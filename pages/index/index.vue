<template>
	<view class="home">
		<swiper class="swiper" circular :indicator-dots="true" indicator-dots="rgba(0, 0, 0, .3)"
			indicator-active-color="#303344" duration="500" :circular="false" @change="swiperChange">
			<swiper-item class="swiper-item">
				<view class="header">
					当月支出(元)
				</view>
				<view class="moneyContent">
					<!-- 如果钱超出一定范围，会导致布局有误 -->
					<u--text v-if="isEyeShow" mode="price" :text="monthlyBalance.monthlyExpend" size="72rpx" color="#000"></u--text>
					<view v-else>
						￥*****
					</view>
					<view class="eye" @click="clickEye">
						<uni-icons v-if="isEyeShow" type="eye" size="56rpx" color="rgba(0,0,0, 0.6)"></uni-icons>
						<uni-icons v-else type="eye-slash" size="56rpx" color="rgba(0,0,0, 0.6)"></uni-icons>
					</view>
				</view>
				<view class="footer">
					<text>当月收入<text class="bold" v-if="isEyeShow">{{monthlyBalance.monthlyIncome.toFixed(2)}}</text><text class="bold" v-else>*****</text></text>
					<text>当月结余<text class="bold" v-if="isEyeShow">{{(monthlyBalance.monthlyIncome - monthlyBalance.monthlyExpend).toFixed(2)}}</text><text class="bold" v-else>*****</text></text>
				</view>
				<!-- 占位 -->
				<view class="bottom"></view>
			</swiper-item>
			<swiper-item class="swiper-item">
				<view class="header">
					净资产(元)
				</view>
				<view class="moneyContent">
					<u--text v-if="isEyeShow" mode="price" :text="totalAssets" size="72rpx" color="#000"></u--text>
					<view v-else="isEyeShow">
						￥*****
					</view>
					<view class="eye" @click="clickEye">
						<uni-icons v-if="isEyeShow" type="eye" size="56rpx" color="rgba(0,0,0, 0.6)"></uni-icons>
						<uni-icons v-else type="eye-slash" size="56rpx" color="rgba(0,0,0, 0.6)"></uni-icons>
					</view>
				</view>
				<view class="footer">
					<text>总资产<text class="bold" v-if="isEyeShow">{{totalAssets.toFixed(2)}}</text><text class="bold" v-else>*****</text></text>
				</view>
				<!-- 占位 -->
				<view class="bottom"></view>
			</swiper-item>
		</swiper>
		<!-- 月度账单展示区域 -->
		<view class="monthly-bills-section" v-show="!isIndexShow">
			<!-- <view class="header-fixed"> -->
				<!-- 筛选按钮暂时保留，但功能未实现 -->
				<!-- <view v-if="false" class="filter" @click="toFilterBills">
					筛选
				</view> -->
			<!-- </view> -->
			<!-- <view class="card-money">
				<view class="left">
					月支出：<u--text mode="price" :text="monthlyBalance.monthlyExpend" color="#dd524d" size="24rpx" bold></u--text>
				</view>
				<view class="right">
					月收入：<u--text mode="price" :text="monthlyBalance.monthlyIncome" color="#219a6d" size="24rpx" bold></u--text>
				</view>
			</view> -->
			<view class="bill-list">
				<view class="header">
					<view class="header-left">
						<uni-icons type="list" size="48rpx" color="#212121"></uni-icons>
						<text>账单明细</text>
					</view>
					<mj-datetype-picker @pickDate="pickDate"></mj-datetype-picker>
				</view>
				<mj-bill-card
					v-for="(bills,index) in userBillsByDay"
					:key="index"
					:userBillsFromDB="bills"
					:userAssetsFromDB="userAssets"
				>
				</mj-bill-card>
				<view v-show="userBillsCount === 0">
					<u-empty mode="list" text="没有找到符合条件的账单哦,快去记一笔吧"></u-empty>
				</view>
			</view>
		</view>
		<view class="asset" v-if="isIndexShow && userAssets.length > 0">
			<view class="header">
				<view class="left">
					<uni-icons type="wallet" size="48rpx" color="#212121"></uni-icons>
					<text>我的资产</text>
				</view>
				<view class="right" @click="toMyAssets">
					管理
				</view>
			</view>
			<mj-asset-card :userAssetsFromDB="userAssets" :isEyeShow="isEyeShow" :safeAreaInsetBottom="false"></mj-asset-card>
		</view>
		<!-- 固定定位，最底下 -->
		<view class="bottom-btn" >
			<u-button  :text="bottomBtnText" color="#9fcba7" shape="circle" @click="clickBottomBtn"></u-button>
		</view>
	</view>
</template>

<script>
	import UT from '@/utils/user-state.js'
	const db = uniCloud.database()
	export default {
		data() {
			return {
				isEyeShow: uni.getStorageSync('isEyeShow'),
				isIndexShow: 0,  // 0 展示首页账单  1 展示资产页
				bottomBtnText: '点我记账',
				userAssets: [],
				userBills: [],
				currentDate: uni.$u.timeFormat(Date.now(), 'yyyy-mm'),
				monthlyExpense: 0,
				monthlyIncome: 0,
				
				// 从 bills.vue 迁移过来的数据
				month: uni.$u.timeFormat(Date.now(), 'yyyy-mm'), // 当前选择的月份，用于账单列表
				monthNow: uni.$u.timeFormat(Date.now(), 'yyyy-mm'), // 当前实际月份，用于判断是否为当月
				userBillsByDay: [], // 按日分组的账单，替代原来的 userBills
				initBillCard: true, // 是否为初始化加载账单列表
				monthlyBalance: { // 用于账单列表下方的月度收支总览
					monthlyExpend: 0,
					monthlyIncome: 0
				},
				needShowIndex: 0, // 按天展示的账单索引 (用于触底加载)
				userBillsOrderByDayArray: [], // 按天倒序排序的原始账单二维数组 (用于触底加载)
			}
		},
		computed: {
			// 计算总资产
			totalAssets() {
				// 筛选出计入总资产的资产项
				let userAssetsIncludeInTotalAssets = this.userAssets.filter(item => item.include_in_total_assets == true)
				return userAssetsIncludeInTotalAssets.reduce((lastValue, currentArr) => lastValue + currentArr.asset_balance , 0)
			},
			// 计算月度账单明细中的账单个数
			userBillsCount() {
				let count = 0
				//  修改为遍历 userBillsByDay，因为它是直接给 mj-bill-card 用的数组
				for (const dayBills of this.userBillsByDay) {
					count += dayBills.length;
				}
				return count
			}
		},
		async onReady() {
			const state = UT.checkUserTokenExpierd() // 检查老用户的token是否过期，如果过期则跳转登录，并返回true；没过期返回false
			if(state) return
			
			const {uid} = uniCloud.getCurrentUserInfo()
			if (uid) {
				this.loadData();


				// 绑定全局事件
				uni.$on('updateAssetsList',this.getUserAssets) // 已存在
				uni.$on('updateMonthlyBillBalance',this.getUserMonthlyBillBalance) // 已存在
				// uni.$on('updateBillsList',this.getUserBills) // 旧的事件，替换为新的
				uni.$on('updateBillPage', this.upDateMonthBillsToDisplay); // 新增事件，来自bills.vue
				
				this.initBillCard = false; // 完成初始化
			}
		},
		// 添加onShow生命周期
		async onShow() {
			// 检查是否需要刷新数据
			const needRefresh = uni.getStorageSync('needRefreshHome');
			if (needRefresh) {
				console.log('[Home] 检测到需要刷新数据');
				// 清除刷新标记
				uni.removeStorageSync('needRefreshHome');
				// 刷新数据
				await this.loadData();
			}

			// 判断用户是否登录，如果未登录 则跳转到登录页
			const {uid} = uniCloud.getCurrentUserInfo()
			if (!uid && (this.$mp.page.route !== 'pages/index/index' && this.$mp.page.route !== '/uni_modules/uni-id-pages/pages/login/login-withpwd') ) {
				uni.redirectTo({
					url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
				})
				return
			}

			if (uid) {
				// 避免与onReady重复加载
				if (!this.initBillCard) { 
					await this.loadData();
				}
			}
		},
		methods: {
			clickEye() {
				this.isEyeShow = !this.isEyeShow
				uni.setStorageSync('isEyeShow', this.isEyeShow)
			},
			toMyAssets() {
				uni.navigateTo({
					url:"/pagesMy/my-assets/my-assets"
				})
			},
			async swiperChange(res) {
				const prevIndex = this.isIndexShow
				this.isIndexShow = res.detail.current
				this.isIndexShow ? this.bottomBtnText = '添加资产' : this.bottomBtnText = '点我记账'
				
				if(this.isIndexShow === 1 && prevIndex === 0) { // 切换到资产页面
					const {uid} = uniCloud.getCurrentUserInfo()
					if(uid) {
						// 显示加载提示
						uni.showLoading({
							title: '加载资产数据...',
							mask: true
						})
						try {
							await this.getUserAssets()
						} catch (error) {
							console.error('资产数据加载失败:', error)
							uni.showToast({
								title: '资产数据加载失败',
								icon: 'error'
							})
						} finally {
							uni.hideLoading()
						}
					}
				} else if (this.isIndexShow === 0 && prevIndex === 1) { // 切换回账单展示
					const {uid} = uniCloud.getCurrentUserInfo()
					if(uid) {
						// 显示加载提示
						uni.showLoading({
							title: '加载账单数据...',
							mask: true
						})
						try {
							// 确保月账单数据是最新的
							await this.getMonthBillsToDisplay();
						} catch (error) {
							console.error('账单数据加载失败:', error)
							uni.showToast({
								title: '账单数据加载失败',
								icon: 'error'
							})
						} finally {
							uni.hideLoading()
						}
					}
				}
			},
			clickBottomBtn() {
				const {uid} = uniCloud.getCurrentUserInfo()
				if (!uid) {
					uni.redirectTo({
						url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
					})
					return
				}
				let url = ''
				this.isIndexShow ? url = '/pagesAccount/make-an-asset/make-an-asset' : url = '/pagesAccount/make-an-account/make-an-account'
				uni.navigateTo({
					url
				})
			},
			
			// 原 get3DayBills 和 getUserBills (获取三日账单) 被移除

			// 获取用户月账单的本月支出和本月收入 (用于首页顶部swiper) - 此方法保留
			async getUserMonthlyBillBalance() {
				const {uid} = uniCloud.getCurrentUserInfo();
				if (!uid) return;
				
				try {
					// 筛选条件 bill_date 日期格式化成 YYYY-MM 的字段，按照账单类型进行分组，并计算每个分组的总价
					// 注意：这里用的是 this.month (来自日期选择器) 还是固定用当前月份 (this.currentDate)？
					// 首页顶部swiper应该始终显示当前月份的统计，而不是跟随日期选择器变化。
					// 因此，我们应该用一个始终代表当前月份的变量。
					const currentDisplayMonth = uni.$u.timeFormat(Date.now(), 'yyyy-mm');

					const res = await db.collection("mj-user-bills").where(`user_id == $cloudEnv_uid && dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${currentDisplayMonth}"`).groupBy('bill_type').groupField('sum(bill_amount) as bill_amount_total').orderBy('bill_type asc').get()
					const monthlyExpenseTemp = res.result.data.filter(item => item.bill_type === 0)[0]?.bill_amount_total / 100 || 0 // 确保是数字
					const transferBalanceTemp = res.result.data.filter(item => item.bill_type === 2)[0]?.bill_amount_total / 100 || 0 // 确保是数字
					const monthlyIncomeTemp = res.result.data.filter(item => item.bill_type === 1)[0]?.bill_amount_total / 100 || 0 // 确保是数字
					this.monthlyExpense = Number(monthlyExpenseTemp) + Number(transferBalanceTemp)
					this.monthlyIncome = Number(monthlyIncomeTemp)
					
					// 同时更新 monthlyBalance 对象，用于首页轮播显示
					this.monthlyBalance.monthlyExpend = this.monthlyExpense
					this.monthlyBalance.monthlyIncome = this.monthlyIncome
				} catch (error) {
					console.error('获取月度账单余额失败:', error);
					// 设置默认值，避免界面显示异常
					this.monthlyExpense = 0;
					this.monthlyIncome = 0;
					this.monthlyBalance.monthlyExpend = 0;
					this.monthlyBalance.monthlyIncome = 0;
					throw error; // 重新抛出错误，让调用者处理
				}
			},
			// 获取用户资产列表 - 此方法保留
			async getUserAssets(params = false) {
				const {uid} = uniCloud.getCurrentUserInfo();
				if (!uid && !params) return; // 如果未登录且不是由带回调的调用触发，则返回
				try {
					const res = await db.collection("mj-user-assets").where(" user_id == $cloudEnv_uid ").get()
					this.userAssets = []
					let assets = res.result.data
					if(!assets.length && uid) { // 确保uid存在才创建默认资产
						await db.collection("mj-user-assets").add({
							asset_type: 'default',
							asset_balance: 0,
							default_asset: true
						})
						const defalutAsset = await db.collection("mj-user-assets").where(" user_id == $cloudEnv_uid ").get()
						assets = defalutAsset.result.data
					}
					assets.forEach(item => item.asset_balance /= 100)
					const mergedAssets = this.mergeAssets(assets)
					this.userAssets = mergedAssets
					uni.setStorageSync('mj-user-assets', this.userAssets)
					if (params && typeof params.resolve === 'function') { // 确保params是期望的带resolve的对象
						params.resolve('ok')
					}
				} catch(e) {
					console.error('获取资产列表出错:', e)
					if (params && typeof params.reject === 'function') {
						params.reject(e);
					}
				}
			},
			
			// 合并同类型同名资产 - 此方法保留
			mergeAssets(assets) {
				if (!assets || !Array.isArray(assets) || assets.length === 0) {
					return []
				}
				const assetMap = new Map()
				assets.forEach(asset => {
					const assetName = asset.asset_name || asset.asset_type
					const key = `${asset.asset_type}_${assetName}`
					if (assetMap.has(key)) {
						const existingAsset = assetMap.get(key)
						existingAsset.asset_balance += asset.asset_balance
						existingAsset.hide_in_interface = existingAsset.hide_in_interface && asset.hide_in_interface
						existingAsset.include_in_total_assets = existingAsset.include_in_total_assets || asset.include_in_total_assets
						assetMap.set(key, existingAsset)
					} else {
						assetMap.set(key, {...asset})
					}
				})
				return Array.from(assetMap.values())
			},

			// ---- 从 bills.vue 迁移过来的方法 ----
			// 触发日期选择器
			async pickDate(res) {
				const {value} = res
				this.month = uni.$u.timeFormat(value, 'yyyy-mm')
				
				// 显示加载提示
				uni.showLoading({
					title: '加载账单数据...',
					mask: true
				})
				
				try {
					await this.getMonthBillsToDisplay() // 更新账单列表
				} catch (error) {
					console.error('切换月份账单数据加载失败:', error)
					uni.showToast({
						title: '账单数据加载失败',
						icon: 'error'
					})
				} finally {
					uni.hideLoading()
				}
			},

			// 获取并处理月度账单数据 (原 getMonthBills)
			async getMonthBillsToDisplay() {
				const {uid} = uniCloud.getCurrentUserInfo();
				if (!uid) return;

				console.log(`开始获取并处理 ${this.month} 的账单数据结构`);
				// 如果非初始化 (例如，通过日期选择器更改月份时)
				if(!this.initBillCard) {
					this.userBillsByDay = [] // 重置显示的账单列表
				}
				
				try {
					// 按月份获取账单，记账日期降序排列
					const userMonthBillsQuery = db.collection("mj-user-bills")
						.where(`user_id == $cloudEnv_uid && dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${this.month}"`)
						.orderBy('bill_date desc')
						.getTemp();
					// 联表查询用户资产，用于在账单卡片中显示账户名
					const userAssetsQuery = db.collection("mj-user-assets")
						.where('user_id == $cloudEnv_uid')
						.field('_id,asset_type,user_id,asset_name')
						.getTemp();
					
					const res = await db.collection(userMonthBillsQuery, userAssetsQuery).get();
					
					let rawUserBills = res.result.data;
					// 统一修改金额为 元
					rawUserBills.forEach(bill => bill.bill_amount /= 100);

					// 计算当前选择月份的支出和收入 (用于账单列表下方的总览)
					const categorizedBillsByBillType = { 0: 0, 1: 0, 2: 0 };
					for (const bill of rawUserBills) {
					  const { bill_type, bill_amount } = bill;
					  categorizedBillsByBillType[bill_type] += bill_amount;
					}
					this.monthlyBalance.monthlyExpend = categorizedBillsByBillType[0] + categorizedBillsByBillType[2];
					this.monthlyBalance.monthlyIncome = categorizedBillsByBillType[1];

					// --- 按天对账单进行分类 ---
					let numberOfDaysInSelectedMonth;
					// 判断是当月还是历史月份，以确定日期分组的范围
					if(this.month === this.monthNow) { // 如果是当前月份
						const today = new Date();
						numberOfDaysInSelectedMonth = today.getDate(); // 获取今天是本月的第几天
					} else { // 如果是历史月份
						numberOfDaysInSelectedMonth = this.getTotalDaysInMonth(this.month); // 获取该月的总天数
					}

					const twoDimensionalArray = [];
					for (let i = 0; i < numberOfDaysInSelectedMonth; i++) {
						twoDimensionalArray.push([]);
					}
					
					rawUserBills.forEach(bill => {
						let billDay = parseInt(uni.$u.timeFormat(bill.bill_date, 'dd'), 10); // 获取账单是几号
						// 数组索引计算：数组是按日期倒序的，所以最近的日期（如当月30号）应该在数组前面。
						// 例如，如果 numberOfDaysInSelectedMonth 是30，30号的账单放在索引0，29号的账单放在索引1，以此类推。
						// 索引 = (总天数 - 账单日期日)
						// 注意：如果月份是当前月，numberOfDaysInSelectedMonth 是今天的日期，不是整月天数。
						// 例如，当前是9月10日，则 numberOfDaysInSelectedMonth=10。
						// 9月10日的账单，billDay=10, index = 10-10=0.
						// 9月9日的账单，billDay=9, index = 10-9=1.
						// 9月1日的账单，billDay=1, index = 10-1=9.
						// 这个逻辑和 bills.vue 保持一致。
						const index = numberOfDaysInSelectedMonth - billDay;
						if (index >= 0 && index < numberOfDaysInSelectedMonth) { // 确保索引在有效范围内
							twoDimensionalArray[index].push(bill);
						} else {
							// console.warn("账单日期索引计算错误", bill, "billDay:", billDay, "numberOfDays:", numberOfDaysInSelectedMonth, "index:", index);
						}
					});
					
					this.userBillsOrderByDayArray = twoDimensionalArray; // 存储原始按天分组数据，用于触底加载

					// 初始加载时，决定显示多少天的账单 (至少6条，或全部)
					this.needShowIndex = this.findNeedShowIndex(twoDimensionalArray) ?? numberOfDaysInSelectedMonth;
					this.userBillsByDay = twoDimensionalArray.slice(0, this.needShowIndex + 1);
					
					console.log('账单列表数据处理完毕，userBillsByDay:', this.userBillsByDay);
					
					// 新增：检查内容是否满一屏，不满则自动加载
					this.checkAndLoadMore();
				} catch (error) {
					console.error('获取月度账单数据失败:', error);
					throw error; // 重新抛出错误，让调用者处理
				}
			},

			// 当账单数据更新时（例如，记一笔后，或删除账单后）调用此方法
			async upDateMonthBillsToDisplay() {
				// 显示加载提示
				uni.showLoading({
					title: '更新数据中...',
					mask: true
				})
				
				try {
					await this.getMonthBillsToDisplay(this.month);
					await this.getUserAssets(); // 确保资产信息也是最新的，因为账单卡片可能需要
					await this.getUserMonthlyBillBalance(); // 更新首页顶部的月度收支统计
				} catch (error) {
					console.error('更新账单数据失败:', error)
					uni.showToast({
						title: '更新数据失败',
						icon: 'error'
					})
				} finally {
					uni.hideLoading()
				}
			},

			// 获取指定年月的总天数
			getTotalDaysInMonth(yearmonth) {
				const [year,monthStr] = yearmonth.split('-');
				const month = parseInt(monthStr, 10);
				// 创建一个日期对象，月份参数是 0-11，所以 month-1
				// 将日期设为下个月的第0天，即为本月的最后一天
				const date = new Date(year, month, 0);
				return date.getDate(); // 获取本月总天数
			},

			// 找到账单数 >= 6条时所在的日期分组索引 (用于初始加载)
			findNeedShowIndex(twoDimensionalArray) {
				if (!twoDimensionalArray || twoDimensionalArray.length === 0) return 0;
				let currentIndex = 0;
				let accumulatedBillCount = 0;
				for (const dayBills of twoDimensionalArray) {
					accumulatedBillCount += dayBills.length;
					if (accumulatedBillCount >= 6) {
						return currentIndex;
					}
					currentIndex++;
				}
				// 如果总账单数少于6条，则返回最后一个有账单的索引，或者数组的最后索引
				return currentIndex > 0 ? currentIndex -1 : 0;
			},
			
			// 筛选按钮点击（占位）
			toFilterBills() {
				uni.showToast({
					title:"功能开发中~",
					icon:"none"
				})
			},

			// 添加loadData方法
			async loadData() {
				// 显示加载提示
				uni.showLoading({
					title: '数据加载中...',
					mask: true
				});
				
				try {
					// 获取用户资产列表
					await this.getUserAssets();
					// 获取首页顶部轮播所需的本月支出和本月收入
					await this.getUserMonthlyBillBalance();
					// 获取月度账单列表
					await this.getMonthBillsToDisplay();
				} catch (error) {
					console.error('首页数据加载失败:', error);
					uni.showToast({
						title: '数据加载失败',
						icon: 'error'
					});
				} finally {
					uni.hideLoading();
				}
			},

			// 新增：检查内容是否满一屏，不满则自动加载更多
			async checkAndLoadMore() {
				this.$nextTick(() => {
					// 如果所有天数的账单都已加载，则无需检查
					if (this.needShowIndex >= this.userBillsOrderByDayArray.length - 1) {
						return;
					}
					const query = uni.createSelectorQuery().in(this);
					// .home 是整个页面的根容器
					query.select('.home').boundingClientRect(data => {
						if (!data) return; // 未找到元素则退出
						const windowHeight = uni.getSystemInfoSync().windowHeight;
						// 如果内容高度小于屏幕高度，说明没产生滚动条
						if (data.height < windowHeight) {
							console.log('内容不足一屏，自动加载更多...');
							this.loadMoreBills(true); // 传入true表示是自动加载
						}
					}).exec();
				});
			},
			
			// 新增：从 onReachBottom 提取的通用加载逻辑
			loadMoreBills(isAutoLoad = false) {
				// isAutoLoad 用于区分是用户手动触底还是程序自动加载
				
				// 如果已经加载到最后一天，则停止
				if (this.needShowIndex >= this.userBillsOrderByDayArray.length - 1) {
					// 只有在用户手动上拉时才提示，避免初始自动加载时出现不必要的提示
					if (!isAutoLoad) {
						uni.showToast({ title: '没有更多账单了', icon: 'none' });
					}
					return;
				}
			
				this.needShowIndex++;
				let oneDayBillArray = this.userBillsOrderByDayArray[this.needShowIndex];
				
				// 可能存在某一天没有账单的情况，继续查找下一个有账单的日期
				while(this.needShowIndex < this.userBillsOrderByDayArray.length - 1 && (!oneDayBillArray || oneDayBillArray.length === 0) ) {
					this.needShowIndex++;
					oneDayBillArray = this.userBillsOrderByDayArray[this.needShowIndex];
				}
			
				if (oneDayBillArray && oneDayBillArray.length > 0) {
					this.userBillsByDay.push(oneDayBillArray);
					console.log("成功加载更多账单:", oneDayBillArray);
					// 如果是自动加载触发的，加载完之后需要再次检查是否满一屏
					if(isAutoLoad) {
						this.checkAndLoadMore();
					}
				} else {
					// 如果循环结束仍未找到有账单的数组，说明已经到底了
					if (!isAutoLoad) {
						uni.showToast({ title: '没有更多账单了', icon: 'none' });
					}
				}
			},
		},
		// ---- 触底加载逻辑，从 bills.vue 迁移 ----
		onReachBottom() {
			// 只有在账单显示区域才执行触底加载
			if (this.isIndexShow === 0) {
				console.log("首页触底，尝试加载更多账单...");
				this.loadMoreBills();
			}
		},
		onUnload(){
			uni.$off('updateAssetsList', this.getUserAssets)
			// uni.$off('updateBillsList') // 旧事件已移除
			uni.$off('updateMonthlyBillBalance', this.getUserMonthlyBillBalance)
			uni.$off('updateBillPage', this.upDateMonthBillsToDisplay); // 移除新事件
		},
		// 分享功能
		onShareAppMessage () {
			return {
				title: "致富之路——口袋智富",
				path: "/pages/index/index",
				imageUrl: "/static/share.png"
			}
		},
		// 分享到朋友圈功能
		onShareTimeline(){
			return {
				title: '致富之路——口袋智富'
			}
		}
	}
</script>

<style lang="scss" scoped>
	.home {
		.swiper {
			height: 300rpx;
			background-color: $mj-theme-color;
			border-radius: 0 0 40rpx 40rpx;
			
			.swiper-item {
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				box-sizing: border-box;
				padding: 0 28rpx;

				.header {
					color: $mj-text-color-grey;
					font-size: 28rpx;
				}

				.moneyContent {
					display: flex;
					justify-content: space-between;
					align-items: center;
					font-size: 72rpx;
				}

				.footer {
					display: flex;
					color: $mj-text-color-grey;
					font-size: 28rpx;
					>text {
						flex: 1;
						width: 375rpx;
						.bold {
							margin-left: 12rpx;
							color: $mj-text-color;
							font-weight: bold;
						}
					}
				}
				.bottom {
					height: 40rpx;
				}
			}
		}

		// 原 .bills 和 .asset 的通用底部填充现在由 .monthly-bills-section 和 .asset 单独处理
		// .bills,.asset {
		// 	padding-bottom: 104rpx; // 移除，或由各自的section控制
		// }

		// 资产页样式 (原 .asset)
		.asset {
			padding-bottom: 104rpx; // 为底部按钮留出空间
			.header {
				margin: 16rpx 0;
				padding-left: 12rpx;
				display: flex;
				align-items: center;
				justify-content: space-between;
				color: $mj-text-color;
				font-size: 32rpx;
				text {
					padding-left: 8rpx;
				}
				.left {
					display: flex;
					align-items: center;
				}
				.right {
					display: flex;
					align-items: center;
					box-sizing: border-box;
					padding: 4px 8px;
					margin-right: 8px;
					background-color: $mj-theme-color;
					border-radius: 16px;
					font-size: 28rpx;
					color: $mj-bg-color;
				}
			}
		}
		
		// 新增：月度账单展示区域的样式
		.monthly-bills-section {
			padding-bottom: 104rpx; // 为底部按钮留出空间
			// 从 bills.vue 迁移过来的样式
			.header-fixed {
				// position: fixed; // 移除fixed，因为它在首页的swiper下方
				width: 100%;
				// top: 0; // 移除
				// left: 0; // 移除
				box-sizing: border-box;
				padding: 0 28rpx;
				background-color: $mj-theme-color; // 主题色背景
				height: 80rpx;
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 32rpx;
				color: $mj-text-color; // 文本颜色
				// z-index: 999; // 如果不是fixed，z-index可能意义不大
			}
			.linear-gradient {
				// 这个渐变背景是紧随header-fixed的，如果header-fixed不固定了，它的定位也需要考虑
				// position: absolute; // 移除绝对定位，让它自然流动
				// top: 80rpx; // 移除
				left: 0;
				right: 0;
				height: 100rpx; // 可以调整或移除，看是否还需要这个视觉效果
				background-image: linear-gradient(#9fcba7, #fafafa); // 主题色到几乎白色的渐变
				// z-index: -1; // 如果不是覆盖内容，z-index意义不大
			}
			.card-money {
				margin: 20rpx 28rpx 0;
				box-sizing: border-box;
				background-color: #fff;
				height: 88rpx;
				border-radius: 36rpx;
				font-size: 24rpx;
				display: flex;
				justify-content: space-around;
				align-items: center;
				color: $mj-text-color;
				box-shadow: rgba(0, 0, 0, 0.03) 0px 20px 25px -5px, rgba(0, 0, 0, 0.01) 0px 10px 10px -5px;
				.left {
					display: flex;
					justify-content: flex-start;
				}
				.right {
					display: flex;
					justify-content: flex-start;
				}
			}
			.bill-list {
				.header { // 账单明细列表的头部
					margin: 16rpx 0;
					padding-left: 12rpx;
					display: flex;
					justify-content: space-between; // 使左右内容分开
					align-items: center;
					color: #000; // 文本黑色
					font-size: 32rpx;
					text {
						padding-left: 8rpx;
					}
					.header-left {
						display: flex;
						align-items: center;
					}
					// 月份选择器的右边距在原始组件中设置
				}
			}
		}

		.bottom-btn {
			box-sizing: border-box;
			z-index: 999;
			position: fixed;
			width: 100%;
			padding: 0 24rpx 12px;
			bottom: 0;
			opacity: 0.98;
		}
	}
</style>