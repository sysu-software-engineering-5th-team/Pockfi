<template>
	<view class="container">
		<uni-segmented-control :current="current" :values="items" @clickItem="onClickItem" styleType="button" activeColor="#65915b" style="margin-bottom: 15px;"></uni-segmented-control>

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
						
						<uni-forms-item label="利率计算方式" name="interestMethod">
							<radio-group @change="radioChange($event, 'interestMethod')">
								<label class="radio">
									<radio value="auto" :checked="formData.interestMethod === 'auto'" />自动
								</label>
								<label class="radio">
									<radio value="manual" :checked="formData.interestMethod === 'manual'" />手动
								</label>
							</radio-group>
						</uni-forms-item>

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
			<uni-section title="股票分析" type="line">
				<view class="webview-container">
					<web-view :src="stockWebviewUrl"></web-view>
				</view>
				<view style="padding: 10px; color: #888; font-size: 12px;">
					提示：此处嵌入的是外部股票信息页面，仅供演示。您可以替换为其他股票信息源。
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
				items: ['存款利率计算器', '股票分析'],
				
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

				// 股票分析模块数据
				stockWebviewUrl: 'https://vip.stock.finance.sina.com.cn/mkt' // 示例股票行情网址
			};
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
			}
		},
		methods: {
			onClickItem(e) {
				if (this.current !== e.currentIndex) {
					this.current = e.currentIndex;
				}
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
			}
		},
		mounted() {
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
</style>
