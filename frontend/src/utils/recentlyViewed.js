/** Lưu ID sản phẩm (Mongo ObjectId) đã xem — mới nhất lên đầu. */

export const RECENTLY_VIEWED_STORAGE_KEY = 'bookle_recently_viewed_product_ids';
export const RECENTLY_VIEWED_MAX = 20;
/** Cùng tab: sidebar / trang chủ có thể lắng nghe để tải lại danh sách. */
export const RECENTLY_VIEWED_CHANGED_EVENT = 'bookle-recently-viewed-changed';

function isValidObjectId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());
}

export function getRecentlyViewedProductIds() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidObjectId).map((id) => String(id).trim());
  } catch {
    return [];
  }
}

export function recordRecentlyViewedProductId(id) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!isValidObjectId(id)) return;
  const normalized = String(id).trim();
  try {
    const prev = getRecentlyViewedProductIds();
    const next = [normalized, ...prev.filter((x) => x !== normalized)].slice(
      0,
      RECENTLY_VIEWED_MAX
    );
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(next)
    );
    try {
      window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  } catch {
    /* quota / private mode */
  }
}
