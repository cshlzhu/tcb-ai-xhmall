/**
 * 地址服务
 */

// 检查云开发是否就绪
const isCloudReady = () => {
  return typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.database === 'function';
};

// 懒初始化数据库引用
const getDb = () => {
  if (!isCloudReady()) {
    throw new Error('云开发未就绪');
  }
  const db = wx.cloud.database();
  return { db, _: db.command };
};

/**
 * 获取当前用户 openid
 */
const getOpenId = async () => {
  if (!isCloudReady()) {
    throw new Error('云开发未就绪');
  }
  const { result } = await wx.cloud.callFunction({
    name: 'getOpenId',
  });
  if (!result || !result.openid) {
    throw new Error('获取openid失败');
  }
  return result.openid;
};

/**
 * 获取用户所有收货地址
 */
export const getAddresses = async () => {
  try {
    if (!isCloudReady()) return [];
    const { db } = getDb();
    const openid = await getOpenId();
    const { data } = await db
      .collection('addresses')
      .where({
        _openid: openid,
      })
      .orderBy('createTime', 'desc')
      .get();
    return data;
  } catch (error) {
    console.error('获取地址列表失败：', error);
    return [];
  }
};

/**
 * 获取单个地址详情
 * @param {string} id - 地址ID
 */
export const getAddressById = async (id) => {
  try {
    if (!isCloudReady()) return null;
    const { db } = getDb();
    const { data } = await db.collection('addresses').doc(id).get();
    return data;
  } catch (error) {
    console.error('获取地址详情失败：', error);
    return null;
  }
};

/**
 * 添加地址
 * @param {Object} addressData - 地址数据
 */
export const addAddress = async (addressData) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { db } = getDb();
    const openid = await getOpenId();

    // 如果设置为默认地址，先取消其他默认地址
    if (addressData.isDefault) {
      await db
        .collection('addresses')
        .where({
          _openid: openid,
          isDefault: true,
        })
        .update({
          data: {
            isDefault: false,
          },
        });
    }

    const result = await db.collection('addresses').add({
      data: {
        ...addressData,
        openid,
        createTime: new Date(),
        updateTime: new Date(),
      },
    });
    return result;
  } catch (error) {
    console.error('添加地址失败：', error);
    throw error;
  }
};

/**
 * 更新地址
 * @param {string} id - 地址ID
 * @param {Object} addressData - 地址数据
 */
export const updateAddress = async (id, addressData) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { db } = getDb();
    const openid = await getOpenId();

    // 如果设置为默认地址，先取消其他默认地址
    if (addressData.isDefault) {
      await db
        .collection('addresses')
        .where({
          _openid: openid,
          isDefault: true,
        })
        .update({
          data: {
            isDefault: false,
          },
        });
    }

    await db
      .collection('addresses')
      .doc(id)
      .update({
        data: {
          ...addressData,
          updateTime: new Date(),
        },
      });
    return true;
  } catch (error) {
    console.error('更新地址失败：', error);
    throw error;
  }
};

/**
 * 删除地址
 * @param {string} id - 地址ID
 */
export const deleteAddress = async (id) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { db } = getDb();
    await db.collection('addresses').doc(id).remove();
    return true;
  } catch (error) {
    console.error('删除地址失败：', error);
    throw error;
  }
};

/**
 * 设置默认地址
 * @param {string} id - 地址ID
 */
export const setDefaultAddress = async (id) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { db } = getDb();
    const openid = await getOpenId();

    // 先取消所有默认地址
    await db
      .collection('addresses')
      .where({
        _openid: openid,
        isDefault: true,
      })
      .update({
        data: {
          isDefault: false,
        },
      });

    // 设置新的默认地址
    await db
      .collection('addresses')
      .doc(id)
      .update({
        data: {
          isDefault: true,
          updateTime: new Date(),
        },
      });
    return true;
  } catch (error) {
    console.error('设置默认地址失败：', error);
    throw error;
  }
};
