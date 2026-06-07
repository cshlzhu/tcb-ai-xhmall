import {
  getUserInfo,
  updateUserInfo,
  getOrderStats
} from '../../services/user';

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    isLoggingIn: false,
    needNickname: false,
    isAdmin: false,
    paymentEnabled: false,
    orderStats: {
      pendingPayment: 0,
      pendingDelivery: 0,
      pendingReceipt: 0,
      completed: 0,
    },
  },

  onShow() {
    const app = getApp();
    this.setData({ paymentEnabled: app.globalData.paymentEnabled });

    const savedInfo = wx.getStorageSync('userInfo') || {};
    const hasRealNickname = savedInfo.nickName && savedInfo.nickName !== '微信用户';

    if (hasRealNickname) {
      this.setData({ userInfo: savedInfo, isLoggedIn: true, isLoggingIn: false, needNickname: false });
      this.loadOrderStats();
      this.checkAdmin();
    } else if (savedInfo && savedInfo._id) {
      // 有用户记录但昵称无效，显示未登录
      this.setData({ userInfo: savedInfo, isLoggedIn: false, isLoggingIn: false, needNickname: false });
      wx.setStorageSync('userInfo', savedInfo);
    } else {
      // 全新用户，从数据库加载
      this.loadUserInfo();
    }
  },

  onPullDownRefresh() {
    Promise.all([this.loadUserInfo(), this.loadOrderStats()])
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },

  async loadUserInfo() {
    try {
      const userInfo = await getUserInfo();
      if (userInfo) {
        const hasRealNickname = userInfo.nickName && userInfo.nickName !== '微信用户';
        this.setData({
          userInfo,
          isLoggedIn: hasRealNickname,
          isLoggingIn: false,
          needNickname: false,
        });
        wx.setStorageSync('userInfo', userInfo);
        if (hasRealNickname) this.checkAdmin();
      } else {
        wx.removeStorageSync('userInfo');
        this.setData({ userInfo: {}, isLoggedIn: false, isLoggingIn: false, needNickname: false });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      wx.removeStorageSync('userInfo');
      this.setData({ userInfo: {}, isLoggedIn: false, isLoggingIn: false, needNickname: false });
    }
  },

  async loadOrderStats() {
    if (!this.data.isLoggedIn) return;
    try {
      const stats = await getOrderStats();
      this.setData({ orderStats: stats });
    } catch (error) {
      console.error('获取订单统计失败:', error);
    }
  },

  // 检查当前用户是否为管理员
  async checkAdmin() {
    const userInfo = this.data.userInfo || wx.getStorageSync('userInfo') || {};
    const openid = userInfo._openid;
    if (!openid) return;

    try {
      const res = await wx.cloud.callFunction({
        name: 'wxpayFunctions',
        data: { type: 'check_admin', data: { openid } }
      });
      const isAdmin = (res.result && res.result.isAdmin) || false;
      this.setData({ isAdmin });
    } catch (error) {
      console.error('检查管理员状态失败:', error);
      this.setData({ isAdmin: false });
    }
  },

  // ========== 登录流程 ==========

  // 点击用户卡片区域触发登录
  handleLogin() {
    // 已登录或正在登录不处理
    if (this.data.isLoggedIn || this.data.isLoggingIn) return;

    wx.showModal({
      title: '微信登录',
      content: '是否使用微信昵称和头像？',
      confirmText: '使用',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.startLogin();
        }
      },
    });
  },

  // 开始登录：进入登录中状态，弹出昵称输入
  startLogin() {
    this.setData({ isLoggingIn: true });

    // 延迟聚焦，确保DOM渲染后键盘弹出
    setTimeout(() => {
      this.setData({ needNickname: true });
    }, 300);
  },

  // 阻止事件冒泡（头像button和昵称input不要触发整个卡片的点击）
  preventBubble() {
    // 空函数，仅用于阻止事件冒泡
  },

  // ========== 头像选择 ==========

  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    if (!avatarUrl) return;

    try {
      wx.showLoading({ title: '上传中' });

      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: avatarUrl,
      });

      const updatedInfo = {
        ...this.data.userInfo,
        avatarUrl: uploadRes.fileID,
      };

      await updateUserInfo(updatedInfo);
      this.setData({ 'userInfo.avatarUrl': uploadRes.fileID });
      wx.setStorageSync('userInfo', this.data.userInfo);
      wx.hideLoading();
    } catch (error) {
      console.error('上传头像失败:', error);
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  // ========== 昵称输入 ==========

  async onNicknameBlur(e) {
    const nickName = e.detail.value;
    if (!nickName || nickName === this.data.userInfo.nickName) return;
    await this.saveNickname(nickName);
  },

  async onNicknameConfirm(e) {
    const nickName = e.detail.value;
    if (!nickName || nickName === this.data.userInfo.nickName) return;
    await this.saveNickname(nickName);
    wx.hideKeyboard();
  },

  onNicknameFocus() {
    // 不在这里重置 needNickname，否则会导致 input 立即失焦
    // PC 微信不受影响，但手机端 focus 从 true 变 false 会收起键盘
    // needNickname 只在 saveNickname 时重置
  },

  async saveNickname(nickName) {
    try {
      const updatedInfo = { ...this.data.userInfo, nickName };
      await updateUserInfo(updatedInfo);
      this.setData({
            'userInfo.nickName': nickName,
            isLoggedIn: true,
            isLoggingIn: false,
            needNickname: false,
          });
      wx.setStorageSync('userInfo', this.data.userInfo);

      // 登录完成后加载订单统计并检查管理员
      this.loadOrderStats();
      this.checkAdmin();
    } catch (error) {
      console.error('保存昵称失败:', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // ========== 导航 ==========

  // 支付功能开关
  onPaymentSwitch(e) {
    const enabled = e.detail.value;
    const app = getApp();
    app.globalData.paymentEnabled = enabled;
    wx.setStorageSync('paymentEnabled', enabled);
    this.setData({ paymentEnabled: enabled });

    wx.showToast({
      title: enabled ? '支付功能已开启' : '支付功能已关闭',
      icon: 'none',
    });
  },

  navigateToOrderList(e) {
    if (!this.data.isLoggedIn) {
      this.promptLogin();
      return;
    }
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/order/list/index?type=${type}` });
  },

  navigateToAdmin() {
    wx.navigateTo({ url: '/pages/admin/orders/index' });
  },

  async navigateTo(e) {
    if (!this.data.isLoggedIn) {
      this.promptLogin();
      return;
    }
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  // 未登录时提示并引导登录
  promptLogin() {
    wx.showModal({
      title: '提示',
      content: '请先登录后再使用此功能',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.startLogin();
        }
      },
    });
  },

  onShareAppMessage() {
    return {
      title: '我的小程序',
      path: '/pages/mine/mine',
    };
  },

  // ========== 退出登录 ==========

  async logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 重置为未登录状态
            this.setData({
              isLoggedIn: false,
              isLoggingIn: false,
              needNickname: false,
              isAdmin: false,
              userInfo: {},
              orderStats: {
                pendingPayment: 0,
                pendingDelivery: 0,
                pendingReceipt: 0,
                completed: 0,
              },
            });
            wx.removeStorageSync('userInfo');
            wx.showToast({ title: '已退出登录', icon: 'success' });
          } catch (error) {
            console.error('退出登录失败:', error);
            wx.showToast({ title: '退出登录失败', icon: 'none' });
          }
        }
      },
    });
  },
});
