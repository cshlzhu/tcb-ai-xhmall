/**
 * 购物车服务
 *
 * 使用 CloudBase 数据库 PRIVATE 权限模式，_openid 由系统自动管理，
 * 无需通过云函数获取 openid。
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
  return { db, cartCollection: db.collection('cart'), _: db.command };
};

/**
 * 添加商品到购物车
 * PRIVATE 权限下 _openid 自动管理
 * @param {Object} product - 商品信息
 * @param {Number} count - 商品数量
 * @returns {Promise} - 添加结果
 */
export const addToCart = async (product, count = 1) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { db, cartCollection, _ } = getDb();

    // PRIVATE 权限自动限定当前用户，仅按 productId 查询
    const res = await cartCollection.where({
      productId: product._id
    }).get();

    if (res.data.length > 0) {
      // 商品已存在，更新数量
      const cartItem = res.data[0];
      return await cartCollection.doc(cartItem._id).update({
        data: {
          count: _.inc(count)
        }
      });
    } else {
      // 商品不存在，添加新记录（_openid 由系统自动设置）
      return await cartCollection.add({
        data: {
          productId: product._id,
          name: product.name,
          price: product.price,
          coverUrl: product.coverUrl,
          count: count,
          selected: true,
          createTime: db.serverDate()
        }
      });
    }
  } catch (error) {
    console.error('添加到购物车失败', error);
    throw error;
  }
}

/**
 * 获取购物车列表
 * PRIVATE 权限自动按 _openid 过滤
 * @returns {Promise} - 购物车列表
 */
export const getCartList = async () => {
  try {
    if (!isCloudReady()) return [];
    const { cartCollection } = getDb();

    const res = await cartCollection
      .orderBy('createTime', 'desc')
      .get();

    return res.data;
  } catch (error) {
    console.error('获取购物车列表失败', error);
    throw error;
  }
}

/**
 * 更新购物车商品数量
 * @param {String} id - 购物车项ID
 * @param {Number} count - 新的数量
 * @returns {Promise} - 更新结果
 */
export const updateCartItemCount = async (id, count) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { cartCollection } = getDb();
    return await cartCollection.doc(id).update({
      data: {
        count: count
      }
    });
  } catch (error) {
    console.error('更新购物车商品数量失败', error);
    throw error;
  }
}

/**
 * 删除购物车商品
 * @param {String} id - 购物车项ID
 * @returns {Promise} - 更新结果
 */
export const removeFromCart = async (id) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { cartCollection } = getDb();
    return await cartCollection.doc(id).remove();
  } catch (error) {
    console.error('删除购物车商品失败', error);
    throw error;
  }
}

/**
 * 更新购物车商品选中状态
 * @param {String} id - 购物车项ID
 * @param {Boolean} selected - 选中状态
 * @returns {Promise} - 更新结果
 */
export const updateCartItemSelected = async (id, selected) => {
  try {
    if (!isCloudReady()) throw new Error('云开发未就绪');
    const { cartCollection } = getDb();
    return await cartCollection.doc(id).update({
      data: {
        selected: selected
      }
    });
  } catch (error) {
    console.error('更新购物车商品选中状态失败', error);
    throw error;
  }
}
