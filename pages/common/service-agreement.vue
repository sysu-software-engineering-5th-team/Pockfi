<template>
	<view class="agreement-container">
		<h1 class="title">用户服务协议</h1>
		<view class="content">
			<p>欢迎使用本应用！</p>
			<p>请您仔细阅读以下条款，如果您对本协议的任何条款表示异议，您可以选择不使用本应用。</p>
			
			<h2>一、服务说明</h2>
			<p>1.1 本应用提供的服务包括...</p>
			<p>1.2 您理解并同意，本服务仅依其当前所呈现的状况提供，对于任何用户信息或个人化设定之时效、删除、传递错误、未予储存或其他任何问题，本应用均不承担任何责任。</p>

			<h2>二、用户行为</h2>
			<p>2.1 您应对自己使用本应用服务的行为负责，不得利用本服务从事违法违规行为。</p>
			<p>2.2 ...</p>

			<h2>三、免责声明</h2>
			<p>3.1 ...</p>

			<!-- 待填充 -->
			<p>...</p>
			<p>本协议最终解释权归开发者所有。</p>
		</view>
		
		<!-- 新增返回按钮容器 -->
		<view class="footer-button-container">
			<button type="primary" class="back-button" @click="goBackToLogin">我已知晓</button>
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
			// 在跳转时设置标题
			uni.setNavigationBarTitle({
				title: '用户服务协议'
			});
		},
		methods: {
			// 新增返回登录页面的方法
			goBackToLogin() {
				// 获取当前页面栈
				const pages = getCurrentPages();
				if (pages.length > 1) {
					// 如果页面栈大于1，尝试返回上一页
					// 检查上一页是否是登录页，如果不是，可能需要 reLaunch
					// let prevPage = pages[pages.length - 2];
					// console.log('Previous page route:', prevPage.route);
					// if (prevPage.route === 'uni_modules/uni-id-pages/pages/login/login-withpwd' || prevPage.route === 'pages/login/login') { // 根据你的实际登录页路径调整
					//  uni.navigateBack({ delta: 1 });
					// } else {
					//  uni.reLaunch({ url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' }); // 修改为你的登录页实际路径
					// }
					// 简单处理：直接返回上一页，通常协议是从登录/注册页打开的。
					uni.navigateBack({ delta: 1 });
				} else {
					// 如果页面栈只有当前页，说明可能是直接打开的，此时 reLaunch 到登录页
					uni.reLaunch({
						url: '/uni_modules/uni-id-pages/pages/login/login-withpwd' // 请确认这是你的密码登录页面路径
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

/* 5.18 新增按钮样式 */
.footer-button-container {
	position: fixed; /* 固定在底部 */
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #f8f8f8; /* 给按钮一个背景色，避免文字与页面内容重叠 */
	padding: 20rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); /* 适配iPhone X等底部安全区域 */
	display: flex;
	justify-content: center;
	border-top: 1rpx solid #eee; /* 可选：顶部加一条分割线 */
	z-index: 10; // 确保按钮在最上层
}

.back-button {
	width: 90%;
	// 可以根据uView或项目主题色调整按钮颜色
	// 如： background-color: #9fcba7; color: white;
}

.safe-area-bottom {
	height: env(safe-area-inset-bottom);
}
</style>
