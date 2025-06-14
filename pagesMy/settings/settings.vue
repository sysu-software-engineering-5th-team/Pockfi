<template>
  <view class="settings">
    <view class="content">
      <u-cell-group :border="false">
        <u-cell title="通知监听功能" :value="notificationListenerEnabled ? '已开启' : '已关闭'">
          <uni-icons slot="icon" type="sound" size="48rpx" color="#888"></uni-icons>
          <u-switch slot="right-icon" v-model="notificationListenerEnabled" @change="onNotificationListenerChange"></u-switch>
        </u-cell>
        
        <u-cell title="无障碍监听功能" :value="accListenerEnabled ? '已开启' : '已关闭'">
          <uni-icons slot="icon" type="auth" size="48rpx" color="#888"></uni-icons>
          <u-switch slot="right-icon" v-model="accListenerEnabled" @change="onAccListenerChange"></u-switch>
        </u-cell>
        
        <u-cell title="开启通知监听权限" isLink @click="openNotificationPermission" v-if="notificationListenerEnabled">
          <uni-icons slot="icon" type="notification" size="48rpx" color="#888"></uni-icons>
        </u-cell>
        
        <u-cell title="开启无障碍辅助功能" isLink @click="openAccessibilityService" v-if="accListenerEnabled">
          <uni-icons slot="icon" type="settings" size="48rpx" color="#888"></uni-icons>
        </u-cell>
        
        <!-- <u-cell title="加入电池优化白名单" isLink @click="openBatteryWhitelist">
          <uni-icons slot="icon" type="battery" size="48rpx" color="#888"></uni-icons>
        </u-cell> -->
      </u-cell-group>
      
      <!-- 功能说明 -->
      <view class="feature-desc">
        <view class="desc-title">功能说明</view>
        <view class="desc-content">
          <text>• 监听通知功能：监听系统通知栏的支付消息，提供记账提醒</text>
          <text>• 无障碍监听功能：通过无障碍服务直接检测支付应用的支付行为</text>
          <text>• 关闭监听通知功能后，不会自动唤醒应用到前台</text>
          <text>• 您可以根据需要单独控制这两个功能的开启状态</text>
		  <text>• 需要自行开启自启动、关联启动、悬浮窗和后台弹出界面权限</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      notificationListenerEnabled: false,
      accListenerEnabled: false
    }
  },
  onLoad() {
    this.loadSettings();
  },
  methods: {
    loadSettings() {
      // 从本地存储加载设置
      this.notificationListenerEnabled = uni.getStorageSync('notificationListenerEnabled') === true;
      this.accListenerEnabled = uni.getStorageSync('accListenerEnabled') === true;
    },
    
    onNotificationListenerChange(enabled) {
      console.log('[Settings] 通知监听功能设置变更:', enabled);
      this.notificationListenerEnabled = enabled;
      
      // 保存到本地存储
      uni.setStorageSync('notificationListenerEnabled', enabled);
      
      // 通知App.vue更新状态
      uni.$emit('notificationListenerSettingChanged', enabled);
      
      uni.showToast({
        title: enabled ? '通知监听功能已开启' : '通知监听功能已关闭',
        icon: 'none'
      });
    },
    
    onAccListenerChange(enabled) {
      console.log('[Settings] 无障碍监听功能设置变更:', enabled);
      this.accListenerEnabled = enabled;
      
      // 保存到本地存储
      uni.setStorageSync('accListenerEnabled', enabled);
      
      // 通知App.vue更新状态
      uni.$emit('accListenerSettingChanged', enabled);
      
      uni.showToast({
        title: enabled ? '无障碍监听功能已开启' : '无障碍监听功能已关闭',
        icon: 'none'
      });
    },
    
    openNotificationPermission() {
      const plugin = uni.requireNativePlugin('listener');
      plugin.requestPermission();
    },
    
    openBatteryWhitelist() {
      const plugin = uni.requireNativePlugin('listener');
      plugin.requestIgnoreBatteryOptimizations();
    },
    
    openAccessibilityService() {
      const nativePlug = uni.requireNativePlugin("MonitorPayinform")
      if (nativePlug.isStartAccService()) {
        uni.showToast({
          title: "无障碍服务已开启",
          icon: 'none'
        })
      } else {
		nativePlug.openService();
        // uni.showToast({
        //   title: "请在系统设置中开启无障碍服务",
        //   icon: 'none'
        // })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.settings {
  min-height: 100vh;
  background: #fafafa;
  .content {
    padding: 24rpx;
  }
  
  .feature-desc {
    margin-top: 40rpx;
    padding: 30rpx;
    background: #fff;
    border-radius: 16rpx;
    
    .desc-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }
    
    .desc-content {
      font-size: 28rpx;
      color: #666;
      line-height: 1.6;
      
      text {
        display: block;
        margin-bottom: 16rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style> 