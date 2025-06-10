<script>
import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js';

export default {
	data() {
		return {
		  isListening: false,
		  serviceStatus: 'disconnected',
		  notificationCallback: null,
		  checkInterval: null,
		  lastNotificationTime: 0,
		  retryCount: 0,
		  maxRetryCount: 5,
		  isInBackground: false,
		  lastNotification: null
		}
	},
	onLaunch: async function() {
		await uniIdPageInit()
		console.log("[App] Launch");
		// Android特有：检查后台弹窗权限
		  if (uni.getSystemInfoSync().platform === 'android') {
			const main = plus.android.runtimeMainActivity();
			const pkManager = main.getPackageManager();
			const flag = plus.android.invoke(
			  'android.content.pm.PackageManager', 'GET_PERMISSIONS'
			);
			const hasPermission = pkManager.checkPermission(
			  "android.permission.SYSTEM_ALERT_WINDOW",
			  main.getPackageName()
			) === 0;
			
			if (!hasPermission) {
			  uni.showModal({
				title: '权限提示',
				content: '请授权应用在后台显示记账提醒',
				confirmText: '去设置',
				success: (res) => {
				  if (res.confirm) {
					const Intent = plus.android.importClass('android.content.Intent');
					const Settings = plus.android.importClass('android.provider.Settings');
					const intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
					intent.setData(plus.android.invoke(
					  'android.net.Uri', 'parse', 'package:' + main.getPackageName()
					));
					main.startActivity(intent);
				  }
				}
			  });
			}
		  }
		this.initNotificationListener();
	},
	onShow: function() {
	  console.log("[App] 回到前台");
	  this.isInBackground = false;
	  this.startNotificationListener();
	},
	onHide: function() {
	  console.log("[App] 进入后台");
	  this.isInBackground = true;
	},
    methods: {
    initNotificationListener() {
      this.checkPermissionAndConnect();
    },

    checkPermissionAndConnect() {
      const plugin = this.getPlugin();
      plugin.checkPermission(res => {
        console.log('[Permission] 检查结果:', JSON.stringify(res));
        if (res?.isGranted) {
          this.startNotificationListener();
        } else {
          console.log('[Permission] 未授予');
          this.requestPermission();
        }
      });
    },

    requestPermission() {
      const plugin = this.getPlugin();
      plugin.requestPermission(res => {
        console.log('[Permission] 请求结果:', res);
        if (res?.status === 'redirected') {
          setTimeout(() => this.checkPermissionAndConnect(), 3000);
        }
      });
    },

	startNotificationListener() {
	  if (this.isListening || this.serviceStatus === 'connecting') {
		console.log('[Listener] 已在监听或正在连接');
		return;
	  }

	  const plugin = this.getPlugin();
	  
	  this.notificationCallback = (response) => {
		// 优先级1：处理消息通知
		if (response.text || response.packageName) {
		  console.log('[Notification] 收到通知:', JSON.stringify(response));
		  this.handleNotification(response);
		  return;
		}
		
		// 优先级2：处理服务状态
		if (response.status) {
		  this.handleServiceStatus(response);
		  return;
		}
	  };

	  this.serviceStatus = 'connecting';
	  console.log('[Listener] 启动监听服务...');
	  
	  plugin.startListening((response) => {
		console.log('[Listener] 收到响应:', JSON.stringify(response));
		this.notificationCallback(response);
	  });
	},

	handleServiceStatus(response) {
	  switch(response.status) {
		case 'connection_changed':
		  this.serviceStatus = response.isConnected ? 'connected' : 'disconnected';
		  console.log(`[Connection] 状态变更: ${this.serviceStatus}`);
		  
		  if (!response.isConnected) {
			this.isListening = false;
			// 快速重连（从5秒改为2秒）
			setTimeout(() => this.startNotificationListener(), 2000);
		  }
		  break;
		const plugin = this.getPlugin();
		case 'success':
		  this.isListening = true;
		  this.retryCount = 0;
		  console.log('[Listener] 监听服务已启动');
		  this.startStatusCheck(plugin);
		  break;
		  
		case 'error':
		  console.error('[Listener] 启动失败:', response.error);
		  this.serviceStatus = 'disconnected';
		  setTimeout(() => this.startNotificationListener(), 3000);
		  break;
	  }
	},

    handleConnectionChange(isConnected) {
      this.serviceStatus = isConnected ? 'connected' : 'disconnected';
      console.log(`[Connection] 状态变更: ${this.serviceStatus}`);
      
      if (!isConnected) {
        setTimeout(() => {
          if (!this.isListening) {
            this.startNotificationListener();
          }
        }, 5000);
      }
    },

    handleStartSuccess(plugin) {
      this.isListening = true;
      this.retryCount = 0;
      console.log('[Listener] 监听服务已启动');
      this.startStatusCheck(plugin);
    },

    handleStartFailure(error) {
      console.error('[Listener] 启动失败:', error);
      this.serviceStatus = 'disconnected';
      
      setTimeout(() => {
        if (!this.isListening) {
          this.startNotificationListener();
        }
      }, 5000);
    },

    startStatusCheck(plugin) {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
      
      this.checkInterval = setInterval(() => {
        if (!this.isListening) {
          clearInterval(this.checkInterval);
          return;
        }
        
        plugin.checkServiceStatus(res => {
          console.log('[Status] 检查:', res);
          if (!res?.connected) {
            console.log('[Status] 服务断开');
            this.serviceStatus = 'disconnected';
            this.isListening = false;
            this.startNotificationListener();
          }
        });
      }, 60000);
    },

	handleNotification(ret) {
	  // 确保这是消息通知而不是状态更新
	  if (!ret.text && !ret.packageName) return;
	  
	  const now = Date.now();
	  // 增加防抖时间间隔（从1秒改为500毫秒）
	  if (now - this.lastNotificationTime < 500) {
		return;
	  }
	  this.lastNotificationTime = now;
	  
	  console.log('[Notification] 处理通知:', JSON.stringify(ret));
	  
	  // 提取金额逻辑保持不变
	  const amountMatch = ret.text?.match(/([¥￥]|\b)(\d+\.?\d*)\s*(元|人民币|RMB)?/);
	  const amount = amountMatch ? amountMatch[2] : null;
	  
	  if (amount) {
		console.log('[Payment] 检测到支付金额:', amount);
		console.log('[Payment] 来源应用:', ret.packageName);
		
		// 检查是否包含关键词
		const paymentKeywords = ['支付', '收款', '付款', '转账', '收钱', '付钱', '到账', '入账'];
		const hasPaymentKeyword = paymentKeywords.some(keyword => ret.text.includes(keyword));
		if (hasPaymentKeyword) {
		  console.log('[Payment] 检测到支付关键词');
		  this.showPaymentConfirmDialog(amount, ret);
		}
	  }
	},
	
    isPaymentApp(packageName) {
      const paymentApps = [
        'com.tencent.mm', 
        'com.eg.android.AlipayGphone',
        'com.unionpay',
        'com.wuba'
      ];
      return paymentApps.includes(packageName);
    },
    
    getAppName(packageName) {
      const appNames = {
        'com.tencent.mm': '微信',
        'com.eg.android.AlipayGphone': '支付宝',
        'com.unionpay': '云闪付',
        'com.wuba': '58同城',
        'com.tencent.mobileqq': 'QQ'
      };
      return appNames[packageName] || packageName;
    },
    
	showPaymentConfirmDialog(amount, notification) {
	  // 先停止当前所有可能存在的弹窗
	  uni.hideToast();
	  uni.hideLoading();
	  
	  // 保存通知内容
	  this.lastNotification = notification;
	  
	  console.log('[Dialog] 准备显示支付确认对话框');
	  uni.showModal({
		title: `检测到收入-支出 (${amount}元)`,
		content: `来自 ${this.getAppName(notification.packageName)}\n${notification.text}`,
		confirmText: '立即记账',
		cancelText: '忽略',
		success: (res) => {
		  if (res.confirm) {
			this.navigateToAccountPage(amount);
		  }
		}
	  });
	},
    
    navigateToAccountPage(amount) {
      console.log('[Navigation] 准备跳转到记账页面, 金额:', amount);
      
      // 根据通知内容判断是收入还是支出
      const isIncome = this.lastNotification?.text?.includes('收入') || 
                      this.lastNotification?.text?.includes('收款') ||
                      this.lastNotification?.text?.includes('到账') ||
                      this.lastNotification?.text?.includes('转入') ||
                      this.lastNotification?.text?.includes('收到') ||
                      this.lastNotification?.text?.includes('入账');
      
      console.log('[Navigation] 通知内容:', this.lastNotification?.text);
      console.log('[Navigation] 是否为收入:', isIncome);
      
      // 构建跳转URL，添加 tab 参数
      const url = `/pagesAccount/make-an-account/make-an-account?amount=${amount}&tab=${isIncome ? 1 : 0}`;
      console.log('[Navigation] 目标URL:', url);
      
      // 使用navigateTo跳转到子包页面
      uni.navigateTo({
        url: url,
        success: () => {
          console.log('[Navigation] 成功跳转到记账页面');
          // 延迟设置金额，确保页面已加载
          setTimeout(() => {
            const pages = getCurrentPages();
            const currentPage = pages[pages.length - 1];
            if (currentPage && currentPage.$vm) {
              console.log('[Navigation] 设置金额:', amount);
              currentPage.$vm.amount = amount;
              currentPage.$vm.keyboardInfo.balance = amount;
            }
          }, 500);
        },
        fail: (err) => {
          console.error('[Navigation] 跳转失败:', err);
          uni.showToast({
            title: '打开记账页面失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },

	cleanupListeners(force = false) {
	  // 如果在后台且不强制停止，则保持运行
	  if (this.isInBackground && !force) {
		console.log('[Cleanup] 应用在后台，保持监听');
		return;
	  }
	  
	  console.log('[Cleanup] 真正停止监听');
	  this.isListening = false;
      this.serviceStatus = 'disconnected';
      this.retryCount = 0;
      
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      
      const plugin = this.getPlugin();
      plugin.stopListening(() => {
        console.log('[Cleanup] 已停止');
      });
    },

    getPlugin() {
      try {
        return uni.requireNativePlugin('listener');
      } catch (e) {
        console.error('[Plugin] 加载失败:', e);
        uni.showToast({
          title: '功能初始化失败',
          icon: 'none'
        });
        throw e;
      }
    }
  }
};
</script>

<style lang="scss">
@import "@/uni_modules/uview-ui/index.scss";
@import "@/static/iconfont.css";

page {
  background-color: $mj-bg-color;
}
</style>