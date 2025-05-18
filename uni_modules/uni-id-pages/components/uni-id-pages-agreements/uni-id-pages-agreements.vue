<template>
	<view class="root" v-if="agreements.length">
		<template v-if="needAgreements">
			<checkbox-group @change="setAgree">
				<label class="checkbox-box">
					<checkbox :checked="isAgree" style="transform: scale(0.5);margin-right: -6px;" />
					<text class="text">同意</text>
				</label>
			</checkbox-group>
			<view class="content">
				<view class="item" v-for="(agreement,index) in agreements" :key="index">
					<text class="agreement text" @click="navigateTo(agreement)">{{agreement.title}}</text>
					<text class="text and" v-if="hasAnd(agreements,index)" space="nbsp"> 和 </text>
				</view>
			</view>
		</template>
		<!-- 弹出式 -->
		<uni-popup v-if="needAgreements||needPopupAgreements" ref="popupAgreement" type="center">
			<uni-popup-dialog confirmText="同意" @confirm="popupConfirm">
				<view class="content">
					<text class="text">请先阅读并同意</text>
					<view class="item" v-for="(agreement,index) in agreements" :key="index">
						<text class="agreement text" @click="navigateTo(agreement)">{{agreement.title}}</text>
						<text class="text and" v-if="hasAnd(agreements,index)" space="nbsp"> 和 </text>
					</view>
				</view>
			</uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	import config from '@/uni_modules/uni-id-pages/config.js'
	let retryFun = ()=>console.log('为定义')
	/**
		* uni-id-pages-agreements
		* @description 用户服务协议和隐私政策条款组件
		* @property {String,Boolean} scope = [register|login]	作用于哪种场景如：register 注册（包括登录并注册，如：微信登录、苹果登录、短信验证码登录）、login 登录。默认值为：register
	*/
	export default {
		name: "uni-agreements",
		computed: {
			agreements() {
				if(!config.agreements){
					return []
				}
				let {serviceUrl,privacyUrl} = config.agreements
				return [
					{
						url:serviceUrl,
						title:"用户服务协议"
					},
					{
						url:privacyUrl,
						title:"隐私政策条款"
					}
				]
			}
		},
		props: {
			scope: {
				type: String,
				default(){
					return 'register'
				}
			},
		},
		methods: {
			popupConfirm(){
				this.isAgree = true
				retryFun()
				// this.$emit('popupConfirm')
			},
			popup(Fun){
				this.needPopupAgreements = true
				// this.needAgreements = true

				//::TODO 鸿蒙元服务暂不支持 createAnimation，等支持后再打开
				// #ifdef MP-HARMONY
					return uni.showModal({
						title: "提示",
						content: `请先阅读并同意${this.agreements.map(item=>`"${item.title}"`).join('和')}`,
					})
				// #endif
				// #ifndef MP-HARMONY
				this.$nextTick(()=>{
					if(Fun){
						retryFun = Fun
					}
					this.$refs.popupAgreement.open()
				})
				// #endif
			},
			navigateTo({
				url,
				title
			}) {
				// 检查url是否是外部链接
				if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
					// 如果是外部链接，则通过webview打开
					uni.navigateTo({
						url: '/uni_modules/uni-id-pages/pages/common/webview/webview?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title),
					});
				} else if (url && url.startsWith('/')) {
					// 如果是内部页面路径 (以 / 开头)，则直接跳转到该页面
					uni.navigateTo({
						url: url, // 直接使用/pages/common/service-agreement 等路径
						// success: () => {
						// 	// 如果页面跳转成功后，还需要设置标题，可以在这里进行，
						// 	// 但页面自身在 onLoad 中设置标题更常见。
						// 	// uni.setNavigationBarTitle({ title: title }); 
						// }
					});
				} else {
					// 如果URL既不是外部链接也不是有效的内部路径，可以给个提示或者不执行任何操作
					console.warn('无效的协议链接:', url);
					uni.showToast({
						title: '协议链接无效',
						icon: 'none'
					});
				}
			},
			hasAnd(agreements, index) {
				return agreements.length - 1 > index
			},
			setAgree(e) {
				this.isAgree = !this.isAgree
				this.$emit('setAgree', this.isAgree)
			}
		},
		created() {
			this.needAgreements = (config?.agreements?.scope || []).includes(this.scope)
		},
		data() {
			return {
				isAgree: false,
				needAgreements:true,
				needPopupAgreements:false
			};
		}
	}
</script>

<style lang="scss" scoped>
	/* #ifndef APP-NVUE */
	view {
		display: flex;
		box-sizing: border-box;
		flex-direction: column;
	}

	/* #endif */
	.root {
		flex-direction: row;
		align-items: center;
		font-size: 12px;
		color: #8a8f8b;
	}

	.checkbox-box ,.uni-label-pointer{
		align-items: center;
		display: flex;
		flex-direction: row;
	}

	.item {
		flex-direction: row;
	}
	.text{
		line-height: 26px;
	}
	.agreement {
		color: #04498c;
		cursor: pointer;
	}

	.checkbox-box ::v-deep .uni-checkbox-input{
		border-radius: 100%;
	}

	.checkbox-box ::v-deep .uni-checkbox-input.uni-checkbox-input-checked{
		border-color: $uni-color-primary;
		color: #FFFFFF !important;
		background-color: $uni-color-primary;
	}

	.content{
		flex-wrap: wrap;
		flex-direction: row;
	}

	.root ::v-deep .uni-popup__error{
		color: #333333;
	}
</style>
