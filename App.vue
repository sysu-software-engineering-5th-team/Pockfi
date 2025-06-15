<script>
import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js';

const nativePlug = uni.requireNativePlugin("MonitorPayinform");

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
		  lastNotification: null,
		  pendingNotificationForPopup: null,
		  accListenerRegistered: false,
		  lastAccData: null,
		  lastAccDataTime: 0,
		  accListenerEnabled: false, // 无障碍监听功能开关，默认关闭
		  notificationListenerEnabled: false // 监听通知功能开关，默认关闭
		}
	},
	onLaunch: async function() {
		await uniIdPageInit();
		console.log("[App] Launch");
		
		// 初始化设置
		this.loadAllSettings();
		
		// 监听无障碍设置变更事件
		uni.$on('accListenerSettingChanged', (enabled) => {
			console.log('[App] 收到无障碍监听设置变更:', enabled);
			this.accListenerEnabled = enabled;
			
			// 如果关闭了功能，则停止相关服务
			if (!enabled) {
				this.stopAccListener();
			} else {
				console.log("[App] 无障碍监听功能已启用，开始初始化...");
				if (nativePlug) {
					const result = nativePlug.isStartAccService();
					console.log("[App] isStartAccService 结果:", result);
					if (result) {
						nativePlug.initAcc();
						console.log("[App] 无障碍服务已开启，重新注册事件监听器");
						this.initAccListener(); // 每次都重新注册
					} else {
						console.log("[App] 无障碍服务未开启或初始化失败");
					}
				}
			}
		});
		
		// 监听通知监听设置变更事件
		uni.$on('notificationListenerSettingChanged', (enabled) => {
			console.log('[App] 收到通知监听设置变更:', enabled);
			this.notificationListenerEnabled = enabled;
		});
		
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
	  
	  // 重新加载设置，确保同步最新状态
	  this.loadAllSettings();
	  
	  // 只有在用户启用了无障碍监听功能时才初始化
	  if (this.accListenerEnabled) {
		  console.log("[App] 无障碍监听功能已启用，开始初始化...");
		  if (nativePlug) {
			  const result = nativePlug.isStartAccService();
			  console.log("[App] isStartAccService 结果:", result);
			  if (result) {
				  nativePlug.initAcc();
				  console.log("[App] 无障碍服务已开启，重新注册事件监听器");
				  this.initAccListener(); // 每次都重新注册
			  } else {
				  console.log("[App] 无障碍服务未开启或初始化失败");
			  }
		  }
	  } else {
		  console.log("[App] 无障碍监听功能已关闭，跳过初始化");
	  }
	
	  // 检查是否有待处理的通知弹窗
	  if (this.pendingNotificationForPopup) {
	    console.log('[App] 检测到待处理的通知弹窗');
	    const { amount, notification, timestamp } = this.pendingNotificationForPopup;
	    this.pendingNotificationForPopup = null; // 立即清除，防止重复触发
	
	    // 检查时效性，例如60秒内
	    if (Date.now() - timestamp < 60000) {
	      // 延迟以确保UI渲染完成
	      setTimeout(() => {
	        // 此处 this.isInBackground 已为 false，会直接显示弹窗
	        this.showPaymentConfirmDialog(amount, notification);
	      }, 500);
	    } else {
	      console.log('[App] 待处理通知已过期，不显示弹窗');
	    }
	  }
	  
	  // 只有在用户启用了通知监听功能时才启动通知监听
	  if (this.notificationListenerEnabled) {
		  console.log("[App] 通知监听功能已启用，启动通知监听服务");
		  this.startNotificationListener();
	  } else {
		  console.log("[App] 通知监听功能已关闭，跳过通知监听");
	  }
	},
	onHide: function() {
	  console.log("[App] 进入后台");
	  this.isInBackground = true;
	},
    methods: {
    // 检查是否有任何监听功能启用
    hasAnyListenerEnabled() {
      return this.notificationListenerEnabled || this.accListenerEnabled;
    },
    
    // 检查指定来源的监听功能是否启用
    isSourceEnabled(source) {
      if (source === 'accessibility') {
        return this.accListenerEnabled;
      } else {
        return this.notificationListenerEnabled;
      }
    },
    
    // 加载所有设置
    loadAllSettings() {
      // 默认都是关闭状态，只有用户明确设置为true时才开启
      this.accListenerEnabled = uni.getStorageSync('accListenerEnabled') === true;
      this.notificationListenerEnabled = uni.getStorageSync('notificationListenerEnabled') === true;
      
      console.log('[App] 加载无障碍监听设置:', this.accListenerEnabled);
      console.log('[App] 加载通知监听设置:', this.notificationListenerEnabled);
    },
    
    // 停止无障碍监听相关服务
    stopAccListener() {
      console.log('[App] 停止无障碍监听服务');
      this.accListenerRegistered = false;
      this.lastAccData = null;
      this.lastAccDataTime = 0;
      
      // 这里可以添加其他清理逻辑，如果原生插件支持的话
      // 例如：nativePlug.stopAcc() 等
    },
    
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
	  
	  // 提取金额逻辑
	  let amount = null;
	  if (ret.text) {
		// 优先匹配带有货币符号或关键字的金额
		// 关键字列表: 支付, 付款, 收款, 消费, 交易, 金额, 转账, 到账, 入账, 支出, 收入, 转入, 收到
		let amountMatch = ret.text.match(/(?:[¥￥]|(?:支付|付款|收款|消费|交易|金额|转账|到账|入账|支出|收入|转入|收到)\s*[:：]?\s*)(\d+\.?\d*)/);
		
		// 如果没有匹配到，则尝试匹配数字后面带"元"的模式
		if (!amountMatch) {
		  amountMatch = ret.text.match(/(\d+\.?\d*)\s*元/);
		}
		
		if (amountMatch) {
		  // 无论是哪个正则匹配到的，金额都在第一个捕获组
		  amount = amountMatch[1];
		}
	  }
	  
	  if (amount) {
		  this.handleReceivedData(amount, ret);
	  }
	},
	
    isPaymentApp(packageName) {
      const paymentApps = [
        'com.tencent.mm', 
        'com.eg.android.AlipayGphone',
		'com.alipay.mobile.client',
        'com.unionpay',
        'com.wuba'
      ];
      return paymentApps.includes(packageName);
    },
    
    getAppName(packageName) {
      const appNames = {
        'com.tencent.mm': '微信',
        'com.eg.android.AlipayGphone': '支付宝',
		'com.alipay.mobile.client': '支付宝',
        'com.unionpay': '云闪付',
        'com.wuba': '58同城',
        'com.tencent.mobileqq': 'QQ'
      };
      return appNames[packageName] || packageName;
    },
    
	/**
	 * @description 将应用从后台唤醒到前台（仅限Android）
	 */
	bringAppToFront() {
	  if (uni.getSystemInfoSync().platform !== 'android') {
	    return;
	  }
	  console.log('[App] 尝试将应用唤起到前台');
	  try {
	    const main = plus.android.runtimeMainActivity();
	    const Intent = plus.android.importClass('android.content.Intent');
	    const intent = new Intent(main.getApplicationContext(), main.getClass());
	    // 使用 FLAG_ACTIVITY_REORDER_TO_FRONT 将已存在的 Activity 提到前台
	    intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
	    // 使用 FLAG_ACTIVITY_SINGLE_TOP 避免重新创建实例
	    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
	    // 对于从后台服务启动 Activity，需要 FLAG_ACTIVITY_NEW_TASK
	    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
	    main.startActivity(intent);
	  } catch (e) {
	    console.error('[App] 唤起应用失败:', e);
	  }
	},
	
	showPaymentConfirmDialog(amount, notification) {
	  // 检查是否有任何监听功能启用
	  if (!this.hasAnyListenerEnabled()) {
	    console.log('[Dialog] 所有监听功能均已关闭，忽略支付提醒');
	    return;
	  }
	  
	  // 新增逻辑：如果 App 在后台，则先唤醒
	  if (this.isInBackground) {
	    console.log('[Dialog] 应用在后台，保存通知并准备唤起');
	    this.pendingNotificationForPopup = { amount, notification, timestamp: Date.now() };
	    this.bringAppToFront();
	    return; // 不立即显示弹窗，交由 onShow 处理
	  }
		
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
      
      let isIncome = false; // 默认为支出
      // 优先使用来自无障碍服务的、更准确的收支判断
      if (typeof this.lastNotification?.isIncome === 'boolean') {
        isIncome = this.lastNotification.isIncome;
        console.log('[Navigation] 使用来自无障碍服务的判断:', isIncome ? '收入' : '支出');
      } else {
        // 兼容旧的、来自通知栏的关键词判断逻辑
        isIncome = this.lastNotification?.text?.includes('收入') || 
                        this.lastNotification?.text?.includes('收款') ||
                        this.lastNotification?.text?.includes('到账') ||
                        this.lastNotification?.text?.includes('转入') ||
                        this.lastNotification?.text?.includes('收到') ||
                        this.lastNotification?.text?.includes('入账') ;
        console.log('[Navigation] 使用来自通知栏的关键词判断:', isIncome ? '收入' : '支出');
      }
      
      console.log('[Navigation] 通知内容:', this.lastNotification?.text);
      console.log('[Navigation] 最终判断是否为收入:', isIncome);
      
      // 构建跳转URL，添加 tab 参数 (0是支出, 1是收入)
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
    },

	initAccListener() {
		// 检查功能是否启用
		if (!this.accListenerEnabled) {
			console.log("[AccListener] 无障碍监听功能已关闭，跳过注册");
			return;
		}
		
		console.log("[AccListener] 开始注册无障碍事件监听器...");
		
		try {
			const globalEvent = uni.requireNativePlugin('globalEvent');
			console.log("[AccListener] globalEvent 实例:", globalEvent);
			
			// 每次都重新注册，不检查是否已注册
			globalEvent.addEventListener('acc_data', (res) => {
				console.log('收到无障碍服务数据:', JSON.stringify(res));
				
				if (!res || !res.data || !res.data.money || !res.data.inform) {
					console.log("[AccListener] 数据格式不正确，忽略");
					return;
				}
				
				// 简单去重：检查是否与上次数据相同，且时间间隔小于3秒
				const currentTime = Date.now();
				const dataKey = `${res.type}_${res.data.money}_${res.data.inform}`;
				
				if (this.lastAccData === dataKey && (currentTime - this.lastAccDataTime) < 3000) {
					console.log("[AccListener] 检测到重复数据，忽略");
					return;
				}
				
				// 更新去重记录
				this.lastAccData = dataKey;
				this.lastAccDataTime = currentTime;
		
				let amount = null;
				let isIncome = false; // 默认为支出
				let packageName = "";
				const moneyStr = res.data.money;
				
				console.log("[AccListener] 开始解析数据，type:", res.type, "money:", moneyStr);
				
				// 根据type分别处理
				switch (res.type) {
					case 'zfb_monitor':
					case 'wx_monitor':
						const amountMatchMonitor = moneyStr.match(/(\d+\.?\d*)/);
						amount = amountMatchMonitor ? amountMatchMonitor[1] : null;
						isIncome = false; // 支付页面总是支出
						packageName = res.type.startsWith("zfb") ? "com.eg.android.AlipayGphone" : "com.tencent.mm";
						break;
				
					case 'zfb':
						const amountMatchBill = moneyStr.match(/(\d+\.?\d*)/);
						amount = amountMatchBill ? amountMatchBill[1] : null;
						isIncome = !moneyStr.includes('支出'); // 不含"支出"字样则为收入
						packageName = "com.eg.android.AlipayGphone";
						break;
				
					default:
						console.log('[AccListener] 未知的数据类型:', res.type);
						return;
				}
		
				if (!amount) {
					console.log('[AccListener] 未能从数据中提取有效金额:', moneyStr);
					return;
				}
				
				console.log("[AccListener] 解析成功 - 金额:", amount, "收入:", isIncome, "应用:", packageName);
				
				// 解析商家信息
				let remark = '';
				try {
					const informArray = JSON.parse(res.data.inform);
					remark = Array.isArray(informArray) ? informArray.join(' | ') : res.data.inform;
				} catch (e) {
					remark = res.data.inform;
				}
		
				const notificationData = {
					text: `${isIncome ? '收入' : '支出'} ${amount}元, 商家: ${remark}`,
					packageName: packageName,
					title: "无障碍服务记账提醒",
					source: 'accessibility',
					isIncome: isIncome 
				};
				
				console.log("[AccListener] 准备调用 handleReceivedData");
				this.handleReceivedData(amount, notificationData);
			});
			
			console.log("[AccListener] 事件监听器注册完成");
			this.accListenerRegistered = true;
			
		} catch (error) {
			console.error("[AccListener] 注册监听器时发生错误:", error);
		}
	},

	handleReceivedData(amount, notification) {
		console.log('[Payment] 检测到支付金额:', amount);
		console.log('[Payment] 来源应用:', notification.packageName);

		// 统一检查：如果所有监听功能都关闭，直接返回
		if (!this.hasAnyListenerEnabled()) {
			console.log('[Payment] 所有监听功能均已关闭');
			return;
		}

		// 如果数据源是无障碍服务，则跳过关键词检查，直接处理
		if (notification.source === 'accessibility') {
			console.log('[Payment] 数据来自无障碍服务，直接显示弹窗');
			this.showPaymentConfirmDialog(amount, notification);
			return;
		}
		// 如果数据源是通知栏，则检查是否开启通知监听功能
		if(!this.notificationListenerEnabled){
			console.log('[Payment] 数据来自通知栏，但已经关闭通知监听功能');
			return;
		}
		console.log('[Payment] 数据来自通知栏，继续进行关键词检查');
		// 对来自通知栏的数据，继续进行关键词检查
		const paymentKeywords = ['支付', '收款', '付款', '转账', '收钱', '付钱', '到账', '入账', '支出', '收入'];
		const hasPaymentKeyword = paymentKeywords.some(keyword => notification.text.includes(keyword));
		if (hasPaymentKeyword) {
			console.log('[Payment] 检测到支付关键词');
			this.showPaymentConfirmDialog(amount, notification);
		} else {
			console.log('[Payment] 未检测到支付关键词，忽略通知');
		}
	}
  }
};
</script>

<style lang="scss">
/*每个页面公共css */
// 引入uView基础样式
@import "@/uni_modules/uview-ui/index.scss";
// 引入自定义图标库
@import "@/static/iconfont.css";

// 为每个页面设置公共样式
page {
	background-color: $mj-bg-color;
}

</style>
