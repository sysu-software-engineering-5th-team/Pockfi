<template>
	<view class="about">
		<view class="logo" @click="subMsg">
			<u--image src="/static/logo.png" width="72px" height="72px" radius="20px" ></u--image>
			<view class="version">
				Version：<text class="highlight">1.1.0</text>
			</view>
		</view>
		<view class="main">
			<mj-card title="关于口袋智富">
				<view class="about-textarea">
					口袋智富是基于开源项目<text class="highlight">妙记</text>进行二次开发的智能理财记账应用。在保持妙记简洁易用特色的基础上，我们将其迁移到移动端，并增加了理财分析、预算管理、存钱目标等实用功能，致力于为用户提供更全面的个人财务管理体验。
				</view>
				<view class="about-textarea">
					本项目作为学习实践项目，感谢妙记原作者的开源贡献。如果您觉得口袋智富对您有帮助，欢迎推荐给朋友使用。
				</view>
			</mj-card>
			<mj-card title="主要特色功能">
				<view class="about-textarea">
					💰 <text class="highlight">智能记账</text>：支持收入、支出、转账记录，模板记账，秒记功能
				</view>
				<view class="about-textarea">
					📊 <text class="highlight">理财分析</text>：股票K线图表分析，利息计算器
				</view>
				<view class="about-textarea">
					🎯 <text class="highlight">目标管理</text>：月度预算设置，存钱目标追踪
				</view>
			</mj-card>
			<mj-card title="开源致谢">
				<view class="about-textarea">
					口袋智富基于<text class="highlight">妙记 (MiaoJi)</text>项目进行二次开发，感谢原作者的开源贡献。原项目地址：<text class="highlight">github.com/ztkuaikuai/MiaoJi</text>
				</view>
			</mj-card>
			<u-divider text="版本更新说明"></u-divider>
			<mj-card title="🎉1.1.0" subTitle="2025-06-14">
				<view class="one-update">
					<view class="row highlight">
						⭐新增原生功能：无障碍服务，主动记录支付宝、微信支付页面，支付宝账单
					</view>
					<view class="row highlight">
						⭐新增原生功能：监听通知功能，主动记录通知栏消息，提取金额和关键词
					</view>
					<view class="row">
						🔧解决资产精度报错，修改预算计算逻辑
					</view>
				</view>
			</mj-card>			
			<mj-card title="🎉1.0.0" subTitle="2025-06-01">
				<view class="one-update">
					<view class="row highlight">
						⭐新增提醒页面：月度预算管理和存钱目标追踪
					</view>
					<view class="row highlight">
						⭐新增理财页面：利息计算器和股票K线分析
					</view>
					<view class="row">
						🌞优化秒记功能：支持模板绑定和解绑，响应式更新
					</view>
					<view class="row">
						🌞优化资产管理：同名资产自动合并，移动端完整支持
					</view>
					<view class="row">
						🌞重构页面布局：账单明细移至首页，图表移至报表页
					</view>
					<view class="row">
						🔧修复再记功能卡顿问题
					</view>
					<view class="row">
						🔧修复资产显示错误和编辑账单问题
					</view>
				</view>
			</mj-card>
			<mj-card title="0.0.2" subTitle="2025-05-25">
				<view class="one-update">
					<view class="row highlight">
						⭐新增自定义头像功能
					</view>
					<view class="row highlight">
						⭐新增用户服务协议和隐私政策页面
					</view>
					<view class="row">
						🌞优化账单加载体验：新增加载框和状态提示
					</view>
					<view class="row">
						🔧修复模板记账无法显示问题
					</view>
					<view class="row">
						🔧解决编译警告和样式兼容性问题
					</view>
				</view>
			</mj-card>
			<mj-card title="0.0.1" subTitle="2025-05-15">
				<view class="one-update">
					<view class="row highlight">
						⭐完善移动端APP支持：解决登录和资产管理问题
					</view>
					<view class="row highlight">
						⭐实现资产同名自动合并功能
					</view>
					<view class="row">
						🌞优化记账页面样式：修复资产列表显示问题
					</view>
					<view class="row">
						🔧修复账单页面后台报错
					</view>
				</view>
			</mj-card>
			<mj-card title="未来更新计划">
				<view class="one-update">
					<view class="row">
						😇优化理财分析功能：更多投资工具和指标
					</view>
					<view class="row">
						😇增强预算管理：分类预算和智能提醒
					</view>
					<view class="row">
						😇添加数据导出功能
					</view>
					<view class="row">
						😇优化UI设计和用户体验
					</view>
				</view>
			</mj-card>
		</view>
		<u-safe-bottom></u-safe-bottom>
	</view>
</template>

<script>
	import { subscribeMessage } from '@/utils/subscribeMessage.js'
	export default {
		methods: {
			// 订阅版本更新说明消息
			subMsg() {
				subscribeMessage(['kGUsXGcTKBAA239WAxPCbn3Sv2svDGWTqsglYZMiqLI'])
			}
		}
	}
</script>

<style lang="scss" scoped>
.about {
	.logo {
		height: 320rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		.version {
			margin-top: 12px;
			color: #727272;
			font-size: 16px
		}
	}
	.main {
		.about-textarea {
			text-indent: 2em;
			font-size: 32rpx;
			color: $mj-text-color-grey;
			line-height: 48rpx;
			margin-bottom: 8rpx;
		}
		
		.one-update {
			font-size: 32rpx;
			color: $mj-text-color-grey;
			line-height: 48rpx;
			.title {
				font-size: 36rpx;
				text-align: center;
			}
			.row {
				margin-bottom: 8rpx;
			}
		}
	}
	.highlight {
		color: $mj-theme-color-black;
		font-weight: 700;
	}
}
</style>
