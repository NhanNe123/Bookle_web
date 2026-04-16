const ROOT = () => document.documentElement;

const DEFAULTS = {
  primaryColor: '#036280',
  secondaryColor: '#ff6500',
};

// ── Color utilities ──────────────────────────────────────

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function darken(hex, pct = 15) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - pct / 100;
  return rgbToHex(r * f, g * f, b * f);
}

function lighten(hex, pct = 90) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * pct / 100, g + (255 - g) * pct / 100, b + (255 - b) * pct / 100);
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** YIQ brightness → contrast text color */
export function getContrastYIQ(hex) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#333333' : '#ffffff';
  } catch { return '#ffffff'; }
}

function isDark(hex) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  } catch { return true; }
}

// ── Constants ────────────────────────────────────────────

const FONT_FESTIVE = "'Playfair Display', 'Noto Serif', Georgia, serif";
const FONT_MODERN = "'Inter', system-ui, -apple-system, sans-serif";
const FESTIVE_TYPES = new Set(['noel', 'tet', 'snow', 'lantern', 'rose', 'hearts', 'sakura']);

// ── Compute CSS variables (document root hoặc preview scope) ─

/**
 * Trả về object { '--var-name': value } để gán vào style={...} hoặc setProperty.
 */
export function computeThemeCssVariables(config) {
  if (!config || typeof config !== 'object') config = {};
  const pc = config.primaryColor || DEFAULTS.primaryColor;
  const sc = config.secondaryColor || DEFAULTS.secondaryColor;
  const deco = config.decorationType || 'none';
  const darkMode = isDark(pc) && isDark(sc);
  const isFestive = FESTIVE_TYPES.has(deco);

  const tip =
    typeof config.textOnPrimary === 'string' && /^#[0-9A-Fa-f]{6}$/.test(config.textOnPrimary.trim())
      ? config.textOnPrimary.trim()
      : getContrastYIQ(pc);
  const priceC =
    typeof config.priceColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(config.priceColor.trim())
      ? config.priceColor.trim()
      : '#e67e22';
  const successC =
    typeof config.statusSuccessColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(config.statusSuccessColor.trim())
      ? config.statusSuccessColor.trim()
      : '#16a34a';

  return {
    '--primary-color': pc,
    '--theme': pc,
    '--secondary-color': sc,
    '--theme2': sc,

    '--bg-body': darkMode ? '#121218' : '#ffffff',
    '--bg-card': darkMode ? '#1e1e2e' : '#ffffff',
    '--text-main': darkMode ? '#e8e8ef' : '#0f172a',
    '--text-secondary': darkMode ? '#9ca3af' : '#64748b',
    '--border-color': darkMode ? '#2d2d3d' : '#e2e8f0',

    '--price-color': priceC,
    '--status-success': successC,

    '--primary-hover': darken(pc, 18),
    '--text-on-primary': tip,
    '--text-on-secondary': getContrastYIQ(sc),
    '--primary-contrast': tip,
    '--secondary-contrast': getContrastYIQ(sc),
    '--shadow-color': hexToRgba(pc, 0.1),

    '--card-shadow': `0 8px 28px ${hexToRgba(pc, 0.09)}`,
    '--card-bg': darkMode ? '#1e1e2e' : '#ffffff',
    '--card-text': darkMode ? '#e0e0e0' : '#1a1a2e',
    '--card-radius': config.borderRadius || (isFestive ? '16px' : '12px'),

    '--theme-font': config.fontFamily || (isFestive ? FONT_FESTIVE : FONT_MODERN),

    '--hero-overlay': `linear-gradient(to right, ${hexToRgba(pc, 0.8)}, ${hexToRgba(pc, 0.2)}, transparent)`,

    '--header': darkMode ? '#0a0a12' : '#012e4a',
    '--bg-color': darkMode ? '#121218' : '#ffffff',
    '--text-color': darkMode ? '#9ca3af' : '#4f536c',
  };
}

/** Inline style cho khung preview (React), không đụng tới document. */
export function getPreviewThemeStyle(config) {
  const vars = computeThemeCssVariables(config);
  return {
    ...vars,
    fontFamily: `var(--theme-font), system-ui, sans-serif`,
    isolation: 'isolate',
  };
}

// ── Apply theme ──────────────────────────────────────────

export function applyTheme(config) {
  if (!config || typeof config !== 'object') return;
  const root = ROOT();
  const deco = config.decorationType || 'none';
  const pc = config.primaryColor || DEFAULTS.primaryColor;
  const sc = config.secondaryColor || DEFAULTS.secondaryColor;
  const darkMode = isDark(pc) && isDark(sc);

  const vars = computeThemeCssVariables(config);

  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

  root.dataset.decoration = deco;
  root.dataset.themeDark = darkMode ? 'true' : 'false';
}

// ── Reset ────────────────────────────────────────────────

const ALL_VARS = [
  '--primary-color', '--theme', '--secondary-color', '--theme2',
  '--bg-body', '--bg-card', '--text-main', '--text-secondary', '--border-color',
  '--price-color', '--status-success',
  '--primary-hover', '--text-on-primary', '--text-on-secondary',
  '--primary-contrast', '--secondary-contrast', '--shadow-color',
  '--card-shadow', '--card-bg', '--card-text', '--card-radius',
  '--theme-font', '--hero-overlay', '--header', '--bg-color', '--text-color',
];

export function resetTheme() {
  const root = ROOT();
  ALL_VARS.forEach((v) => root.style.removeProperty(v));
  root.style.setProperty('--primary-color', DEFAULTS.primaryColor);
  root.style.setProperty('--theme', DEFAULTS.primaryColor);
  root.style.setProperty('--secondary-color', DEFAULTS.secondaryColor);
  root.style.setProperty('--theme2', DEFAULTS.secondaryColor);
  root.dataset.decoration = 'none';
  root.dataset.themeDark = 'false';
}

export function getActiveDecoration() {
  return ROOT().dataset.decoration || 'none';
}
