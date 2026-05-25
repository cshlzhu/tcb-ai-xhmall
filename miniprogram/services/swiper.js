/**
 * 轮播图数据服务
 */

// 检查云开发是否就绪
const isCloudReady = () => {
  return typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.database === 'function';
};

// 获取轮播图列表
export const getSwiperList = async () => {
  if (!isCloudReady()) {
    console.warn('云开发未就绪，跳过轮播图加载');
    return [];
  }
  try {
    const db = wx.cloud.database()
    const { data } = await db.collection('swipers')
      .orderBy('sort', 'asc')
      .get()
    return data
  } catch (error) {
    console.error('获取轮播图数据失败', error)
    return []
  }
}