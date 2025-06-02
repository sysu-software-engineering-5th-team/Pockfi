<template>
	<view class="seconds">
		<view class="linear-gradient"></view>
		<mj-card title="食用说明">
			<view style="font-size: 28rpx;color: rgba(0, 0, 0, 0.6);">
				秒记可<span style="font-weight: 700;">用于记录经常购买的账单</span>，如每天喝咖啡9.9元，可设置为秒记方便快速记账。
			</view>
			<view style="font-size: 28rpx;color: rgba(0, 0, 0, 0.6);">
				<span style="font-weight: 700;">秒记比模板更加方便</span>，在记一笔页面使用秒记<span style="font-weight: 700;">相当于使用模板+点击保存</span>。
			</view>
		</mj-card>
		<!-- 秒记1 -->
		<mj-card :title="secondOneData.subTitle ? secondOneData.subTitle : secondOneData.title" :subTitle="secondOneData.subTitle ? secondOneData.title : ''">
			<mj-bill-one-template :oneTemplate="secondOneTemp" @click.native="editSeconds(1)"></mj-bill-one-template>
			<template #right>
				<view @click="editSeconds(1)" class="edit">
					修改
				</view>
			</template>
		</mj-card>
		<!-- 秒记2 -->
		<mj-card :title="secondTwoData.subTitle ? secondTwoData.subTitle : secondTwoData.title" :subTitle="secondTwoData.subTitle ? secondTwoData.title : ''">
			<mj-bill-one-template :oneTemplate="secondTwoTemp" @click.native="editSeconds(2)"></mj-bill-one-template>
			<template #right>
				<view @click="editSeconds(2)" class="edit">
					修改
				</view>
			</template>
		</mj-card>
		<u-popup 
			:show="showPop" 
			:round="16" 
			mode="center"
			:closeOnClickOverlay="true"
			@close="closePop" 
			:safeAreaInsetBottom='false'
			:customStyle="popStyle"
		>
			<view style="width: 480rpx;">
				<uni-section title="秒记别名" type="line" titleFontSize="32rpx" titleColor="#212121" :white="true" />
				<u--input
					placeholder="别名会显示在记账键盘上,最多设置十个字"
					border="surround"
					v-model="secondName"
					shape="circle"
					fontSize="24rpx"
					maxlength="10"
					:clearable="true"
				></u--input>
			</view>
			<view style="width: 480rpx;">
				<uni-section title="绑定模板" type="line" titleFontSize="32rpx" titleColor="#212121" :white="true" />
				<mj-bill-one-template  :oneTemplate="popTemplate" @click.native="showTempSelect"></mj-bill-one-template>
			</view>
			<view class="pop-buttons">
				<u-button shape="circle" type="error" :plain="true" text="解绑模板" :customStyle="btnUnbindStyle" size="normal" @click="unbindTemplate" v-if="isTemplateActuallyBound"></u-button>
				<u-button shape="circle" type="primary" :plain="true" text="保存" :customStyle="btnSaveStyle" size="normal" @click="saveSecond"></u-button>
			</view>
		</u-popup>
		
		<!-- 选取模板的popup -->
		<u-popup 
			:show="showTemplate" 
			:overlayStyle="{background: 'rgba(0, 0, 0, 0)'}" 
			round="20px" 
			zIndex="10076"
		>
			<view class="user-template-list">
				<view class="header">
					<view class="middle">
						帐单模板
					</view>
				</view>
				<view class="template-list" :style="{maxHeight: windowHeight * 0.6 + 'rpx'}">
					<mj-bill-template :templateList="templateList" pageType="account" @getTemp="getTemp"></mj-bill-template>
				</view> 
			</view>
		</u-popup>
	</view>
</template>

<script>
	import { themeColor } from '@/uni.scss'
	import { formatOneTemplate } from '@/utils/formatTemplate.js'
	
	const db = uniCloud.database()
	export default {
		data() {
			return {
				showPop: false,
				mainColor: themeColor,
				secondName: '',
				windowHeight: uni.getSystemInfoSync().windowHeight,
				// pop框样式
				popStyle: {
					'box-sizing': 'border-box',
					'padding': '0 24rpx 24rpx',
					'bottom': '0rpx',
					'transition': 'bottom 0.3s'
				},
				btnSaveStyle: {
					'width': '100rpx',
				},
				btnUnbindStyle: {
					'width': 'auto',
				},
				// 弹出框的模板数据
				popTemplate: null,
				secondOneData: {
					title: '秒记1',
					subTitle: '',
					tempId: 0,
					secondType: 1,
					_id: undefined
				},
				secondTwoData: {
					title: '秒记2',
					subTitle: '',
					tempId: 0,
					secondType: 2,
					_id: undefined
				},
				secondOneTemp: null,
				secondTwoTemp: null,
				showTemplate: false,
				templateList: [],
				secondType: undefined
			};
		},
		computed: {
			// 新增计算属性，判断当前编辑的秒记是否实际绑定了模板
			isTemplateActuallyBound() {
				if (this.secondType && this[this.secondType] && this[this.secondType].tempId && this[this.secondType].tempId !== '' && this[this.secondType].tempId !== this[this.secondType]._id) {
					return true;
				}
				return false;
			}
		},
		async onLoad() {
			// 这里先获取模板数据为的是在获取秒记后通过模板id找到对应模板进行渲染
			// 获取用户的模板
			await this.getUserTemplate()
			// 获取用户的秒记模板
			await this.getUserSeconds()
		},
		methods: {
			async getUserSeconds() {
				const res = await db.collection('mj-user-seconds').where('user_id == $cloudEnv_uid').get()
				console.log('秒记',res.result.data);
				// 根据second_type分别赋值秒记数据
				res.result.data.forEach(item => {
					if (item.second_type === 1) {
						this.secondOneData.subTitle = item.second_name
						this.secondOneData.tempId = item.template_id
						this.secondOneData._id = item._id
					} 
					if (item.second_type === 2) {
						this.secondTwoData.subTitle = item.second_name
						this.secondTwoData.tempId = item.template_id
						this.secondTwoData._id = item._id
					}
				})
				// 渲染秒记模板
				this.renderTwoSecondTemplates()
			},
			async getUserTemplate() {
				// 获取模板信息
				const temp = db.collection('mj-user-templates').where('user_id == $cloudEnv_uid').orderBy('template_creation_date desc').getTemp()
				const userAssets = db.collection("mj-user-assets").where('user_id == $cloudEnv_uid').field('_id,asset_type,user_id,asset_name').getTemp()
				const res = await db.collection(temp, userAssets).get()
				this.templateList = res.result.data
				console.log('templateList: ',this.templateList);
			},
			renderTwoSecondTemplates() {
				if (this.secondOneData.tempId) {
					// 如果tempId是秒记本身的_id，则视为未绑定
					if (this.secondOneData.tempId === this.secondOneData._id) {
						this.secondOneTemp = null;
					} else {
					const index = this.templateList.findIndex(item => item._id === this.secondOneData.tempId)
					if (index !== -1) {
						this.secondOneTemp = formatOneTemplate(this.templateList[index])
						} else {
							this.secondOneTemp = null; // 找不到也视为未绑定
						}
					}
				} else {
					this.secondOneTemp = null; // tempId为空也视为未绑定
				}

				if (this.secondTwoData.tempId) {
					// 如果tempId是秒记本身的_id，则视为未绑定
					if (this.secondTwoData.tempId === this.secondTwoData._id) {
						this.secondTwoTemp = null;
					} else {
					const index = this.templateList.findIndex(item => item._id === this.secondTwoData.tempId)
					if (index !== -1) {
						this.secondTwoTemp = formatOneTemplate(this.templateList[index])
							// console.log('this.secondTwoTemp: ',this.secondTwoTemp);
						} else {
							this.secondTwoTemp = null; // 找不到也视为未绑定
						}
					}
				} else {
					this.secondTwoTemp = null; // tempId为空也视为未绑定
				}
			},
			// 修改按钮触发
			editSeconds(type) {
				// 1 重置pop框数据
				this.secondName = ''
				// this.popTemplate = null; // 由后续逻辑决定

				// 2 传入秒记数据到pop框中
				if (type === 1) {
					this.secondType = 'secondOneData'
					this.secondName = this.secondOneData.subTitle
					// 如果secondOneTemp为null (表示未绑定或找不到模板)，则popTemplate也应为null
					this.popTemplate = this.secondOneTemp;
				} else if (type === 2) {
					this.secondType = 'secondTwoData'
					this.secondName = this.secondTwoData.subTitle
					// 如果secondTwoTemp为null，则popTemplate也应为null
					this.popTemplate = this.secondTwoTemp;
				}
				// 3 展示pop
				// console.log('编辑秒记模板，type:',type, 'popTemplate:', this.popTemplate)
				this.showPop = true
			},
			// pop框保存按钮触发
			async saveSecond() {
				// -1 判断是否绑定模板
				if (!this.popTemplate) {
					uni.showToast({
						icon: 'none',
						title: '保存前先绑定模板哦'
					})
					return
				}
				// 0 loading
				uni.showLoading({
					mask: true
				})
				this.showPop = false
				// 1 判断新建or修改 // 实际上是判断记录是否存在，然后执行更新或添加
				// 2 上传or更新数据

				const trimmedSecondName = this.secondName ? this.secondName.trim() : '';
				const defaultName = this[this.secondType].secondType === 1 ? '秒记1' : '秒记2';
				const finalSecondName = trimmedSecondName === '' ? defaultName : trimmedSecondName;

				const dataForDb = {
					template_id: this.popTemplate._id, // 模板ID必须存在，已在前面校验过
					second_name: finalSecondName,
				};

				try {
					if (this[this.secondType]._id) {
						// 记录已存在，执行更新
						await db.collection("mj-user-seconds").doc(this[this.secondType]._id).update(dataForDb);
				} else {
						// 记录不存在，执行添加
						dataForDb.second_type = this[this.secondType].secondType; // 新增时需要秒记类型
						await db.collection("mj-user-seconds").add(dataForDb);
				}

				uni.hideLoading()
				uni.showToast({
					icon: 'success',
					title: '保存成功'
				})
					// 重新获取秒记数据，以更新本地状态和UI
					await this.getUserSeconds()
					// console.log('保存后的秒记名:', finalSecondName, '模板信息:', this.popTemplate);
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						icon: 'none',
						title: '保存失败，请重试'
					});
					console.error("saveSecond error:", error);
				}
			},
			showTempSelect() {
				this.popStyle['bottom'] = `${this.windowHeight * 0.1}px`
				this.showTemplate = true
			},
			hideTempPop() {
				this.popStyle['bottom'] = '0rpx'
				this.showTemplate = false
			},
			// 点击遮罩触发的回调
			closePop() {
				if (this.showTemplate) {
					this.hideTempPop()
				} else {
					this.showPop = false
				}
			},
			// 点击添加模板触发
			goTemplatePage() {
				uni.showToast({
					icon: 'none',
					title: '正在开发中'
				})
			},
			getTemp(temp) {
				this.popTemplate = temp
				this.popStyle['bottom'] = '0rpx'
				this.showTemplate = false
			},
			// 新增：解绑模板
			async unbindTemplate() {
				if (!this.popTemplate) {
					uni.showToast({
						icon: 'none',
						title: '当前没有绑定模板'
					});
					return;
				}
				const modalRes = await uni.showModal({
					title: '提示',
					content: '确定要解绑当前模板吗？解绑后秒记别名也会被清空。',
					confirmColor: '#f56c6c' // 确认按钮颜色设为红色，以示警告
				});

				if (modalRes.confirm) {
					uni.showLoading({
						mask: true,
						title: '正在解绑...'
					});
					this.showPop = false;
					try {
						const data = {
							template_id: this[this.secondType]._id, // 用户指定的解绑数据库逻辑
							second_name: '',   // 清空别名
						};
						await db.collection("mj-user-seconds").doc(this[this.secondType]._id).update(data);
						
						// 更新本地数据
						this[this.secondType].tempId = this[this.secondType]._id; // 保持与数据库一致
						this[this.secondType].subTitle = '';
						if (this.secondType === 'secondOneData') {
							this.secondOneTemp = null; // 解绑后，卡片模板视图也清空
						} else if (this.secondType === 'secondTwoData') {
							this.secondTwoTemp = null; // 解绑后，卡片模板视图也清空
						}
						this.popTemplate = null; // 清空弹窗中的模板显示
						this.secondName = '';    // 清空弹窗中的别名显示

						uni.hideLoading();
						uni.showToast({
							icon: 'success',
							title: '解绑成功'
						});
						// 重新获取秒记数据以刷新列表（如果需要，或者直接操作本地数据）
						// this.getUserSeconds(); // 已经在上面更新了本地数据，可以按需决定是否重新请求
					} catch (error) {
						uni.hideLoading();
						uni.showToast({
							icon: 'none',
							title: '解绑失败，请重试'
						});
						console.error("unbindTemplate error:", error);
					}
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
.seconds {
	position: relative;
	.linear-gradient {
		position: absolute;
		top: -24rpx;
		left: 0;
		right: 0;
		height: 130rpx;
		background-image: linear-gradient(#9fcba7, #fafafa);
		z-index: -1;
	}
	.edit {
		display: flex;
		align-items: center;
		box-sizing: border-box;
		padding: 4px 8px;
		margin-right: 4px;
		border-radius: 16px;
		font-size: 24rpx;
		color: $mj-bg-color;
		background-color: $mj-theme-color-2;
	}
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
	.user-template-list {
		
		.header {
			display: flex;
			justify-content: center;
			padding-top: 24rpx;
			.middle {
				text-align: center;
				// scss中font另一种写法
				font: {
					size: 32rpx;
					weight: bold;
				}
			}
		}
		.template-list {
			overflow: auto;
		}
	}
	.pop-buttons {
		display: flex;
		justify-content: center;
		margin-top: 20rpx;
	}
}
</style>
