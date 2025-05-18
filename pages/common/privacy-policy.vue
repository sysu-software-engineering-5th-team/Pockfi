<template>
	<view class="agreement-container">
		<h1 class="title">隐私政策条款</h1>
		<view class="content">
			<p>本应用尊重并保护所有使用服务用户的个人隐私权。</p>
			<p>为了给您提供更准确、更有个性化的服务，本应用会按照本隐私权政策的规定使用和披露您的个人信息。但本应用将以高度的勤勉、审慎义务对待这些信息。除本隐私权政策另有规定外，在未征得您事先许可的情况下，本应用不会将这些信息对外披露或向第三方提供。</p>
			
			<h2>一、适用范围</h2>
			<p>1.1 在您注册本应用帐号时，您根据本应用要求提供的个人注册信息；</p>
			<p>1.2 在您使用本应用网络服务，或访问本应用平台网页时，本应用自动接收并记录的您的浏览器和计算机上的信息，包括但不限于您的IP地址、浏览器的类型、使用的语言、访问日期和时间、软硬件特征信息及您需求的网页记录等数据；</p>
			
			<h2>二、信息使用</h2>
			<p>2.1 本应用不会向任何无关第三方提供、出售、出租、分享或交易您的个人信息，除非事先得到您的许可。</p>
			<p>2.2 ...</p>

			<h2>三、信息披露</h2>
			<p>3.1 ...</p>

			<!-- 待填充 -->
			<p>...</p>
			<p>本政策最终解释权归开发者所有。</p>
		</view>

		<!-- 新增返回按钮容器 -->
		<view class="footer-button-container">
			<button type="primary" class="back-button" @click="goBackToLogin">返回登录</button>
		</view>

		<view class="safe-area-bottom"></view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		onLoad() {
			uni.setNavigationBarTitle({
				title: '隐私政策条款'
			});
		},
		methods: {
			// 新增返回登录页面的方法
			goBackToLogin() {
				// 获取当前页面栈
				const pages = getCurrentPages();
				if (pages.length > 1) {
					uni.navigateBack({ delta: 1 });
				} else {
					uni.reLaunch({
						url: '/uni_modules/uni-id-pages/pages/login/login-withpwd'
					});
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
.agreement-container {
	padding: 30rpx;
	font-size: 28rpx;
	line-height: 1.8;
	color: #333;
	padding-bottom: 120rpx; /* 为底部按钮留出空间 */
}
.title {
	font-size: 40rpx;
	font-weight: bold;
	text-align: center;
	margin-bottom: 40rpx;
	color: #000;
}
.content h2 {
	font-size: 32rpx;
	font-weight: bold;
	margin-top: 30rpx;
	margin-bottom: 15rpx;
	color: #111;
}
.content p {
	margin-bottom: 20rpx;
	text-indent: 2em; // 首行缩进
}

/* 新增按钮样式 */
.footer-button-container {
	position: fixed; /* 固定在底部 */
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #f8f8f8;
	padding: 20rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	display: flex;
	justify-content: center;
	border-top: 1rpx solid #eee;
	z-index: 10;
}

.back-button {
	width: 90%;
}

.safe-area-bottom {
	height: env(safe-area-inset-bottom);
}
</style>
