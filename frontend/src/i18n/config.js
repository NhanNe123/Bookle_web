import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import tất cả các file JSON
import commonVi from './locales/common.json';
import commonEn from './locales/common.en.json';
import headerVi from './locales/header.json';
import headerEn from './locales/header.en.json';
import footerVi from './locales/footer.json';
import footerEn from './locales/footer.en.json';
import shopVi from './locales/pages/shop.json';
import shopEn from './locales/pages/shop.en.json';
import homeVi from './locales/pages/home.json';
import homeEn from './locales/pages/home.en.json';
import aboutVi from './locales/pages/about.json';
import aboutEn from './locales/pages/about.en.json';
import teamVi from './locales/pages/team.json';
import teamEn from './locales/pages/team.en.json';
import contactVi from './locales/pages/contact.json';
import contactEn from './locales/pages/contact.en.json';
import faqVi from './locales/pages/faq.json';
import faqEn from './locales/pages/faq.en.json';
import newsVi from './locales/pages/news.json';
import newsEn from './locales/pages/news.en.json';
import blogVi from './locales/pages/blog.json';
import blogEn from './locales/pages/blog.en.json';
import authVi from './locales/pages/auth.json';
import authEn from './locales/pages/auth.en.json';
import errorsVi from './locales/pages/errors.json';
import errorsEn from './locales/pages/errors.en.json';

// Hàm merge deep để merge nested objects đúng cách
const deepMerge = (target, source) => {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

const mergeTranslations = (...translations) => {
  return translations.reduce((acc, curr) => deepMerge(acc, curr), {});
};

const viTranslations = mergeTranslations(
  commonVi, headerVi, footerVi, homeVi, shopVi, aboutVi, teamVi, 
  contactVi, faqVi, newsVi, blogVi, authVi, errorsVi
);

const enTranslations = mergeTranslations(
  commonEn, headerEn, footerEn, homeEn, shopEn, aboutEn, teamEn, 
  contactEn, faqEn, newsEn, blogEn, authEn, errorsEn
);

// Lấy ngôn ngữ đã lưu, NẾU KHÔNG CÓ thì mặc định là 'vi'
// Kiểm tra xem có localStorage không (chỉ có trong browser)
const getSavedLang = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem('bookle_language') || 'vi';
    } catch (e) {
      return 'vi';
    }
  }
  return 'vi';
};

const savedLang = getSavedLang();

i18n
  // --- CHÚNG TA XÓA .use(LanguageDetector) ---
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        translation: viTranslations
      },
      en: {
        translation: enTranslations
      }
    },
    
    // ÉP NGÔN NGỮ KHỞI ĐỘNG là 'vi' (hoặc ngôn ngữ đã lưu)
    lng: savedLang, 
    
    // Ngôn ngữ dự phòng nếu 'lng' ở trên bị lỗi
    fallbackLng: 'vi', 
    
    interpolation: {
      escapeValue: false
    },
    
  });

export default i18n;