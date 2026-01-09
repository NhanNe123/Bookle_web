// categories.js

/**
 * CẤU HÌNH DANH MỤC (SINGLE SOURCE OF TRUTH)
 * Định nghĩa cấu trúc cha-con tại một nơi duy nhất để dễ bảo trì.
 */
export const CATEGORY_CONFIG = {
  'van-hoc-nghe-thuat': {
    display: 'Văn học – Nghệ thuật',
    tabId: 'pills-arts',
    gridId: 'artsGrid',
    children: [
      { id: 'tieu-thuyet', name: 'Tiểu thuyết' },
      { id: 'trinh-tham', name: 'Trinh thám' },
      { id: 'lang-man', name: 'Lãng mạn' },
      { id: 'kinh-di', name: 'Kinh dị' },
      { id: 'tho', name: 'Thơ' },
      { id: 'light-novel', name: 'Light Novel' },
      { id: 'van-hoc-nuoc-ngoai', name: 'Văn học nước ngoài' }
    ]
  },
  'kinh-te-kinh-doanh': {
    display: 'Kinh tế – Kinh doanh',
    tabId: 'pills-business',
    gridId: 'businessGrid',
    children: [
      { id: 'quan-tri', name: 'Quản trị' },
      { id: 'khoi-nghiep', name: 'Khởi nghiệp' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'dau-tu-tai-chinh', name: 'Đầu tư – tài chính' },
      { id: 'ban-hang', name: 'Bán hàng' },
      { id: 'kinh-te-hoc', name: 'Kinh tế học' }
    ]
  },
  'khoa-hoc-cong-nghe': {
    display: 'Khoa học – Công nghệ',
    tabId: 'pills-science-tech',
    gridId: 'scienceTechGrid',
    children: [
      { id: 'khoa-hoc-tu-nhien', name: 'Khoa học tự nhiên' },
      { id: 'cong-nghe-thong-tin', name: 'Công nghệ thông tin' },
      { id: 'ai-machine-learning', name: 'AI – Machine Learning' },
      { id: 'ky-thuat', name: 'Kỹ thuật' },
      { id: 'toan-hoc', name: 'Toán học' }
    ]
  },
  'lich-su-chinh-tri-xa-hoi': {
    display: 'Lịch sử – Chính trị – Xã hội',
    tabId: 'pills-history-politics',
    gridId: 'historyPoliticsGrid',
    children: [
      { id: 'lich-su-the-gioi', name: 'Lịch sử thế giới' },
      { id: 'lich-su-viet-nam', name: 'Lịch sử Việt Nam' },
      { id: 'chinh-tri-phap-luat', name: 'Chính trị – pháp luật' },
      { id: 'triet-hoc', name: 'Triết học' },
      { id: 'xa-hoi-hoc', name: 'Xã hội học' }
    ]
  },
  'tam-ly-ky-nang-song': {
    display: 'Tâm lý – Kỹ năng sống',
    tabId: 'pills-psychology-lifestyle',
    gridId: 'psychologyLifestyleGrid',
    children: [
      { id: 'tam-ly-hoc', name: 'Tâm lý học' },
      { id: 'tam-linh', name: 'Tâm linh' },
      { id: 'ky-nang-giao-tiep', name: 'Kỹ năng giao tiếp' },
      { id: 'phat-trien-ban-than', name: 'Phát triển bản thân' },
      { id: 'thien-song-toi-gian', name: 'Thiền – sống tối giản' }
    ]
  },
  'thieu-nhi-giao-duc': {
    display: 'Thiếu nhi – Giáo dục',
    tabId: 'pills-children-education',
    gridId: 'childrenEducationGrid',
    children: [
      { id: 'truyen-tranh', name: 'Truyện tranh' },
      { id: 'sach-mau', name: 'Sách màu' },
      { id: 'giao-trinh', name: 'Giáo trình' },
      { id: 'sach-hoc-tieng-anh', name: 'Sách học tiếng Anh' },
      { id: 'stem-cho-tre', name: 'STEM cho trẻ' }
    ]
  }
};

// ==========================================
// HELPER FUNCTIONS (TỰ ĐỘNG TRÍCH XUẤT DỮ LIỆU)
// ==========================================

/**
 * Lấy danh sách ID các danh mục con của một nhóm (Dùng để query DB)
 * @param {string} groupKey - Key của nhóm cha (vd: 'van-hoc-nghe-thuat')
 * @returns {Array<string>} - Mảng các ID con (vd: ['tieu-thuyet', 'tho'])
 */
export const getGroupCategoryIds = (groupKey) => {
  const group = CATEGORY_CONFIG[groupKey];
  return group ? group.children.map(child => child.id) : [];
};

/**
 * Lấy danh sách chi tiết (id, name) các danh mục con của một nhóm (Dùng để hiển thị UI)
 * @param {string} groupKey
 * @returns {Array<Object>}
 */
export const getGroupSubcategories = (groupKey) => {
  const group = CATEGORY_CONFIG[groupKey];
  return group ? group.children : [];
};

/**
 * Tìm Group cha dựa trên ID của danh mục con (Reverse mapping)
 * @param {string} childId - ID danh mục con (vd: 'tieu-thuyet')
 * @returns {string|null} - Key của nhóm cha hoặc null
 */
export const getCategoryGroup = (childId) => {
  for (const [groupKey, groupData] of Object.entries(CATEGORY_CONFIG)) {
    if (groupData.children.some(child => child.id === childId)) {
      return groupKey;
    }
  }
  return null;
};

/**
 * Lấy thông tin chi tiết của một sub-category và group cha của nó
 * @param {string} childId
 * @returns {Object|null} - { groupKey, subgroup: {id, name} }
 */
export const getSubgroup = (childId) => {
  for (const [groupKey, groupData] of Object.entries(CATEGORY_CONFIG)) {
    const foundChild = groupData.children.find(child => child.id === childId);
    if (foundChild) {
      return { groupKey, subgroup: foundChild };
    }
  }
  return null;
};

// ==========================================
// TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY)
// ==========================================
// Phần này cực kỳ quan trọng để code cũ (như file products.js) vẫn chạy tốt.

// 1. Map hàm cũ sang hàm mới
export const getGroupCategories = getGroupCategoryIds;

// 2. Tái tạo lại biến CATEGORY_GROUPS cũ từ CATEGORY_CONFIG mới
export const CATEGORY_GROUPS = {};

for (const [key, val] of Object.entries(CATEGORY_CONFIG)) {
  CATEGORY_GROUPS[key] = {
    ...val,
    // Code cũ cần mảng 'dbCategories' là danh sách strings (IDs)
    // Chúng ta map từ 'children' sang để tạo ra nó.
    dbCategories: val.children.map(child => child.id)
  };
}

// 3. Tái tạo lại biến CATEGORY_SUBGROUPS cũ (nếu cần)
export const CATEGORY_SUBGROUPS = {};
for (const [key, val] of Object.entries(CATEGORY_CONFIG)) {
    CATEGORY_SUBGROUPS[key] = val.children;
}