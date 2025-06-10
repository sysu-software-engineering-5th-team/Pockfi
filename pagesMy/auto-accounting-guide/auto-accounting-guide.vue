<template>
	<view class="auto-accounting-guide">
		<uni-card :is-shadow="true" shadow="rgba(149, 157, 165, 0.2) 0px 8px 24px;">
			<view class="guide-content">
				<view class="title">自动记账须知</view>
				
				<view class="section">
					<view class="section-title">什么是自动记账？</view>
					<view class="section-content">
						自动记账是口袋智富提供的一项智能功能，目前的功能主要是识别部分应用的通知关键词和金额，如果含有金额且“支付”、“收款”等关键词，会识别并且自动输入金额。
					</view>
				</view>
				
				<view class="section">
					<view class="section-title">需要开启的权限</view>
					<view class="section-content">
						<view class="feature-item">• 在“我的”-“设置”处开启电池白名单和监听权限</view>
						<view class="feature-item">• 自行到设置开启应用自启动权限</view>
					</view>
				</view>
				
				<view class="section">
					<view class="section-title">局限性</view>
					<view class="section-content">
						<view class="feature-item">1. 目前应用在后台运行时，当收到支出收入的消息时，无法弹窗提醒用户打开应用，需要用户自行打开应用</view>
						<view class="feature-item">2. 后台完全杀死应用时，检测不到消息</view>
						<view class="feature-item">3. 目前能检测的关键字和应用有限</view>
					</view>
				</view>
			</view>
		</uni-card>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			
		}
	}
</script>

<style lang="scss">
.auto-accounting-guide {
	padding: 20rpx;
	
	.guide-content {
		.title {
			font-size: 36rpx;
			font-weight: bold;
			text-align: center;
			margin-bottom: 40rpx;
			color: #333;
		}
		
		.section {
			margin-bottom: 40rpx;
			
			.section-title {
				font-size: 32rpx;
				font-weight: bold;
				color: #333;
				margin-bottom: 20rpx;
			}
			
			.section-content {
				font-size: 28rpx;
				color: #666;
				line-height: 1.6;
				
				.feature-item {
					margin-bottom: 16rpx;
				}
			}
		}
	}
}
</style> 