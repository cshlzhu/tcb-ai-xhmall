import { getAddressById, addAddress, updateAddress, deleteAddress } from '../../../services/address';

Page({
  data: {
    isEdit: false,
    addressId: '',
    form: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false,
    },
    regionText: '请选择所在地区',
    submitting: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, addressId: options.id });
      this.loadAddressDetail(options.id);
      wx.setNavigationBarTitle({ title: '编辑地址' });
    } else {
      wx.setNavigationBarTitle({ title: '添加地址' });
    }
  },

  async loadAddressDetail(id) {
    try {
      const data = await getAddressById(id);
      if (data) {
        this.setData({
          form: {
            name: data.name || '',
            phone: data.phone || '',
            province: data.province || '',
            city: data.city || '',
            district: data.district || '',
            detail: data.detail || '',
            isDefault: data.isDefault || false,
          },
          regionText: `${data.province || ''} ${data.city || ''} ${data.district || ''}`.trim() || '请选择所在地区',
        });
      }
    } catch (error) {
      console.error('加载地址详情失败：', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 表单输入
  onNameInput(e) {
    this.setData({ 'form.name': e.detail });
  },

  onPhoneInput(e) {
    this.setData({ 'form.phone': e.detail });
  },

  onDetailInput(e) {
    this.setData({ 'form.detail': e.detail });
  },

  // 地区选择
  onRegionChange(e) {
    const values = e.detail.value;
    this.setData({
      'form.province': values[0],
      'form.city': values[1],
      'form.district': values[2],
      regionText: `${values[0]} ${values[1]} ${values[2]}`,
    });
  },

  // 默认地址开关
  onDefaultChange(e) {
    this.setData({ 'form.isDefault': e.detail });
  },

  // 表单验证
  validateForm() {
    const { name, phone, province, city, district, detail } = this.data.form;

    if (!name.trim()) {
      wx.showToast({ title: '请输入收货人姓名', icon: 'none' });
      return false;
    }

    if (!phone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return false;
    }

    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone.trim())) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }

    if (!province || !city || !district) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' });
      return false;
    }

    if (!detail.trim()) {
      wx.showToast({ title: '请输入详细地址', icon: 'none' });
      return false;
    }

    return true;
  },

  // 保存地址
  async onSave() {
    if (!this.validateForm()) return;
    if (this.data.submitting) return;

    this.setData({ submitting: true });

    try {
      const formData = {
        name: this.data.form.name.trim(),
        phone: this.data.form.phone.trim(),
        province: this.data.form.province,
        city: this.data.form.city,
        district: this.data.form.district,
        detail: this.data.form.detail.trim(),
        isDefault: this.data.form.isDefault,
      };

      if (this.data.isEdit) {
        await updateAddress(this.data.addressId, formData);
        wx.showToast({ title: '修改成功', icon: 'success' });
      } else {
        await addAddress(formData);
        wx.showToast({ title: '添加成功', icon: 'success' });
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1200);
    } catch (error) {
      console.error('保存地址失败：', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 删除地址
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteAddress(this.data.addressId);
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => {
              wx.navigateBack();
            }, 1000);
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      },
    });
  },
});
