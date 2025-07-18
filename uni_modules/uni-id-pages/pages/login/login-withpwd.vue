<!-- 账号密码登录页 -->
<template>
	<view class="uni-content">
		<div class="flex-box">
			<!-- 顶部logo+文字 -->
			<view class="logo">
				<u--image src="/static/logo.png" width="72px" height="72px" radius="20px" ></u--image>
				<text class="title">致富之路✨口袋智富</text>
			</view>
			<!-- 账号密码登录区域 -->
			<uni-forms>
				<uni-forms-item name="username">
					<uni-easyinput :focus="focusUsername" @blur="focusUsername = false" class="input-box"
						:inputBorder="false" v-model="username" placeholder="请输入手机号/用户名/邮箱" trim="all" />
				</uni-forms-item>
				<uni-forms-item name="password">
						<uni-easyinput :focus="focusPassword" @blur="focusPassword = false" class="input-box" clearable
									type="password" :inputBorder="false" v-model="password" placeholder="请输入密码" trim="all" />
				</uni-forms-item>
			</uni-forms>
			<uni-captcha v-if="needCaptcha" focus ref="captcha" scene="login-by-pwd" v-model="captcha" />
			<!-- 带选择框的隐私政策协议组件 -->
			<uni-id-pages-agreements scope="login" ref="agreements"></uni-id-pages-agreements>
			<button class="uni-btn" type="primary" @click="pwdLogin">登录</button>
			
			<!-- 快捷导航区域 -->
			<view class="link-box">
				<view v-if="!config.isAdmin">
					<text class="forget">忘记了？</text>
					<text class="link" @click="toRetrievePwd">找回密码</text>
				</view>
				<text class="link" @click="toRegister">{{config.isAdmin ? '注册管理员账号': '注册账号'}}</text>
			</view>
			
			<!-- 其他登录方式提示 -->
			<view class="other-login-type">
				<view class="line"></view>
				<view class="text">其他登录方式</view>
				<view class="line"></view>
			</view>
			
			<!-- 其他登录方式图标按钮 -->
			<view class="link-box login-type-box">
				<!-- 短信验证码登录 -->
				<view @click="toSmsLogin" class="login-type-item">
					<u-icon name="chat" size="20" color="#999"></u-icon>
					<text class="login-type-text">短信验证码</text>
				</view>
				
				<!-- 微信登录 -->
				<!-- #if MP-WEIXIN || APP-PLUS -->
				<view @click="loginByWeixin" class="login-type-item">
					<u-icon name="weixin-fill" size="20" color="#52b838"></u-icon>
					<text class="login-type-text">微信登录</text>
				</view>
				<!-- #endif -->

				<!-- 一键登录 -->
				<!-- #ifdef APP-PLUS -->
				<view @click="loginByUniverify" class="login-type-item">
					<u-icon name="fingerprint" size="20" color="#999"></u-icon> <!-- 使用 fingerprint 作为示意图标 -->
					<text class="login-type-text">一键登录</text>
				</view>
				<!-- #endif -->
			</view>
		</div>
		
		<!-- 用户隐私授权popup -->
		<u-popup :show="showPrivacyAuthorize" round="20px" mode="center" :closeOnClickOverlay="false" :safeAreaInsetBottom="false">
			<view class="privacy-authorize">
				<view class="title">
					个人信息保护提示
				</view>
				<view class="content">
					我们会按照相关法律法规的规定及<text class="highlight" @click="openPrivacyContract">《口袋智富隐私保护指引》</text>，遵守正当、合法、必要原则收集和使用你的个人信息。
				</view>
				<view class="content">
					为了向你提供正常的服务，我们可能会申请你的头像、昵称、位置信息等权限，相应权限并不会默认开启或强制收集信息。权限开启后，你可以随时通过设置选项关闭权限。你不同意开启权限，将不会影响其他非相关业务功能的正常使用。
				</view>
				<view class="btn">
					<u-button text="不同意" shape="circle" :customStyle="{margin: '0 20px'}" @click="clickDisagree"></u-button>
					<u-button openType="agreePrivacyAuthorization" @click="clickAgree" type="primary" text="同意" shape="circle" :customStyle="{margin: '0 20px'}" ></u-button>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import mixin from '@/uni_modules/uni-id-pages/common/login-page.mixin.js';
	import config from '@/uni_modules/uni-id-pages/config.js'
	
	const uniIdCo = uniCloud.importObject("uni-id-co", {
		errorOptions: {
			type: 'toast'
		}
	})
	export default {
		mixins: [mixin],
		data() {
			return {
				"password": "",
				"username": "",
				"captcha": "",
				"needCaptcha": false,
				"focusUsername": false,
				"focusPassword": false,
				"logo": "/static/logo.png",
				"showPrivacyAuthorize": false, // 是否显示隐私授权窗口
				"allowLogin": false,
			}
		},
		onLoad() {
			// #ifdef MP-WEIXIN
			wx.getPrivacySetting({
				success: res => {
					if(!res.needAuthorization) {
						this.allowLogin = true
					} else {
						this.showPrivacyAuthorize = true
					}
				}
			})
			// #endif
			
			// #ifndef MP-WEIXIN
			this.allowLogin = true
			// #endif
		},
		onShow() {
			// #ifdef H5
			document.onkeydown = event => {
				var e = event || window.event;
				if (e && e.keyCode == 13) { //回车键的键值为13
					this.pwdLogin()
				}
			};
			// #endif
		},
		methods: {
			clickDisagree() {
				this.showPrivacyAuthorize = false
			},
			openPrivacyContract() {
				// #ifdef MP-WEIXIN
				wx.openPrivacyContract()
				// #endif
			},
			clickAgree(e) {
				// 用户点击同意
				this.showPrivacyAuthorize = false
				this.allowLogin = true
			},
			// 页面跳转，找回密码
			toRetrievePwd() {
				let url = '/uni_modules/uni-id-pages/pages/retrieve/retrieve'
				//如果刚好用户名输入框的值为手机号码，就把它传到retrieve页面，根据该手机号找回密码
				if (/^1\d{10}$/.test(this.username)) {
					url += `?phoneNumber=${this.username}`
				}
				uni.navigateTo({
					url
				})
			},
			// 跳转至短信验证码登录
			toSmsLogin() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd'
				})
			},
			/**
			 * 密码登录
			 */
			pwdLogin() {
				if(!this.allowLogin) {
					this.showPrivacyAuthorize = true
					return
				}
				
				if (!this.password.length) {
					this.focusPassword = true
					return uni.showToast({
						title: '请输入密码',
						icon: 'none',
						duration: 3000
					});
				}
				if (!this.username.length) {
					this.focusUsername = true
					return uni.showToast({
						title: '请输入手机号/用户名/邮箱',
						icon: 'none',
						duration: 3000
					});
				}
				if (this.needCaptcha && this.captcha.length != 4) {
					this.$refs.captcha.getImageCaptcha()
					return uni.showToast({
						title: '请输入验证码',
						icon: 'none',
						duration: 3000
					});
				}

				if (this.needAgreements && !this.agree) {
					return this.$refs.agreements.popup(this.pwdLogin)
				}

				let data = {
					"password": this.password,
					"captcha": this.captcha
				}

				if (/^1\d{10}$/.test(this.username)) {
					data.mobile = this.username
				} else if (/@/.test(this.username)) {
					data.email = this.username
				} else {
					data.username = this.username
				}

				uniIdCo.login(data).then(e => {
					this.loginSuccess(e)
				}).catch(e => {
					if (e.errCode == 'uni-id-captcha-required') {
						this.needCaptcha = true
					} else if (this.needCaptcha) {
						//登录失败，自动重新获取验证码
						this.$refs.captcha.getImageCaptcha()
					}
				})
			},
			/* 前往注册 */
			toRegister() {
				uni.navigateTo({
					url: this.config.isAdmin ? '/uni_modules/uni-id-pages/pages/register/register-admin' :
						'/uni_modules/uni-id-pages/pages/register/register',
					fail(e) {
						console.error(e);
					}
				})
			},
			async loginByWeixin() {
				// #ifdef MP-WEIXIN
				if (!this.allowLogin) {
					this.showPrivacyAuthorize = true;
					return;
				}
				try {
					const loginRes = await uni.login({ provider: 'weixin' });
					if (loginRes.errMsg === 'login:ok') {
						const code = loginRes.code;
						const res = await uniIdCo.loginByWeixin({ code });
						this.loginSuccess(res);
					} else {
						uni.showToast({ title: '微信登录获取code失败: ' + loginRes.errMsg, icon: 'none' });
					}
				} catch (err) {
					console.error('微信登录失败', err);
					uni.showToast({ title: '微信登录失败', icon: 'none' });
				}
				// #endif
				// #ifdef APP-PLUS
				// App端的微信登录逻辑
				if (!this.allowLogin) {
					this.showPrivacyAuthorize = true;
					return;
				}
				uni.showLoading({mask:true,title:'请稍候'})
				try {
					const providers = await uni.getProvider({service: 'oauth'});
					if (providers.provider.indexOf('weixin') === -1) {
						uni.showToast({title: '当前环境不支持微信登录',icon: 'none'});
						uni.hideLoading();
						return;
					}
					const loginRes = await uni.login({provider: 'weixin'});
					// console.log('App微信登录 loginRes:', loginRes);
					// loginRes.authResult 包含 openid, access_token 等
					const res = await uniIdCo.loginByAppWeixin(loginRes.authResult);
					this.loginSuccess(res);
				} catch (err) {
					console.error('App微信登录失败', err);
					let errMsg = err.errMsg || err.message || '微信登录失败';
					if(err.code === 1000){ // 用户取消授权
						errMsg = '您已取消微信登录';
					}
					uni.showToast({ title: errMsg, icon: 'none' });
				} finally {
					uni.hideLoading();
				}
				// #endif
			},
			async loginByUniverify() {
				// #ifdef APP-PLUS
				if (!this.allowLogin) {
					this.showPrivacyAuthorize = true;
					return;
				}
				uni.showLoading({mask:true,title:'请稍候'})
				try {
					const loginRes = await uni.login({ provider: 'univerify' });
					if (loginRes.errMsg === 'login:ok') {
						const res = await uniIdCo.loginByUniverify(loginRes.authResult);
						this.loginSuccess(res);
					} else {
						// https://uniapp.dcloud.net.cn/api/plugins/login.html#showuniverifytooltip
						// uni.showUniverifyTooltip(true) // 根据情况显示提示，引导用户进行相关操作
						uni.showToast({ title: '一键登录获取参数失败: ' + loginRes.errMsg, icon: 'none', duration: 3000 });
					}
				} catch (err) {
					console.error('一键登录失败', err);
					// uni-id-pages 对于错误的细化处理可参考：
					// uni_modules/uni-id-pages/uniCloud/common/uni-id-pages/uni-id-pages.js.page.js login_by_univerify 部分
					let errMsg = '一键登录失败';
					if (err.code === '30002' || err.code === '30001') { // 无 SIM 卡或未开启数据网络
						errMsg = '请检查SIM卡并开启数据网络';
					} else if (err.code === '30004') { // 预登录失败
						errMsg = '预登录失败，请稍后重试';
					} else if (err.code === '30005') { // 用户取消
						errMsg = '您已取消一键登录';
					}
					uni.showToast({ title: errMsg, icon: 'none', duration: 3000 });
				} finally {
					uni.hideLoading();
				}
				// #endif
				// #ifndef APP-PLUS
				uni.showToast({ title: '一键登录仅支持App端', icon: 'none' });
				// #endif
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import "@/uni_modules/uni-id-pages/common/login-page.scss";
	/* 5.18 改进登录页面样式 */
	.uni-content {
		width: 750rpx;
		min-height: 100vh;  /* 最小高度100vh */	
		padding: 0;
		margin-left: auto; /* 自动居中 */
		margin-right: auto; /* 自动居中 */
		.flex-box {
			width: 100%; /* 宽度100% */
			min-height: 100vh; /* 最小高度100vh */
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			box-sizing: border-box;
		}
	}
	
	.privacy-authorize {
		width: 640rpx;
		color: #9fcba7;
		.title {
			font-size: 32rpx
		}
		.content {
			box-sizing: border-box;
			padding: 0 20rpx;
			text-indent: 2em;
			color: #8a8a8a;
			margin-bottom: 28rpx;
			font-size: 28rpx;
			.highlight {
				color: #9fcba7;
				font-weight: 700;
			}
		}
		.btn {
			margin-bottom: 10px;
			box-sizing: border-box;
			padding: 0 20rpx;
			display: flex;
			justify-content: right;
			align-items: center;
		}
	}

	.forget {
		font-size: 12px;
		color: #8a8f8b;
	}

	.link-box {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: space-between;
		margin-top: 20px;
		width: 650rpx;
	}

	.link {
		font-size: 12px;
	}
	
	.logo {
		height: 320rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	
	.other-login-type {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		margin-top: 40px;
		width: 650rpx;
		
		.line {
			height: 1px;
			background-color: #ddd;
			flex: 1;
		}
		
		.text {
			color: #999;
			padding: 0 15px;
			font-size: 12px;
		}
	}
	
	.login-type-box {
		margin-top: 10px;
		justify-content: center;
	}
	
	.login-type-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 20px;
	}
	
	.login-type-text {
		font-size: 12px;
		margin-top: 8px;
		color: #666;
	}
</style>
