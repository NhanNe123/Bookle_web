/** Placeholder trung tính (tỷ lệ 2:3), không dùng ảnh chồng sách / vuông generic */
export const PRODUCT_IMAGE_FALLBACK = '/assets/img/no-book-cover.svg';

/**
 * Encode image URL if it contains special characters (Vietnamese)
 * @param {string} imageUrl - The image URL path
 * @returns {string} - Properly encoded URL
 */
export const encodeImageUrl = (imageUrl) => {
  if (!imageUrl) return PRODUCT_IMAGE_FALLBACK;
  
  // Only encode URLs from /uploads/ directory
  if (imageUrl.startsWith('/uploads/')) {
    // Split the path and encode only the filename part
    const parts = imageUrl.split('/');
    // Encode each part after /uploads/products/
    return parts.map((part, i) => i > 2 ? encodeURIComponent(part) : part).join('/');
  }
  
  return imageUrl;
};

/**
 * Get properly encoded product image URL
 * @param {Array<string>} images - Array of image URLs
 * @param {string} coverImage - Cover image URL fallback
 * @param {string} fallback - Fallback image URL
 * @returns {string} - Encoded image URL
 */
export const getProductImage = (images, coverImage = '', fallback = PRODUCT_IMAGE_FALLBACK) => {
  const rawFromList = Array.isArray(images) ? images.find((x) => typeof x === 'string' && x.trim()) : '';
  const rawFromCover = typeof coverImage === 'string' ? coverImage.trim() : '';
  const rawImage = rawFromList || rawFromCover || fallback;
  return encodeImageUrl(rawImage);
};

// Category mapping: slug -> display name with proper Vietnamese diacritics
export const CATEGORY_MAP = {
  'tieu-thuyet': 'Tiểu Thuyết',
  'thieu-nhi': 'Thiếu Nhi',
  'tham-khao': 'Tham Khảo',
  'khoa-hoc': 'Khoa Học',
  'lich-su': 'Lịch Sử',
  'chinh-tri': 'Chính Trị',
  'cong-nghe': 'Công Nghệ',
  'gia-tuong': 'Giả Tưởng',
  'vien-tuong': 'Viễn Tưởng',
  'lang-man': 'Lãng Mạn',
  'trinh-tham': 'Trinh Thám',
  'kinh-di': 'Kinh Dị',
  'tieu-su': 'Tiểu Sử',
  'phat-trien-ban-than': 'Phát Triển Bản Thân',
  'kinh-doanh': 'Kinh Doanh',
  'ton-giao': 'Tôn Giáo',
  'nau-an': 'Nấu Ăn',
  'nghe-thuat': 'Nghệ Thuật',
  'du-lich': 'Du Lịch',
  'tho': 'Thơ',
  'giao-duc': 'Giáo Dục',
  'luat': 'Luật',
  'kinh-te': 'Kinh Tế',
  'xa-hoi': 'Xã Hội',
  'doi-song': 'Đời Sống',
  'khac': 'Khác'
};

/**
 * Format category slug to display name with proper Vietnamese diacritics
 * @param {string} categorySlug - The category slug (e.g., 'trinh-tham')
 * @returns {string} - Formatted category name (e.g., 'Trinh Thám')
 */
export const formatCategoryName = (categorySlug) => {
  if (!categorySlug) return '';
  
  // Check if we have a mapping
  if (CATEGORY_MAP[categorySlug]) {
    return CATEGORY_MAP[categorySlug];
  }
  
  // Fallback: convert slug to title case and replace hyphens with spaces
  return categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

