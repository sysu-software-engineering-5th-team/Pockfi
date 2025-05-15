<template>
	<view class="asset-card">
		<!-- 这里需要循环 -->
		<view class="content">
			<!-- 滑动单元格 -->
			<u-swipe-action>
				<u-swipe-action-item :options="options" v-for="asset,index in userAssetsShow" :key="asset._id" :threshold="80" @click="clickSwipeActionItemBtn($event,asset)" >
					<view class="swipe-action-item">
						<view class="left">
							<mj-icon-with-background :type="asset.assetStyle.icon" size="48rpx" customPrefix="miaoji" :color="asset.assetStyle.color"></mj-icon-with-background>
							<view class="info">
								<view>{{asset.assetStyle.title}}</view>
								<view class="asset-name" v-if="asset.asset_name">{{asset.asset_name}}</view>
							</view>
						</view>
						<view class="right">
							<view class="money">
								<u--text v-if="isEyeShow" mode="price" :text="asset.asset_balance" color="rgba(0,0,0, 0.8)" size="32rpx" bold></u--text>
								<view v-else>
									￥*****
								</view>
							</view>
						</view>
					</view>
					<view class="line" v-if="index != userAssetsShow.length - 1">
						<u-line length="80%"></u-line>
					</view>
				</u-swipe-action-item>
			</u-swipe-action>
		</view>
		<view class="hideAsset" @click="clickHideAsset">查看隐藏资产</view>
		
		<!-- 隐藏资产弹出框 -->
		<u-popup :show="showHideAsset" @close="showHideAsset = false" round="20px" :safeAreaInsetBottom="safeAreaInsetBottom" > 
			<view>
				<view class="top">小金库</view>
				<view v-if="userAssetsHide.length">
					<u-swipe-action>
						<u-swipe-action-item :options="options" v-for="asset in userAssetsHide" :key="asset._id" :threshold="80" @click="clickSwipeActionItemBtn($event,asset)" >
							<view class="swipe-action-item">
								<view class="left">
									<mj-icon-with-background :type="asset.assetStyle.icon" size="48rpx" customPrefix="miaoji" :color="asset.assetStyle.color"></mj-icon-with-background>
									<view class="info">
										<view>{{asset.assetStyle.title}}</view>
										<view class="asset-name" v-if="asset.asset_name">{{asset.asset_name}}</view>
									</view>
								</view>
								<view class="right">
									<view class="money">
										<u--text v-if="isEyeShow" mode="price" :text="asset.asset_balance" color="rgba(0,0,0, 0.8)" size="32rpx" bold></u--text>
										<view v-else>
											￥*****
										</view>
									</view>
								</view>
							</view>
							<view class="line" v-if="item != 2">
								<u-line length="80%"></u-line>
							</view>
						</u-swipe-action-item>
					</u-swipe-action>
				</view>
				<view v-else class="bottom">
					还没有隐藏金库噢！
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import {getAssetsStyle} from "@/utils/icon-config.js";
	const db = uniCloud.database()
	
	export default {
		name: "mj-asset-card",
		props: ['userAssetsFromDB','isEyeShow','safeAreaInsetBottom'],

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
				assets: [], // 将由 watcher 初始化
				assetsStyle: [], // 在 created 中加载
				showHideAsset: false,
				showBalance: true,
				// 默认资产样式，当找不到匹配的资产类型时使用
				defaultAssetStyle: {
					title: '默认资产',
					icon: 'mj-qianbao',
					color: '#9fcba7',
					type: 'default'
				}
			};
		},
		computed: {
			userAssetsShow() {
				return this.assets.filter(item => item.hide_in_interface == false)
			},
			// 隐藏资产，一定不计入总资产
			userAssetsHide() {
				return this.assets.filter(item => item.hide_in_interface == true)
			}
		},
		created() {
			// 在组件创建时获取资产样式配置
			this.assetsStyle = getAssetsStyle();
		},
		methods: {
			clickSwipeActionItemBtn({index},asset) { // 0 点击了修改  1 点击了删除
				// 获取资产信息 ，如果点击了修改，则先缓存，后跳转到修改页拿到缓存渲染页面，后删除缓存；如果点击了删除，先提示弹框，后通过id删除
				// console.log(index,asset);
				if(index == 0) {
					uni.setStorageSync('mj-asset-edit',asset)
					uni.navigateTo({
						// 需要传递的参数  type  资产金额 是否隐藏 是否计入总资产 用户名？ 
						url:`/pagesAccount/set-asset/set-asset?type=${asset.asset_type}`
					})
				} else {
					// console.log("点击了删除");
					uni.showModal({
						content: "你确定删除该资产账户吗？（删除之后不可恢复哦）",
						cancelColor: "rgba(0,0,0,0.6)",
						confirmColor:"#9fcba7",
						success:async res =>  {
							if(res.confirm) {
								await db.collection("mj-user-assets").doc(asset._id).remove()
								uni.$emit('updateAssetsList')
								uni.showToast({
									title: "删除成功",
									icon: "success"
								})
							}
						}
					})
				}
			},
			clickHideAsset() {
				this.showHideAsset = true
				// console.log(this.userAssetsHide);
			}
		},
		watch: {
			userAssetsFromDB: {
				deep: true,
				immediate: true, // 确保初始时也能处理 prop
				handler: function(newAssetsFromDB) {
					if (newAssetsFromDB && Array.isArray(newAssetsFromDB)) {
						// 基于 prop 创建一个新的、响应式的本地 assets 列表
						this.assets = newAssetsFromDB.map(asset => {
							const matchedStyle = this.assetsStyle.find(style => style.type === asset.asset_type);
							return {
								...asset, // 展开原始资产属性
								assetStyle: matchedStyle || this.defaultAssetStyle // 添加或更新 assetStyle
							};
						});
					} else {
						this.assets = []; // 如果 prop 无效或为空，则清空本地列表
					}
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.asset-card {
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
					.asset-name {
						color: $mj-text-color-grey;
						font-size: 24rpx;
					}
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
		
		.top {
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 28rpx;
			border-radius: 20px 20px 0 0;
			color: $mj-text-color-grey;
			height: 48rpx;
			background-color: $mj-bg-color;
			padding: 8rpx 0 4rpx;
		}
		.bottom {
			display: flex;
			justify-content: center;
			align-items: center;
			color: $mj-theme-color;
			height: 100rpx;
			width: 100%;
			background-color: $mj-bg-color;
		}
		
		.line {
			display: flex;
			justify-content: center;
		}
		
		.hideAsset {
			display: flex;
			justify-content: center;
			font-size: 24rpx;
			color: $mj-text-color-grey;
			margin-top: 20px;
		}
		
		.money {
			font-weight: bold;
		}

	}
</style>