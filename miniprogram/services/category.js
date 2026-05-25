/**
 * 商品分类数据服务
 */

// 检查云开发是否就绪
const isCloudReady = () => {
  return typeof wx !== 'undefined' && wx.cloud && typeof wx.cloud.database === 'function';
};

// 云存储图片URL -> 本地图片路径映射（解决私有存储桶403问题）
const CATEGORY_IMAGE_MAP = {
  'drinks.png': '/images/categories/drinks.png',
  'digital.png': '/images/categories/digital.png',
  'fashion.png': '/images/categories/fashion.png',
};

// 将云存储URL转换为本地路径
const resolveImageUrl = (cloudUrl) => {
  if (!cloudUrl) return '';
  // 从URL中提取文件名，如 drinks.png
  const match = cloudUrl.match(/\/([^/]+\.png)$/i);
  if (match && CATEGORY_IMAGE_MAP[match[1]]) {
    return CATEGORY_IMAGE_MAP[match[1]];
  }
  return cloudUrl;
};

// 获取分类列表
export const getCategoryList = async () => {
	if (!isCloudReady()) {
		console.warn('云开发未就绪，跳过分类数据加载');
		return [];
	}
	try {
		const db = wx.cloud.database();
		const { data } = await db.collection('categories').orderBy('sort', 'asc').get();
		// 替换云存储URL为本地路径，避免403
		return data.map(item => ({
			...item,
			imageUrl: resolveImageUrl(item.imageUrl),
		}));
	} catch (error) {
		console.error('获取分类列表数据失败', error);
		return [];
	}
};
