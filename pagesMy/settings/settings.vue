<template>
  <view class="settings">
    <u-navbar title="设置" :border="false" :fixed="true" :autoBack="true" background="#fafafa" />
    <view class="content">
      <u-cell-group :border="false">
        <u-cell title="开启通知监听权限" isLink @click="openNotificationPermission">
          <uni-icons slot="icon" type="sound" size="48rpx" color="#888"></uni-icons>
        </u-cell>
        <u-cell title="加入电池优化白名单" isLink @click="openBatteryWhitelist">
          <uni-icons slot="icon" type="notification" size="48rpx" color="#888"></uni-icons>
        </u-cell>
      </u-cell-group>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    openNotificationPermission() {
      const plugin = uni.requireNativePlugin('listener');
      plugin.requestPermission();
    },
    openBatteryWhitelist() {
      const plugin = uni.requireNativePlugin('listener');
      plugin.requestIgnoreBatteryOptimizations();
    }
  }
}
</script>

<style lang="scss" scoped>
.settings {
  min-height: 100vh;
  background: #fafafa;
  .content {
    margin-top: 100rpx;
    padding: 24rpx;
  }
}
</style> 