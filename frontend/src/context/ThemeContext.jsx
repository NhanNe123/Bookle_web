import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

/** Khóa localStorage — đồng bộ với public/assets/js/main.js */
export const THEME_STORAGE_KEY = 'bookle_theme';

const DEFAULT_THEME = {
  primaryColor: '#036280',
  secondaryColor: '#FF6500',
  bgColor: '#ffffff',
  textColor: '#4F536C',
  bannerUrl: 'none',
};

const CAMEL_TO_CSS_VAR = {
  primaryColor: '--primary-color',
  secondaryColor: '--secondary-color',
  bgColor: '--bg-color',
  textColor: '--text-color',
  bannerUrl: '--banner-url',
};

/** Chuẩn hoá banner: chấp nhận 'none' | url(...) | đường dẫn tương đối / tuyệt đối */
function normalizeBannerValue(value) {
  if (value == null || value === '' || value === 'none') return 'none';
  const s = String(value).trim();
  if (/^url\s*\(/i.test(s)) return s;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) {
    return `url("${s.replace(/"/g, '\\"')}")`;
  }
  return `url("${s}")`;
}

/** Ghi các biến CSS lên <html> để toàn trang cập nhật tức thì */
export function applyThemeToDocument(theme) {
  const root = document.documentElement;
  if (!root?.style) return;

  const merged = { ...DEFAULT_THEME, ...theme };

  Object.entries(CAMEL_TO_CSS_VAR).forEach(([key, cssName]) => {
    let val = merged[key];
    if (val === undefined || val === null) return;
    if (key === 'bannerUrl') {
      val = normalizeBannerValue(val);
    } else if (typeof val === 'string') {
      val = val.trim();
    }
    root.style.setProperty(cssName, String(val));
  });
}

function loadStoredTheme() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => loadStoredTheme());

  /* Áp dụng biến CSS trước paint để tránh nháy màu */
  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const updateTheme = useCallback((partial) => {
    setTheme((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  const resetTheme = useCallback(() => {
    const next = { ...DEFAULT_THEME };
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setTheme(next);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      updateTheme,
      resetTheme,
    }),
    [theme, updateTheme, resetTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme phải dùng bên trong ThemeProvider');
  }
  return ctx;
}
