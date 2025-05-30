<template>
	<view class="charts">
		<view class="header-fixed">
			<!-- 日期类型选择器 需要输出选择类型和时间戳，之后数据库进行筛选，拿到数据进行渲染 -->
			<mj-datetype-picker @pickDate="pickDate"></mj-datetype-picker>
			<!-- 先只考虑饼图 -->
			<!-- <view class="tabs"><u-tabs :list="[{name:'饼图'},{name: '日历'}]" @click="clickTab" lineColor="#2e3548"></u-tabs></view> -->
			<view v-if="false" class="filter" @click="toFilterBills">
				筛选
			</view>
		</view>
		<view class="linear-gradient"></view>

		<!-- 5.19新增：柱状图容器 -->
		<view class="card-chart-column">
			<view class="ucharts">
				<qiun-data-charts 
					type="column" 
					:opts="optsColumn" 
					:chartData="chartsDataColumn" 
					:ontouch="true" 
					canvasId="uchartscolumn_in_charts" 
					:canvas2d="true"
				/>
			</view>
		</view>

		<!-- 原有的饼图/环形图容器 -->
		<view class="card-chart">
			<view class="radio">
				<view>
					<u-radio-group v-model="type" placement="row" shape="circle" activeColor="#9fcba7"
						labelColor="#212121" iconSize="0" labelSize="28rpx">
						<u-radio size="24rpx" label="月支出" name="月支出" style="margin-right: 20rpx;"></u-radio>
						<u-radio size="24rpx" label="月收入" name="月收入"></u-radio>
					</u-radio-group>
				</view>
				<view class="money">
					<view class="expend" @tap="tapExpend">
						<u--text mode="price" :text="monthlyExpend" color="#dd524d" bold></u--text>
					</view>
					<view class="income" @tap="tapIncome">
						<u--text mode="price" :text="monthlyIncome" color="#219a6d" bold></u--text>
					</view>
				</view>
			</view>
			<view class="ucharts">
				<qiun-data-charts type="ring" :opts="opts" :chartData="chartData" canvasId="uchartsring1"
					:canvas2d="true" />
			</view>
		</view>
		<!-- 组件放置位置，传递分类，分类支出，交易数量信息进去，渲染分类百分比卡片 -->
		<view v-if="type === '月支出'" class="card-category">
			<mj-category-card :categoryListFromChart="expendCategoryList" ></mj-category-card>
			<view v-show="!expendCategoryList.length">
				<u-empty mode="list" text="没有找到符合条件的账单哦,快去记一笔吧"></u-empty>
			</view>
		</view>
		<view v-if="type === '月收入'" class="card-category">
			<mj-category-card :categoryListFromChart="incomeCategoryList" ></mj-category-card>
			<view v-show="!incomeCategoryList.length">
				<u-empty mode="list" text="没有找到符合条件的账单哦,快去记一笔吧"></u-empty>
			</view>
		</view>
	</view>
</template>

<script>
	import UT from '@/utils/user-state.js'
	import {getAllIconList} from '@/utils/icon-config.js'
	const db = uniCloud.database()
	export default {
		data() {
			return {
				type: '月支出',
				chartData: {},
				opts: {
					color: ["#f78121", "#df4402", "#fde801", "#ffbb02", "#fa5207"],
					padding:[14,0,0,0],
					dataLabel: true,
					legend: {
						show: true,
						position: "bottom",
						fontColor: "#212121",
						fontSize: 12,
						lineHeight: 12,
						margin: 0
					},
					title: {
						name: "月支出",
						color: "#212121",
						fontSize: 22,
						offsetY: -4
					},
					subtitle: {
						name: "￥0.00",
						color: "#dd524d",
						fontSize: 20,
						offsetY: -4
					},
					extra: {
						ring: {
							ringWidth: 30,
							activeOpacity: 0.5,
							activeRadius: 10,
							offsetAngle: -90,
							labelWidth: 15,
							border: false,
							borderColor: "#FFFFFF",
							activeOpacity: 0.3
						},
						tooltip: {
							showArrow: false,
							borderRadius: 10
						}
					}
				},
				month: uni.$u.timeFormat(Date.now(), 'yyyy-mm'),
				monthNow: uni.$u.timeFormat(Date.now(), 'yyyy-mm'),
				monthlyBalance: {
					monthlyExpend: 0,
					monthlyIncome: 0
				},
				userBills: [],
				expendCategoryList: [],
				incomeCategoryList: [],
				initChart: true,

				// --- 5.19新增：柱状图相关 data ---
				chartsDataColumn: {},
				optsColumn: {
					padding: [10,10,0,10],
					dataLabel: false,
					enableScroll: true,
					fontSize: 10,
					enableMarkLine: true,
					color: ['#dd524d','#009c63'],
					yAxis: {
						//disabled: true, // 显示y轴
						disableGrid: true
					},
					xAxis: {
						itemCount: 20,
						labelCount: 5,
						fontSize: 10,
						min: 0
					},
					legend: {
						margin: 0
					},
					extra: {
						tooltip: {
							showArrow: false,
							bgOpacity: 0.5,
							fontSize: 12,
							lineHeight: 16,
							legendShape: 'circle'
						},
						column: {
							width: 10,
							seriesGap: 4,
							barBorderCircle: true,
							activeBgOpacity: 0.04
						}
					},
				},
				userBillsOrderByDayForColumn: [],
				initColumnChart: true,
			};
		},
		computed: {
			monthlyExpend(){
				return this.monthlyBalance.monthlyExpend
			},
			monthlyIncome(){
				return this.monthlyBalance.monthlyIncome
			}
		},
		watch: {
			type(newValue){
				if(newValue==="月收入") {
					this.getRingChartData(this.incomeCategoryList)
				}
				if(newValue==="月支出") {
					this.getRingChartData(this.expendCategoryList)
				}
			}
		},
		async onReady() {
			const state = UT.checkUserTokenExpierd() // 检查老用户的token是否过期，如果过期则跳转登录，并返回true；没过期返回false
			if (state) return
			// console.log("用户token没过期，继续执行下面的逻辑");

			// 如果用户登录了，进行初始化
			const {uid} = uniCloud.getCurrentUserInfo()
			if (uid) {
				await this.getUserBillsAndProcessCharts()
				this.initChart = false;
				this.initColumnChart = false;
			}
		},
		async onShow() {
			const { uid } = uniCloud.getCurrentUserInfo()
			if (!uid) {
				uni.redirectTo({
					url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
				})
				return
			}
			if(!this.initChart || !this.initColumnChart) {
				await this.getUserBillsAndProcessCharts()
			}
			
		},
		methods: {
			clickTab(e) {
				console.log(e);
			},
			toFilterBills() {
				uni.showToast({
					title: "功能开发中~",
					icon: "none"
				})
				return
				uni.navigateTo({
					url: "/pagesFilter/filter-bills/filter-bills"
				})
			},
			// 点击了月支出下方金额的文字
			tapExpend() {
				this.type = '月支出'
			},
			tapIncome() {
				this.type = '月收入'
			},
			async getUserBillsAndProcessCharts() {
				await this.getMonthCategoryBills(this.month);
				this.processUserBillsForColumnChart();
				this.getColumnChartData();
				if(this.type === "月收入") {
					this.getRingChartData(this.incomeCategoryList);
				} else {
					this.getRingChartData(this.expendCategoryList);
				}
			},
			async getMonthCategoryBills(month) {
				const userMonthBills = db.collection("mj-user-bills").where(
					`user_id == $cloudEnv_uid && dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${month}"`
				).orderBy('bill_date desc').getTemp()
				const userAssets = db.collection("mj-user-assets").where('user_id == $cloudEnv_uid').field(
					'_id,asset_type,user_id,asset_name').getTemp()
				const res = await db.collection(userMonthBills, userAssets).get()
				// 根据账单计算月支出和月收入
				this.userBills = res.result.data
				// 统一修改金额为 元
				this.userBills.forEach(bill => bill.bill_amount /= 100)
				
				const categorizedBillsByBillType = {
					0: 0, // bill_type为0的总和
					1: 0, // bill_type为1的总和
					2: 0, // bill_type为2的总和
				}
				// 遍历账单数组，根据bill_type分类并计算总和
				for (const bill of this.userBills) {
					const { bill_type, bill_amount } = bill;
					categorizedBillsByBillType[bill_type] += bill_amount
				}
				this.monthlyBalance.monthlyExpend = categorizedBillsByBillType[0] + categorizedBillsByBillType[2]
				this.monthlyBalance.monthlyIncome = categorizedBillsByBillType[1]

				// 根据账单类型bill_type进行分组  0 2:group0 ;  1 group1 
				// 根据分类category_type进行分组
				// 使用对象来分组账单并计算总和和帐单数
				const groupedBills = {};

				for (const bill of this.userBills) {
					const {
						bill_type,
						category_type,
						bill_amount
					} = bill;

					// 将bill_type为0和2的账单放在一组，bill_type为1的账单放在另一组
					const groupKey = bill_type === 1 ? 'group1' : 'group0';

					if (!groupedBills[groupKey]) {
						groupedBills[groupKey] = {};
					}

					if (!groupedBills[groupKey][category_type]) {
						groupedBills[groupKey][category_type] = {
							total_amount: 0,
							bill_count: 0,
							category_type: category_type,
							total_amount_percent: 0
						};
					}

					// 累加bill_amount到对应category_type的总和中
					groupedBills[groupKey][category_type]['total_amount'] += bill_amount;
					groupedBills[groupKey][category_type]['bill_count'] += 1;
				}
				// 将group0, group1转换成数组
				for (const groupName in groupedBills) {
					const data = Object.values(groupedBills[groupName])
					groupedBills[groupName] = data
				}
				// 计算出每个分类总支出占月支出的百分比
				for (const groupName in groupedBills) {
					const group = groupedBills[groupName]
					if (groupName === 'group0' && this.monthlyBalance.monthlyExpend > 0) {
						group.forEach(item => item.total_amount_percent = (item.total_amount / this.monthlyBalance.monthlyExpend).toFixed(4))
					} else if (groupName === 'group0'){
						group.forEach(item => item.total_amount_percent = 0)
					}
					if (groupName === 'group1' && this.monthlyBalance.monthlyIncome > 0) {
						group.forEach(item => item.total_amount_percent = (item.total_amount / this.monthlyBalance.monthlyIncome).toFixed(4))
					} else if (groupName === 'group1'){
						group.forEach(item => item.total_amount_percent = 0)
					}
				}
				
				// 进行排序
				for (const groupName in groupedBills) {
					if (groupedBills.hasOwnProperty(groupName)) {
						groupedBills[groupName].sort((a, b) => b.total_amount - a.total_amount);
					}
				}
				// 存入相应数组
				this.expendCategoryList = groupedBills.group0 || []
				this.incomeCategoryList = groupedBills.group1 || []
			},
			processUserBillsForColumnChart() {
				console.log(`为柱状图处理 ${this.month} 的账单数据`);
				if (!this.userBills || this.userBills.length === 0) {
					this.userBillsOrderByDayForColumn = [];
					return;
				}

				let numberOfDaysInSelectedMonth;
				if(this.month === this.monthNow) {
					const today = new Date();
					numberOfDaysInSelectedMonth = today.getDate();
				} else {
					numberOfDaysInSelectedMonth = this.getTotalDaysInMonth(this.month);
				}

				const twoDimensionalArray = [];
				for (let i = 0; i < numberOfDaysInSelectedMonth; i++) {
					twoDimensionalArray.push([]);
				}
				
				this.userBills.forEach(bill => {
					let billDay = parseInt(uni.$u.timeFormat(bill.bill_date, 'dd'), 10);
					const index = numberOfDaysInSelectedMonth - billDay;
					if (index >= 0 && index < numberOfDaysInSelectedMonth) {
						twoDimensionalArray[index].push(bill);
					}
				});
				this.userBillsOrderByDayForColumn = twoDimensionalArray;
				console.log('柱状图的按天分组数据:', this.userBillsOrderByDayForColumn);
			},
			getColumnChartData() {
				console.log('开始准备柱状图数据');
				const result = {
				  categories: [],
				  series: [
				    { name: "支出", data: [] },
				    { name: "收入", data: [] },
				  ],
				};
				
				if (!this.userBillsOrderByDayForColumn || this.userBillsOrderByDayForColumn.length === 0) {
					console.log("没有为柱状图准备好的按天账单数据");
					const dayCount = this.getTotalDaysInMonth(this.month);
					for (let i = 0; i < dayCount; i++) {
						let day = dayCount - i;
						result.categories.push(`${this.month.slice(-2)}月${day}日`);
						result.series[0].data.push(0);
						result.series[1].data.push(0);
					}
					this.chartsDataColumn = JSON.parse(JSON.stringify(result));
					return;
				}

				let chartMonth = this.month.slice(-2);
				if (/^0\d+$/.test(chartMonth)) {
					chartMonth = chartMonth.replace(/^0+/, '');
				}
				
				let currentDayNumber;
				if (this.month === this.monthNow) {
				    currentDayNumber = new Date().getDate();
				} else {
				    currentDayNumber = this.getTotalDaysInMonth(this.month);
				}

				for (let i = 0; i < this.userBillsOrderByDayForColumn.length; i++) {
					const dayData = this.userBillsOrderByDayForColumn[i];
					let dayExpense = 0;
					let dayIncome = 0;
					
					for (const bill of dayData) {
						if (bill.bill_type === 0 || bill.bill_type === 2) {
						  dayExpense += bill.bill_amount;
						} else if (bill.bill_type === 1) {
						  dayIncome += bill.bill_amount;
						}
					}
					result.categories.push(`${chartMonth}月${currentDayNumber - i}日`); 
					result.series[0].data.push(parseFloat(dayExpense.toFixed(2)));
					result.series[1].data.push(parseFloat(dayIncome.toFixed(2)));
				}
				
				result.categories.reverse();
				result.series[0].data.reverse();
				result.series[1].data.reverse();

				console.log('柱状图格式化后数据: ', result);
				this.chartsDataColumn = JSON.parse(JSON.stringify(result));
			},
			getTotalDaysInMonth(yearmonth) {
				const [year,monthStr] = yearmonth.split('-');
				const month = parseInt(monthStr, 10);
				const date = new Date(year, month, 0);
				return date.getDate();
			},
			getRingChartData(categoryData) {
				let res = {}
				if(categoryData && categoryData.length) {
					const allIconList = getAllIconList()
					let data = []
					for (const categoryList of categoryData) {
						const objTemp = {}
						// 固定2位小数
						objTemp['value'] = parseFloat(categoryList.total_amount.toFixed(2))
						const iconInfo = allIconList.filter(item => item.type === categoryList.category_type)[0]
						objTemp['name'] = iconInfo ? iconInfo.title : categoryList.category_type
						data.push(objTemp)
					}
					// 只存储前5个数据
					data = data.slice(0,5)
					res = {
						series: [{ data }]
					}
				} else {
					res = {
						series: [{
							data: [{ name: '暂无数据', value: 0 }]
						}]
					}
				}
				
				if(this.type === '月支出') {
					this.opts.title.name = '月支出'
					this.opts.subtitle.name = `￥${this.monthlyBalance.monthlyExpend.toFixed(2)}`
				}
				if(this.type === '月收入') {
					this.opts.title.name = '月收入'
					this.opts.subtitle.name = `￥${this.monthlyBalance.monthlyIncome.toFixed(2)}`
				}
				this.chartData = JSON.parse(JSON.stringify(res))
			},
			async pickDate(res) {
				const {value} = res
				this.month = uni.$u.timeFormat(value, 'yyyy-mm')
				await this.getUserBillsAndProcessCharts();
			},
		},
		onShareAppMessage () {
			return {
				title: "妙记——记录你的生活",
				path: "/pages/index/index",
				imageUrl: "/static/share.png"
			}
		},
		onShareTimeline(){
			return {
				title: '妙记——记录你的生活'
			}
		}
	}
</script>

<style lang="scss">
	.charts {
		.header-fixed {
			position: fixed;
			width: 100%;
			top: 0;
			left: 0;
			box-sizing: border-box;
			padding: 0 28rpx;
			background-color: $mj-theme-color;
			height: 80rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 32rpx;
			color: $mj-text-color;
			z-index: 999;
		}
		.linear-gradient {
			position: absolute;
			top: 80rpx;
			left: 0;
			right: 0;
			height: 100rpx;
			background-image: linear-gradient(#9fcba7, #fafafa);
			z-index: -1;
		}
		.card-chart-column {
			margin: 0 28rpx;
			margin-top: 96rpx;
			background-color: #fff;
			height: 368rpx;
			border-radius: 36rpx;
			padding: 8rpx;
			box-shadow: rgba(0, 0, 0, 0.03) 0px 20px 25px -5px, rgba(0, 0, 0, 0.01) 0px 10px 10px -5px;
			.ucharts {
				width: 100%;
				height: 100%;
			}
		}
		.card-chart {
			margin: 0 28rpx;
			margin-top: 20rpx;
			box-sizing: border-box;
			background-color: #fff;
			height: 660rpx;
			border-radius: 36rpx;
			padding: 20rpx;
			box-shadow: rgba(0, 0, 0, 0.03) 0px 20px 25px -5px, rgba(0, 0, 0, 0.01) 0px 10px 10px -5px;

			.radio {
				height: 100rpx;

				.u-radio:first-child {
					margin-right: 140rpx;
				}

				.money {
					display: flex;
					justify-content: flex-start;
					align-items: center;

					.expend {
						width: 166rpx;
						text-align: center;
					}

					.income {
						width: 166rpx;
						text-align: center;
					}
				}
			}

			.ucharts {
				height: 520rpx;
				width: 100%;
			}
		}

		.card-category {
			margin-top: 8rpx;
		}
	}
</style>