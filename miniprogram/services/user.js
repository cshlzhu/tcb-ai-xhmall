/**
 * 用户服务
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
  return { db, _: db.command };
};

/**
 * 获取用户信息
 * PRIVATE 权限下自动按 _openid 过滤，无需显式指定
 */
export const getUserInfo = async () => {
	try {
		if (!isCloudReady()) return null;
		const { db } = getDb();

		const { data } = await db
			.collection('users')
			.get();

		return data[0] || null;
	} catch (error) {
		console.error('获取用户信息失败：', error);
		return null;
	}
};

/**
 * 更新用户信息
 * PRIVATE 权限下 add() 自动设置 _openid，update() 自动限定当前用户
 * @param {Object} userInfo - 微信用户信息
 */
export const updateUserInfo = async (userInfo) => {
	try {
		if (!isCloudReady()) throw new Error('云开发未就绪');
		const { db } = getDb();

		// PRIVATE 权限自动过滤当前用户
		const { data } = await db
			.collection('users')
			.get();

		const userData = {
			nickName: userInfo.nickName || '',
			avatarUrl: userInfo.avatarUrl || '',
			phone: userInfo.phone || '',
			lastLogin: new Date(),
		};

		if (data.length === 0) {
			// 新用户，创建记录（_openid 由系统自动设置）
			return await db.collection('users').add({
				data: {
					...userData,
					createTime: new Date(),
				},
			});
		} else {
			// 更新现有用户信息（PRIVATE 权限自动限定当前用户）
			return await db
				.collection('users')
				.doc(data[0]._id)
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
 * PRIVATE 权限下自动按 _openid 过滤
 */
export const getOrderStats = async () => {
	try {
		if (!isCloudReady()) {
			return { pendingPayment: 0, pendingDelivery: 0, pendingReceipt: 0, completed: 0 };
		}
		const { db } = getDb();

		// PRIVATE 权限自动过滤当前用户订单
		const { data } = await db
			.collection('orders')
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
