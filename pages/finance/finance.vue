<template>
	<view class="container">
		<uni-segmented-control :current="current" :values="items" @clickItem="onClickItem" styleType="button" activeColor="#65915b" style="margin-bottom: 15px; position: relative; z-index: 1;"></uni-segmented-control>

		<view v-show="current === 0">
			<uni-section title="个人存款计算器 (仅供参考)" type="line">
				<view class="calculator-form">
					<uni-forms ref="depositForm" :modelValue="formData">
						<uni-forms-item label="币种" name="currency">
							<picker @change="bindPickerChange($event, 'currency')" :value="currencyIndex" :range="currencies" range-key="text">
								<view class="uni-input">{{currencies[currencyIndex].text}}</view>
							</picker>
						</uni-forms-item>

						<uni-forms-item label="存款金额(元)" name="depositAmount">
							<uni-easyinput type="digit" v-model="formData.depositAmount" placeholder="请输入存款金额" />
						</uni-forms-item>

						<uni-forms-item label="存款类型" name="depositType">
							<picker @change="bindPickerChange($event, 'depositType')" :value="depositTypeIndex" :range="depositTypes" range-key="text">
								<view class="uni-input">{{depositTypes[depositTypeIndex].text}}</view>
							</picker>
						</uni-forms-item>

						<uni-forms-item v-if="formData.depositType === 'fixed'" label="定期期限" name="term">
							<picker @change="bindPickerChange($event, 'term')" :value="termIndex" :range="terms" range-key="text">
								<view class="uni-input">{{terms[termIndex].text}}</view>
							</picker>
						</uni-forms-item>

						<uni-forms-item v-if="formData.depositType === 'current'" label="存款天数" name="depositDays">
							<uni-easyinput type="number" v-model="formData.depositDays" placeholder="请输入实际存款天数" />
						</uni-forms-item>
						
						<!-- <uni-forms-item label="利率计算方式" name="interestMethod">
							<radio-group @change="radioChange($event, 'interestMethod')">
								<label class="radio">
									<radio value="auto" :checked="formData.interestMethod === 'auto'" />自动
								</label>
								<label class="radio">
									<radio value="manual" :checked="formData.interestMethod === 'manual'" />手动
								</label>
							</radio-group>
						</uni-forms-item> -->

						<uni-forms-item label="年利率(%)" name="annualRate">
							<uni-easyinput type="digit" v-model="formData.annualRate" placeholder="请输入年利率" :disabled="formData.interestMethod === 'auto'" />
						</uni-forms-item>
					</uni-forms>

					<view class="button-group">
						<button type="primary" @click="calculateInterest" class="calc-btn">测算</button>
						<button type="default" @click="resetForm">重置</button>
					</view>

					<view v-if="calculationResult.show" class="results">
						<text>预期收益：{{ calculationResult.earnings }} 元</text>
						<text>本息总计：{{ calculationResult.total }} 元</text>
					</view>
				</view>
			</uni-section>
		</view>

		<view v-show="current === 1">
			<uni-section title="股票K线数据 (iTick API)" type="line">
				<view class="stock-query-form">
					<uni-forms ref="stockForm" :modelValue="{ iTickApiToken, stockSymbolInput }">
						<uni-forms-item label="API Token" name="iTickApiToken">
							<uni-easyinput type="text" v-model="iTickApiToken" placeholder="请输入您的iTick API Token" />
							<view class="form-item-tip">请从iTick获取您的API Token。</view>
						</uni-forms-item>
						<uni-forms-item label="股票代码" name="stockSymbolInput">
							<uni-easyinput type="text" v-model="stockSymbolInput" placeholder="例如: 700.HK 或 AAPL.US" />
							<view class="form-item-tip">格式: 代码.地区 (地区大写)</view>
						</uni-forms-item>
						<uni-forms-item label="K线周期" name="kType">
							<picker @change="bindKTypeChange" :value="selectedKTypeIndex" :range="kTypes" range-key="text">
								<view class="uni-input">{{kTypes[selectedKTypeIndex].text}}</view>
							</picker>
						</uni-forms-item>
					</uni-forms>

					<button type="primary" @click="fetchKlineData" :loading="isLoadingKlineData" class="query-btn">查询K线</button>
					<view class="api-limit-tip">免费API每分钟限5次查询，请勿频繁操作。</view>

					<view v-if="isLoadingKlineData" class="loading-indicator">
						<uni-load-more status="loading" :showText="false"></uni-load-more>
						<text>正在加载K线数据...</text>
					</view>

					<view v-if="klineApiError" class="stock-error">
						<text class="error-title">错误提示：</text>
						<text>{{ klineApiError }}</text>
					</view>

					<!-- 添加K线图表显示区域 -->
					<view v-if="uChartData && uChartData.categories && uChartData.categories.length > 0 && !isLoadingKlineData && !klineApiError" class="kline-chart-container">
						<qiun-data-charts
							ref="stockChartRef"
							type="candle" 
							:opts="chartOptions"
							:chartData="uChartData"
							canvasId="stockCandleChart"
							:ontap= "true"
							:ontouch= "true"
							:onmouse= "true"
							:canvas2d= "true" 
							style="width: 100%; height: 300px;" 
							@touchstart="handleChartTouchStart"
							@touchmove="handleChartTouchMove"
							@touchend="handleChartTouchEnd"
						/>
						<view class="data-source-tip">数据来源：iTick API</view>
					</view>

					<view v-if="!isLoadingKlineData && (!klineDataArray || klineDataArray.length === 0) && !klineApiError && current === 1" class="empty-state">
						<text>请输入API Token、股票代码并选择K线周期后点击"查询K线"按钮获取数据。</text>
					</view>
				</view>
			</uni-section>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				current: 0,
				items: ['存款利率计算器', '股票K线分析'],
				
				// 存款计算器数据
				formData: {
					depositAmount: null,
					currency: 'CNY', // 默认人民币
					depositType: 'current', // 'current' 或 'fixed'
					term: 0.25, // 对应 terms 数组中的 value
					depositDays: null,
					interestMethod: 'manual', // 'auto' 或 'manual'
					annualRate: null,
				},
				currencies: [{ text: '人民币', value: 'CNY' }],
				currencyIndex: 0,
				depositTypes: [
					{ text: '活期存款', value: 'current' },
					{ text: '定期存款', value: 'fixed' }
				],
				depositTypeIndex: 0,
				terms: [ // 年为单位
					{ text: '三个月', value: 0.25 },
					{ text: '六个月', value: 0.5 },
					{ text: '一年', value: 1 },
					{ text: '二年', value: 2 },
					{ text: '三年', value: 3 },
					{ text: '五年', value: 5 }
				],
				termIndex: 0, // 默认选择"三个月"
				
				calculationResult: {
					show: false,
					earnings: 0,
					total: 0
				},

				// iTick API 股票查询相关数据
				iTickApiToken: '', // 用于iTick API身份验证的令牌，会优先从本地存储加载，若为空则使用默认值
				stockSymbolInput: '', // 用户输入的股票代码 (格式: CODE.REGION)
				
				klineDataArray: [], // 存储获取到的K线数据
				isLoadingKlineData: false, // 是否正在加载K线数据
				klineApiError: null, // K线 API 请求错误信息

				kTypes: [ // K线周期选项
					{ text: '日K', value: 8 }, // 优先选择长周期，减少API调用频率
					{ text: '周K', value: 9 },
					{ text: '月K', value: 10 },
					{ text: '60分钟', value: 5 },
					{ text: '30分钟', value: 4 },
					{ text: '5分钟', value: 2 },
					{ text: '1分钟', value: 1 }
				],
				selectedKTypeIndex: 0, // 默认选择第一个 (日K)

				uChartData: {}, // uCharts图表数据
				chartOptions: { // uCharts图表配置
					enableScroll: true,
					touchEvents: true,
					xAxis: {
						disableGrid: true,
						itemCount: 20, // 明确设置一屏显示的K线数量，应小于总数据量以触发滚动
						labelCount: 4,
						scrollShow: true,
						scrollAlign: 'right',
						boundaryGap: 'center'
					},
					yAxis: {
						data: [
							{ // K线主图y轴配置
								// min: 0, // uCharts会自动计算
								// max: 0,
								display:true,
								position: 'left',
							},
							{ // 副图Y轴 (如果显示成交量等)
								display:false,
								position: 'right',
							}
						]
					},
					legend: {
						show: true, // 显示图例，但内容会根据series动态生成
						position: 'bottom'
					},
					extra: {
						candle: {
							color: {
								up: '#f04a4a', 
								down: '#00aa7f', 
							},
							average: { // 明确禁用uCharts内部的均线计算和显示
								show: false
							}
						}
					}
				},
			};
		},
		computed: {
			selectedKType() {
				if (this.kTypes && this.kTypes.length > this.selectedKTypeIndex) {
					return this.kTypes[this.selectedKTypeIndex].value;
				}
				return 8; // 默认日K以防万一
			}
		},
		watch: {
			'formData.depositType'(newVal) {
				// 如果切换到定期，且之前是活期，可能需要重置/更新期限选择
				if (newVal === 'fixed') {
					this.formData.term = this.terms[this.termIndex].value;
				}
				this.calculationResult.show = false; // 类型改变时隐藏旧结果
			},
			'formData.interestMethod'(newVal) {
				if (newVal === 'auto') {
					// 自动模式下，理论上应获取标准利率，此处简化，可提示用户或清空手动利率
					// this.formData.annualRate = null; // 或者设置为对应的标准利率（如果实现）
					uni.showToast({
						title: '自动利率暂未实现，请输入手动利率',
						icon: 'none'
					});
					this.formData.interestMethod = 'manual'; // 强制切回手动，因为自动没实现
				}
				this.calculationResult.show = false; // 利率方式改变时隐藏旧结果
			},
			// 监听iTickApiToken的变化，并将其保存到本地存储中
			iTickApiToken(newVal) {
				uni.setStorageSync('iTickApiToken', newVal);
			}
		},
		methods: {
			onClickItem(e) {
				if (this.current !== e.currentIndex) {
					this.current = e.currentIndex;
				}
				// 如果切换到股票分析，且之前没有数据，可以考虑是否要自动获取一次（如果上次有输入）
				// if (this.current === 1 && !this.stockQuoteData && this.stockSymbolInput) {
				//  this.fetchStockQuote();
				// }
			},
			bindPickerChange(e, type) {
				const index = e.detail.value;
				if (type === 'currency') {
					this.currencyIndex = index;
					this.formData.currency = this.currencies[index].value;
				} else if (type === 'depositType') {
					this.depositTypeIndex = index;
					this.formData.depositType = this.depositTypes[index].value;
					if(this.formData.depositType === 'current'){
						this.formData.term = null; // 活期无固定期限
					} else {
						this.formData.depositDays = null; // 定期无自选天数
						this.formData.term = this.terms[this.termIndex].value; // 默认或保持上次选择
					}
				} else if (type === 'term') {
					this.termIndex = index;
					this.formData.term = this.terms[index].value;
				}
				this.calculationResult.show = false; // 选择变化时隐藏结果
			},
			radioChange(e, type) {
				if (type === 'interestMethod') {
					this.formData.interestMethod = e.detail.value;
				}
			},
			calculateInterest() {
				// 输入校验
				if (!this.formData.depositAmount || parseFloat(this.formData.depositAmount) <= 0) {
					uni.showToast({ title: '请输入有效的存款金额', icon: 'none' });
					return;
				}
				if (this.formData.interestMethod === 'manual' && (!this.formData.annualRate || parseFloat(this.formData.annualRate) <= 0)) {
					uni.showToast({ title: '手动模式下，请输入有效的年利率', icon: 'none' });
					return;
				}
				if (this.formData.depositType === 'current' && (!this.formData.depositDays || parseInt(this.formData.depositDays) <= 0)) {
					uni.showToast({ title: '活期存款请输入有效的存款天数', icon: 'none' });
					return;
				}
				
				let principal = parseFloat(this.formData.depositAmount);
				let annualRateDecimal = parseFloat(this.formData.annualRate) / 100;
				let earnings = 0;

				if (this.formData.depositType === 'current') {
					// 活期利息计算: 本金 * (年利率 / 360) * 存款天数 (通常银行按360天计息)
					let days = parseInt(this.formData.depositDays);
					earnings = principal * (annualRateDecimal / 360) * days;
				} else if (this.formData.depositType === 'fixed') {
					// 定期利息计算: 本金 * 年利率 * 存款年限
					// this.formData.term 已经是年为单位 (如0.25, 1, 2)
					earnings = principal * annualRateDecimal * this.formData.term;
				}

				this.calculationResult.earnings = earnings.toFixed(2); // 保留两位小数
				this.calculationResult.total = (principal + earnings).toFixed(2);
				this.calculationResult.show = true;
				
				// 调试信息
				console.log("计算参数:", this.formData);
				console.log("预期收益:", this.calculationResult.earnings);
				console.log("本息总计:", this.calculationResult.total);
			},
			resetForm() {
				this.formData = {
					depositAmount: null,
					currency: 'CNY',
					depositType: 'current',
					term: this.terms[0].value, // 重置为第一个期限选项值
					depositDays: null,
					interestMethod: 'manual',
					annualRate: null,
				};
				this.currencyIndex = 0;
				this.depositTypeIndex = 0;
				this.termIndex = 0; // 重置期限选择到第一个
				this.calculationResult.show = false;
				this.$refs.depositForm.clearValidate(); // 如果有表单校验的话
				uni.showToast({ title: '已重置', icon: 'none' });
			},

			async fetchKlineData() {
				const defaultToken = '8deef432e4ff4c2f95b0f28085b0204fd8155c8fc51d4f9e9cf9f882e6fa2bcd';
				const tokenToUse = this.iTickApiToken || defaultToken;

				if (!this.stockSymbolInput) {
					uni.showToast({ title: '请输入股票代码 (格式如: 700.HK)', icon: 'none' });
					return;
				}

				// 解析股票代码和地区
				let code = '';
				let region = '';
				const parts = this.stockSymbolInput.trim().split('.');
				if (parts.length === 2 && parts[0] && parts[1]) {
					code = parts[0];
					region = parts[1].toUpperCase();
				} else {
					uni.showToast({ title: '股票代码格式不正确，应为 CODE.REGION (例如: 700.HK 或 AAPL.US)', icon: 'none', duration: 3000 });
					return;
				}

				this.isLoadingKlineData = true;
				this.klineApiError = null;
				this.klineDataArray = [];
				// 参考文档：https://itick-cn.readme.io/reference/get_stock-quote
				const apiUrl = 'https://api.itick.org/stock/kline';
				
				const requestData = {
					region: region,
					code: code,
					kType: this.selectedKType
				};

				try {
					const response = await uni.request({
						url: apiUrl,
						method: 'GET',
						data: requestData,
						header: {
							'accept': 'application/json',
							'token': tokenToUse
						},
						timeout: 10000, // 请求超时时间，单位毫秒
					});

					console.log('iTick API Response:', response);

					if (response.statusCode === 200 && response.data) {
						// 首先检查API业务状态码
						if (response.data.code === 0) {
							// 成功，数据在 response.data.data 中
							if (response.data.data) {
								this.klineDataArray = response.data.data;
								this.processKlineDataForChart(this.klineDataArray);
							} else {
								this.klineApiError = 'API成功返回，但核心数据对象(data.data)缺失。';
								this.klineDataArray = []; // 清空旧数据
								this.uChartData = {}; // 清空图表数据
							}
						} else {
							// API业务逻辑错误
							this.klineApiError = `API业务错误：${response.data.msg || '未知业务错误'} (code: ${response.data.code})`;
							this.klineDataArray = []; // 清空旧数据
							this.uChartData = {}; // 清空图表数据
						}
					} else {
						// HTTP 错误或响应体为空
						this.klineApiError = `API 请求失败，状态码：${response.statusCode}。`;
						if (response.data && response.data.msg) { 
							this.klineApiError += ` 错误信息：${response.data.msg}`;
						} else if (response.data && response.data.message) {
							this.klineApiError += ` 错误信息：${response.data.message}`;
						} else if (typeof response.data === 'string' && response.data.length < 200) { // 避免过长的字符串错误信息
							this.klineApiError += ` ${response.data}`;
						}
						this.klineDataArray = []; // 清空旧数据
						this.uChartData = {}; // 清空图表数据
						console.error('iTick API Error / HTTP Error:', response);
					}
				} catch (error) {
					this.klineApiError = `请求时发生错误：${error.errMsg || error.message || '未知错误'}`;
					console.error('uni.request Exception:', error);
					this.klineDataArray = [];
					this.uChartData = {};
				} finally {
					this.isLoadingKlineData = false;
				}
			},
			processKlineDataForChart(klineArray) {
				if (!klineArray || klineArray.length === 0) {
					this.uChartData = {};
					return;
				}
				// iTick K线数据通常是 [时间戳, 开, 高, 低, 收, 量, ...]
				// uCharts K线图 (candle) 需要的 series 数据格式是 [开, 收, 低, 高] 或对象形式
				// categories 需要的是时间戳对应的日期字符串
				
				let categories = [];
				let seriesData = [];
				let volumes = []; // 如果要画成交量副图

				// K线数据通常是时间倒序的（最新在前），uCharts可能需要时间正序
				// 这里我们假设 klineArray 是时间倒序的，我们反转它以得到时间正序
				// const sortedKlineArray = [...klineArray].reverse(); 
				// 根据用户提供的API响应示例，数据已经是时间升序的，所以不再需要reverse()
				const sortedKlineArray = klineArray; 

				sortedKlineArray.forEach(klineItem => {
					// 假设 klineItem 的结构是 {t, o, h, l, c, v, ...}
					// 或者如果 klineItem 是数组 [时间戳, 开, 高, 低, 收, 量]
					// const time = klineItem.t || klineItem[0];
					// const open = klineItem.o || klineItem[1];
					// const high = klineItem.h || klineItem[2];
					// const low = klineItem.l || klineItem[3];
					// const close = klineItem.c || klineItem[4];
					// const volume = klineItem.v || klineItem[5];
					
					// 为保持一致性，这里我们继续使用之前假定的对象结构
					const time = klineItem.t; // API提供的是毫秒时间戳
					const open = parseFloat(klineItem.o);
					const high = parseFloat(klineItem.h);
					const low = parseFloat(klineItem.l);
					const close = parseFloat(klineItem.c);
					const volume = parseFloat(klineItem.v);

					if (time !== undefined && open !== undefined && high !== undefined && low !== undefined && close !== undefined) {
						categories.push(this.formatKlineTimestamp(time, 'MM-DD')); // 格式化X轴日期
						seriesData.push([open, close, low, high]);
						// volumes.push(volume); // 如果要显示成交量
					}
				});

				this.uChartData = {
					categories: categories,
					series: [
						{
							name: 'K线',
							data: seriesData,
							// yAxisIndex: 0, // 主图Y轴
						}
						// 如果要添加成交量副图，可以取消注释下面部分
						/*
						{
							name: '成交量',
							type: 'column', // 或 bar
							data: volumes,
							yAxisIndex: 1, // 副图Y轴
							barWidth: 4, // 柱状图宽度
							color: '#ccc' // 成交量柱子颜色
						}
						*/
					]
				};
				console.log('Processed uChartData:', JSON.parse(JSON.stringify(this.uChartData)));
			},
			formatKlineTimestamp(timestamp, format = 'YYYY-MM-DD HH:mm') {
				const date = new Date(timestamp); // 直接使用毫秒时间戳
				const year = date.getFullYear();
				const month = ('0' + (date.getMonth() + 1)).slice(-2);
				const day = ('0' + date.getDate()).slice(-2);
				const hours = ('0' + date.getHours()).slice(-2);
				const minutes = ('0' + date.getMinutes()).slice(-2);
				// const seconds = ('0' + date.getSeconds()).slice(-2); // 秒通常不展示

				if (format === 'YYYY-MM-DD HH:mm') {
					return `${year}-${month}-${day} ${hours}:${minutes}`;
				} else if (format === 'MM-DD') {
					return `${month}-${day}`;
				}
				return date.toLocaleString(); // 默认
			},
			bindKTypeChange(e) {
				const index = e.detail.value;
				this.selectedKTypeIndex = index;
			},
			handleChartTouchStart(e) {
				// console.log('Chart touchstart', e);
				if (this.$refs.stockChartRef && this.$refs.stockChartRef.chart && typeof this.$refs.stockChartRef.chart.scrollStart === 'function') {
					this.$refs.stockChartRef.chart.scrollStart(e);
				} else {
					// Fallback or alternative way to get uCharts instance if the above path is incorrect for qiun-data-charts
					// console.warn('uCharts instance or scrollStart method not found on this.$refs.stockChartRef.chart');
					// For example, it might be directly on the component or via a getInstance() method:
					// if (this.$refs.stockChartRef && typeof this.$refs.stockChartRef.scrollStart === 'function') {
					//   this.$refs.stockChartRef.scrollStart(e);
					// } else if (this.$refs.stockChartRef && this.$refs.stockChartRef.getInstance && typeof this.$refs.stockChartRef.getInstance().scrollStart === 'function'){
					//   this.$refs.stockChartRef.getInstance().scrollStart(e);
					// }
				}
			},
			handleChartTouchMove(e) {
				// console.log('Chart touchmove', e);
				if (this.$refs.stockChartRef && this.$refs.stockChartRef.chart && typeof this.$refs.stockChartRef.chart.scroll === 'function') {
					this.$refs.stockChartRef.chart.scroll(e);
				}
			},
			handleChartTouchEnd(e) {
				// console.log('Chart touchend', e);
				if (this.$refs.stockChartRef && this.$refs.stockChartRef.chart && typeof this.$refs.stockChartRef.chart.scrollEnd === 'function') {
					this.$refs.stockChartRef.chart.scrollEnd(e);
					// 根据文档示例， touchend 后可能还需要调用 touchLegend 和 showToolTip
					// if (typeof this.$refs.stockChartRef.chart.touchLegend === 'function') {
					// 	this.$refs.stockChartRef.chart.touchLegend(e);
					// }
					// if (typeof this.$refs.stockChartRef.chart.showToolTip === 'function') {
					// 	this.$refs.stockChartRef.chart.showToolTip(e);
					// }
				}
			}
		},
		mounted() {
			// 页面加载时，尝试从本地存储中读取API Token，如果为空则使用一个默认的
			this.iTickApiToken = uni.getStorageSync('iTickApiToken') || '8deef432e4ff4c2f95b0f28085b0204fd8155c8fc51d4f9e9cf9f882e6fa2bcd';
			
			// 初始化时，确保 formData.term 基于 termIndex (如果初始是定期)
			if(this.formData.depositType === 'fixed'){
				this.formData.term = this.terms[this.termIndex].value;
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 15px;
		background-color: #f8f8f8;
		min-height: 100vh;
	}

	.calculator-form {
		background-color: #ffffff;
		padding: 15px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.uni-input {
		height: 35px;
		line-height: 35px;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
		padding: 0 10px;
		background-color: #fff;
	}

	.radio-group {
		display: flex;
		align-items: center;
		.radio {
			margin-right: 15px;
		}
	}
	
	.button-group {
		display: flex;
		justify-content: space-around;
		margin-top: 20px;
		.calc-btn {
			// background-color: #65915b; // 使用主题色
			// color: white;
		}
	}

	.results {
		margin-top: 20px;
		padding: 10px;
		background-color: #eefaf2; // 淡绿色背景
		border: 1px solid #d4f0dd; // 边框
		border-radius: 4px;
		text {
			display: block;
			margin-bottom: 5px;
			color: #333; // 深色文字
		}
	}
	
	.webview-container {
		height: calc(100vh - 120px); // 减去 segmented control 和可能的其他头部高度
		width: 100%;
		position: relative; // 添加 position relative
		overflow: hidden;   // 添加 overflow hidden
	}

	// 确保 uni-forms-item 标签和内容对齐
	::v-deep .uni-forms-item__label {
		width: 90px !important; // 适当调整标签宽度
		display: flex;
		align-items: center;
	}

	// 新增股票查询界面的样式
	.stock-query-form {
		background-color: #ffffff;
		padding: 15px;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		.form-item-tip {
			font-size: 12px;
			color: #999;
			margin-top: 2px;
		}
		.query-btn {
			margin-top: 15px;
			// background-color: #65915b; // 可以使用主题色
		}
		.api-limit-tip {
			font-size: 12px;
			color: #e6a23c; /* 警告色 */
			text-align: center;
			margin-top: 8px;
		}
	}

	.loading-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 20px;
		text {
			margin-top: 5px;
			color: #888;
		}
	}

	.stock-error {
		margin-top: 20px;
		padding: 10px;
		background-color: #ffebee; // 淡红色背景
		border: 1px solid #f4c7c3; // 边框
		border-radius: 4px;
		color: #c62828; // 深红色文字
		.error-title {
			display: block;
			font-weight: bold;
			margin-bottom: 5px;
		}
	}

	.kline-results-list {
		margin-top: 20px;
		.data-source-tip {
			font-size: 10px;
			color: #aaa;
			text-align: center;
			margin-top: 10px;
		}
	}

	.empty-state {
		margin-top: 20px;
		padding: 20px;
		text-align: center;
		color: #888;
	}

	// 移除 webview 相关样式 (如果不再需要)
	// .webview-container {
	// 	height: calc(100vh - 120px); // 减去 segmented control 和可能的其他头部高度
	// 	width: 100%;
	// 	position: relative; // 添加 position relative
	// 	overflow: hidden; // 添加 overflow hidden
	// }

	// 确保 uni-forms-item 标签和内容对齐
	::v-deep .uni-forms-item__label {
		width: 90px !important; // 适当调整标签宽度
		display: flex;
		align-items: center;
	}

	.kline-chart-container {
		margin-top: 20px;
		width: 100%;
		// height: 300px; /* 高度也可以在这里设置，或者直接在组件上用style设置 */
	}

	.kline-results-list { // 这个样式如果不再需要可以移除，或者保留给其他可能的列表显示
		margin-top: 20px;
		.data-source-tip {
			font-size: 10px;
			color: #aaa;
			text-align: center;
			margin-top: 10px;
		}
	}
</style>
