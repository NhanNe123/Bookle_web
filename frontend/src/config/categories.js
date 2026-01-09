// Frontend category groups configuration
// Maps category groups to UI display structure

export const CATEGORY_GROUPS = {
  'van-hoc-nghe-thuat': {
    id: 'van-hoc-nghe-thuat',
    name: 'Văn học – Nghệ thuật',
    nameKey: 'shop.categoryGroups.van-hoc-nghe-thuat',
    subcategories: [
      { id: 'tieu-thuyet', name: 'Tiểu thuyết', nameKey: 'shop.categoryNames.tieu-thuyet' },
      { id: 'trinh-tham', name: 'Trinh thám', nameKey: 'shop.categoryNames.trinh-tham' },
      { id: 'lang-man', name: 'Lãng mạn', nameKey: 'shop.categoryNames.lang-man' },
      { id: 'kinh-di', name: 'Kinh dị', nameKey: 'shop.categoryNames.kinh-di' },
      { id: 'tho', name: 'Thơ', nameKey: 'shop.categoryNames.tho' },
      { id: 'light-novel', name: 'Light Novel', nameKey: 'shop.categoryNames.light-novel' },
      { id: 'van-hoc-nuoc-ngoai', name: 'Văn học nước ngoài', nameKey: 'shop.categoryNames.van-hoc-nuoc-ngoai' }
    ]
  },
  'kinh-te-kinh-doanh': {
    id: 'kinh-te-kinh-doanh',
    name: 'Kinh tế – Kinh doanh',
    nameKey: 'shop.categoryGroups.kinh-te-kinh-doanh',
    subcategories: [
      { id: 'quan-tri', name: 'Quản trị', nameKey: 'shop.categoryNames.quan-tri' },
      { id: 'khoi-nghiep', name: 'Khởi nghiệp', nameKey: 'shop.categoryNames.khoi-nghiep' },
      { id: 'marketing', name: 'Marketing', nameKey: 'shop.categoryNames.marketing' },
      { id: 'dau-tu-tai-chinh', name: 'Đầu tư – tài chính', nameKey: 'shop.categoryNames.dau-tu-tai-chinh' },
      { id: 'ban-hang', name: 'Bán hàng', nameKey: 'shop.categoryNames.ban-hang' },
      { id: 'kinh-te-hoc', name: 'Kinh tế học', nameKey: 'shop.categoryNames.kinh-te-hoc' }
    ]
  },
  'khoa-hoc-cong-nghe': {
    id: 'khoa-hoc-cong-nghe',
    name: 'Khoa học – Công nghệ',
    nameKey: 'shop.categoryGroups.khoa-hoc-cong-nghe',
    subcategories: [
      { id: 'khoa-hoc-tu-nhien', name: 'Khoa học tự nhiên', nameKey: 'shop.categoryNames.khoa-hoc-tu-nhien' },
      { id: 'cong-nghe-thong-tin', name: 'Công nghệ thông tin', nameKey: 'shop.categoryNames.cong-nghe-thong-tin' },
      { id: 'ai-machine-learning', name: 'AI – Machine Learning', nameKey: 'shop.categoryNames.ai-machine-learning' },
      { id: 'ky-thuat', name: 'Kỹ thuật', nameKey: 'shop.categoryNames.ky-thuat' },
      { id: 'toan-hoc', name: 'Toán học', nameKey: 'shop.categoryNames.toan-hoc' }
    ]
  },
  'lich-su-chinh-tri-xa-hoi': {
    id: 'lich-su-chinh-tri-xa-hoi',
    name: 'Lịch sử – Chính trị – Xã hội',
    nameKey: 'shop.categoryGroups.lich-su-chinh-tri-xa-hoi',
    subcategories: [
      { id: 'lich-su-the-gioi', name: 'Lịch sử thế giới', nameKey: 'shop.categoryNames.lich-su-the-gioi' },
      { id: 'lich-su-viet-nam', name: 'Lịch sử Việt Nam', nameKey: 'shop.categoryNames.lich-su-viet-nam' },
      { id: 'chinh-tri-phap-luat', name: 'Chính trị – pháp luật', nameKey: 'shop.categoryNames.chinh-tri-phap-luat' },
      { id: 'triet-hoc', name: 'Triết học', nameKey: 'shop.categoryNames.triet-hoc' },
      { id: 'xa-hoi-hoc', name: 'Xã hội học', nameKey: 'shop.categoryNames.xa-hoi-hoc' }
    ]
  },
  'tam-ly-ky-nang-song': {
    id: 'tam-ly-ky-nang-song',
    name: 'Tâm lý – Kỹ năng sống',
    nameKey: 'shop.categoryGroups.tam-ly-ky-nang-song',
    subcategories: [
      { id: 'tam-ly-hoc', name: 'Tâm lý học', nameKey: 'shop.categoryNames.tam-ly-hoc' },
      { id: 'tam-linh', name: 'Tâm linh', nameKey: 'shop.categoryNames.tam-linh' },
      { id: 'ky-nang-giao-tiep', name: 'Kỹ năng giao tiếp', nameKey: 'shop.categoryNames.ky-nang-giao-tiep' },
      { id: 'phat-trien-ban-than', name: 'Phát triển bản thân', nameKey: 'shop.categoryNames.phat-trien-ban-than' },
      { id: 'thien-song-toi-gian', name: 'Thiền – sống tối giản', nameKey: 'shop.categoryNames.thien-song-toi-gian' }
    ]
  },
  'thieu-nhi-giao-duc': {
    id: 'thieu-nhi-giao-duc',
    name: 'Thiếu nhi – Giáo dục',
    nameKey: 'shop.categoryGroups.thieu-nhi-giao-duc',
    subcategories: [
      { id: 'truyen-tranh', name: 'Truyện tranh', nameKey: 'shop.categoryNames.truyen-tranh' },
      { id: 'sach-mau', name: 'Sách màu', nameKey: 'shop.categoryNames.sach-mau' },
      { id: 'giao-trinh', name: 'Giáo trình', nameKey: 'shop.categoryNames.giao-trinh' },
      { id: 'sach-hoc-tieng-anh', name: 'Sách học tiếng Anh', nameKey: 'shop.categoryNames.sach-hoc-tieng-anh' },
      { id: 'stem-cho-tre', name: 'STEM cho trẻ', nameKey: 'shop.categoryNames.stem-cho-tre' }
    ]
  }
};

// Get all category groups as array
export const getCategoryGroups = () => {
  return Object.values(CATEGORY_GROUPS);
};

// Get group by ID
export const getCategoryGroup = (groupId) => {
  return CATEGORY_GROUPS[groupId] || null;
};

// Get all subcategories from all groups
export const getAllSubcategories = () => {
  const allSubcategories = [];
  Object.values(CATEGORY_GROUPS).forEach(group => {
    allSubcategories.push(...group.subcategories);
  });
  return allSubcategories;
};

// Find which group a category belongs to
export const findCategoryGroup = (categoryId) => {
  for (const [groupId, group] of Object.entries(CATEGORY_GROUPS)) {
    const found = group.subcategories.find(sub => sub.id === categoryId);
    if (found) {
      return groupId;
    }
  }
  return null;
};

