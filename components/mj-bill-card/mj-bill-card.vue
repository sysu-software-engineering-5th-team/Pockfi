<template>
	<view class="bill-card" v-if="userBills.length !== 0">
		<view class="header">
			<text>{{today}}</text>
			<text>支:{{totalExpenditure}} 收:{{totalIncome}}</text>
		</view>
		<!-- 这里需要循环 -->
		<view class="content">
			<!-- 滑动单元格 -->
			<u-swipe-action>
				<u-swipe-action-item :options="options" v-for="bill,index in userBills" :key="bill._id" :threshold="80" @click="clickSwipeActionItemBtn($event,bill)">
					<view class="swipe-action-item" @click="clickBillDetail(bill)">
						<view class="left">
							<mj-icon-with-background :type="bill.billStyle.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
							<view class="info">
								<view>{{bill.billStyle.title}}</view>
								<view class="minor" v-if="bill.bill_notes"><u--text :lines="1" :text="bill.bill_notes" color="rgba(0,0,0, 0.6)" size="24rpx"></u--text></view> <!-- 设置超过一行就... 可以使用u-text组件 -->
							</view>
						</view>
						<view class="right">
							<view class="money" v-if="bill.bill_type === 0">
								<u--text mode="price" :text="bill.bill_amount" color="#dd524d" size="32rpx" bold></u--text>
							</view>
							<view class="money" v-if="bill.bill_type === 1">
								<u--text mode="price" :text="bill.bill_amount" color="#219a6d" size="32rpx" bold></u--text>
							</view>
							<view class="money" v-if="bill.bill_type === 2">
								<u--text mode="price" :text="(bill.transfer_amount / 100)" color="#212121" size="32rpx" bold></u--text>
							</view>
							<view class="minor">{{ bill.asset_id && bill.asset_id[0] && bill.asset_id[0].asset_name ? bill.asset_id[0].asset_name : (bill.assetStyle ? bill.assetStyle.title : '未知资产') }}</view>
						</view>
					</view>
					<view class="line" v-if="index != userBills.length - 1">
						<u-line length="80%"></u-line>
					</view>
				</u-swipe-action-item>
			</u-swipe-action>
			<mj-bill-details-popup
				:bill="billDetails"
				:show="showBillDetails" 
				@close="showBillDetails = false" 
				@updateBill="clickSwipeActionItemBtn({index: 0},billDetails)" 
				@deleteBill="clickSwipeActionItemBtn({index: 1},billDetails)"
			>
			</mj-bill-details-popup>
		</view>
	</view>
</template>

<script>
	import {getAllIconList, getAssetsStyle} from "@/utils/icon-config.js";
	// 金额处理工具
	import { convertYuanToCent } from '@/utils/amount-utils.js'
	const db = uniCloud.database()
	export default {
		name: "mj-bill-card",
		props: ['userBillsFromDB','userAssetsFromDB'],
		// userBillsFromDB 中金额单位为元
		data() {
			return {
				options: [{
					text: "修改",
					style: {
						backgroundColor: '#9fcba7',
						padding: '0 40rpx'
					}
				}, {
					text: "删除",
					style: {
						backgroundColor: '#e94459',
						padding: '0 40rpx'
					}
				}],
				userBills: [],
				userAssets: [],
				iconGather: getAllIconList(),
				assetsStyle: getAssetsStyle(),
				today: '',
				// 账单详情 
				billDetails: {},
				showBillDetails: false
			};
		},
		computed: {
			// 支出 = 支出类型 + 转账手续费
			totalExpenditure() {
				// 支出总额
				const expendAmount = this.userBills
					.filter(bill => bill.bill_type === 0)
					.reduce((prev, next) => prev + next.bill_amount, 0);
		
				// 转账手续费总额
				const transferFee = this.userBills
					.filter(bill => bill.bill_type === 2)
					.reduce((prev, next) => prev + next.bill_amount, 0);
				
				return (expendAmount + transferFee).toFixed(2);
			},
			// 收入
			totalIncome() {
				const incomeBills = this.userBills.filter(bill => bill.bill_type === 1)
				return incomeBills.reduce((prev,next) => prev + next.bill_amount ,0).toFixed(2)
			}
			
		},
		methods: {
			clickBillDetail(bill) {
				// 用户点击某个账单
				// 1 拿到账单信息，处理账单
				// 2 将账单信息传递给 mj-bill-details-popup
				// 3 show弹出框
				this.billDetails = {}
				this.billDetails = {...bill}
				this.showBillDetails = true
			},
			clickSwipeActionItemBtn({index},bill) {  // 0 修改  1 删除
				if(index === 1) {
					uni.showModal({
						content: "你确定删除该账单吗？（删除之后不可恢复哦）",
						cancelColor: "rgba(0,0,0,0.6)",
						confirmColor:"#9fcba7",
						success:async res =>  {
							if(res.confirm) {
								uni.showLoading({
									title: "删除中",
									mask: true
								})
								await db.collection("mj-user-bills").doc(bill._id).remove()
								// console.log('删除账单成功');
								// uni.$emit('updateBillsList') // 已经没有这个事件了
								uni.$emit('updateMonthlyBillBalance')
								await this.updateAssetBalance(bill)
								// console.log('更新资产成功');
								// 等待资产异步更新完成，用户资产缓存更新完成
								await this.asyncEmitUpdateAssets()
								// 更新账单页面
								uni.$emit('updateBillPage')
								// 通知提醒页面更新存钱目标
								uni.$emit('savingGoalsMightUpdate'); 
								uni.hideLoading()
								uni.showToast({
									title: "删除成功",
									icon: "success"
								})
								// 如果是弹出框中点击删除，则隐藏弹出框
								if(this.showBillDetails) {
									this.showBillDetails = false
								}
							}
						}
					})
				} else {
					// 修改账单  存入缓存，在记一笔页面读取
					uni.setStorageSync('mj-bill-edit',bill)
					// 如果是弹出框中点击修改，则隐藏弹出框
					if(this.showBillDetails) {
						this.showBillDetails = false
					}
					// 传递参数，挑战到记一笔页面
					uni.navigateTo({
						url:`/pagesAccount/make-an-account/make-an-account?type=edit&tab=${bill.bill_type}`
					})
				}
			},
			// 更新资产金额
			async updateAssetBalance(bill) {
				// 所选账单的金额  单位换为分
				const bill_amount = convertYuanToCent(bill.bill_amount)
				if(bill.bill_type === 0 || bill.bill_type === 1) {
					// 找出该账单使用资产对应的资产余额
					let assetBalance = this.userAssets.find(item => item._id === bill.asset_id[0]?._id)?.asset_balance ?? 'none'
					// 如果取不到资产余额，即用户账单对应的资产以及被删除了，则return
					if(assetBalance === 'none') return
					assetBalance = convertYuanToCent(assetBalance)  // 转换单位为分
					// console.log(assetBalance);
					if(bill.bill_type === 0) {
						const asset_balance = assetBalance + bill_amount
						await db.collection("mj-user-assets").doc(bill.asset_id[0]._id).update({
							asset_balance
						})
					} else {
						const asset_balance = assetBalance - bill_amount
						await db.collection("mj-user-assets").doc(bill.asset_id[0]._id).update({
							asset_balance
						})
					}
				} else {
					// 转出账户 资产余额
					let transferOutAssetBalance = this.userAssets.find(item => item._id === bill.asset_id[0]?._id)?.asset_balance ?? 'none'
					// 转入账户 资产余额
					let transferIntoAssetBalance = this.userAssets.find(item => item._id === bill.destination_asset_id[0]?._id)?.asset_balance ?? 'none'
					// 如果取不到资产余额，即用户账单对应的资产已经被删除了，则不执行
					if(transferOutAssetBalance != 'none') {
						transferOutAssetBalance = convertYuanToCent(transferOutAssetBalance)  // 转换单位为分
						// 删除账单后转出资产余额 = 转出资产余额 + 手续费 + 转账金额  注意单位为分
						transferOutAssetBalance = transferOutAssetBalance + bill_amount + bill.transfer_amount
						// 更新
						await db.collection("mj-user-assets").doc(bill.asset_id[0]._id).update({
							asset_balance: transferOutAssetBalance
						})
					}
					if(transferIntoAssetBalance != 'none') {
						transferIntoAssetBalance = convertYuanToCent(transferIntoAssetBalance)  // 转换单位为分
						// 删除账单后转入资产余额 = 转入资产余额 - 转账金额
						transferIntoAssetBalance = transferIntoAssetBalance - bill.transfer_amount
						await db.collection("mj-user-assets").doc(bill.destination_asset_id[0]._id).update({
							asset_balance: transferIntoAssetBalance
						})
					}
				}
			},
			setToday() {
				// 赋值日期
				this.today = uni.$u.timeFormat(this.userBills[0]?.bill_date, 'mm月dd日')
				if(this.today === uni.$u.timeFormat(Date.now(), 'mm月dd日')) this.today += ' 今天'
				if(this.today === uni.$u.timeFormat(Date.now() - 86400000, 'mm月dd日')) this.today += ' 昨天'
				if(this.today === uni.$u.timeFormat(Date.now() - 172800000, 'mm月dd日')) this.today += ' 前天'
			},
			// 异步更新资产
			async asyncEmitUpdateAssets() {
				return new Promise((resolve) => {
					uni.$emit('updateAssetsList', {resolve})
				})
			}
		},
		watch: {
			userBillsFromDB: {
				immediate: true,
				handler(newValue) {
					if(!newValue?.length) {
						this.userBills = []
						return
					}
					this.userBills = newValue
					// 通过type给每一条添加对应billStyle
					if(!this.userBills) this.userBills = []
					this.userBills.forEach(bill => {
						bill.billStyle = this.iconGather.find(item => item.type === bill.category_type)
					})
					// 通过asset_id.asset_type给每一条添加对应的assetStyle
					this.userBills.forEach(bill => {
						// 更加安全的访问
						const assetType = bill.asset_id && bill.asset_id[0] ? bill.asset_id[0].asset_type : undefined;
						if (assetType) {
							bill.assetStyle = this.assetsStyle.find(item => item.type === assetType);
						} else {
							bill.assetStyle = null; // 或者一个默认的 assetStyle 对象
						}
					})
					this.setToday()
					// console.log('监听userBillsFromDB，赋值userbills',this.userBills );
				}
			},
			userAssetsFromDB: {
				immediate: true,
				handler(newValue) {
					this.userAssets = newValue
				}
			}
		},
	}
</script>

<style lang="scss" scoped>
	.bill-card {
		padding-right: 24rpx;
		margin-bottom: 12rpx;

		.header {
			padding-left: 24rpx;
			display: flex;
			justify-content: space-between;
			color: $mj-text-color-grey;
			font-size: 28rpx;
		}

		.content {
			.swipe-action-item {
				background-color: $mj-bg-color;
				display: flex;
				justify-content: space-between;
				height: 100rpx;
				color: $mj-text-color;
				font-size: 32rpx;
				padding: 8rpx 0;

				.left {
					padding-left: 24rpx;
					display: flex;
					justify-content: right;
					align-items: center;

					.info {
						display: flex;
						flex-direction: column;
						justify-content: center;
						padding-left: 24rpx;
					}
				}

				.right {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: flex-end;
					padding-right: 20rpx;
				}

				.minor {
					color: $mj-text-color-grey;
					font-size: 24rpx;
				}
			}

			.line {
				display: flex;
				justify-content: center;
			}


		}
	}
</style>