<template>
	<view class="bill-template">
		<!-- 需要从数据库中获取数据进行渲染 -->
		<!-- 去掉@click.native的.native -->
		<view @click="clickTemp(temp)" v-for="temp in formatTempList" :key="temp._id">
			<mj-card :title="temp.bill_type === 0 ? '支出' : '收入'" v-if="temp.bill_type !== 2">
				<view class="one-bill-template">
					<view class="left">
						<mj-icon-with-background :type="temp.billStyle.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
						<view class="info">
							<view>{{temp.billStyle.title}}</view>
							<view class="minor" v-if="temp.bill_notes"><u--text :lines="1" :text="temp.bill_notes" color="rgba(0,0,0, 0.6)" size="24rpx"></u--text></view> <!-- 设置超过一行就... 可以使用u-text组件 -->
						</view>
					</view>
					<view class="right">
						<u--text mode="price" :text="temp.bill_amount" :color="temp.bill_type === 0 ? '#dd524d' : '#219a6d'" size="32rpx" bold></u--text>
						<view class="minor">{{temp.asset_id[0].asset_name || temp.assetStyle.title}}</view>
					</view>
				</view>
			</mj-card>
			<mj-card v-else title="转账">
				<view class="one-bill-template">
					<view class="left">
						<mj-icon-with-background :type="temp.billStyle.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
						<view class="info">
							<view>{{temp.billStyle.title}}</view>
							<view class="minor" v-if="temp.bill_notes"><u--text :lines="1" :text="temp.bill_notes" color="rgba(0,0,0, 0.6)" size="24rpx"></u--text></view> <!-- 设置超过一行就... 可以使用u-text组件 -->
						</view>
					</view>
					<view class="right">
						<u--text mode="price" :text="temp.transfer_amount / 100" color="#212121" size="32rpx" bold></u--text>
						<view class="minor">{{temp.asset_id[0].asset_name || temp.assetStyle.title}}</view>
					</view>
				</view>
			</mj-card>
		</view>
		<view v-show="formatTempList.length == 0">
			<u-empty mode="list" text="暂时没有模板哦,快去添加一个吧"></u-empty>
		</view>

		
		<mj-bill-details-popup
			type="temp"
			:bill="templateDetails"
			:show="showBillDetails" 
			@close="showBillDetails = false" 
			@updateBill="updateTemp" 
			@deleteBill="deleteTemp"
		>
		</mj-bill-details-popup>
	</view>
</template>

<script>
	const db = uniCloud.database()
	import {getAllIconList, getAssetsStyle} from "@/utils/icon-config.js";
	export default {
		name:"mj-bill-template",
		// templateList 原始模板列表；pageType 页面类型:account 记一笔页面  temp 管理模板页面
		props: ['templateList','pageType'],
		data() {
			return {
				templateDetails: {},
				showBillDetails: false,
				iconGather: getAllIconList(),
				assetsStyle: getAssetsStyle(),
				formatTempList: []
			};
		},
		watch: {
			templateList: {
				handler(newValue, oldValue) {
					// console.log('[DEBUG] mj-bill-template watcher: templateList changed. New length:', newValue ? newValue.length : 0);
					this.formatTemp();
				},
				immediate: true,
				deep: true
			}
		},
		mounted() {
			// console.log('[DEBUG] mj-bill-template mounted. Initial templateList length:', this.templateList ? this.templateList.length : 0);
			if (this.templateList && this.templateList.length > 0 && this.formatTempList.length === 0) {
				 // console.log('[DEBUG] mj-bill-template mounted: Calling formatTemp because formatTempList is still empty.');
				 this.formatTemp();
			}
		},
		methods: {
			updateTemp() {
				// 修改模板
				// 1 将改模板存入缓存，在记一笔页面读取缓存
				// 2 进入记一笔页面
				// 3 隐藏pop框
				uni.setStorageSync('mj-user-temp-template',this.templateDetails)
				uni.navigateTo({
					url: `/pagesAccount/make-an-account/make-an-account?type=templateEdit`
				})
				setTimeout(() => {
					this.showBillDetails = false
				}, 2000)
			},
			async deleteTemp() {
				uni.showModal({
					content: "你确定删除该模板吗？（删除之后不可恢复哦）",
					cancelColor: "rgba(0,0,0,0.6)",
					confirmColor:"#9fcba7",
					success:async res =>  {
						if(res.confirm) {
							uni.showLoading({
								title: "删除中",
								mask: true
							})
							await db.collection('mj-user-templates').doc(this.templateDetails._id).remove()
							this.$emit('updateList')
							uni.hideLoading()
							uni.showToast({
								title: "删除成功",
								icon: "success"
							})
							this.showBillDetails = false
						}
					}
				})
			},
			// 点击每个模板卡片触发
			clickTemp(temp) {
				// 只有在模板管理页面才能查看模板详情
				if(this.pageType === 'temp') {
					this.templateDetails = {}
					this.templateDetails = temp
					this.showBillDetails = true
				}
				// 如果在记一笔页面，返回当前点击的模板数据
				if(this.pageType === 'account') {
					this.$emit('getTemp',temp)
				}
			},
			formatTemp() {
				// console.log('[DEBUG] mj-bill-template: formatTemp called.');
				const assets = uni.getStorageSync('mj-user-assets');
				// console.log('[DEBUG] mj-bill-template: assets from storage:', JSON.stringify(assets));

				if (!this.templateList || this.templateList.length === 0) {
					console.log('[DEBUG] mj-bill-template: formatTemp - templateList is empty, setting formatTempList to [].');
					this.formatTempList = [];
					return;
				}
				
				const arr = uni.$u.deepClone(this.templateList);
				// 1 修改金额单位 变为元
				// 2 通过category_type给每一条添加对应billStyle
				// 3 通过asset_type给每一条添加对应的assetStyle
				// 4 如果转入资产的id，给其添加对应的destinationAssetStyle
				arr.forEach(temp => {
					temp.bill_amount /= 100
					temp.billStyle = this.iconGather.find(item => item.type === temp.category_type)
					// 如果为undefined，则对应的资产被用户删除
					const assetFromStorage = assets ? assets.find(item => item._id ===  temp.asset_id[0]?._id) : null;
					const asset_type = assetFromStorage?.asset_type
					// 判断模板的资产id对应的资产有没有被用户删除
					if(asset_type) {
						temp.assetStyle = this.assetsStyle.find(item => item.type === asset_type)
						// hasAsset 用户是否存在对应资产
						temp.hasAsset = true
						// 确保 asset_id[0].asset_name 存在，否则使用 assetStyle.title
						temp.asset_id[0].asset_name = assetFromStorage.asset_name || temp.assetStyle.title;
					} else {
						temp.assetStyle = {}
						temp.assetStyle.title = '资产已删除'
						temp.hasAsset = false
						// 如果原始数据中 asset_id[0] 可能不存在，需要更安全的处理
						if (!temp.asset_id || !temp.asset_id[0]) {
							temp.asset_id = [{ asset_name: '资产已删除' }];
						} else {
							 temp.asset_id[0].asset_name = '资产已删除';
						}
					}
					const destinationAssetFromStorage = assets ? assets.find(item => item._id ===  temp.destination_asset_id[0]?._id) : null;
					const destination_asset_type = destinationAssetFromStorage?.asset_type
					if(destination_asset_type) {
						temp.destinationAssetStyle = this.assetsStyle.find(item => item.type === destination_asset_type)
						temp.hasDestinationAsset = true
						temp.destination_asset_id[0].asset_name = destinationAssetFromStorage.asset_name || temp.destinationAssetStyle.title;
					} else {
						temp.destinationAssetStyle = {}
						temp.destinationAssetStyle.title = '资产已删除'
						temp.hasDestinationAsset = false
						if (!temp.destination_asset_id || !temp.destination_asset_id[0]) {
							temp.destination_asset_id = [{ asset_name: '资产已删除' }];
						} else {
							temp.destination_asset_id[0].asset_name = '资产已删除';
						}
					}
				})
				this.formatTempList = arr
				// console.log('[DEBUG] mj-bill-template: formatTemp finished. formatTempList length:', this.formatTempList.length);
			}
		}
	}
</script>

<style lang="scss" scoped>
.bill-template {
	.one-bill-template {
		display: flex;
		justify-content: space-between;
		color: $mj-text-color;
		
		font-size: 32rpx;
		padding: 8rpx 0;
	
		.left {
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
}
</style>