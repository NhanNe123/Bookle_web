/**
 * Khởi tạo tập trung cho hệ thống AI Bookle (Singleton embedding + kiểm tra Ollama).
 * Gọi một lần từ server.js TRƯỚC app.listen để không nhận request khi model chưa sẵn sàng.
 */

import axios from 'axios';
import { getEmbeddingService } from './embeddingService.js';

const OLLAMA_BASE = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
/** Kiểm tra Ollama có model qwen2.5:3b (bắt buộc cho Bookle RAG) */
const OLLAMA_MODEL = 'qwen2.5:3b';
const OLLAMA_PING_MS = Number(process.env.OLLAMA_INIT_TIMEOUT_MS) || 15_000;

let _aiReady = false;

export function isAIReady() {
  return _aiReady;
}

/**
 * Nạp embedding CPU (Singleton, transformers.js) + kiểm tra Ollama có phản hồi (model có trong danh sách local).
 * Ném lỗi nếu bước bắt buộc thất bại — server sẽ process.exit.
 */
export async function initAI() {
  if (_aiReady) return;

  // 1) Embedding Singleton
  const embedding = getEmbeddingService();
  await embedding.initialize();

  // 2) Ollama: API /api/tags (nhẹ hơn generate)
  try {
    const { data, status } = await axios.get(`${OLLAMA_BASE}/api/tags`, {
      timeout: OLLAMA_PING_MS,
      validateStatus: () => true,
    });
    if (status < 200 || status >= 300) {
      throw new Error(`Ollama /api/tags trả HTTP ${status}`);
    }
    const names = (data?.models || []).map((m) => m.name || m.model || '').filter(Boolean);
    const shortName = OLLAMA_MODEL.split(':')[0];
    const ok = names.some((n) => n === OLLAMA_MODEL || n.startsWith(`${shortName}:`));
    if (!ok && names.length > 0) {
      console.warn(
        `⚠️ [AI] Chưa thấy model "${OLLAMA_MODEL}" trong Ollama. Có sẵn: ${names.slice(0, 8).join(', ')}… — hãy \`ollama pull ${OLLAMA_MODEL}\``
      );
    } else if (!ok) {
      console.warn('⚠️ [AI] Ollama không trả về danh sách model — vẫn tiếp tục (có thể chưa pull Gemma).');
    } else {
      console.log(`✅ [AI] Ollama OK, model "${OLLAMA_MODEL}" có trong danh sách.`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `[AI] Không kết nối được Ollama tại ${OLLAMA_BASE}: ${msg}. Hãy chạy ollama serve và cài model.`
    );
  }

  _aiReady = true;
  console.log('✅ [AI] initAI() hoàn tất — sẵn sàng nhận request chat.');
}
