<template>
	<view class="set-asset">
		<u--form :model="assetInfo" :borderBottom="false" ref="uForm" errorType="toast">
			<mj-card title="资产类型">
				<u-cell-group :border="false">
					<u-cell :title="asset.title" :border="false">
						<uni-icons slot="icon" :type="asset.icon" size="36rpx" custom-prefix="miaoji" :color="asset.color"></uni-icons>
					</u-cell>
				</u-cell-group>
			</mj-card>
			<mj-card title="基本信息">
				<u-form-item prop="asset_name" :borderBottom="false">
					<u--input v-model="assetInfo.asset_name" placeholder="资产名(可选)" type="text" border="surround"
						clearable shape="circle" fontSize="13px"></u--input>
				</u-form-item>
				<u-form-item prop="asset_balance" :borderBottom="false">
					<u--input v-model="assetInfo.asset_balance" placeholder="账户余额" type="digit" border="surround" clearable
						shape="circle" maxlength="10" fontSize="13px" suffixIcon="rmb-circle"
						suffixIconStyle="color: #909399"></u--input>
				</u-form-item>
			</mj-card>
			<mj-card title="其他">
				<view class="other">
					<view class="other-font">
						<view class="top">
							在资产页面隐藏此资产
						</view>
						<view class="bottom">
							隐藏资产可在资产主页底部查看
						</view>
					</view>
					<u-form-item :borderBottom="false">
						<u-switch v-model="assetInfo.hide_in_interface" activeColor="#9fcba7"></u-switch>
					</u-form-item>
				</view>
				<view class="other" :style="isHideTotalAssetsBox ? 'display: none;' : '' ">
					<view class="other-font">
						<view class="top">
							计入总资产
						</view>
						<view class="bottom">
							是否加入总资产计算
						</view>
					</view>
					<u-form-item :borderBottom="false">
						<u-switch v-model="assetInfo.include_in_total_assets" activeColor="#9fcba7"></u-switch>
					</u-form-item>
				</view>
			</mj-card>
		</u--form>
		<!-- 固定定位，最底下 -->
		<view class="bottom-btn">
			<u-button text="保存" color="#9fcba7" shape="circle" @click="clickBottomBtn"></u-button>
		</view>
	</view>
</template>

<script>
	import colorGradient from '../../uni_modules/uview-ui/libs/function/colorGradient';
	import {getAssetsStyle} from "@/utils/icon-config.js";
	// 金额处理工具
	import { convertYuanToCent } from '@/utils/amount-utils.js'
	const db = uniCloud.database()

	export default {
		data() {
			return {
				type: '',
				// 表单信息
				assetInfo: {
					asset_name: '',
					asset_balance: '',
					hide_in_interface: false,
					include_in_total_assets: true,
					asset_type: '',
				},
				// 所有资产的数据  从本地缓存中获取，如果获取不到，向工具库中icon-config获取
				assetsStyle: [],
				// 用户选择的资产，渲染页面用的数据
				asset: {
					title: '',
					icon: '',
					color: '',
					type: ''
				},
				isHideTotalAssetsBox: false,
				rules: {
					'asset_name': {
						type: 'string',
						required: false,
						trigger: ['blur']
					},
					'asset_balance': [
						{
							type: 'float',
							required: true,
							message: '请输入金额',
							trigger: ['blur', 'change'],
						},
						{
							validator: (rule, value, callback) => {
								// 检查是否为负值
								if (parseFloat(value) < 0) {
									return false
								}
								return true
							},
							message: '资产余额不能为负值'
						},
						{
							validator: (rule, value, callback) => {
								value = value.toString()
								if (value === '0') value = '0.00'
								return uni.$u.test.amount(value)
							},
							message: '最多填写两位小数'
						},
					]
				},
				assetInfoFromStorage: {}
			};
		},
		onLoad( {type} ) {
			this.type = type
			this.assetsStyle = getAssetsStyle()
			const arr = this.assetsStyle.filter(item => {
				return item.type == type
			})
			// 确保找到了匹配的资产类型
			if (arr && arr.length > 0) {
				this.asset = arr[0]
				this.assetInfo.asset_type = arr[0].type
			} else {
				// 没有找到匹配的资产类型，设置默认值或显示错误
				uni.showToast({
					title: '未找到对应的资产类型',
					icon: 'none'
				})
				// 可以设置一个默认资产样式
				// this.asset 已在data中初始化为空对象
			}
			
			// console.log('asset', this.asset);
			// 如果有缓存,则赋值，并且说明是点击了编辑进入此页面，则在点击保存按钮时数据库操作是更新
			if(uni.getStorageSync('mj-asset-edit')) {
				this.assetInfo = uni.getStorageSync('mj-asset-edit')
				console.log('点了编辑进入,assetInfo',this.assetInfo)
				uni.removeStorage({
					key: 'mj-asset-edit',
					success: () => {}
				})
			}
		},
		onReady() {
			this.$refs.uForm.setRules(this.rules)
		},
		methods: {
			clickBottomBtn() {
				// 1 验证表单  用户名可选， 金额必填，不能为空，可有两位小数num 类型。
				// 2 如果校验通过，获取表单数据 即assetInfo中的数据，通过数据中有无_id判断是新增还是编辑资产
				// 3 整合账户数据  上传至数据库  （资产类型、资产金额：单位为分、是否隐藏、是否计入总资产、资产名（可选））
				this.$refs.uForm.validate().then(async () => {
					try {
						let userAsset = Object.assign({},this.assetInfo)
						// 使用安全的转换方法将元转换为分
						userAsset.asset_balance = convertYuanToCent(userAsset.asset_balance)
						
						if(!userAsset._id) {
							// 新增资产前，检查是否已存在同类型同名资产
							const assetName = userAsset.asset_name || ''
							const assetType = userAsset.asset_type
							
							// 查询数据库中是否存在同名同类型资产
							const existingAssets = await db.collection("mj-user-assets").where({
								user_id: uniCloud.getCurrentUserInfo().uid,
								asset_type: assetType,
								asset_name: assetName
							}).get()
							
							if (existingAssets.result.data && existingAssets.result.data.length > 0) {
								// 已存在同名同类型资产，更新该资产
								const existingAsset = existingAssets.result.data[0]
								await db.collection("mj-user-assets").doc(existingAsset._id).update({
									// 增加余额
									asset_balance: existingAsset.asset_balance + userAsset.asset_balance,
									// 其他属性根据新设置更新
									hide_in_interface: userAsset.hide_in_interface,
									include_in_total_assets: userAsset.include_in_total_assets
								})
								
								// 提示用户已合并资产
								uni.showToast({
									title: '已合并到同名资产',
									icon: 'success'
								})
							} else {
								// 不存在同名同类型资产，创建新资产
								await db.collection("mj-user-assets").add({...userAsset})
							}
						} else {
							// 编辑现有资产
							await db.collection("mj-user-assets").doc(userAsset._id).update({
								asset_balance: userAsset.asset_balance,
								hide_in_interface: userAsset.hide_in_interface,
								include_in_total_assets: userAsset.include_in_total_assets,
								asset_name: userAsset.asset_name
							})
						}
						
						// 触发全局资产列表更新事件，通知 index.vue 更新
						uni.$emit('updateAssetsList')
						
						// 直接返回，不再在此处操作缓存
						uni.navigateBack({delta: 2})

					} catch(err) {
						console.error('保存资产失败:', err)
						uni.$u.toast('保存失败，请重试')
					}
				}).catch(errors => {
					console.log(errors);
					uni.$u.toast(errors[0].message)
				})

			},
		},
		watch: {
			// 监听账单信息中 是否隐藏资产 的switch布尔值
			assetInfo: {
				handler: function({
					hide_in_interface
				}) {
					// 如果为true，则隐藏计入总资产一行，并修改 计入总资产的switch为false
					if (hide_in_interface) {
						this.isHideTotalAssetsBox = true
						this.assetInfo.include_in_total_assets = false
					} else {
						this.isHideTotalAssetsBox = false
					}
				},
				deep: true
			}
		}
	}
</script>

<style lang="scss" scoped>
	.set-asset {
		.other {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.other-font {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: flex-start;
				font-size: 28rpx;

				.bottom {
					color: $mj-text-color-grey;
					font-size: 24rpx;
				}
			}
		}

		.bottom-btn {
			box-sizing: border-box;
			z-index: 999;
			position: fixed;
			width: 100%;
			padding: 0 24rpx 12rpx;
			bottom: 12px;
			opacity: 0.98;
		}
	}
</style>