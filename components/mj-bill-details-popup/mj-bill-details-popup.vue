<template>
	<u-popup :show="show" @close="close" round="20px" zIndex="10076" :safeAreaInsetBottom="safeAreaInsetBottom" >
		<view class="user-assets-list">
			<view class="top">
				<view class="btn del" @click="deleteBill">
					删除
				</view>
				<view class="btn edit" @click="updateBill">
					修改
				</view>
			</view>
			<view class="content">
				<mj-card title="分类">
					<view class="category">
						<mj-icon-with-background :type="billDetails.billStyle.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
						<text>{{billDetails.billStyle.title}}</text>
					</view>
				</mj-card>
				<mj-card title="账单">
					<view class="row">
						<view>
							金额
						</view>
						<view v-if="billDetails.bill_type === 0">
							<u--text mode="price" :text="billDetails.bill_amount" color="#dd524d" size="32rpx" bold></u--text>
						</view>
						<view v-if="billDetails.bill_type === 1">
							<u--text mode="price" :text="billDetails.bill_amount" color="#219a6d" size="32rpx" bold></u--text>
						</view>
						<view v-if="billDetails.bill_type === 2">
							<u--text mode="price" :text="billDetails.transfer_amount" color="#212121" size="32rpx" bold></u--text>
						</view>
					</view>
					<view class="row" v-if="billDetails.bill_type === 2">
						<view>
							手续费
						</view>
						<view>
							<u--text mode="price" :text="billDetails.bill_amount" color="#212121" size="32rpx" bold></u--text>
						</view>
					</view>
					<view class="row">
						<view>
							时间
						</view>
						<view>
							{{billDate}}
						</view>
					</view>
				</mj-card>
				<mj-card title="资产">
					<view class="row">
						<view>
							资产账户
						</view>
						<view class="highlight" v-if="billDetails.assetStyle && billDetails.assetStyle.title !== '资产信息缺失' && billDetails.assetStyle.title !== '无数据' ">
							{{ (billDetails.asset_id && billDetails.asset_id.length > 0 && billDetails.asset_id[0] && billDetails.asset_id[0].asset_name) ? `${billDetails.assetStyle.title} - ${billDetails.asset_id[0].asset_name}` : billDetails.assetStyle.title }}
						</view>
						<view class="highlight" v-else>
							资产信息缺失
						</view>
					</view>
					<view class="row" v-if="billDetails.bill_type === 2">
						<view>
							入账账户
						</view>
						<view class="highlight" v-if="billDetails.transferAssetStyle && billDetails.transferAssetStyle.title !== '目标资产信息缺失' && billDetails.transferAssetStyle.title !== '无数据' ">
							{{ (billDetails.destination_asset_id && billDetails.destination_asset_id.length > 0 && billDetails.destination_asset_id[0] && billDetails.destination_asset_id[0].asset_name) ? `${billDetails.transferAssetStyle.title} - ${billDetails.destination_asset_id[0].asset_name}` : billDetails.transferAssetStyle.title }}
						</view>
						<view class="highlight" v-else>
							资产信息缺失
						</view>
					</view>
				</mj-card>
				<mj-card title="备注" v-if="billDetails.bill_notes">
					<view style="text-align: center;">
						{{billDetails.bill_notes}}
					</view>
				</mj-card>
			</view>
		</view>
		<u-safe-bottom v-if="type !== 'bill'"></u-safe-bottom>
	</u-popup>
</template>

<script>
	import {getAssetsStyle, getAllIconList} from '@/utils/icon-config.js'
	export default {
		name: "mj-bill-details-popup",
		props: {
			show: {
				type: Boolean,
				default: false
			},
			bill: { // 这个 prop 就是可能出问题的 bill 对象
				type: Object,
				default: () => ({}) // 提供一个默认空对象
			},
			safeAreaInsetBottom : {
				type: Boolean,
				default: false
			},
			type: {
				type: String,
				default: 'bill'
			}
		},
		data() {
			return {
				// iconGather: getAllIconList(), // 如果 icon-config 已经缓存，这里可以不用
				// assetsStyleList: getAssetsStyle() // 同上
			};
		},
		methods: {
			close() {
				this.$emit('close')
			},
			deleteBill() {
				this.$emit('deleteBill')
			},
			updateBill() {
				this.$emit('updateBill')
			}
		},
		computed: {
			billDetails() {
				const billFromProp = this.bill;

				// 对传入的 bill prop 做严格的检查
				if (!billFromProp || typeof billFromProp !== 'object' || Object.keys(billFromProp).length === 0) {
					// console.warn('MjBillDetailsPopup: bill prop is invalid or empty. Returning default structure.');
					// 返回一个包含所有期望字段的默认结构，特别是数组类型字段
					return {
						bill_type: 0,
						bill_amount: 0,
						bill_date: Date.now(),
						billStyle: { title: '无数据', icon: 'mj-loop' }, // 确保 billStyle 和 icon 存在
						assetStyle: { title: '无数据' },
						transferAssetStyle: { title: '无数据' },
						asset_id: [], // 关键: 确保是数组
						destination_asset_id: [], // 关键: 确保是数组
						bill_notes: ''
					};
				}

				const billCopy = uni.$u.deepClone(billFromProp);

				// 确保 billCopy 上有 asset_id 和 destination_asset_id，并且它们是数组
				if (!Array.isArray(billCopy.asset_id)) {
					billCopy.asset_id = [];
				}
				if (!Array.isArray(billCopy.destination_asset_id)) {
					billCopy.destination_asset_id = [];
				}
				// 确保 category_type 存在且为字符串，用于后续查找
				billCopy.category_type = billCopy.category_type || '';

				// 初始化 billStyle, assetStyle, transferAssetStyle 以免它们是 undefined
				billCopy.billStyle = { title: '分类信息缺失', icon: 'mj-loop' }; // 默认值
				billCopy.assetStyle = { title: '资产信息缺失' }; // 默认值
				if (billCopy.bill_type === 2) {
					billCopy.transferAssetStyle = { title: '目标资产信息缺失' }; // 默认值
				}
				
				const allIconList = getAllIconList();
				if (billCopy.category_type) {
					const foundBillStyle = allIconList.find(item => item.type === billCopy.category_type);
					if (foundBillStyle) {
						billCopy.billStyle = foundBillStyle;
					}
				}

				const assetsStyleList = getAssetsStyle();
				
				// 处理 assetStyle
				if (billCopy.asset_id.length > 0 && billCopy.asset_id[0]) {
					if (billCopy.asset_id[0].asset_type) {
						const foundAssetStyle = assetsStyleList.find(item => item.type === billCopy.asset_id[0].asset_type);
						if (foundAssetStyle) {
							billCopy.assetStyle = foundAssetStyle;
						}
						// 如果没找到匹配的 assetStyle，它会保留上面设置的默认值 "资产信息缺失"
					} else {
						// asset_id[0] 存在但没有 asset_type，可能是资产数据不完整
						billCopy.assetStyle = { title: billCopy.asset_id[0].asset_name || '资产类型未知' };
					}
				}
				// 如果 billCopy.asset_id 是空数组, assetStyle 会保留默认值 "资产信息缺失"

				if (billCopy.bill_type === 2) {
					if (typeof billCopy.transfer_amount === 'number') {
						billCopy.transfer_amount /= 100;
					}
					// 处理 transferAssetStyle
					if (billCopy.destination_asset_id.length > 0 && billCopy.destination_asset_id[0]) {
						if (billCopy.destination_asset_id[0].asset_type) {
							const foundTransferAssetStyle = assetsStyleList.find(item => item.type === billCopy.destination_asset_id[0].asset_type);
							if (foundTransferAssetStyle) {
								billCopy.transferAssetStyle = foundTransferAssetStyle;
							}
						} else {
							billCopy.transferAssetStyle = { title: billCopy.destination_asset_id[0].asset_name || '目标资产类型未知' };
						}
					}
				}
				return billCopy;
			},
			billDate() {
				// 确保 billDetails 和 bill_date 存在
				if (this.billDetails && this.billDetails.bill_date) {
					return uni.$u.timeFormat(this.billDetails.bill_date, 'yyyy-mm-dd hh:MM:ss');
				}
				return '日期未知';
			}
		},
	}
</script>

<style lang="scss" scoped>
	.user-assets-list {
		height: 640rpx;
		box-sizing: border-box;
		padding: 10px;
		background-color: $mj-bg-color;
		overflow: hidden;
		border-radius: 20px;

		.top {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			margin-bottom: 10px;
			.btn {
				display: flex;
				align-items: center;
				box-sizing: border-box;
				padding: 4px 8px;
				margin-right: 8px;
				border-radius: 16px;
				font-size: 28rpx;
				
			}
			.del {
				color: $mj-color-red;
				border: 1px solid $mj-color-red;
			}
			.edit {
				color: $mj-bg-color;
				background-color: $mj-theme-color-2;
				border: 1px solid $mj-theme-color-2;
			}
		}
		.content {
			max-height: 580rpx;
			overflow-y: auto;
			box-sizing: border-box;
			padding-bottom: 20px;
			.category {
				display: flex;
				justify-content: flex-start;
				align-items: center;
				text {
					margin-left: 16rpx;
				}
			}
			.row {
				display: flex;
				justify-content: space-between;
				align-items: center;
				box-sizing: border-box;
				padding: 0 8rpx;
				font-size: 32rpx;
				color: $mj-text-color;
				margin-bottom: 24rpx;
				.highlight {
					color: $mj-theme-color;
				}
			}
		}
	}
</style>