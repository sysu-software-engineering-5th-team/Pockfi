<template>
	<view class="my">
		<view class="linear-gradient"></view>
		<!-- 用户卡片 -->
		<uni-card :is-shadow="true" @click="clickUserCard" shadow="rgba(149, 157, 165, 0.2) 0px 8px 24px;">
			<view class="user-card">
				<view class="left">
					<u-avatar :src="userInfo.avatarSrc" size="100rpx"></u-avatar>
					<view class="main">
						<view class="username">
							Hi {{userInfo.nickname || '朋友'}}
						</view>
						<view class="day">
							今天是你记账的第{{userInfo.useDate}}天
						</view>
					</view>
				</view>
				<view class="right">
					<u-icon name="arrow-right"></u-icon>
				</view>
			</view>
		</uni-card>
		<!-- 修改了uni-section的样式，背景色和装饰line颜色改变,padding -->
		<view class="options">
			<!-- 功能 -->
			<uni-section class="section" title="功能" type="line" titleFontSize="32rpx"
				titleColor="#212121"></uni-section>
			<!-- grid组件 -->
			<u-grid :border="false" @click="clickOption" col="4">
				<u-grid-item v-for="item,index in optionList" :key="index" >
					<view class="content">
						<view class="grid-item">
							<uni-icons :type="item.icon" size="48rpx" :customPrefix="item.customPrefix"></uni-icons>
							<view class="grid-text">{{item.title}}</view>
						</view>
					</view>
				</u-grid-item>
			</u-grid>
			<!-- 偏好 -->
			<uni-section class="section" title="偏好" type="line" titleFontSize="32rpx"
				titleColor="#212121"></uni-section>
			<u-grid :border="false" @click="clickLike" col="4">
				<u-grid-item v-for="item,index in likeList" :key="index" >
					<view class="content">
						<view class="grid-item">
							<uni-icons :type="item.icon" size="48rpx" :customPrefix="item.customPrefix"></uni-icons>
							<view class="grid-text">{{item.title}}</view>
						</view>
					</view>
				</u-grid-item>
			</u-grid>

			<!-- 其他 -->
			<uni-section class="section" title="其他" type="line" titleFontSize="32rpx"
				titleColor="#212121"></uni-section>
			<u-cell-group :border="false">
				<u-cell title="设置" :isLink="true" @click="goSetting">
					<uni-icons slot="icon" type="gear" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="自动记账须知" :isLink="true" @click="Knowing">
					<uni-icons slot="icon" type="chat" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell :isLink="true" @click="clickAbout">
					<view slot="title" class="about">
						<view>
							关于口袋智富
						</view>
						<view class="about-tag">
							<u-tag text="🎉v1.1.0" size="mini" @click="clickAbout"></u-tag>
						</view>
					</view>
					<uni-icons slot="icon" type="info" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="反馈问题" :isLink="true" @click="clickFeedback">
					<uni-icons slot="icon" type="compose" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="项目成员" :isLink="true" @click="clickAuthor">
					<uni-icons slot="icon" type="personadd" size="36rpx"></uni-icons>
				</u-cell>
				<u-cell title="退出登录" :isLink="true" @click="logout">
					<uni-icons slot="icon" type="mj-logout" size="32rpx" customPrefix="miaoji"></uni-icons>
				</u-cell>
				<!-- <u-cell title="注销账号" :isLink="true" @click="deactivate">
					<uni-icons slot="icon" type="mj-stop" size="32rpx" customPrefix="miaoji"></uni-icons>
				</u-cell> -->
			</u-cell-group>
		</view>
	</view>
</template>

<script>
	import UT from '@/utils/user-state.js'
	import {mutations} from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database()
	const uniIdCo = uniCloud.importObject('uni-id-co')
	export default {
		data() {
			return {
				userInfo: {
					avatarSrc: '',
					nickname: '',
					registerDate: 0,
					useDate: 0,
				},
				optionList: [{
						icon: 'mj-wallet',
						title: '我的资产',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-layout',
						title: '模板管理',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-second',
						title: '秒记管理',
						customPrefix: "miaoji"
					},
					{
						icon: 'mj-reloadtime',
						title: '定时记账',
						customPrefix: "miaoji"
					}
				],
				likeList: [
					{
						icon: 'mj-individuation',
						title: '个性化',
						customPrefix: "miaoji"
					}
				],
				showUserAssetsList: false,
			};
		},
		onReady() {
			const state = UT.checkUserTokenExpierd() // 检查老用户的token是否过期，如果过期则跳转登录，并返回true；没过期返回false
			if(state) return
			// console.log("用户token没过期，继续执行下面的逻辑");
			
			// 如果用户登录了，进行初始化
			const {uid} = uniCloud.getCurrentUserInfo()
			if (uid) {
				this.getUserInfo()
			}
		},
		onShow() {
			// 判断用户是否登录，如果未登录 则跳转到登录页
			const {uid} = uniCloud.getCurrentUserInfo()
			if (!uid) {
				uni.redirectTo({
					url: "/uni_modules/uni-id-pages/pages/login/login-withpwd"
				})
				return
			}
			this.resetUserInfo()
		},
		methods: {
			clickUserCard() {
				uni.navigateTo({
					url: "/pagesMy/user-info/user-info"
				})
			},
			clickOption(index) {
				switch (index) {
					case 0:
						uni.navigateTo({
							url:"/pagesMy/my-assets/my-assets"
						})
						break
					case 1:
						uni.navigateTo({
							url:"/pagesMy/bill-template/bill-template"
						})
						break
					case 2:
						uni.navigateTo({
							url:"/pagesMy/seconds/seconds"
						})
						break
					case 3:
						uni.navigateTo({
							url:"/pagesMy/cron-accounting/cron-accounting"
						})
						break
					default:
						uni.showToast({
							title:"正在开发中~",
							icon: "none"
						})
				}
			},
			clickLike(index) {
				switch (index) {
					default:
						uni.showToast({
							title:"正在开发中~",
							icon: "none"
						})
				}
			},
			clickFeedback() {
				uni.navigateTo({
					url: "/pagesMy/feedback/feedback"
				})
			},
			clickAuthor() {
				uni.showModal({
					title: "中山大学计算机学院 22级软件工程大作业 口袋智富记账应用",
					content: "前端开发工程师：苏逸翔\n后端开发工程师：王晨宇\n项目经理/技术负责人：邵力\nUI设计师：罗松健\n测试工程师：莫桐语\n产品经理/文档工程师：汪宣彤",
					cancelColor: "rgba(0,0,0,0.6)",
					confirmColor:"#9fcba7",
					showCancel:false
				})
			},
			clickAbout(){
				uni.navigateTo({
					url:"/pagesMy/about/about"
				})
			},
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出登录吗？',
					cancelColor: "rgba(0,0,0,0.6)",
					confirmColor: "#9fcba7",
					success: (res) => {
						if (res.confirm) {
							// 用户点击确认，执行退出登录
							mutations.logout()
							// 5.24 退出时清除用户信息缓存
							uni.removeStorageSync('mj-user-info'); // 清除自定义的用户信息缓存
							// 可选：立即重置本地userInfo，以便UI即时（部分）更新
							this.userInfo = {
								avatarSrc: '',
								nickname: '',
								registerDate: 0,
								useDate: 0,
							};
						}
						// 如果用户点击取消（res.cancel为true），则不执行任何操作
					}
				})
			},
			// 注销
			deactivate() {
				uni.navigateTo({
					url: "/uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate"
				})
			},
			Knowing() {
				uni.navigateTo({
					url: "/pagesMy/auto-accounting-guide/auto-accounting-guide"
				})
			},
			// 页面挂载时获取数据  1 如果有缓存，获取缓存进行渲染  2 若无缓存，获取db数据，并赋值  3 获取用户使用天数 4 存入缓存
			async getUserInfo() {
				try {
					const storageUserInfo = uni.getStorageSync('mj-user-info')
					if (storageUserInfo) {
						Object.assign(this.userInfo, storageUserInfo)   // 里面的registerDate是yyyy-mm-dd格式
					} else {
						const res = await db.collection("uni-id-users").where("_id == $cloudEnv_uid").field(
							"_id,nickname,avatar,register_date").get()
						let {
							avatar: avatarSrc,
							nickname,
							register_date: registerDate
						} = res.result.data[0]
						
						// 注册日期格式化
						registerDate = uni.$u.timeFormat(registerDate,'yyyy-mm-dd')
						
						Object.assign(this.userInfo, {
							avatarSrc,
							nickname,
							registerDate
						})
					}
					this.getUserDate()
					uni.setStorage({
						key:'mj-user-info',
						data: this.userInfo
					})
				} catch (err) {
					console.log('err',err);
				}
			},
			resetUserInfo() {
				const storageUserInfo = uni.getStorageSync('mj-user-info')
				if(!storageUserInfo) {
					// 如果没有用户信息的缓存
					this.getUserInfo()
					return
				}
				Object.assign(this.userInfo, storageUserInfo)
				this.getUserDate()
			},
			// 获取使用天数
			getUserDate() {
				const registerDateTimestamp = Date.parse(this.userInfo.registerDate)
				let useDate = Date.now() - registerDateTimestamp
				this.userInfo.useDate = Math.ceil(useDate / (1000 * 60 * 60 * 24))
			},
			goSetting() {
				uni.navigateTo({
					url: '/pagesMy/settings/settings'
				})
			}
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
	.my {
		position: relative;
		.linear-gradient {
			position: absolute;
			top: -15px;
			left: 0;
			right: 0;
			height: 130rpx;
			background-image: linear-gradient(#9fcba7, #fafafa);
		}
		.user-card {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.left {
				display: flex;
				justify-content: flex-start;
				align-items: center;

				.main {
					margin-left: 24rpx;
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
		}

		.options {
			box-sizing: border-box;
			padding: 0 28rpx;

			.content {
				padding-bottom: 14px;

				.grid-item {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					width: 148rpx;
					height: 124rpx;
					background-color: #f1f1f1;
					border-radius: 30%;
					color: $mj-text-color;

					.grid-text {
						font-size: 28rpx;
					}
				}
			}
			.about {
				display: flex;
				justify-content: flex-start;
				align-items: center;
				.about-tag {
					margin-left: 16rpx;
				}
			}
		}
	}
</style>