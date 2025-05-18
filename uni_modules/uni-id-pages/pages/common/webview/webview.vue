<!-- 网络链接内容展示页（uni-id-pages中用于展示隐私政策协议内容） -->
<template>
	<view>
		<web-view v-if="url" :src="url"></web-view>
	</view>
</template>

<script>
	export default {
		onLoad({url,title}) {
			if(url && url.substring(0, 4) != 'http'){
				uni.showModal({
					title:"错误",
					content: '不是一个有效的网站链接,'+'"'+url+'"',
					showCancel: false,
					confirmText:"知道了",
					complete: () => {
						uni.navigateBack()
					}
				});
				title = "页面路径错误"
				this.url = null;
			}else if (url) {
				this.url = url;
			} else {
				uni.showModal({
					title:"错误",
					content: '页面链接未提供',
					showCancel: false,
					confirmText:"知道了",
					complete: () => {
						uni.navigateBack()
					}
				});
				title = "页面链接错误"
				this.url = null;
			}

			if(title){
				uni.setNavigationBarTitle({title});
			}
		},
		data() {
			return {
				// url:null // 从 data 中移除 url，因为它会通过 onLoad 传入
			};
		},
		// 如果需要明确将 onLoad 的参数作为 prop 接收并使其具有响应性，
		// 尤其是在组件不仅仅作为页面使用时，标准的做法是：
		// props: {
		//   initialUrl: String // 假设从外部传入一个名为 initialUrl 的 prop
		// },
		// data() {
		//   return {
		//     url: null
		//   };
		// },
		// onLoad(options) {
		//   let urlToLoad = options.url || this.initialUrl;
		//   let title = options.title;
		//   // ... 接下来的逻辑和上面类似 ...
		//   this.url = urlToLoad;
		// }
		// 但对于作为页面直接通过 url?url=xxx 传递参数的情况，
		// onLoad({url}) 然后 this.url = url 是常见的简单处理方式，
		// Vue 3 Composition API 或 Vue 2 中更复杂的场景下，会更明确地处理 props。
		// 为了解决警告，我们只需要确保不在 data 中重复声明即可。
		// 对于页面，Uniapp 会将 onLoad 的参数挂载到 this 上，所以 this.url = url 也是可以工作的。
		// 修复警告最直接的方式是删除 data 中的 url。
		// 为确保响应性，我们还是在 data 中保留 url，但在 onLoad 中正确赋值。
		// data() {
		// 	return {
		// 		url:null // 确保 url 在 data 中定义，以便 this.url = url 能正确触发响应式更新
		// 	};
		// }
		// Vue 的警告是针对 props 和 data 同名。在页面路由参数中，参数会直接挂载到 this 上。
		// 只要不在 data 中定义同名属性 `url`，警告就会消失。
		// onLoad(query) { this.url = query.url } 这种写法，如果 data 中没有 url，
		// this.url 赋值时会创建一个非响应式的属性。
		// 正确的方式是 data 中有 url: null, 然后 onLoad(query) { this.url = query.url }
		// 这个警告的核心是 onLoad({url}) 中的 url 和 data(){return {url:xxx}} 冲突。
		// onLoad 的参数可以直接通过 this.url 访问 (如果 onLoad 的参数名是 url)。

		// 正确的处理方式：
		// data() {
		//   return {
		//     url: null // 由 onLoad 赋值
		//   }
		// },
		// onLoad(options) {
		//   const pageUrl = options.url; // 从 options 中获取 url
        //   const pageTitle = options.title;
		//   if (pageUrl && pageUrl.substring(0, 4) != 'http') { ... }
		//   else if (pageUrl) { this.url = pageUrl; }
		//   ...
		// }
		// 这样就不会有 props 和 data 的冲突。
		// 我们将采用这种方式。
	}
</script>
