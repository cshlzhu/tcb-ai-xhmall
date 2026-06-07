// pages/admin/orders/index.js
Page({
  data: {
    orders: [],
    isLoading: true,
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => wx.stopPullDownRefresh());
  },

  // ========== 加载所有用户已支付订单 ==========

  async loadOrders() {
    this.setData({ isLoading: true });

    try {
      // 通过云函数查询所有用户的已支付订单（绕过客户端权限限制）
      const res = await wx.cloud.callFunction({
        name: 'wxpayFunctions',
        data: { type: 'admin_list_orders', data: {} }
      });

      const orders = (res.result && res.result.orders || []).map((order) => ({
        ...order,
        statusText: this.getStatusText(order.status),
        createTimeFormatted: this.formatDate(order.createTime),
        totalAmount: order.totalAmount / 100,
      }));

      this.setData({ orders, isLoading: false });
    } catch (err) {
      console.error('加载订单失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  // ========== 查看订单详情 ==========

  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/detail/index?id=${orderId}`,
    });
  },

  // ========== 工具方法 ==========

  getStatusText(status) {
    const map = {
      NOTPAY: '待付款',
      PAID: '待发货',
      SHIPPED: '待收货',
      FINISHED: '已完成',
      CLOSED: '已关闭',
    };
    return map[status] || '未知状态';
  },

  formatDate(date) {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
});
