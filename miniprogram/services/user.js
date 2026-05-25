/**
 * 用户服务
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

// 获取当前用户 openid
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
 * 获取用户信息
 */
export const getUserInfo = async () => {
	try {
		if (!isCloudReady()) return null;
		const { db } = getDb();
		const openid = await getOpenId();

		const { data } = await db
			.collection('users')
			.where({
				_openid: openid,
			})
			.get();

		return data[0] || null;
	} catch (error) {
		console.error('获取用户信息失败：', error);
		return null;
	}
};

/**
 * 更新用户信息
 * @param {Object} userInfo - 微信用户信息
 */
export const updateUserInfo = async (userInfo) => {
	try {
		if (!isCloudReady()) throw new Error('云开发未就绪');
		const { db } = getDb();
		const openid = await getOpenId();

		const { data } = await db
			.collection('users')
			.where({
				_openid: openid,
			})
			.get();

		const userData = {
			nickName: userInfo.nickName || '',
			avatarUrl: userInfo.avatarUrl || '',
			phone: userInfo.phone || '',
			lastLogin: new Date(),
		};

		if (data.length === 0) {
			// 新用户，创建记录
			return await db.collection('users').add({
				data: {
					...userData,
					createTime: new Date(),
				},
			});
		} else {
			// 更新现有用户信息
			return await db
				.collection('users')
				.where({
					_openid: openid,
				})
				.update({
					data: userData,
				});
		}
	} catch (error) {
		console.error('更新用户信息失败：', error);
		throw error;
	}
};

/**
 * 获取用户订单统计
 */
export const getOrderStats = async () => {
	try {
		if (!isCloudReady()) {
			return { pendingPayment: 0, pendingDelivery: 0, pendingReceipt: 0, completed: 0 };
		}
		const { db } = getDb();
		const openid = await getOpenId();

		if (!openid) {
			return {
				pendingPayment: 0,
				pendingDelivery: 0,
				pendingReceipt: 0,
				completed: 0,
			};
		}

		const { data } = await db
			.collection('orders')
			.where({
				_openid: openid,
			})
			.get();

		const stats = {
			pendingPayment: 0,
			pendingDelivery: 0,
			pendingReceipt: 0,
			completed: 0,
		};

		data.forEach((order) => {
			switch (order.status) {
				case 'PENDING_PAYMENT':
					stats.pendingPayment++;
					break;
				case 'PENDING_DELIVERY':
					stats.pendingDelivery++;
					break;
				case 'PENDING_RECEIPT':
					stats.pendingReceipt++;
					break;
				case 'COMPLETED':
					stats.completed++;
					break;
			}
		});

		return stats;
	} catch (error) {
		console.error('获取订单统计失败：', error);
		return {
			pendingPayment: 0,
			pendingDelivery: 0,
			pendingReceipt: 0,
			completed: 0,
		};
	}
};
