import { getAddresses, deleteAddress, setDefaultAddress } from '../../services/address';

Page({
  data: {
    addresses: [],
    loading: true,
  },

  onShow() {
    this.loadAddresses();
  },

  onPullDownRefresh() {
    this.loadAddresses().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadAddresses() {
    try {
      this.setData({ loading: true });
      const addresses = await getAddresses();
      // 格式化地址显示
      const formatted = addresses.map((addr) => ({
        ...addr,
        fullRegion: `${addr.province || ''}${addr.city || ''}${addr.district || ''}`,
        createTimeText: this.formatTime(addr.createTime),
      }));
      this.setData({
        addresses: formatted,
        loading: false,
      });
    } catch (error) {
      console.error('加载地址失败：', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none',
      });
    }
  },

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  },

  // 跳转到添加地址页
  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/address/edit/index',
    });
  },

  // 跳转到编辑地址页
  navigateToEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/address/edit/index?id=${id}`,
    });
  },

  // 设置默认地址
  async onToggleDefault(e) {
    const { id, isdefault } = e.currentTarget.dataset;

    if (isdefault) return; // 已经是默认的

    try {
      await setDefaultAddress(id);
      await this.loadAddresses();
      wx.showToast({
        title: '已设为默认',
        icon: 'success',
      });
    } catch (error) {
      wx.showToast({
        title: '设置失败',
        icon: 'none',
      });
    }
  },

  onShareAppMessage() {
    return {
      title: '我的小程序',
      path: '/pages/index/index',
    };
  },

  // 删除地址
  onDeleteAddress(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteAddress(id);
            await this.loadAddresses();
            wx.showToast({
              title: '已删除',
              icon: 'success',
            });
          } catch (error) {
            wx.showToast({
              title: '删除失败',
              icon: 'none',
            });
          }
        }
      },
    });
  },
});
