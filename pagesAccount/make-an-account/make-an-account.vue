<template>
	<view class="keep-accounts">
		<view class="header-tabs">
			<view class="tabs"><u-tabs ref="tabs" :list="tabList" @click="clickTab" lineColor="#2e3548" :itemStyle="{ height: '76rpx' }"></u-tabs></view>
		</view>
		<view class="icon-grid">
			<view class="icon-expend" v-show="showExpend">
				<!-- 支出icon -->
				<u-grid :border="false" @click="clickCategoryExpend" col="5">
					<u-grid-item v-for="item,index in categoryIconListForExpend" :key="item.type">
						<view class="content">
							<view class="grid-item">
								<mj-icon-with-background v-if="index !== currentExpendIndex" :type="item.icon" size="48rpx" customPrefix="miaoji"></mj-icon-with-background>
								<mj-icon-with-background v-if="index === currentExpendIndex" :type="item.icon" size="48rpx" customPrefix="miaoji" color="#65915b" bgcColor="#efea9b"></mj-icon-with-background>
								<view class="grid-text">{{item.title}}</view>
							</view>
						</view>
					</u-grid-item>
				</u-grid>
			</view>
			<!-- 收入icon -->
			<view class="icon-income" v-show="showIncome">
				<u-grid :border="false" @click="clickCategoryIncome" col="5">
					<u-grid-item v-for="item,index in categoryIconListForIncome" :key="item.type">
						<view class="content">
							<view class="grid-item">
								<mj-icon-with-background v-if="index !== currentIncomeIndex" :type="item.icon" size="48rpx" customPrefix="miaoji" ></mj-icon-with-background>
								<mj-icon-with-background v-if="index === currentIncomeIndex" :type="item.icon" size="48rpx" customPrefix="miaoji" color="#65915b" bgcColor="#efea9b"></mj-icon-with-background>
								<view class="grid-text">{{item.title}}</view>
							</view>
						</view>
					</u-grid-item>
				</u-grid>
			</view>
			<view class="transfer-accounts" v-show="showTransferAccounts">
				<!-- 转出账户 -->
				<view class="asset-card" @click="chooseTransferAsset(0)">
					<view class="left">
						<view class="left-icon">
							<uni-icons type="mj-wallet" color="#6d6d6d" size="40rpx" customPrefix="miaoji"></uni-icons>
						</view>
						<view class="asset-type" :style="transferOutAssetStyle.title ? '' : 'color: #6d6d6d;'" >
							{{transferOutAssetStyle.asset_name || transferOutAssetStyle.title  || '转出账户'}}
						</view>
					</view>
					<view class="asset-icon" v-show="transferOutAssetStyle">
						<uni-icons :type="transferOutAssetStyle.icon" :color="transferOutAssetStyle.color" customPrefix="miaoji"></uni-icons>
					</view>
				</view>
				<!-- 转入账户 -->
				<view class="asset-card" @click="chooseTransferAsset(1)">
					<view class="left">
						<view class="left-icon">
							<uni-icons type="mj-wallet" color="#6d6d6d" size="40rpx" customPrefix="miaoji"></uni-icons>
						</view>
						<view class="asset-type" :style="transferIntoAssetStyle.title ? '' : 'color: #6d6d6d;'" >
							{{transferIntoAssetStyle.asset_name || transferIntoAssetStyle.title || '转入账户'}}
						</view>
					</view>
					<view class="asset-icon" v-show="transferIntoAssetStyle">
						<uni-icons :type="transferIntoAssetStyle.icon" :color="transferIntoAssetStyle.color" customPrefix="miaoji"></uni-icons>
					</view>
				</view>
				
				<view style="color: #6d6d6d;padding-left: 8rpx;font-size: 24rpx;">
					手续费 —— 从转出账户转出的钱 = 转出金额 + 手续费
				</view>
				<u--form :model="transferInfo" :borderBottom="false" ref="uForm" errorType="toast">
					<u-form-item prop="serviceCharge" :borderBottom="false">
						<u-input 
							v-model="transferInfo.serviceCharge" 
							placeholder="手续费" 
							placeholderStyle="color: #6d6d6d" 
							type="digit" 
							border="surround" 
							clearable
							shape="circle" 
							maxlength="8" 
							fontSize="13px" 
							:customStyle="inputStyle" 
						>
							<template slot="prefix">
								<uni-icons style="margin-right: 20rpx;" type="mj-yuan-circle" color="#6d6d6d" size="40rpx" customPrefix="miaoji"></uni-icons>
							</template>
						</u-input>
					</u-form-item>
				</u--form>
			</view>
		</view>
		<view class="mj-keyboard">
			<view class="fixed">
				<view class="tags">
					<view class="item" @click="chooseAsset" v-if="!showTransferAccounts">
						<view><uni-icons type="wallet" size="28rpx"></uni-icons></view>
						<view>{{currentAssetTitle}}</view>
					</view>
					<view class="item" @click="chooseDate" v-if="!isTemplate">
						<view><uni-icons type="calendar" size="28rpx"></uni-icons></view>
						<view>{{userChooseDate}}</view>
					</view>
					<view class="item" @click="chooseTemplate" v-if="!isTemplate">
						<view><uni-icons type="mj-layout" size="28rpx" customPrefix="miaoji"></uni-icons></view>
						<view>模板</view>
					</view>
				</view>
				<view class="bgc">
					<view class="header">
						<view class="textarea">
							<u--textarea v-model="keyboardInfo.notes" placeholder="备注信息(最多输入60字)" autoHeight border="none" :fixed="true" maxlength="60"></u--textarea>
						</view>
						<view class="num" :style="bill_type === 1 ? 'color:#219a6d;' : ''" v-show="!showTransferAccounts">
							￥{{keyboardInfo.balance}}
						</view>
						<view class="num numForTransfer" v-show="showTransferAccounts">
							￥{{keyboardInfo.balance}}
						</view>
					</view>
				</view>
			</view>
			<view class="keyboard">
				<!-- 修改了u-number-keyboard中的样式,逻辑 -->
				<u-keyboard 
					mode="number" 
					zIndex="1" 
					:show="true" 
					:tooltip="false" 
					:overlay="false" 
					@change="tapKeyboard" 
					@backspace="tapBackspace" 
					:safeAreaInsetBottom="false" 
					:secondOne="keyboardSecondOneName" 
					:secondTwo="keyboardSecondTwoName"
				></u-keyboard>
			</view>
		</view>
		
		<!-- 展示资产页的popup -->
		<u-popup :show="showUserAssetsList" @close="showUserAssetsList = false" round="20px" zIndex="10076">
			<view class="user-assets-list">
				<view class="top">
					<view class="add">
						请选择账户
					</view>
				</view>
				<view class="content">
					<u-cell-group :border="false" >
						<u-cell :title="asset.asset_name ? asset.asset_name : asset.assetStyle.title" :clickable="true" @click="clickOneAsset(asset)" v-for="asset in userAssets" :key="asset._id" >
							<uni-icons slot="icon" :type="asset.assetStyle.icon" size="36rpx" custom-prefix="miaoji" :color="asset.assetStyle.color"></uni-icons>
							<view slot="value">
								<u--text mode="price" :text="asset.asset_balance" color="#219a6d" size="28rpx" bold></u--text>
							</view>
						</u-cell>
					</u-cell-group>
				</view>
			</view>
		</u-popup>
		
		<!-- 展示日期选择器的组件 -->
		<!-- 删除下面的maxDate="Date.now()？" -->
		<u-datetime-picker
			:show="showDatetimePicker"
			v-model="currentDate"
			mode="datetime"
			confirmColor="#9fcba7"
			:closeOnClickOverlay="true"
			@close="showDatetimePicker = false"
			@cancel="showDatetimePicker = false"
			@confirm="getBillDate"
		></u-datetime-picker>
		
		<!-- 模板的popup -->
		<u-popup :show="showTemplate" @close="showTemplate = false" round="20px" zIndex="10076">
			<view class="user-template-list">
				<view class="header">
					<view class="left">
						占位
					</view>
					<view class="middle">
						帐单模板
					</view>
					<view class="right" @click="goTemplatePage">
						添加
					</view>
				</view>
				<view class="template-list">
					<mj-bill-template :templateList="templateList" @updateList="getUserTemplate" pageType="account" @getTemp="getTemp"></mj-bill-template>
				</view> 
			</view>
		</u-popup>
	</view>
</template>

<script>
	import { getCategoryIconListForExpend, getCategoryIconListForIncome, getAssetsStyle } from "@/utils/icon-config.js";
	import { throttle } from '@/utils/throttle.js'
	import { formatOneTemplate } from '@/utils/formatTemplate.js'
	// 订阅消息
	import { subscribeMessage } from '@/utils/subscribeMessage.js'
	// 金额处理工具
	import { convertYuanToCent } from '@/utils/amount-utils.js'
	const db = uniCloud.database()
	export default {
		data() {
			return {
				pageType: 'add', // 页面类型，默认为添加； 还有 edit：编辑；template：添加模板；templateEdit：编辑模板；
				tabList: [{
					name: '支出'
				}, {
					name: '收入'
				}, {
					name: '转账'
				}],
				categoryIconListForExpend: [],
				categoryIconListForIncome: [],
				showExpend: true,
				showIncome: false,
				showTransferAccounts: false,
				// 用户资产列表
				userAssets: [],
				assetsStyle: [],
				showUserAssetsList: false,
				showDatetimePicker: false,
				currentDate: Date.now(),
				userChooseDate: uni.$u.timeFormat(Date.now(), 'mm月dd日'),
				// 转出转入账户的渲染样式
				transferOutAssetStyle: {},
				transferIntoAssetStyle: {},
				// 转账页用户点击的账户，用于clickOneAsset方法判断。 0 转出账户   1 转入账户
				userClickAsset: 0,
				rules: {
					'serviceCharge': [
						{
							type: 'number',
							message: '请输入数字金额'
						},
						{
							validator: (rule, value, callback) => {
								// 检查是否为负值
								if (parseFloat(value) < 0) {
									return false
								}
								return true
							},
							message: '手续费不能为负值'
						},
						{
							validator: (rule, value, callback) => {
								return uni.$u.test.amount(value)
							},
							message: '手续费格式有误，最多填写两位小数'
						},
					]
				},
				isSetRules: false,
				inputStyle: {
					'background-color': '#f1f1f1',
					'border-radius': '20px',
					'border': 'none',
					'height': '80rpx',
					'padding-left': '20px',
					'padding-right': '20px',
				},
				// 支出页||收入页表单信息
				expendOrIncomeInfo: {
					category_type: 'dining',
					bill_type: 0,
					bill_amount: 0.00,
					asset_id: '',
					bill_date: Date.now(),
					bill_notes: ''
				},
				// 转账页表单信息
				transferAccountInfo: {
					category_type: 'transfer',
					bill_type: 2,
					bill_amount: 0.00,  // 手续费
					asset_id: '',
					bill_date: Date.now(),
					bill_notes: '',
					transfer_amount: 0.00,  //转账金额
					destination_asset_id: ''  // 转入资产id
				},
				// 转账页手续费
				transferInfo: {
					serviceCharge: 0.00
				},
				//  keyboard相关数据
				keyboardInfo: {
					notes: '',
					balance: '0.00'
				},
				// 分类index
				currentExpendIndex: 0,
				currentIncomeIndex: 0,
				currentTabIndex: 0,
				currentAssetTitle: '未选择资产',// 默认为用户第一个资产
				
				// 修改账单相关数据
				// 账单的初始数据
				editInitBill: {},
				isEdit: false,
				
				// 模板管理相关数据
				showTemplate: false,
				isTemplate: false,
				isTemplateEdit: false,
				templateEditId: '',
				templateList: [],
				// 再记标识
				isAddAgain: false,
				// 保存按钮触发函数：使用节流
				throttleTapSaveBtn: throttle(this.tapSaveBtn, 5000),
				// 再记按钮触发函数：使用节流
				throttleAddAgain: throttle(this.addAgain, 5000),
				// 秒记数据
				secondOneData: null,
				secondTwoData: null,
				throttleAddSecond: throttle(this.addSecond, 5000),
				secondId: '',
				navigatedFromAddAgain: false, // 新增：标记是否从"再记"跳转而来
				isNavigatingToHome: false // 新增：防止重复跳转的状态锁
			};
		},
		computed: {
			bill_type: {
				get() {
					return this.expendOrIncomeInfo.bill_type
				},
				set(value) {
					this.expendOrIncomeInfo.bill_type = value
				}
			},
			category_type: {
				get() {
					return this.expendOrIncomeInfo.category_type
				},
				set(value) {
					this.expendOrIncomeInfo.category_type = value
				}
			},
			// 新增计算属性，确保秒记名称的响应性
			// 使用可选链操作符?.，确保即使second_name为null，也不会导致错误
			keyboardSecondOneName() {
				return this.secondOneData?.second_name || '秒记1';
			},
			keyboardSecondTwoName() {
				return this.secondTwoData?.second_name || '秒记2';
			}
		},
		onLoad(options) { // 修改onLoad以接收完整options
			uni.showLoading({
				title: '加载中...',
				mask: false // 默认其实也是false，不应用遮罩，这样就可以直接返回
			});
			this.pageType = options.type ?? 'add'
			if (options.from === 'addAgain') {
			    this.navigatedFromAddAgain = true;
			}
			// 异步执行初始化，以便catch错误并隐藏loading
			this.initializePageData(options);
		},
		onShow() {
			// 获取用户秒记列表和模板列表
			// uni.showLoading 和 uni.hideLoading 由调用这些方法的外部逻辑处理，或各自方法内部保证单一实例
			this.loadDataForShow();
		},
		methods: {
			async loadDataForShow() {
				// onShow 调用的数据加载，可以考虑是否需要独立的 loading 提示
				// 如果这些数据对于页面立即可见部分不是强关键，可以不显示全局 loading
				// 或者，如果希望有提示，可以在这里管理一个短时的 loading
				try {
					await this.getUserSeconds();
					await this.getUserTemplate();
				} catch (e) {
					// console.error("loadDataForShow failed:", e) // 保留错误处理，但注释掉普通日志
				}
			},
			// 新增：统一处理页面初始化逻辑，方便管理loading状态
			async initializePageData(options) {
				try {
					await this.initPage(); // initPage现在应该是async
					await this.initEditPage(options.type, options.tab); // initEditPage现在应该是async
				} catch (error) {
					console.error("Page initialization failed:", error);
					uni.showToast({
						title: '页面加载失败',
						icon: 'none'
					});
				} finally {
					uni.hideLoading();
				}
			},
			// 初始化相关方法
			async initPage() { // 修改为 async
				// 获取分类列表，该用户所有资产信息，将用户资产信息添加对应资产icon样式
				this.categoryIconListForExpend = getCategoryIconListForExpend()
				this.categoryIconListForIncome = getCategoryIconListForIncome()
				// 从缓存中读取用户资产信息，金额从大到小排序
				const storageUserAssets = uni.getStorageSync('mj-user-assets')
				this.userAssets = storageUserAssets.sort((a, b) => b.asset_balance - a.asset_balance)
				this.expendOrIncomeInfo.asset_id = this.userAssets.filter(asset => asset.default_asset === true)[0]?._id ?? ''
				this.assetsStyle = getAssetsStyle()
				this.addAssetStyle()
				// 设置当前默认使用的资产
				const currentAsset = this.userAssets.filter(asset => asset.default_asset === true)
				this.currentAssetTitle = currentAsset[0]?.asset_name || currentAsset[0]?.assetStyle.title || '未选择资产'
				// console.log('[DEBUG] initPage completed, currentAssetTitle:', this.currentAssetTitle);

				// 确保在 initPage 中也等待这些数据加载完成
				try {
					await this.getUserSeconds();
					await this.getUserTemplate();
					// console.log('[DEBUG] initPage - after getUserTemplate, templateList length:', this.templateList.length);
				} catch (error) {
					// console.error("[DEBUG] initPage - error during getUserSeconds/getUserTemplate:", error);
				}
			},
			// 给userAssets添加type值对应的assetStyle
			addAssetStyle() {
				this.userAssets.forEach(asset => {
					asset.assetStyle = this.assetsStyle.find(item => item.type == asset.asset_type)
				})
				// console.log('addAssetStyle',this.assets);
			},
			// 编辑账单||编辑模板 初始化
			async initEditPage(type,tab) { // 修改为 async
				if(type === 'edit') {
					// 赋值账单初始数据
					this.editInitBill = uni.getStorageSync('mj-bill-edit')
					this.isEdit = true
					uni.removeStorage({
						key: 'mj-bill-edit',
						success: () => {}
					})
					// 触发clickTab事件，index为tab
					this.$nextTick(() => {
						this.$refs.tabs.clickHandler({},tab)
					})
					
					if(tab != 2) {
						// 如果为收入 || 支出
						// 修改左下资产标题
						// console.log('this.editInitBill: ',this.editInitBill);
						this.currentAssetTitle =  this.editInitBill.asset_id[0].asset_name || this.editInitBill.assetStyle?.title || '未选择资产'
					} else {
						// 如果为转账，获取转出、转入账户的资产名
						this.transferOutAssetStyle = {asset_name: this.editInitBill.asset_id[0].asset_name}
						if (this.editInitBill.destination_asset_id && this.editInitBill.destination_asset_id[0]) {
							this.transferIntoAssetStyle = {asset_name: this.editInitBill.destination_asset_id[0].asset_name};
						}
					}
					// 清洗editInitBill的asset_id和destination_asset_id，使其从array => string
					this.editInitBill.asset_id = this.editInitBill.asset_id[0]?._id ?? ''
					this.editInitBill.destination_asset_id = this.editInitBill.destination_asset_id[0]?._id ?? ''
					// 修改金额单位，从分转为元
					this.editInitBill.transfer_amount ? this.editInitBill.transfer_amount /= 100 : ''
					// console.log('editInitBill',this.editInitBill);
					// 修改keyboard的数据
					// 修改日期事件
					this.userChooseDate = uni.$u.timeFormat(this.editInitBill.bill_date, 'mm月dd日')
					// 修改备注 (通用部分)
					this.keyboardInfo.notes = this.editInitBill.bill_notes
					if(tab != 2) {
						// 如果是支出 和 收入 ，存入支出||收入表单信息
						this.expendOrIncomeInfo = uni.$u.deepClone(this.editInitBill)
						// 修改keyboard金额
						this.keyboardInfo.balance = this.editInitBill.bill_amount.toFixed(2)
						// 高亮选择的icon
						if(tab == 0) {
							this.currentExpendIndex = this.categoryIconListForExpend.findIndex(item => item.type === this.editInitBill.billStyle.type)
						} else {
							this.currentIncomeIndex = this.categoryIconListForIncome.findIndex(item => item.type === this.editInitBill.billStyle.type)
						}
					} else {
						// 如果是转账，存入转账表单信息
						this.transferAccountInfo = uni.$u.deepClone(this.editInitBill)
						// 填充转账金额和手续费
						this.keyboardInfo.balance = this.editInitBill.transfer_amount.toFixed(2)
						this.transferInfo.serviceCharge = this.editInitBill.bill_amount.toFixed(2)
						
						// 分离用户自定义备注
						const regex = /^([^-\n]+)/;
						const match = regex.exec(this.editInitBill.bill_notes);
						this.keyboardInfo.notes = match ? match[1].trim() : (this.editInitBill.bill_notes || '');
						
						// 填充转出账户的样式
						this.transferOutAssetStyle = Object.assign(this.transferOutAssetStyle, this.editInitBill.assetStyle)
						
						// 修复：通过ID从本地资产列表查找并填充转入账户信息和样式，确保信息完整
						const destinationAsset = this.userAssets.find(asset => asset._id === this.transferAccountInfo.destination_asset_id);
						if (destinationAsset) {
							this.transferIntoAssetStyle = {
								...(destinationAsset.assetStyle || {}), 
								asset_name: destinationAsset.asset_name || destinationAsset.assetStyle.title
							};
						}
					}
				}
				if(type === 'template' || type === 'templateEdit') {
					// 如果是添加或修改模板
					// 标记为 模板页面
					this.isTemplate = true
					if(type === 'templateEdit') {
						// 修改模板
						this.isTemplateEdit = true
						const temp = uni.getStorageSync('mj-user-temp-template')
						// 设置编辑模板的id
						this.templateEditId = temp._id
						await this.getTemp(temp)
						// 删除缓存的数据
						uni.removeStorage({
							key: 'mj-user-temp-template',
							success: () => {}
						})
					}
				}
			},
			clickTab({index}) {  // 0 支出  1 收入  2 转账
				// 如果点击的是当前所在tab,return
				if(this.currentTabIndex === index) return
				const tabs = [
					{ showExpend: true, showIncome: false, showTransferAccounts: false, bill_type : 0, category_type : 'dining', currentIncomeIndex: 0},
					{ showExpend: false, showIncome: true, showTransferAccounts: false, bill_type : 1, category_type : 'primary-income', currentExpendIndex: 0},
					{ showExpend: false, showIncome: false, showTransferAccounts: true, isSetRules: false},
				];
				Object.assign(this, tabs[index] || {});
				this.currentTabIndex = index
				// console.log(this.expendOrIncomeInfo);
			},
			// 点击分类-支出icon触发
			clickCategoryExpend(index) {
				if(this.currentExpendIndex === index) return
				// 高亮并给表单的 分类类型 赋值
				this.currentExpendIndex = index
				this.expendOrIncomeInfo.category_type = this.categoryIconListForExpend[index].type
			},
			// 点击分类-收入icon触发
			clickCategoryIncome(index) {
				if(this.currentIncomeIndex === index) return
				this.currentIncomeIndex = index
				this.expendOrIncomeInfo.category_type = this.categoryIconListForIncome[index].type
			},
			// 用户选择转入转出账户
			chooseTransferAsset(index) {
				this.userClickAsset = index
				this.showUserAssetsList = true
			},
			// 点击设置资产popup中的某一个资产
			clickOneAsset(asset) {
				// console.log('点击了资产列表',asset);
				// 1 隐藏pop框
				// 2 如果是 支出||收入 拿到资产id赋值给表单的 asset_id； 拿到assetStyle中title 渲染
				// 3 如果是转账， 用户点击转出账户，拿到资产id赋值给转账页表单的asset_id，拿到assetStyle渲染
				// 4 如果是转账， 用户点击转入账户，拿到资产id赋值给转账也表单的destination_asset_id，拿到assetStyle渲染
				this.showUserAssetsList = false
				if(this.showTransferAccounts) {
					if(!this.userClickAsset) {
						// 如果是转出
						this.transferAccountInfo.asset_id = asset._id
						this.transferOutAssetStyle = {...asset.assetStyle, asset_name: asset.asset_name}
					} else {
						this.transferAccountInfo.destination_asset_id = asset._id
						this.transferIntoAssetStyle = {...asset.assetStyle, asset_name: asset.asset_name}
					}
					return
				}
				this.expendOrIncomeInfo.asset_id = asset._id
				this.currentAssetTitle = asset.asset_name || asset.assetStyle.title
				// console.log(this.expendOrIncomeInfo);
			},
			
			
			
			// keyboard 相关方法
			
			chooseAsset() {
				this.showUserAssetsList = true
			},
			chooseDate() {
				this.showDatetimePicker = true
			},
			async chooseTemplate() { // 修改为 async
				// console.log('[DEBUG] chooseTemplate called');
				uni.showLoading({
					title: '加载模板...',
					mask: true
				});
				try {
					// 先获取最新的模板列表
					await this.getUserTemplate(); 
					// console.log('[DEBUG] chooseTemplate - after getUserTemplate, templateList length:', this.templateList.length);
					// console.log('[DEBUG] chooseTemplate - templateList content:', JSON.stringify(this.templateList));
					this.showTemplate = true;
				} catch (error) {
					// console.error("[DEBUG] chooseTemplate - getUserTemplate failed:", error);
					// 在 getUserTemplate 内部已经有 toast 提示，这里可能不需要重复
					// uni.showToast({ title: '模板加载失败', icon: 'none' });
				} finally {
					uni.hideLoading(); 
				}
			},
			// 用户选择的日期，返回值为时间戳（毫秒）
			getBillDate({value}) {
				this.showDatetimePicker = false
				// 1 用户选择日期点击确定
				// 2 不管是什么页面，时间戳同时赋值给相应表单的bill_date
				// 3 格式化时间  x月x日，赋值给 userChooseDate
				this.expendOrIncomeInfo.bill_date = value
				this.transferAccountInfo.bill_date = value
				this.userChooseDate = uni.$u.timeFormat(value, 'mm月dd日')
			},
			// keyboard被点击（不包含退格键） e:用户在键盘点击的字符
			tapKeyboard(e) {
				// 允许最大8位整数
				if(this.keyboardInfo.balance.length >= 9) {
					uni.showToast({
						title:"金额长度不能超过8位",
						icon: "none"
					})
					return
				}
				let balance = this.keyboardInfo.balance
				if(e === '保存') {
					// 使用节流，防止用户持续点击导致的重复增加账单
					this.throttleTapSaveBtn()
					return
				} else if (e === '再记') {
					// 再记：保存数据，上传数据库，更新资产缓存，并跳转到新的记一笔页面
					this.throttleAddAgain()
					return
				} else if (e === '.') {
					if(balance.indexOf('.') !== -1) return // 如果含有 .  return
					balance += e
				} else if (e === this.secondOneData?.second_name || e === this.secondTwoData?.second_name || e === '秒记1' || e === '秒记2') {
					// 秒记：1 查找是否有对应模板  2 使用该模板并保存
					this.throttleAddSecond(e)
					return
				} else {
					// 用户输入0-9
					if(balance === '0.00' || balance === '0') {
						balance = e
					}  else if (balance.endsWith('.',balance.length - 2)) {
						// 如果是 .xx形式，不继续添加
						return
					} else {
						balance += e
					}
				}
				// console.log('更新后的balance',balance);
				this.keyboardInfo.balance = balance.toString()
			},
			// 退格键被点击
			tapBackspace() {
				let balance = this.keyboardInfo.balance
				if(balance.length === 0) return 
				// 删除最后一个字符
				balance = balance.slice(0, -1)
				// console.log('更新后的balance',balance)
				this.keyboardInfo.balance = balance.toString()
			},
			// 用户点击再记触发
			addAgain() {
				if(this.pageType !== 'add') {
					uni.showToast({title: "再记只可以在添加账单时使用",icon: 'none'})
					return
				}
				uni.showLoading({
					title: '生成账单中',
					mask: true
				})
				this.isAddAgain = true
				this.tapSaveBtn()
			},
			// 用户点击保存按钮触发  判断类型，并触发相应逻辑
			async tapSaveBtn() {
				if(!uni.$u.test.amount(this.keyboardInfo.balance)) return
				// 在实际的保存操作前显示 Loading
				// 注意：具体的 hideLoading 和 showToast 应该在各自的 addOneBill, addOneTransfer 等方法中处理
				// 因为 tapSaveBtn 只是一个分发器

				if(this.isTemplate) {
					// 如果是添加或编辑模板
					// addOneTemplate 内部应处理 loading 和 toast
					await this.addOneTemplate() // 确保 addOneTemplate 是 async 并被 await
					return
				}
				if(this.isEdit) {
					// 如果是编辑账单
					// updateUserBill 内部应处理 loading 和 toast
					await this.updateUserBill() // 确保 updateUserBill 是 async 并被 await
					return
				}
				if(this.showTransferAccounts) {
					// addOneTransfer 内部应处理 loading 和 toast
					await this.addOneTransfer() // 确保 addOneTransfer 是 async 并被 await
					return
				}
				// addOneBill 内部应处理 loading 和 toast
				await this.addOneBill() // 确保 addOneBill 是 async 并被 await
			},
			// 添加支出||收入账单
			async addOneBill() {
				// 金额不能为0
				if(Number(this.keyboardInfo.balance) === 0) {
					uni.showToast({
						title:"请填写金额",
						icon:"none"
					})
					return
				}
				if(!this.expendOrIncomeInfo.asset_id) {
					uni.showToast({
						title:"请选择资产",
						icon:"none"
					})
					return
				}
				
				uni.showLoading({
					title: this.isAddAgain ? '生成账单中...' : '保存中...',
					mask: true
				});

				try {
					this.expendOrIncomeInfo.bill_amount = convertYuanToCent(this.keyboardInfo.balance)
					this.expendOrIncomeInfo.bill_notes = this.keyboardInfo.notes
					await db.collection("mj-user-bills").add({
						...this.expendOrIncomeInfo
					})
					// 如果为再记
					if(this.isAddAgain) {
						await this.upDateUserAssetBalance()
						// 更新资产缓存
						await this.getUserAssets()
						uni.hideLoading() // 在跳转前隐藏loading
						uni.showToast({ title: '账单已保存', icon: 'success', duration: 1500 });
						setTimeout(() => {
							uni.navigateTo({
								url:'/pagesAccount/make-an-account/make-an-account?from=addAgain&timestamp=' + Date.now()
							})
							this.isAddAgain = false; // 重置再记状态
						}, 1500);
						return
					}
					await this.upDateUserAssetBalance()
					
					uni.hideLoading();
					uni.showToast({
						title: '账单已保存',
						icon: 'success',
						duration: 2000
					});
					// 弹出订阅消息
					this.subDayNotification()
					
					// 检查预算提醒 (在显示 Toast 和导航之前)
					if (this.expendOrIncomeInfo.bill_type === 0) { // 仅支出类型检查
						await this.checkBudgetAfterSave(this.expendOrIncomeInfo.bill_amount, this.expendOrIncomeInfo.bill_type);
					}
					
					// 如果是收入，处理存钱目标
					if (this.expendOrIncomeInfo.bill_type === 1) {
						await this.processSavingGoalsAfterIncome(this.expendOrIncomeInfo.bill_amount);
					}
					
					// 确保所有新增账单操作后都通知提醒页面更新
					uni.$emit('savingGoalsMightUpdate');
					
					setTimeout(() => {
						uni.switchTab({
							url:"/pages/index/index"
						})
					}, 2000);
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: '保存失败，请重试',
						icon: 'none'
					});
					console.error("addOneBill error:", error);
				}
			},
			
			// 添加转账账单
			// 1 验证手续费格式
			// 2 验证转出转入账户是否都存在，并且不相同
			// 3 存入bill_amount，存入keyboard信息，金额不准为0
			async addOneTransfer() {
				// 表单验证失败返回false，成功返回true
				const flag = await this.validatorTransferInfo()
				if(!flag) return
				
				uni.showLoading({
					title: this.isAddAgain ? '生成账单中...' : '保存中...',
					mask: true
				});

				try {
					this.transferAccountInfo.bill_amount = convertYuanToCent(this.transferInfo.serviceCharge)
					this.transferAccountInfo.bill_notes = this.keyboardInfo.notes
					this.transferAccountInfo.transfer_amount = convertYuanToCent(this.keyboardInfo.balance)
					// 组合备注
					const transferOutAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.asset_id)
					const transferOutTitle = transferOutAsset.asset_name || transferOutAsset.assetStyle.title
					const transferInAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.destination_asset_id)
					const transferInTitle = transferInAsset.asset_name || transferInAsset.assetStyle.title
					this.transferAccountInfo.bill_notes = `${this.transferAccountInfo.bill_notes + '-'}${transferOutTitle}转出至${transferInTitle},手续费${this.transferAccountInfo.bill_amount / 100}元`
					await db.collection("mj-user-bills").add({...this.transferAccountInfo})
					// 如果为再记
					if(this.isAddAgain) {
						await this.upDateUserTwoAssetBalance()
						// 更新资产缓存
						await this.getUserAssets()
						uni.hideLoading() // 在跳转前隐藏loading
						uni.showToast({ title: '账单已保存', icon: 'success', duration: 1500 });
						// 再记时也检查预算
						await this.checkBudgetAfterSave(this.transferAccountInfo.bill_amount, 2);
						setTimeout(() => {
							uni.navigateTo({
								url:'/pagesAccount/make-an-account/make-an-account?from=addAgain&timestamp=' + Date.now()
							})
							this.isAddAgain = false; // 重置再记状态
						}, 1500);
						return
					}
					await this.upDateUserTwoAssetBalance()
					
					uni.hideLoading();
					uni.showToast({
						title: '账单已保存',
						icon: 'success',
						duration: 2000
					});
					// 弹出订阅消息
					this.subDayNotification()
					
					// 检查预算
					await this.checkBudgetAfterSave(this.transferAccountInfo.bill_amount, 2);

					// 确保所有新增账单操作后都通知提醒页面更新
					uni.$emit('savingGoalsMightUpdate');

					setTimeout(() => {
						uni.switchTab({
							url:"/pages/index/index"
						})
					}, 2000);
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: '保存失败，请重试',
						icon: 'none'
					});
					console.error("addOneTransfer error:", error);
				}
			},
			// 转账账单表单验证
			async validatorTransferInfo() {
				if(!this.isSetRules) {
					// console.log('setRules', this.$refs)
					this.$refs.uForm.setRules(this.rules)
					this.isSetRules = true
				}
				let flag = false
				// 如果手续费是0 不走验证，如果是其他，走验证
				this.transferInfo.serviceCharge == 0 ? '' : flag = true
				if(flag) {
					// 验证成功则继续执行，验证失败中断执行
					try{
						await this.$refs.uForm.validate()
					}catch(e){
						return false
					}
				}
				if(!this.transferAccountInfo.asset_id || !this.transferAccountInfo.destination_asset_id) {
					// console.log('有资产没填');
					uni.showToast({
						title:"请填入账户",
						icon:"none"
					})
					return false
				}
				if(this.transferAccountInfo.asset_id === this.transferAccountInfo.destination_asset_id) {
					uni.showToast({
						title:"存在相同账户",
						icon:"none"
					})
					return false
				}
				if(Number(this.keyboardInfo.balance) === 0) {
					uni.showToast({
						title:"请填写转账金额",
						icon:"none"
					})
					return false
				}
				return true
			},
			
			
			// 更新用户资产金额   0  支出    1  收入
			async upDateUserAssetBalance() {
				let assetBalance = this.userAssets.find(item => item._id === this.expendOrIncomeInfo.asset_id).asset_balance
				assetBalance = convertYuanToCent(assetBalance)  // 转换单位为分
				// console.log(assetBalance);
				// console.log('bill_type',this.expendOrIncomeInfo.bill_type);
				if(this.expendOrIncomeInfo.bill_type === 0) {
					const asset_balance = assetBalance - this.expendOrIncomeInfo.bill_amount
					await db.collection("mj-user-assets").doc(this.expendOrIncomeInfo.asset_id).update({
						asset_balance
					})
				} else {
					const asset_balance = assetBalance + this.expendOrIncomeInfo.bill_amount
					await db.collection("mj-user-assets").doc(this.expendOrIncomeInfo.asset_id).update({
						asset_balance
					})
				}
				// uni.$emit('updateBillsList')
				uni.$emit('updateMonthlyBillBalance')
				// 等待资产异步更新完成
				if (!this.isAddAgain) { // 如果不是"再记"，则触发首页资产更新（不等待）
				    this.asyncEmitUpdateAssets();
				}
			},
			// 更新用户 转出与转入 资产金额
			async upDateUserTwoAssetBalance() {
				let transferOutAssetBalance = this.userAssets.find(item => item._id === this.transferAccountInfo.asset_id).asset_balance
				let transferIntoAssetBalance = this.userAssets.find(item => item._id === this.transferAccountInfo.destination_asset_id).asset_balance
				
				transferOutAssetBalance = convertYuanToCent(transferOutAssetBalance)  // 转换单位为分
				transferIntoAssetBalance = convertYuanToCent(transferIntoAssetBalance)  // 转换单位为分
				// 转出资产余额 = 转出资产余额 - 手续费 - 转账金额  注意单位为分
				transferOutAssetBalance = transferOutAssetBalance - this.transferAccountInfo.bill_amount - this.transferAccountInfo.transfer_amount
				// 转入资产余额 = 转入资产余额 + 转账金额
				transferIntoAssetBalance = transferIntoAssetBalance + this.transferAccountInfo.transfer_amount
				// 更新
				await db.collection("mj-user-assets").doc(this.transferAccountInfo.asset_id).update({
					asset_balance: transferOutAssetBalance
				})
				await db.collection("mj-user-assets").doc(this.transferAccountInfo.destination_asset_id).update({
					asset_balance: transferIntoAssetBalance
				})
				// uni.$emit('updateBillsList')
				uni.$emit('updateMonthlyBillBalance')
				// 等待资产异步更新完成
				if (!this.isAddAgain) { // 如果不是"再记"，则触发首页资产更新（不等待）
				    this.asyncEmitUpdateAssets();
				}
			},
			
			
			// 编辑账单相关方法
			// 更新用户账单bill
			async updateUserBill() {
				uni.showLoading({
					title: '更新中...',
					mask: true
				});
				try {
					let billTypeToCheck = -1;
					let amountToCheck = 0;

					// 1 判断用户支出||收入||转账
					// 2 进行表单验证
					// 3 验证通过，更新bill，并更新资产
					if(this.showTransferAccounts) {
						// 类型为转账
						const hasAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.asset_id) ?? 'none'
						if(hasAsset === 'none') {
							uni.hideLoading();
							uni.showToast({
								title:"请更新资产",
								icon:"none"
							})
							return;
						}
						const flag = await this.validatorTransferInfo()
						if(!flag) {
							uni.hideLoading();
							return;
						}
						this.transferAccountInfo.bill_amount = convertYuanToCent(this.transferInfo.serviceCharge)
						this.transferAccountInfo.bill_notes = this.keyboardInfo.notes
						this.transferAccountInfo.transfer_amount = convertYuanToCent(this.keyboardInfo.balance)
						
						// 修复：更新时重新组合备注，以反映任何修改
						const transferOutAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.asset_id)
						const transferOutTitle = transferOutAsset?.asset_name || transferOutAsset?.assetStyle.title || '未知账户'
						const transferInAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.destination_asset_id)
						const transferInTitle = transferInAsset?.asset_name || transferInAsset?.assetStyle.title || '未知账户'
						this.transferAccountInfo.bill_notes = `${transferOutTitle}转出至${transferInTitle},手续费${parseFloat(this.transferInfo.serviceCharge).toFixed(2) || 0}元`
						
						await db.collection("mj-user-bills").doc(this.editInitBill._id).update({
							asset_id: this.transferAccountInfo.asset_id,
							bill_amount: this.transferAccountInfo.bill_amount, // 手续费
							bill_date: this.transferAccountInfo.bill_date,
							bill_notes: this.transferAccountInfo.bill_notes,
							bill_type: 2,
							category_type: 'transfer',
							destination_asset_id: this.transferAccountInfo.destination_asset_id,
							transfer_amount: this.transferAccountInfo.transfer_amount // 转账金额
						})
						await this.updateInitAssetsBalance() // 返还初始资产
						await this.upDateUserTwoAssetBalance() // 更新涉及的两个新资产
						
						billTypeToCheck = 2;
						amountToCheck = this.transferAccountInfo.bill_amount; // 仅手续费计入预算
					} else {
						// 类型为支出 || 收入
						const hasAsset = this.userAssets.find(item => item._id === this.expendOrIncomeInfo.asset_id) ?? 'none'
						if(hasAsset === 'none') {
							uni.hideLoading();
							uni.showToast({
								title:"请更新资产",
								icon:"none"
							})
							return;
						}
						if(Number(this.keyboardInfo.balance) === 0) {
							uni.hideLoading();
							uni.showToast({
								title:"请填写金额",
								icon:"none"
							})
							return;
						}
						this.expendOrIncomeInfo.bill_amount = convertYuanToCent(this.keyboardInfo.balance)
						this.expendOrIncomeInfo.bill_notes =this.keyboardInfo.notes
						await db.collection("mj-user-bills").doc(this.editInitBill._id).update({
							asset_id: this.expendOrIncomeInfo.asset_id,
							bill_amount: this.expendOrIncomeInfo.bill_amount,
							bill_date: this.expendOrIncomeInfo.bill_date,
							bill_notes: this.expendOrIncomeInfo.bill_notes,
							bill_type: this.expendOrIncomeInfo.bill_type,
							category_type: this.expendOrIncomeInfo.category_type,
							transfer_amount: 0, // 非转账类型，transfer_amount 为0 或 null
							destination_asset_id: null // 非转账类型，清空此字段
						})
						await this.updateInitAssetsBalance() // 返还初始资产
						await this.upDateUserAssetBalance() // 更新涉及的一个新资产
						
						billTypeToCheck = this.expendOrIncomeInfo.bill_type;
						amountToCheck = this.expendOrIncomeInfo.bill_amount;
					}
					
					// 统一在此处检查预算
					if (billTypeToCheck === 0 || billTypeToCheck === 2) { // 支出和转账手续费需要检查预算
						await this.checkBudgetAfterSave(amountToCheck, billTypeToCheck);
					}

					// 如果是收入，处理存钱目标
					if (this.expendOrIncomeInfo.bill_type === 1) {
						await this.processSavingGoalsAfterIncome(this.expendOrIncomeInfo.bill_amount);
					}
					
					// 确保所有编辑账单操作后都通知提醒页面更新
					uni.$emit('savingGoalsMightUpdate');

					uni.hideLoading();
					uni.showToast({
						title: '账单已更新',
						icon: 'success',
						duration: 2000
					});
					setTimeout(() => {
						uni.switchTab({
							url:"/pages/index/index"
						})
					}, 2000);
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: '更新失败，请重试',
						icon: 'none'
					});
					console.error("updateUserBill error:", error);
				}
			},
			// 返还用户初始资产金额  1 判断用户初始资产类型 0 支出 1 收入 2转账
			async updateInitAssetsBalance() {
				if(this.editInitBill.bill_type == 2) {
					// 返还 转入转出账户的余额
					let transferOutAssetBalance = this.userAssets.find(item => item._id === this.editInitBill.asset_id)?.asset_balance ?? 'none'
					let transferIntoAssetBalance = this.userAssets.find(item => item._id === this.editInitBill.destination_asset_id)?.asset_balance ?? 'none'
					// console.log('transferIntoAssetBalance',transferIntoAssetBalance);
					// 转换单位为分
					const bill_amount = convertYuanToCent(this.editInitBill.bill_amount)
					const transfer_amount = convertYuanToCent(this.editInitBill.transfer_amount)
					
					// 返还规则：用户账单对应资产没有被用户删除时，进行返还，如果删除了，不返还
					if(transferOutAssetBalance !== 'none') {
						transferOutAssetBalance = convertYuanToCent(transferOutAssetBalance)
						// 返还转出资产余额 = 转出资产余额 + 手续费 + 转账金额  注意单位为分
						transferOutAssetBalance = transferOutAssetBalance +bill_amount + transfer_amount
						// 更新
						await db.collection("mj-user-assets").doc(this.editInitBill.asset_id).update({
							asset_balance: transferOutAssetBalance
						})
						// console.log("返还转出账户");
						// 单位为元  更新用户资产列表的对应资产金额，以便后续 更新用户资产计算金额使用
						this.userAssets.find(item => item._id === this.editInitBill.asset_id).asset_balance += this.editInitBill.bill_amount + this.editInitBill.transfer_amount
					}
					if(transferIntoAssetBalance !== 'none') {
						transferIntoAssetBalance = convertYuanToCent(transferIntoAssetBalance)
						// 返还转入资产余额 = 转入资产余额 - 转账金额
						transferIntoAssetBalance = transferIntoAssetBalance - transfer_amount
						await db.collection("mj-user-assets").doc(this.editInitBill.destination_asset_id).update({
							asset_balance: transferIntoAssetBalance
						})
						// console.log("返还转入账户");
						this.userAssets.find(item => item._id === this.editInitBill.destination_asset_id).asset_balance -= this.editInitBill.transfer_amount
					}
					
				} else {
					// 返还 账户的余额
					// 如果初始bill中资产id找不到 为none，则不用返还
					let assetBalance = this.userAssets.find(item => item._id === this.editInitBill.asset_id)?.asset_balance ?? 'none'
					if(assetBalance === 'none') return
					// console.log("返还");
					assetBalance = convertYuanToCent(assetBalance)  // 转换单位为分
					const bill_amount = convertYuanToCent(this.editInitBill.bill_amount)
					if(this.editInitBill.bill_type == 0) {
						const asset_balance = assetBalance + bill_amount
						await db.collection("mj-user-assets").doc(this.editInitBill.asset_id).update({
							asset_balance
						})
						// 单位为元  更新用户资产列表的对应资产金额，以便后续 更新用户资产计算金额使用
						this.userAssets.find(item => item._id === this.editInitBill.asset_id).asset_balance += this.editInitBill.bill_amount
					} else {
						const asset_balance = assetBalance - bill_amount
						await db.collection("mj-user-assets").doc(this.editInitBill.asset_id).update({
							asset_balance
						})
						// 单位为元
						this.userAssets.find(item => item._id === this.editInitBill.asset_id).asset_balance -= this.editInitBill.bill_amount
					}
				}
			},
			/** 添加模板相关方法 */
			async addOneTemplate() {
				uni.showLoading({
					title: this.isTemplateEdit ? '更新模板中...' : '保存模板中...',
					mask: true
				});
				try {
					// 1 判断用户支出||收入||转账
					// 2 进行表单验证
					// 3 验证通过，保存模板，并回到上一页
					if(!this.showTransferAccounts) {
						// ... (省略验证逻辑 - 假设它们会 showToast 并 return) ...
						if(Number(this.keyboardInfo.balance) === 0) {
							uni.showToast({ title:"请填写金额", icon:"none" });
							uni.hideLoading(); return;
						}
						if(!this.expendOrIncomeInfo.asset_id) {
							uni.showToast({ title:"请选择资产", icon:"none" });
							uni.hideLoading(); return;
						}
						this.expendOrIncomeInfo.bill_amount = convertYuanToCent(this.keyboardInfo.balance)
						this.expendOrIncomeInfo.bill_notes = this.keyboardInfo.notes
						const {asset_id,bill_amount,bill_notes,bill_type,category_type} = this.expendOrIncomeInfo
						const res = await db.collection("mj-user-templates").add({
							asset_id,bill_amount,bill_notes,bill_type,category_type
						})
						// 如果秒记id不为空，即修改的模板有对应绑定的秒记
						if (this.secondId) {
							// 更新秒记的模板id
							const templateId = res.result.id
							await this.updateSecondTempId(this.secondId, templateId)
						}
					} else {
						// 类型为转账
						// ... (省略验证逻辑 - 假设 validatorTransferInfo 会 showToast 并 return false) ...
						const flag = await this.validatorTransferInfo()
						if(!flag) {
							uni.hideLoading(); // validatorTransferInfo 内部有 toast
							return;
						}
						this.transferAccountInfo.bill_amount = convertYuanToCent(this.transferInfo.serviceCharge)
						this.transferAccountInfo.bill_notes = this.keyboardInfo.notes
						this.transferAccountInfo.transfer_amount = convertYuanToCent(this.keyboardInfo.balance)
						// ... (组合备注) ...
						const transferOutAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.asset_id)
						const transferOutTitle = transferOutAsset.asset_name || transferOutAsset.assetStyle.title
						const transferInAsset = this.userAssets.find(item => item._id === this.transferAccountInfo.destination_asset_id)
						const transferInTitle = transferInAsset.asset_name || transferInAsset.assetStyle.title
						this.transferAccountInfo.bill_notes = `${this.transferAccountInfo.bill_notes + '-'}${transferOutTitle}转出至${transferInTitle},手续费${this.transferAccountInfo.bill_amount / 100}元`
						const {asset_id,bill_amount,bill_notes,bill_type,category_type,destination_asset_id,transfer_amount} = this.transferAccountInfo
						const res = await db.collection("mj-user-templates").add({asset_id, bill_amount, bill_type, category_type, destination_asset_id, transfer_amount, bill_notes})
						// 如果秒记id不为空，即修改的模板有对应绑定的秒记
						if (this.secondId) {
							// 更新秒记的模板id
							const templateId = res.result.id
							await this.updateSecondTempId(this.secondId, templateId)
						}
					}
					uni.hideLoading();
					uni.showToast({
						title: this.isTemplateEdit ? '模板已更新' : '模板已保存',
						icon: 'success',
						duration: 1500
					});
					setTimeout(() => {
						uni.navigateBack()
					}, 1500);
				} catch (error) {
					uni.hideLoading();
					uni.showToast({
						title: this.isTemplateEdit ? '模板更新失败' : '模板保存失败',
						icon: 'none'
					});
					console.error("addOneTemplate error:", error);
				}
			},
			// 点击添加模板按钮
			goTemplatePage() {
				uni.navigateTo({
					url: `/pagesAccount/make-an-account/make-an-account?type=template`
				})
				this.showTemplate = false
			},
			// 获取用户的模板
			async getUserTemplate() {
				// console.log('[DEBUG] getUserTemplate called'); // 已被注释或移除
				try {
					const temp = db.collection('mj-user-templates').where('user_id == $cloudEnv_uid').orderBy('template_creation_date desc').getTemp()
					const userAssets = db.collection("mj-user-assets").where('user_id == $cloudEnv_uid').field('_id,asset_type,user_id,asset_name').getTemp()
					const res = await db.collection(temp, userAssets).get()
					// console.log('[DEBUG] getUserTemplate - raw response from DB:', JSON.stringify(res)); // 已被注释或移除
					if (res.result && res.result.data) {
						this.templateList = res.result.data;
						// console.log('[DEBUG] getUserTemplate - success, templateList length:', this.templateList.length); // 已被注释或移除
					} else {
						this.templateList = []; // 确保是数组
						// console.warn('[DEBUG] getUserTemplate - no data in response or bad format, res:', res); // 已被注释或移除
					}
				} catch (error) {
					this.templateList = []; // 确保是数组
					console.error("[SYSTEM] getUserTemplate error:", error); // 保留错误日志
					uni.showToast({ title: '模板加载失败', icon: 'none' });
				}
			},
			// 点击模板卡片||编辑模板 触发，获取用户点击的模板数据，并赋值
			async getTemp(temp) { // 修改为 async，并添加加载框
				// console.log('[DEBUG] make-an-account: getTemp called with temp object:', JSON.stringify(temp));
				uni.showLoading({ title: '应用模板...', mask: true });
				try {
					const {bill_type, category_type, bill_notes, bill_amount, asset_id, hasAsset, transfer_amount, hasDestinationAsset, destination_asset_id} = temp;
					// console.log(`[DEBUG] make-an-account:getTemp - Destructured data: bill_type=${bill_type}, category_type=${category_type}, notes=${bill_notes}, bill_amount=${bill_amount} (raw from temp), transfer_amount=${transfer_amount} (raw from temp)`);

					// 触发clickTab事件，index为bill_type
					// console.log(`[DEBUG] make-an-account:getTemp - About to call clickHandler for bill_type: ${bill_type}`);
					await new Promise(resolve => {
						this.$nextTick(() => {
							if (this.$refs.tabs && typeof this.$refs.tabs.clickHandler === 'function') {
								this.$refs.tabs.clickHandler({},bill_type);
								// console.log(`[DEBUG] make-an-account:getTemp - clickHandler called for bill_type: ${bill_type}`);
							} else {
								console.error('[SYSTEM] make-an-account:getTemp - $refs.tabs or clickHandler not available.'); // 保留错误日志
							}
							resolve();
						})
					});
					// console.log(`[DEBUG] make-an-account:getTemp - After clickHandler. Current tab state: showExpend=${this.showExpend}, showIncome=${this.showIncome}, showTransferAccounts=${this.showTransferAccounts}`);

					if(bill_type !== 2) { // 支出||收入模板
						// console.log('[DEBUG] make-an-account:getTemp - Applying non-transfer template.');
						this.expendOrIncomeInfo.bill_type = bill_type;
						this.expendOrIncomeInfo.category_type = category_type;
						// console.log(`[DEBUG] make-an-account:getTemp - expendOrIncomeInfo updated: bill_type=${this.expendOrIncomeInfo.bill_type}, category_type=${this.expendOrIncomeInfo.category_type}`);

						if(bill_type === 0) {
							const index = this.categoryIconListForExpend.findIndex(item => item.type === category_type);
							this.currentExpendIndex = index;
							// console.log(`[DEBUG] make-an-account:getTemp - currentExpendIndex set to: ${index}`);
						} else {
							const index = this.categoryIconListForIncome.findIndex(item => item.type === category_type);
							this.currentIncomeIndex = index;
							// console.log(`[DEBUG] make-an-account:getTemp - currentIncomeIndex set to: ${index}`);
						}
						this.keyboardInfo.notes = bill_notes;
						this.keyboardInfo.balance = (temp.bill_amount).toFixed(2); 
						// console.log(`[DEBUG] make-an-account:getTemp - keyboardInfo updated: notes=${this.keyboardInfo.notes}, balance=${this.keyboardInfo.balance}`);

						if(hasAsset && asset_id && asset_id[0]) {
							this.expendOrIncomeInfo.asset_id = asset_id[0]._id;
							this.currentAssetTitle = asset_id[0].asset_name || temp.assetStyle.title;
							// console.log(`[DEBUG] make-an-account:getTemp - Asset applied: id=${this.expendOrIncomeInfo.asset_id}, title=${this.currentAssetTitle}`);
						} else {
							this.expendOrIncomeInfo.asset_id = '';
							this.currentAssetTitle = '资产已删除';
							// console.log('[DEBUG] make-an-account:getTemp - Asset was deleted or not available.');
						}
					} else { // 转账模板
						// console.log('[DEBUG] make-an-account:getTemp - Applying transfer template.');
						const regex = /^([^-\n]+)/;
						const match = regex.exec(bill_notes);
						this.keyboardInfo.notes = match ? match[1] : '';
						
						this.keyboardInfo.balance = (temp.transfer_amount).toFixed(2); 
						this.transferInfo.serviceCharge = (temp.bill_amount).toFixed(2); 
						// console.log(`[DEBUG] make-an-account:getTemp - Transfer keyboardInfo: notes=${this.keyboardInfo.notes}, balance=${this.keyboardInfo.balance}`);
						// console.log(`[DEBUG] make-an-account:getTemp - Transfer serviceCharge: ${this.transferInfo.serviceCharge}`);

						if(hasAsset && asset_id && asset_id[0]) {
							this.transferAccountInfo.asset_id = asset_id[0]._id;
							this.transferOutAssetStyle = {...temp.assetStyle, asset_name: asset_id[0].asset_name};
							// console.log(`[DEBUG] make-an-account:getTemp - Transfer Out Asset: id=${this.transferAccountInfo.asset_id}, name=${asset_id[0].asset_name}`);
						}
						if(hasDestinationAsset && destination_asset_id && destination_asset_id[0]) {
							this.transferAccountInfo.destination_asset_id = destination_asset_id[0]._id;
							this.transferIntoAssetStyle = {...temp.destinationAssetStyle, asset_name: destination_asset_id[0].asset_name};
							// console.log(`[DEBUG] make-an-account:getTemp - Transfer In Asset: id=${this.transferAccountInfo.destination_asset_id}, name=${destination_asset_id[0].asset_name}`);
						}
					}
					this.showTemplate = false;
					// console.log('[DEBUG] make-an-account:getTemp - Template applied, popup closed.');
				} catch (error) {
					console.error("[SYSTEM] getTemp error:", error); // 保留错误日志
					uni.showToast({ title: '模板应用失败', icon: 'none' });
				} finally {
					uni.hideLoading();
				}
				this.showTemplate = false
			},
			/** 再记相关方法 */
			// 再记使用：更新用户资产列表，并存入缓存
			async getUserAssets() {
				// console.log("getUserAssets");
				const res = await db.collection("mj-user-assets").where(" user_id == $cloudEnv_uid ").get()
				const userAssetsTemp = res.result.data
				// 统一修改金额
				userAssetsTemp.forEach(item => item.asset_balance /= 100)
				// 保存在缓存中
				uni.setStorageSync('mj-user-assets', userAssetsTemp)
			},
			/** 秒记相关方法 */
			async getUserSeconds() {
				// 移除独立的 loading，由调用方管理
				// uni.showLoading({ title: '获取秒记...', mask: true }); 
				try {
					const res = await db.collection('mj-user-seconds').where('user_id == $cloudEnv_uid').get()
					res.result.data.forEach(item => {
						if (item.second_type === 1) {
							this.secondOneData = item
						} 
						if (item.second_type === 2) {
							this.secondTwoData = item
						}
					})
				} catch (error) {
					console.error("getUserSeconds error:", error);
					uni.showToast({ title: '秒记信息加载失败', icon: 'none' });
				} finally {
					// uni.hideLoading(); // 移除
				}
			},
			async addSecond(secondName) { // 修改为 async
				// 判断是否为新增账单，若不是则return
				if (this.pageType !== 'add') {
					uni.showToast({
						icon: 'none',
						title: "秒记只可以在添加账单时使用"
					})
					return
				}
				// 使用计算属性来获取最新的秒记名称
				const sOneName = this.keyboardSecondOneName;
				const sTwoName = this.keyboardSecondTwoName;

				if (secondName === sOneName) {
					const index = this.templateList.findIndex(item => item._id === this.secondOneData?.template_id)
					if (index !== -1) {
						// 格式化模板
						const temp = formatOneTemplate(this.templateList[index])
						await this.getTemp(temp) // 等待模板应用
						await this.tapSaveBtn() // 等待保存
					} else {
						uni.showToast({
							icon: 'none',
							title: '未找到绑定的模板'
						})
					}
				} else if (secondName === sTwoName) { // 明确比较，避免与默认值混淆
					const index = this.templateList.findIndex(item => item._id === this.secondTwoData?.template_id)
					if (index !== -1) {
						// 格式化模板
						const temp = formatOneTemplate(this.templateList[index])
						await this.getTemp(temp) // 等待模板应用
						await this.tapSaveBtn() // 等待保存
					} else {
						uni.showToast({
							icon: 'none',
							title: '未找到绑定的模板'
						})
					}
				} else {
					// 如果传入的secondName与当前实际的秒记名称不符，可能是一个旧的缓存或默认值
					// 这种情况理论上不应该发生，如果发生了，提示用户
					console.warn("[DEBUG] addSecond: secondName mismatch - received:", secondName, "expected sOne:", sOneName, "or sTwo:", sTwoName);
					uni.showToast({
						icon: 'none',
						title: '秒记数据可能已更新，请重试'
					});
				}
			},
			// 异步更新资产
			async asyncEmitUpdateAssets() {
				return new Promise((resolve) => {
					uni.$emit('updateAssetsList', {resolve})
				})
			},
			// 更新秒记的模板id
			async updateSecondTempId(secondId, tempId) {
				await db.collection('mj-user-seconds').doc(secondId).update({template_id: tempId})
			},
			// 订阅每日记账提醒
			subDayNotification() {
				subscribeMessage(['n2kSsJNErg1EWpRrKqTDz2yZvyqC-LH7pLmudAsWNDE'])
			},
			// 保存账单后检查预算是否超限
			async checkBudgetAfterSave(billAmount, billType) {
				console.log('Checking budget after save:', billAmount, billType);
				// billType 0:支出, 1:收入, 2:转账手续费. 收入不参与预算检查
				if (billType === 1) { // 收入不参与预算超限判断
					return;
				}

				try {
					const currentMonth = uni.$u.timeFormat(Date.now(), 'yyyy-mm');
					const budgetRes = await db.collection('pockfi-user-budgets')
						.where(`user_id == $cloudEnv_uid && budget_month == "${currentMonth}"`)
						.limit(1)
						.get();

					if (budgetRes.result.data.length === 0 || !budgetRes.result.data[0].is_enabled) {
						console.log('当月无预算或预算未启用');
						return; // 没有预算或预算未启用
					}

					const budgetSettings = budgetRes.result.data[0];
					const budgetAmount = budgetSettings.budget_amount; // 单位：分
					const warningThreshold = budgetSettings.warning_threshold; // 百分比, e.g., 80

					// 获取本月总支出 (包括刚刚保存的这笔)，查询支出(0)和转账手续费(2)
					const expenseRes = await db.collection("mj-user-bills")
						.where(`user_id == $cloudEnv_uid && dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${currentMonth}" && bill_type in [0, 2]`)
						.groupBy('user_id')
						.groupField('sum(bill_amount) as total_expense')
						.get();
					
					let totalMonthlyExpense = 0;
					if(expenseRes.result.data.length > 0){
						totalMonthlyExpense = expenseRes.result.data[0].total_expense || 0;
					}
					
					console.log(`本月总支出: ${totalMonthlyExpense / 100}, 预算金额: ${budgetAmount / 100}, 阈值: ${warningThreshold}%`);

					if (budgetAmount > 0 && (totalMonthlyExpense / budgetAmount * 100) >= warningThreshold) {
						uni.showModal({
							title: '预算提醒',
							content: `您本月的支出已达到预算的 ${warningThreshold}%，请注意理性消费。`,
							showCancel: false,
							confirmText: '我知道了'
						});
					}
				} catch (error) {
					console.error('检查预算提醒失败:', error);
				}
			},
			// 处理收入记账后的存钱目标逻辑
			async processSavingGoalsAfterIncome(incomeAmountInCents) {
				if (incomeAmountInCents <= 0) return;

				try {
					const goalsRes = await db.collection('pockfi-user-saving-goals')
						.where({
							user_id: db.env.uid,
							is_completed: false,
							is_enabled: true
						})
						.get();

					if (goalsRes.result.data.length === 0) {
						return; // 没有进行中的存钱目标
					}

					const activeGoals = goalsRes.result.data;
					let completedGoalNamesThisTime = [];

					for (const goal of activeGoals) {
						const newCurrentAmount = (goal.current_amount || 0) + incomeAmountInCents;
						let updateData = {
							current_amount: newCurrentAmount
						};

						if (newCurrentAmount >= goal.target_amount) {
							updateData.is_completed = true;
							updateData.completion_date = Date.now();
							updateData.completion_shown_to_user = true; // 在记账页提示后，标记为已展示
							completedGoalNamesThisTime.push(goal.goal_name);
						}
						
						try {
							await db.collection('pockfi-user-saving-goals').doc(goal._id).update(updateData);
						} catch (updateError) {
							console.error(`更新存钱目标 ${goal._id} 失败: `, updateError);
							// 单个目标更新失败不应阻塞其他目标或整体流程，但需要记录错误
						}
					}

					if (completedGoalNamesThisTime.length > 0) {
						uni.showModal({
							title: '恭喜！目标达成！',
							content: `您的存钱目标: "${completedGoalNamesThisTime.join('", "')}" 已成功达成！`,
							showCancel: false,
							confirmText: '太棒了'
						});
					}
				} catch (error) {
					console.error('处理存钱目标失败:', error);
					// 这里不向用户显示toast，避免干扰记账成功的主流程
				}
			}
		},
		// 新增onBackPress生命周期函数
		onBackPress(options) {
		    if (this.navigatedFromAddAgain && !this.isNavigatingToHome) {
		        // options.from 的值有 'backbutton'、'navigateBack'
		        if (options.from === 'backbutton' || options.from === 'navigateBack') {
		            this.isNavigatingToHome = true; // 设置状态锁，防止重复执行
		            uni.switchTab({
		                url: '/pages/index/index',
		                complete: () => {
		                    // 可选：如果需要，在跳转完成后重置状态锁，但对于switchTab通常不需要
		                    // this.isNavigatingToHome = false; 
		                }
		            });
		            return true; // 返回true表示拦截默认返回行为
		        }
		    }
		    this.isNavigatingToHome = false; // 如果未处理或允许默认行为，重置状态锁
		    return false; // 返回false表示不拦截默认返回行为（继续执行返回栈）
		}
	}
</script>

<style lang="scss" scoped>
	.keep-accounts {
		.header-tabs {
			position: fixed;
			top: 0;
			width: 100%;
			height: 80rpx;
			background-color: $mj-theme-color;
			display: flex;
			justify-content: center;
			z-index: 99;
		}

		.icon-grid {
			box-sizing: border-box;
			padding: 48rpx;
			margin-top: 80rpx;
			margin-bottom: 568rpx;
			.content {
				padding-bottom: 14px;

				.grid-item {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					width: 148rpx;
					height: 124rpx;
					color: $mj-text-color;
					.icon {
						width: 80rpx;
						height: 80rpx;
						background-color: #f1f1f1;
						border-radius: 50%;
						display: flex;
						justify-content: center;
						align-items: center;
					}
					.grid-text {
						font-size: 28rpx;
					}
				}
			}
			.transfer-accounts {
				.asset-card {
					display: flex;
					justify-content: space-between;
					align-items: center;
					background-color: #f1f1f1;
					border-radius: 20px;
					height: 80rpx;
					box-sizing: border-box;
					padding: 0 20px;
					margin-bottom: 32rpx;
					.left {
						display: flex;
						justify-content: flex-start;
						align-items: center;
						.left-icon {
							margin-right: 10px;
						}
					}
				}
			}
		}
		// 用户资产列表样式 25.5.15修改
		.user-assets-list {
			display: flex;
			flex-direction: column;
			max-height: 80vh;
			box-sizing: border-box;
			padding: 10px;
			background-color: $mj-bg-color;
			overflow: hidden;
			border-radius: 20px;
			.top {
				display: flex;
				justify-content: flex-end;
				align-items: center;
				padding-bottom: 10px;
				.add {
					color: $mj-text-color;
					font-size: 24rpx;
					box-sizing: border-box;
					padding: 4px 8px;
					border-bottom: 2px solid $mj-theme-color;
				}
			}

			.content {
				flex: 1;
				overflow-y: auto;
				min-height: 300rpx;
			}
		}
		.mj-keyboard {
			.fixed {
				position: fixed;
				bottom: 392rpx;
				left: 0;
				right: 0;
				.tags {
					display: flex;
					justify-content: flex-start;
					background-color: $mj-bg-color;
					padding: 4px 0;
					.item {
						margin-right: 20rpx;
						display: flex;
						justify-content: flex-start;
						align-items: center;
						box-sizing: border-box;
						padding: 12rpx;
						border-radius: 36rpx;
						background-color: #f1f1f1;
						font-size: 24rpx;
					}
					// 父级选择器 & 可以选中当前的父元素
					&:first-child {
						margin-left: 20rpx;
					}
				}
				.bgc {
					background-color: #fff;
					border-top: 1px solid #f3f3f3;
					box-sizing: border-box;
					padding-bottom: 32rpx;
					// margin-top: 8rpx;
					.header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						.textarea {
							min-width: 430rpx;
						}
						.num {
							max-width: 320rpx;
							text-align: right;
							color: $mj-color-red;
							font-size: 36rpx;
							font-weight: 700;
						}
						.numForTransfer {
							color: $mj-text-color;
						}
					}
				}
			}
		}
		.user-template-list {
			
			.header {
				display: flex;
				justify-content: space-between;
				padding-top: 24rpx;
				.left {
					visibility: hidden;
					box-sizing: border-box;
					padding: 4px 8px;
					margin-left: 8px;
					background-color: $mj-theme-color;
					border-radius: 16px;
					font-size: 28rpx;
					color: $mj-bg-color;
				}
				.middle {
					text-align: center;
					// scss中font另一种写法
					font: {
						size: 32rpx;
						weight: bold;
					}
				}
				.right {
					box-sizing: border-box;
					padding: 4px 8px;
					margin-right: 8px;
					background-color: $mj-theme-color;
					border-radius: 16px;
					font-size: 28rpx;
					color: $mj-bg-color;
				}
			}
			.template-list {
				max-height: 450rpx; // 调整最大高度以限制弹窗高度
				overflow: auto;
			}
		}
	}
</style>