<template>
	<view class="userInfo">
		<view class="linear-gradient"></view>
		<mj-card title="我的">
			<view class="me">
				<view class="avatar" @click="handleAvatarClick">
					<u-avatar :src="userInfo.avatarSrc" size="100rpx"></u-avatar>
					<!-- #ifdef MP-WEIXIN -->
					<button open-type="chooseAvatar" class="avatarBtn" @chooseavatar="getAvatarFromWeixin"></button>
					<!-- #endif -->
				</view>
				<view class="main">
					<view class="username" @click="clickName">
						Hi {{userInfo.nickname || '朋友'}}
					</view>
					<view class="day">
						{{registerDateForTitle}}加入妙记
					</view>
				</view>
			</view>
		</mj-card>
		<mj-card title="个人信息">
			<u-cell-group :border="false">
				<u-cell title="会员编号" :label="userInfo.userLabel" :border="false" clickable>
					<uni-icons type="vip" size="48rpx" slot="icon" class="userinfo-icon"></uni-icons>
				</u-cell>
				<u-cell @click="clickName" title="昵称" :label="userInfo.nickname || '点我设置昵称'" :border="false" clickable>
					<uni-icons type="person" size="48rpx" slot="icon" class="userinfo-icon"></uni-icons>
				</u-cell>
				<u-cell title="加入时间" :label="userInfo.registerDate" :border="false">
					<uni-icons type="paperplane" size="48rpx" slot="icon" class="userinfo-icon"></uni-icons>
				</u-cell>
			</u-cell-group>
		</mj-card>
		<u-popup :show="showNicaNamePop" mode="center" :round="10" @close="showNicaNamePop = false"
			:customStyle="popStyle" :safeAreaInsetBottom="false">
			<form @submit="submitName">
				<input type="nickname" placeholder="请输入昵称(10个字以内)" maxlength="10" name="nickname">
				<button form-type="submit" class="btn">确认</button>
			</form>
		</u-popup>
		<u-toast ref="uToastForNickname"></u-toast>
	</view>
</template>

<script>
	const db = uniCloud.database()
	export default {
		data() {
			return {
				userInfo: {
					avatarSrc: '',
					nickname: '',
					registerDate: '',  //格式为 yyyy-mm-dd
					userLabel: '00000001'
				},
				registerDateForTitle: '', //格式为 yyyy年mm
				showNicaNamePop: false,
				popStyle: {
					'box-sizing': 'border-box',
					'padding': '40rpx'
				}
			}
		},
		methods: {
			getAvatarFromWeixin(event) {
				// #ifdef MP-WEIXIN
				if (event && event.detail && event.detail.avatarUrl) {
					const weixinAvatarUrl = event.detail.avatarUrl;
					// 直接使用微信返回的 URL 更新头像
					this.updateUserAvatar(weixinAvatarUrl);
				} else {
					this.$refs.uToastForNickname.show({
						type: 'error',
						message: '获取微信头像失败',
						position: 'top'
					});
				}
				// #endif
			},
			// 5.24 补充移动端更新头像
			async handleAvatarClick() {
				// #ifdef MP-WEIXIN
				// 在微信中，如果用户不小心点到头像本身而不是透明按钮，
				// 我们可以选择什么都不做（让按钮处理），或者也弹起选择。
				// 为避免混淆，此处可以加一个确认或提示，或者直接允许选择。
				// 当前设计是外层view响应点击，微信按钮覆盖在其上，所以微信上会优先触发按钮的chooseAvatar。
				// 如果按钮由于某种原因未触发，此方法可能作为备用。
				// 或者，更简单的是，此方法主要服务于非微信小程序平台。
				// 为确保 App 端能触发，我们不在此处 return。
				// console.log('handleAvatarClick triggered');
				// #endif

				try {
					const chooseImageRes = await uni.chooseImage({
						count: 1,
						sizeType: ['compressed'], // 选择压缩图
						sourceType: ['album', 'camera'], // 从相册选择或拍照
					});

					if (chooseImageRes && chooseImageRes.tempFilePaths && chooseImageRes.tempFilePaths.length > 0) {
						const tempFilePath = chooseImageRes.tempFilePaths[0];
						
						uni.showLoading({ title: '头像上传中...' });

						const uploadResult = await uniCloud.uploadFile({
							filePath: tempFilePath,
							// 为每个用户使用固定的路径覆盖旧头像，或使用时间戳保证唯一性
							// 这里使用用户ID和时间戳确保唯一性，避免缓存问题，但会产生多个文件
							// 若想覆盖，可用： `user_avatars/${uniCloud.getCurrentUserInfo().uid}.jpg`
							cloudPath: `user_avatars/${uniCloud.getCurrentUserInfo().uid}_${Date.now()}.jpg`,
							cloudPathAsRealPath: true, // 获取可直接访问的 HTTPS URL
						});
						
						uni.hideLoading();

						if (uploadResult.fileID) {
							// 使用上传后云存储的 URL 更新头像
							this.updateUserAvatar(uploadResult.fileID);
						} else {
							throw new Error('上传失败，未返回 fileID');
						}
					}
				} catch (error) {
					uni.hideLoading();
					// uni.chooseImage 用户取消选择时会进入 catch，需要判断 error.errMsg
					if (error.errMsg && (error.errMsg.includes('chooseImage:fail cancel') || error.errMsg.includes('chooseAvatar:fail cancel'))) {
						// 用户取消，不提示错误
						return;
					}
					console.error("选择或上传头像错误:", error);
					this.$refs.uToastForNickname.show({
						type: 'error',
						message: error.message || '头像设置失败，请重试',
						position: 'top'
					});
				}
			},
			async updateUserAvatar(newAvatarUrl) {
				const oldAvatarSrc = this.userInfo.avatarSrc; // 用于失败时回滚UI
				this.userInfo.avatarSrc = newAvatarUrl; // 即时更新UI

				try {
					// 更新数据库
					await db.collection("uni-id-users").where("_id == $cloudEnv_uid").update({
						avatar: newAvatarUrl
					});

					// 更新本地缓存 (mj-user-info)
					// 确保合并了其他可能已在缓存中的信息
					const storedUserInfo = uni.getStorageSync('mj-user-info') || {};
					const updatedStoredUserInfo = {
						...storedUserInfo, // 保留缓存中其他字段
						avatarSrc: newAvatarUrl, // 更新头像
						nickname: this.userInfo.nickname // 如果昵称也在此页面修改，也应来自 this.userInfo
					};
					uni.setStorageSync('mj-user-info', updatedStoredUserInfo);
					
					this.$refs.uToastForNickname.show({
						type: 'success',
						message: '头像更新成功!',
						position: 'top'
					});

				} catch (dbError) {
					this.userInfo.avatarSrc = oldAvatarSrc; // 数据库更新失败，回滚UI上的头像
					console.error("数据库头像更新失败:", dbError);
					this.$refs.uToastForNickname.show({
						type: 'error',
						message: '头像同步失败，请重试',
						position: 'top'
					});
				}
			},
			clickName() {
				// console.log("昵称被点击");
				// 修改昵称  修改后保存在本地存储中 并修改数据库中的nickname
				this.showNicaNamePop = true
			},
			// 点击修改昵称pop的确认按钮触发
			submitName(res) {
				// 需要判断是否为空
				if (!res.detail.value.nickname.trim()) {
					this.$refs.uToastForNickname.show({
						message :"输入内容不可以为空！",
						type: 'error',
						position: 'top'
					})
					return
				}
				this.userInfo.nickname = res.detail.value.nickname
				// 更新缓存时，确保 avatarSrc 是最新的
				const storedUserInfo = uni.getStorageSync('mj-user-info') || {};
				const updatedStoredUserInfo = {
					...storedUserInfo,
					avatarSrc: this.userInfo.avatarSrc, 
					nickname: this.userInfo.nickname 
				};
				uni.setStorageSync('mj-user-info', updatedStoredUserInfo);
				db.collection("uni-id-users").where("_id == $cloudEnv_uid").update({
					nickname: res.detail.value.nickname
				})
				this.showNicaNamePop = false
			},
			// 页面挂载时获取数据   1 如果有缓存，则给this.userInfo赋值   2 获取db数据  3 判断数据库数据和缓存中的数据有无区别，有区别覆盖缓存,并再次赋值
			async getUserInfo() {
				const userInfoFromStorage = uni.getStorageSync('mj-user-info')
				if(userInfoFromStorage) {
					// 确保从缓存加载时，本页关心的字段得到更新
					this.userInfo.avatarSrc = userInfoFromStorage.avatarSrc || '';
					this.userInfo.nickname = userInfoFromStorage.nickname || '';
					this.userInfo.registerDate = userInfoFromStorage.registerDate || '';
					// userLabel 是此页面特有的，可以不来自 mj-user-info 的主缓存
				}
				
				const res = await db.collection("uni-id-users").where("_id == $cloudEnv_uid").field("_id,nickname,avatar,register_date").get()
				let {avatar: dbAvatarSrc, nickname: dbNickname, register_date: dbRegisterDate} = res.result.data[0]
				
				const userLabel = Math.round(dbRegisterDate * 3 / 200000).toString()
				this.registerDateForTitle = uni.$u.timeFormat(dbRegisterDate,'yyyy年mm月')
				const formattedRegisterDate = uni.$u.timeFormat(dbRegisterDate,'yyyy-mm-dd')
				
				// 将从数据库获取的值赋给 this.userInfo
				const dbUserInfo = {
					avatarSrc: dbAvatarSrc || '', // 使用数据库的头像
					nickname: dbNickname || '',   // 使用数据库的昵称
					registerDate: formattedRegisterDate,
					userLabel: userLabel 
				};

				// 更新UI并决定是否更新缓存
				// 如果数据库数据与当前UI（可能来自旧缓存）不同，则更新UI
				if (this.userInfo.avatarSrc !== dbUserInfo.avatarSrc || 
					this.userInfo.nickname !== dbUserInfo.nickname ||
					this.userInfo.registerDate !== dbUserInfo.registerDate) {
					Object.assign(this.userInfo, dbUserInfo);
				}
				
				// 将最新的（以数据库为准）信息更新到 mj-user-info 缓存
				const cacheToUpdate = {
					...(uni.getStorageSync('mj-user-info') || {}), // 先获取现有缓存
					avatarSrc: this.userInfo.avatarSrc,
					nickname: this.userInfo.nickname,
					registerDate: this.userInfo.registerDate
					// useDate 等字段不由本页管理，会保留(如果之前存在)
				};
				uni.setStorageSync('mj-user-info', cacheToUpdate);
			}
		},
		onReady() {
			this.getUserInfo()
		}
	}
</script>

<style lang="scss" scoped>
	.userInfo {
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
		.me {
			display: flex;
			justify-content: start;
			align-items: center;
			.avatar {
				position: relative;
				.avatarBtn {
					position: absolute;
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					opacity: 0;
				}
			}
			.main {
				margin-left: 20rpx;
				margin-top: 8rpx;
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: flex-start;
				.username {
					font-size: 40rpx;
					line-height: 40rpx;
					color: $mj-text-color;
					margin-bottom: 16rpx;
				}
				.day {
					font-size: 28rpx;
					line-height: 28rpx;
					color: $mj-text-color-grey;
				}
			}
		}
		.userinfo-icon {
			padding-right: 24rpx;
		}
		.btn {
			margin-top: 10px;
			font-size: 32rpx;
			border: none;
			color: $mj-theme-color;
			background-color: #fff;
		}
	}
</style>