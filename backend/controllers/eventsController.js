// controllers/eventsController.js
import mongoose from 'mongoose';
import Event from '../models/Event.js';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

/** Tách JSON từ phản hồi model (bỏ markdown ``` nếu có) */
function extractJsonString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fenced) return fenced[1].trim();
  const i = t.indexOf('{');
  const j = t.lastIndexOf('}');
  if (i >= 0 && j > i) return t.slice(i, j + 1);
  return t;
}

function normalizeSuggestionPayload(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
  const theme = parsed.themeConfig && typeof parsed.themeConfig === 'object' ? parsed.themeConfig : {};
  const discount = parsed.discountConfig && typeof parsed.discountConfig === 'object' ? parsed.discountConfig : {};
  const pct = Math.round(Number(discount.discountPercent));
  const slogan =
    typeof parsed.suggestedSlogan === 'string' ? parsed.suggestedSlogan.trim() : '';

  if (!name) return { error: 'Thiếu name trong JSON' };
  const primaryColor = String(theme.primaryColor || '').trim();
  const secondaryColor = String(theme.secondaryColor || '').trim();
  const decorationType = String(theme.decorationType || 'none').trim().toLowerCase();
  if (!/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    return { error: 'primaryColor không hợp lệ (cần #RRGGBB)' };
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
    return { error: 'secondaryColor không hợp lệ (cần #RRGGBB)' };
  }
  if (Number.isNaN(pct) || pct < 0 || pct > 100) {
    return { error: 'discountPercent không hợp lệ' };
  }

  return {
    name,
    themeConfig: {
      primaryColor,
      secondaryColor,
      decorationType: decorationType || 'none',
    },
    discountConfig: {
      discountPercent: pct,
      targetCategories: Array.isArray(discount.targetCategories)
        ? discount.targetCategories.map((x) => String(x).trim()).filter(Boolean)
        : [],
    },
    suggestedSlogan: slogan,
  };
}

/**
 * POST /api/events/suggest — Ollama (Local AI) gợi ý nội dung sự kiện (admin).
 * Body: { prompt: string }
 */
export async function suggestEventDetails(req, res) {
  try {
    const prompt = req.body?.prompt ?? req.body?.idea;
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu prompt (ý tưởng sự kiện)',
      });
    }

    const fullPrompt = `Bạn là một chuyên gia marketing sách (Bookle). Hãy tạo một sự kiện khuyến mãi dựa trên chủ đề: "${String(prompt).trim()}".

Trả về KẾT QUẢ CHỈ BẰNG JSON, KHÔNG CÓ MARKDOWN, KHÔNG GIẢI THÍCH, theo đúng cấu trúc sau:
{
  "name": "Tên sự kiện ngắn gọn hấp dẫn",
  "themeConfig": {
    "primaryColor": "#hex6kytự",
    "secondaryColor": "#hex6kytự",
    "decorationType": "loại_hiệu_ứng",
    "borderRadius": "12px hoặc 16px",
    "fontFamily": "serif cho lễ hội, sans-serif cho ngày thường"
  },
  "discountConfig": {
    "discountPercent": số_nguyên_từ_5_đến_35
  },
  "suggestedSlogan": "Câu slogan tiếng Việt ngắn gọn"
}

Quy tắc bắt buộc:
- discountPercent: số nguyên 5–35
- Màu sắc #RRGGBB phải hợp chủ đề
- decorationType PHẢI chọn ĐÚNG 1 trong các giá trị sau (viết thường, không dấu):
  "snow" = tuyết rơi (dùng cho Giáng sinh, mùa đông)
  "noel" = Noel (cây thông, quà, chuông — Giáng sinh)
  "tet" = Tết Nguyên Đán (hoa mai, lì xì, đèn lồng)
  "sakura" = hoa anh đào (Nhật Bản, mùa xuân)
  "rose" = hoa hồng rơi (8/3, Valentine nữ)
  "hearts" = trái tim (Valentine, tình yêu)
  "teacher" = sách + bút (Ngày nhà giáo 20/11)
  "book" = sách bay (sự kiện sách)
  "firework" = pháo hoa (lễ lớn, năm mới)
  "confetti" = confetti nhiều màu (khai trương, sale lớn)
  "lantern" = đèn lồng bay lên (Trung thu)
  "leaves" = lá rơi (mùa thu)
  "none" = không hiệu ứng`;

    let text;
    try {
      const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: fullPrompt,
          stream: false,
          format: 'json',
        }),
      });

      if (!ollamaRes.ok) {
        const errBody = await ollamaRes.text().catch(() => '');
        console.error('[events] Ollama HTTP', ollamaRes.status, errBody.slice(0, 300));
        return res.status(502).json({
          success: false,
          error: `Ollama trả lỗi HTTP ${ollamaRes.status}`,
        });
      }

      const ollamaData = await ollamaRes.json();
      text = ollamaData.response;
    } catch (fetchErr) {
      console.error('[events] Ollama fetch:', fetchErr.message);
      const isConnection = fetchErr.code === 'ECONNREFUSED' || fetchErr.cause?.code === 'ECONNREFUSED';
      return res.status(500).json({
        success: false,
        error: isConnection
          ? 'Local AI đang tắt, vui lòng bật Ollama (ollama serve)'
          : `Lỗi kết nối Ollama: ${fetchErr.message}`,
      });
    }

    let parsed;
    try {
      const jsonStr = extractJsonString(text);
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[events] JSON parse:', parseErr, text?.slice(0, 500));
      return res.status(502).json({
        success: false,
        error: 'Không đọc được JSON từ AI. Thử lại với mô tả ngắn hơn.',
      });
    }

    const normalized = normalizeSuggestionPayload(parsed);
    if (normalized?.error) {
      return res.status(502).json({
        success: false,
        error: normalized.error,
      });
    }

    return res.status(200).json({
      success: true,
      suggestion: normalized,
    });
  } catch (err) {
    console.error('[events] suggestEventDetails:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi gợi ý sự kiện',
    });
  }
}

/** Dữ liệu public cho frontend — không trả trường nội bộ */
function toActiveEventDTO(doc) {
  if (!doc) return null;
  const o = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    id: o._id,
    name: o.name,
    startDate: o.startDate,
    endDate: o.endDate,
    themeConfig: o.themeConfig || {},
    discountConfig: o.discountConfig || {},
    suggestedSlogan: o.suggestedSlogan || '',
  };
}

function mergeThemeConfig(existing, incoming) {
  const base =
    existing && typeof existing.toObject === 'function'
      ? existing.toObject()
      : { ...existing };
  if (!incoming || typeof incoming !== 'object') {
    return base;
  }
  const pick = (key) => {
    if (incoming[key] === undefined) return base[key];
    const s = String(incoming[key]).trim();
    return s || base[key];
  };
  return {
    primaryColor: pick('primaryColor'),
    secondaryColor: pick('secondaryColor'),
    decorationType: pick('decorationType'),
    textOnPrimary:
      incoming.textOnPrimary !== undefined
        ? (String(incoming.textOnPrimary).trim() || undefined)
        : base.textOnPrimary,
    priceColor:
      incoming.priceColor !== undefined
        ? (String(incoming.priceColor).trim() || undefined)
        : base.priceColor,
    statusSuccessColor:
      incoming.statusSuccessColor !== undefined
        ? (String(incoming.statusSuccessColor).trim() || undefined)
        : base.statusSuccessColor,
  };
}

function mergeDiscountConfig(existing, incoming) {
  if (!incoming || typeof incoming !== 'object') return undefined;
  const base = existing && typeof existing.toObject === 'function' ? existing.toObject() : { ...existing };
  let discountPercent = base.discountPercent ?? 0;
  if (incoming.discountPercent !== undefined) {
    const n = Number(incoming.discountPercent);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      const err = new Error('discountPercent phải từ 0 đến 100');
      err.statusCode = 400;
      throw err;
    }
    discountPercent = n;
  }
  let targetCategories = base.targetCategories || [];
  if (incoming.targetCategories !== undefined) {
    targetCategories = Array.isArray(incoming.targetCategories)
      ? incoming.targetCategories.map((x) => String(x).trim()).filter(Boolean)
      : [];
  }
  return { discountPercent, targetCategories };
}

/**
 * GET /api/events/active — sự kiện đang diễn ra (public).
 * Chọn bản ghi mới nhất theo startDate nếu có nhiều sự kiện chồng lấn.
 */
/**
 * GET /api/events — danh sách sự kiện (admin), mới nhất trước.
 */
export async function listEventsForAdmin(req, res) {
  try {
    const events = await Event.find()
      .sort({ startDate: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({ success: true, events });
  } catch (err) {
    console.error('[events] listEventsForAdmin:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tải danh sách sự kiện',
    });
  }
}

export async function getActiveEvent(req, res) {
  try {
    const now = new Date();
    const doc = await Event.findOne({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ startDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      event: toActiveEventDTO(doc),
    });
  } catch (err) {
    console.error('[events] getActiveEvent:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tải sự kiện',
    });
  }
}

/** POST /api/events — tạo mới (admin) */
export async function createEvent(req, res) {
  try {
    const { name, startDate, endDate, isActive, themeConfig, discountConfig, suggestedSlogan } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu name' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu startDate hoặc endDate',
      });
    }

    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
      return res.status(400).json({ success: false, error: 'Ngày không hợp lệ' });
    }
    if (ed.getTime() < sd.getTime()) {
      return res.status(400).json({
        success: false,
        error: 'Thời gian kết thúc không được nhỏ hơn thời gian bắt đầu',
      });
    }

    let mergedDiscount;
    try {
      mergedDiscount = mergeDiscountConfig({}, { discountPercent: 0, targetCategories: [], ...discountConfig });
    } catch (e) {
      return res.status(e.statusCode || 400).json({
        success: false,
        error: e.message,
      });
    }

    const defaultTheme = {
      primaryColor: '#036280',
      secondaryColor: '#FF6500',
      decorationType: 'none',
    };

    const event = await Event.create({
      name: String(name).trim(),
      startDate: sd,
      endDate: ed,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      themeConfig: mergeThemeConfig(
        defaultTheme,
        themeConfig && typeof themeConfig === 'object' ? themeConfig : {}
      ),
      discountConfig: mergedDiscount,
      suggestedSlogan: suggestedSlogan ? String(suggestedSlogan).trim() : '',
    });

    return res.status(201).json({
      success: true,
      event: event.toObject(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join('; ') || 'Validation lỗi',
      });
    }
    console.error('[events] createEvent:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể tạo sự kiện',
    });
  }
}

/** PUT /api/events/:id — cập nhật (admin) */
export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }

    const doc = await Event.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện' });
    }

    const { name, startDate, endDate, isActive, themeConfig, discountConfig } = req.body || {};
    const hasAny =
      name !== undefined ||
      startDate !== undefined ||
      endDate !== undefined ||
      isActive !== undefined ||
      themeConfig !== undefined ||
      discountConfig !== undefined;

    if (!hasAny) {
      return res.status(400).json({
        success: false,
        error: 'Không có trường nào để cập nhật',
      });
    }

    if (name !== undefined) doc.name = String(name).trim();
    if (startDate !== undefined) {
      const d = new Date(startDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, error: 'startDate không hợp lệ' });
      }
      doc.startDate = d;
    }
    if (endDate !== undefined) {
      const d = new Date(endDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, error: 'endDate không hợp lệ' });
      }
      doc.endDate = d;
    }
    const finalStart = doc.startDate;
    const finalEnd = doc.endDate;
    if (finalEnd.getTime() < finalStart.getTime()) {
      return res.status(400).json({
        success: false,
        error: 'Thời gian kết thúc không được nhỏ hơn thời gian bắt đầu',
      });
    }
    if (isActive !== undefined) doc.isActive = Boolean(isActive);

    if (themeConfig !== undefined) {
      doc.themeConfig = mergeThemeConfig(doc.themeConfig, themeConfig);
    }
    if (discountConfig !== undefined) {
      try {
        doc.discountConfig = mergeDiscountConfig(doc.discountConfig, discountConfig);
      } catch (e) {
        return res.status(e.statusCode || 400).json({
          success: false,
          error: e.message,
        });
      }
    }

    await doc.save();

    return res.status(200).json({
      success: true,
      event: doc.toObject(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {}).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: messages.join('; ') || 'Validation lỗi',
      });
    }
    console.error('[events] updateEvent:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể cập nhật sự kiện',
    });
  }
}

/** DELETE /api/events/:id — xóa vĩnh viễn (admin). */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }
    const doc = await Event.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện' });
    }
    const now = new Date();
    const wasActiveNow =
      Boolean(doc.isActive) &&
      doc.startDate &&
      doc.endDate &&
      doc.startDate <= now &&
      doc.endDate >= now;

    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa sự kiện',
      wasActiveNow,
    });
  } catch (err) {
    console.error('[events] deleteEvent:', err);
    return res.status(500).json({
      success: false,
      error: 'Không thể xóa sự kiện',
    });
  }
}
