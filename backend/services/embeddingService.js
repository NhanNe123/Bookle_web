/**
 * Tầng Embedding (CPU) — Bookle RAG — Singleton
 *
 * Ghi chú quan trọng (lỗi 404 tokenizer trên Hub Xenova):
 * Repo `Xenova/Qwen3-Embedding-0.6B` trên Hugging Face không có đủ file cho runtime JS
 * (`tokenizer.json` → "Could not locate file"). Vì vậy Bookle dùng **@huggingface/transformers**
 * (Transformers.js chính thức, v4+) với bản ONNX cộng đồng **cùng họ Qwen3 embedding 0.6B**:
 * `onnx-community/Qwen3-Embedding-0.6B-ONNX` (CPU, q8/fp32).
 *
 * Đổi model: `EMBEDDING_TRANSFORMERS_MODEL`. Token: `HF_TOKEN` / `HF_ACCESS_TOKEN`.
 * Mirror / hub tùy chỉnh: `HF_HUB_URL` (phải đúng domain, ví dụ https://hf-mirror.com — tránh typo huggingfface).
 */

import 'dotenv/config';
import { env, pipeline } from '@huggingface/transformers';

/** Mặc định: ONNX Qwen3 0.6B embedding (tải được, tương thích RAG) */
const MODEL_ID =
  (process.env.EMBEDDING_TRANSFORMERS_MODEL || 'onnx-community/Qwen3-Embedding-0.6B-ONNX').trim();

const DTYPE_TRY = ['q8', 'fp32'];

/** Bắt lỗi gõ nhầm domain gây URL lạ (terminal từng hiện huggingfface.co) */
function applyHubFromEnv() {
  const raw = (process.env.HF_HUB_URL || process.env.HF_ENDPOINT || '').trim();
  if (!raw) return;
  const base = raw.replace(/\/$/, '');
  if (/huggingfface|huuggingface|huggingfface/i.test(base)) {
    console.warn(
      '⚠️ [Embedding] HF_HUB_URL có vẻ sai chính tả domain — bỏ qua và dùng hub mặc định (https://huggingface.co/).'
    );
    return;
  }
  env.remoteHost = `${base}/`;
  console.log(`🌐 [Embedding] Hub tùy chỉnh: ${env.remoteHost}`);
}

class EmbeddingServiceSingleton {
  constructor() {
    this._pipe = null;
    this._loadPromise = null;
    this._ready = false;
    /** @type {Error | null} */
    this._initError = null;
  }

  _configureEnv() {
    env.allowRemoteModels = true;
    env.allowLocalModels = true;
    applyHubFromEnv();

    const onnx = env.backends?.onnx;
    if (onnx?.wasm) {
      onnx.wasm.proxy = false;
      const n = Number(process.env.EMBEDDING_WASM_THREADS);
      if (Number.isFinite(n) && n > 0) onnx.wasm.numThreads = n;
    }
  }

  async initialize() {
    if (this._ready) return;
    if (this._loadPromise) {
      await this._loadPromise;
      if (this._initError) throw this._initError;
      return;
    }

    this._loadPromise = (async () => {
      this._initError = null;
      try {
        this._configureEnv();
        console.log(`📥 [Embedding/CPU] Đang tải Singleton: ${MODEL_ID} …`);

        let lastErr;
        for (const dtype of DTYPE_TRY) {
          try {
            this._pipe = await pipeline('feature-extraction', MODEL_ID, { dtype });
            console.log(`✅ [Embedding] dtype=${dtype}`);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e instanceof Error ? e : new Error(String(e));
            console.warn(`⚠️ [Embedding] dtype=${dtype}:`, lastErr.message);
          }
        }
        if (lastErr || !this._pipe) {
          throw lastErr || new Error('Không nạp được pipeline');
        }

        this._ready = true;
        console.log('✅ [Embedding/CPU] Model đã nạp xong (Singleton).');
      } catch (err) {
        let e = err instanceof Error ? err : new Error(String(err));
        const m = e.message;
        if (/401|Unauthorized/i.test(m)) {
          e = new Error(
            `${m}\n[Bookle] Thêm HF_TOKEN (read) vào .env hoặc kiểm tra quyền truy cập repo.`
          );
        }
        if (/Could not locate|404/i.test(m)) {
          e = new Error(
            `${m}\n[Bookle] Kiểm tra EMBEDDING_TRANSFORMERS_MODEL; với Qwen3 ONNX dùng onnx-community/Qwen3-Embedding-0.6B-ONNX.`
          );
        }
        this._initError = e;
        this._pipe = null;
        this._ready = false;
        console.error('❌ [Embedding/CPU]', this._initError.message);
        throw this._initError;
      } finally {
        this._loadPromise = null;
      }
    })();

    await this._loadPromise;
  }

  isReady() {
    return this._ready && !!this._pipe;
  }

  getInitError() {
    return this._initError;
  }

  /**
   * Qwen3-Embedding ONNX: pooling last_token + normalize (không dùng mean như BERT nhỏ).
   */
  async embed(text) {
    if (!this._ready || !this._pipe) {
      await this.initialize();
    }
    const input = String(text || '').trim().slice(0, 8000);
    if (!input) throw new Error('Chuỗi embedding rỗng');

    try {
      const pooling = (process.env.EMBEDDING_POOLING || 'last_token').toLowerCase();
      const valid = ['mean', 'last_token', 'cls', 'none'];
      const p = valid.includes(pooling) ? pooling : 'last_token';

      const out = await this._pipe(input, {
        pooling: p,
        normalize: true,
      });
      const raw = out?.data;
      if (!raw) throw new Error('Pipeline không trả tensor.data');
      return Array.from(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Lỗi embedding: ${msg}`);
    }
  }
}

let singletonInstance = null;

export function getEmbeddingService() {
  if (!singletonInstance) {
    singletonInstance = new EmbeddingServiceSingleton();
  }
  return singletonInstance;
}

export default getEmbeddingService;
