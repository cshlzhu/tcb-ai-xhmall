// app.js
App({
  onLaunch: function() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      try {
        wx.cloud.init({
          env: 'cloud1-3gilug07b1c4acc4',
          traceUser: false,
        });
        // 验证云环境是否可用
        const db = wx.cloud.database();
        console.log('云开发初始化成功，当前环境:', db.env);
      } catch (e) {
        console.error('云开发初始化失败:', e.message || e);
      }
    }
  },

  globalData: {
    paymentEnabled: wx.getStorageSync('paymentEnabled') || false,
  }
}); 