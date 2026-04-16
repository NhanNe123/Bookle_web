// services/aiService.js — Bookle AI tư vấn sách (RAG)
// Tầng 1: Embedding CPU — @huggingface/transformers + ONNX Qwen3, Singleton (embeddingService.js)
// Tầng 2: DB — vector → 3 cuốn, stock>0, projection tối giản (ragVectorSearch.js)
// Tầng 3: Sinh văn bản GPU — Ollama POST /api/generate, model qwen2.5:3b
// Script generateEmbeddings: BOOKLE_EMBEDDING_BACKEND=xenova|python|openai
import axios from 'axios';
import OpenAI from 'openai';
import Product from '../models/Product.js';
import { getEmbeddingService } from './embeddingService.js';
import { retrieveTopProductsByVector } from './ragVectorSearch.js';

// URL service embedding Python (SentenceTransformer / Qwen). Ví dụ: http://127.0.0.1:5001
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL?.trim() || null;

/** Cơ sở URL Ollama (không có dấu / cuối). Mặc định: máy chủ cục bộ. */
const OLLAMA_BASE_URL = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
/** Tầng sinh văn bản — bắt buộc dùng model này theo spec Bookle (tối ưu ~4GB VRAM) */
const OLLAMA_MODEL = 'qwen2.5:3b';
/** Timeout gọi sinh văn bản (ms) — model lớn trên GPU 4GB có thể cần tăng. */
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 120_000;

// OpenAI Embedding (fallback khi không dùng Python service)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ===== KNOWLEDGE BASE =====
const FAMOUS_AUTHORS = {
  // Tác giả Việt Nam
  vietnamese: [
    // Văn học cổ điển
    'nguyễn du', 'hồ xuân hương', 'nguyễn trãi', 'nguyễn bỉnh khiêm', 'lê quý đôn',
    'đoàn thị điểm', 'bà huyện thanh quan', 'cao bá quát', 'nguyễn công trứ',
    // Văn học hiện đại (trước 1945)
    'nam cao', 'ngô tất tố', 'vũ trọng phụng', 'tô hoài', 'thạch lam',
    'nguyễn tuân', 'xuân diệu', 'huy cận', 'chế lan viên', 'hàn mặc tử',
    'nguyên hồng', 'kim lân', 'nguyễn công hoan', 'nhất linh', 'khái hưng',
    'hoàng ngọc phách', 'tự lực văn đoàn', 'thế lữ', 'lưu trọng lư',
    // Văn học sau 1945
    'nguyễn huy thiệp', 'bảo ninh', 'lê minh khuê', 'nguyễn minh châu',
    'ma văn kháng', 'nguyễn khải', 'chu lai', 'hữu thỉnh', 'nguyễn duy',
    'tố hữu', 'phạm tiến duật', 'trần đăng khoa', 'nguyễn đình thi',
    // Tác giả đương đại nổi tiếng
    'nguyễn nhật ánh', 'nguyễn ngọc tư', 'nguyễn phong việt', 'anh khang',
    'hamlet trương', 'iris cao', 'phan ý yên', 'gào', 'dương thụy',
    'nguyễn ngọc thạch', 'hoàng anh tú', 'tony buổi sáng', 'rosie nguyễn',
    'đặng hoàng giang', 'vũ hoàng long', 'nguyễn đông thức', 'di li',
    'phong điệp', 'nguyễn trí', 'nguyễn hải nhật', 'hạ vũ',
    // Tác giả thiếu nhi
    'nguyễn nhật ánh', 'tô hoài', 'phạm hổ', 'võ quảng', 'trần hoài dương',
    // Tác giả tâm lý, kỹ năng sống
    'giản tư trung', 'phan văn trường', 'trịnh thăng bình', 'vũ hồng nam'
  ],
  // Tác giả quốc tế
  international: [
    // Văn học kinh điển phương Tây
    'william shakespeare', 'shakespeare', 'victor hugo', 'charles dickens',
    'jane austen', 'leo tolstoy', 'fyodor dostoevsky', 'dostoevsky',
    'ernest hemingway', 'f. scott fitzgerald', 'mark twain', 'oscar wilde',
    'franz kafka', 'albert camus', 'jean-paul sartre', 'hermann hesse',
    'gabriel garcía márquez', 'george orwell', 'aldous huxley',
    'virginia woolf', 'james joyce', 'marcel proust', 'thomas mann',
    'anton chekhov', 'ivan turgenev', 'nikolai gogol', 'alexander pushkin',
    // Văn học hiện đại
    'haruki murakami', 'murakami', 'paulo coelho', 'khaled hosseini',
    'dan brown', 'john grisham', 'nicholas sparks', 'jojo moyes',
    'colleen hoover', 'sally rooney', 'kazuo ishiguro', 'orhan pamuk',
    'chimamanda ngozi adichie', 'arundhati roy', 'yann martel',
    // Tiểu thuyết trinh thám, kinh dị
    'agatha christie', 'arthur conan doyle', 'conan doyle', 'sherlock holmes',
    'stephen king', 'dean koontz', 'james patterson', 'lee child',
    'gillian flynn', 'stieg larsson', 'jo nesbo', 'dan simmons',
    'edgar allan poe', 'h.p. lovecraft', 'mary shelley', 'bram stoker',
    // Fantasy, Sci-Fi
    'j.k. rowling', 'rowling', 'j.r.r. tolkien', 'tolkien',
    'george r.r. martin', 'brandon sanderson', 'patrick rothfuss',
    'rick riordan', 'cassandra clare', 'sarah j. maas', 'leigh bardugo',
    'isaac asimov', 'arthur c. clarke', 'philip k. dick', 'ray bradbury',
    'ursula k. le guin', 'frank herbert', 'orson scott card', 'neil gaiman',
    // Tác giả Nhật Bản
    'haruki murakami', 'keigo higashino', 'banana yoshimoto', 'yoko ogawa',
    'natsume soseki', 'yukio mishima', 'kenzaburo oe', 'ryu murakami',
    'kotaro isaka', 'kanae minato', 'hideo levy', 'mieko kawakami',
    // Tác giả Trung Quốc
    'kim dung', 'lỗ tấn', 'mạc ngôn', 'lưu từ hân', 'dư hoa',
    'cao hành kiện', 'tào tuyết cần', 'tiền chung thư', 'trương ái linh',
    'cổ long', 'quỳnh dao', 'minh hiểu khê', 'đồng hoa', 'cố mạn',
    // Tác giả Hàn Quốc
    'han kang', 'kim young ha', 'shin kyung sook', 'hwang sok yong',
    // Sách kinh doanh, phát triển bản thân
    'dale carnegie', 'napoleon hill', 'robert kiyosaki', 'adam khoo',
    'robin sharma', 'brian tracy', 'tony robbins', 'stephen covey',
    'tim ferriss', 'james clear', 'atomic habits', 'cal newport',
    'gary vaynerchuk', 'simon sinek', 'seth godin', 'malcolm gladwell',
    'daniel kahneman', 'nassim taleb', 'ray dalio', 'peter thiel',
    'elon musk', 'walter isaacson', 'phil knight', 'howard schultz',
    // Sách tâm lý, tâm linh
    'osho', 'eckhart tolle', 'thich nhat hanh', 'thích nhất hạnh',
    'dalai lama', 'đạt lai lạt ma', 'deepak chopra', 'louise hay',
    'brene brown', 'mark manson', 'jordan peterson', 'daniel goleman',
    'viktor frankl', 'carl jung', 'sigmund freud', 'alfred adler',
    // Sách khoa học
    'stephen hawking', 'richard dawkins', 'carl sagan', 'neil degrasse tyson',
    'michio kaku', 'brian greene', 'yuval noah harari', 'jared diamond',
    'bill bryson', 'oliver sacks', 'steven pinker', 'richard feynman'
  ],
  // Bút danh / tên viết tắt phổ biến
  aliases: {
    'nna': 'nguyễn nhật ánh',
    'jk rowling': 'j.k. rowling',
    'jrr tolkien': 'j.r.r. tolkien',
    'grr martin': 'george r.r. martin',
    'stephen covey': '7 thói quen',
    'kiyosaki': 'robert kiyosaki',
    'carnegie': 'dale carnegie',
    'murakami': 'haruki murakami',
    'christie': 'agatha christie',
    'dostoevsky': 'fyodor dostoevsky',
    'tolstoy': 'leo tolstoy',
    'hugo': 'victor hugo',
    'king': 'stephen king',
    'coelho': 'paulo coelho',
    'hosseini': 'khaled hosseini',
    'orwell': 'george orwell',
    'kafka': 'franz kafka',
    'camus': 'albert camus',
    'higashino': 'keigo higashino',
    'kim dung': 'kim dung',
    'cổ long': 'cổ long'
  }
};

const BOOK_GENRES = {
  'tiểu thuyết': ['romance', 'drama', 'fiction', 'novel'],
  'trinh thám': ['mystery', 'detective', 'thriller', 'crime'],
  'kinh dị': ['horror', 'scary', 'ghost'],
  'khoa học viễn tưởng': ['sci-fi', 'science fiction', 'future'],
  'giả tưởng': ['fantasy', 'magic', 'supernatural'],
  'lãng mạn': ['romance', 'love', 'romantic'],
  'hài hước': ['comedy', 'funny', 'humor'],
  'lịch sử': ['history', 'historical'],
  'hồi ký': ['memoir', 'autobiography', 'biography'],
  'self-help': ['self improvement', 'personal development'],
  'kinh doanh': ['business', 'finance', 'money', 'investment'],
  'tâm lý': ['psychology', 'mindset', 'mental'],
  'triết học': ['philosophy', 'wisdom', 'triet hoc', 'sach triet', 'sách triết', 'triết'],
  'khoa học': ['science', 'physics', 'biology', 'chemistry'],
  'công nghệ': ['technology', 'programming', 'coding', 'it'],
  'thiếu nhi': ['children', 'kids', 'fairy tale'],
  'truyện tranh': ['manga', 'comic', 'manhwa', 'webtoon']
};

/**
 * Chuẩn bị backend embedding trước khi encode hàng loạt (script generateEmbeddings).
 * — xenova: dùng chung Singleton với server chat.
 * — python: chờ /health + /encode.
 */
let _serviceWarmedUp = false;
const warmUpEmbeddingService = async () => {
  const backend = (process.env.BOOKLE_EMBEDDING_BACKEND || 'xenova').toLowerCase();
  if (backend === 'xenova') {
    await getEmbeddingService().initialize();
    _serviceWarmedUp = true;
    console.log('✅ Embedding Singleton (transformers.js) sẵn sàng (warmUp).');
    return;
  }
  if (_serviceWarmedUp || !EMBEDDING_SERVICE_URL) return;
  const base = EMBEDDING_SERVICE_URL.replace(/\/$/, '');
  console.log('🔄 Đang chờ Python embedding service tải model (lần đầu có thể mất vài phút)...');
  const maxWait = 10 * 60 * 1000; // 10 phút tối đa
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${base}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        // Gửi 1 request encode nhỏ để kích model load nếu chưa
        const ctrl2 = new AbortController();
        const timer2 = setTimeout(() => ctrl2.abort(), 5 * 60 * 1000);
        const testRes = await fetch(`${base}/encode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'warmup test' }),
          signal: ctrl2.signal,
        });
        clearTimeout(timer2);
        if (testRes.ok) {
          _serviceWarmedUp = true;
          console.log('✅ Embedding service sẵn sàng!');
          return;
        }
      }
    } catch {
      // service chưa sẵn sàng, chờ thêm
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('Embedding service không phản hồi sau 10 phút. Kiểm tra terminal Python.');
};

/**
 * Gọi Python embedding service (Qwen / gte-Qwen2) để lấy vector cho 1 đoạn văn bản.
 * Có timeout 120s cho mỗi request.
 */
const EMBED_TIMEOUT_MS = 120_000;

const embedViaService = async (text) => {
  const url = EMBEDDING_SERVICE_URL;
  if (!url) throw new Error('EMBEDDING_SERVICE_URL is not set');
  const base = url.replace(/\/$/, '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/encode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text || '' }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response: missing embedding array');
    }
    return data.embedding;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Embedding service timeout (${EMBED_TIMEOUT_MS / 1000}s). Model có thể đang tải hoặc service bị treo.`);
    }
    throw err;
  }
};

/**
 * Build canonical text representation for a product
 * (Tiêu đề + Tác giả + Thể loại + Mô tả) để đưa vào Embedding model.
 */
const buildProductText = (product) => {
  const parts = [];
  if (product.name) parts.push(`Tiêu đề: ${product.name}`);
  if (product.author) parts.push(`Tác giả: ${product.author}`);
  if (Array.isArray(product.categories) && product.categories.length > 0) {
    parts.push(`Thể loại: ${product.categories.join(', ')}`);
  }
  if (product.shortDescription) parts.push(`Tóm tắt: ${product.shortDescription}`);
  else if (product.description) parts.push(`Mô tả: ${product.description}`);

  return parts.join('\n');
};

/**
 * Tạo embedding cho 1 sản phẩm (dùng trong script generateEmbeddings)
 * Ưu tiên: Python service (Qwen) nếu có EMBEDDING_SERVICE_URL, ngược lại OpenAI.
 */
export const generateProductEmbedding = async (product) => {
  const input = buildProductText(product);
  if (!input || !input.trim()) {
    throw new Error('Product has no text content for embedding');
  }

  const backend = (process.env.BOOKLE_EMBEDDING_BACKEND || 'xenova').toLowerCase();

  /** Vector trong DB phải cùng backend (cùng dimension) với query lúc chat */
  if (backend === 'xenova') {
    const svc = getEmbeddingService();
    await svc.initialize();
    return svc.embed(input);
  }

  if (EMBEDDING_SERVICE_URL) {
    return embedViaService(input);
  }

  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('BOOKLE_EMBEDDING_BACKEND=xenova hoặc set EMBEDDING_SERVICE_URL / OPENAI_API_KEY');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input,
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Failed to generate embedding for product');
  }

  return embedding;
};

/**
 * Tạo embedding cho câu hỏi người dùng
 * Ưu tiên: Python service (Qwen), fallback OpenAI.
 */
const embedQuery = async (query) => {
  const text = query.trim();
  if (!text) {
    throw new Error('Empty query for embedding');
  }

  const backend = (process.env.BOOKLE_EMBEDDING_BACKEND || 'xenova').toLowerCase();
  if (backend === 'xenova') {
    const svc = getEmbeddingService();
    await svc.initialize();
    return svc.embed(text);
  }

  if (EMBEDDING_SERVICE_URL) {
    return embedViaService(text);
  }

  if (!openai || !process.env.OPENAI_API_KEY) {
    throw new Error('BOOKLE_EMBEDDING_BACKEND=xenova hoặc set EMBEDDING_SERVICE_URL / OPENAI_API_KEY');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Failed to generate embedding for query');
  }

  return embedding;
};

/**
 * Tính cosine similarity giữa 2 vector
 */
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i] || 0;
    const vb = b[i] || 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (!normA || !normB) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * RAG retrieval: tìm sách theo vector embedding (MongoDB + cosine trong Node)
 * Embedding từ Python service (Qwen) hoặc OpenAI.
 */
const vectorSearchProducts = async (query, { limit = 6 } = {}) => {
  const backend = (process.env.BOOKLE_EMBEDDING_BACKEND || 'xenova').toLowerCase();
  if (
    backend !== 'xenova' &&
    !EMBEDDING_SERVICE_URL &&
    (!openai || !process.env.OPENAI_API_KEY)
  ) {
    throw new Error(
      'Embeddings: BOOKLE_EMBEDDING_BACKEND=xenova hoặc EMBEDDING_SERVICE_URL hoặc OPENAI_API_KEY'
    );
  }

  const queryEmbedding = await embedQuery(query);

  // Lấy tất cả sách có embedding (chỉ trường cần thiết)
  // embedding đang để select:false nên phải bật lại thủ công
  const productsWithEmbedding = await Product.find({
    isAvailable: true,
    embedding: { $exists: true, $ne: [] },
  })
    .select(
      'name slug price compareAtPrice images categories author stock isAvailable rating ratingCount shortDescription language embedding'
    )
    .lean();

  if (!productsWithEmbedding.length) {
    throw new Error('No products with embeddings available');
  }

  const scored = productsWithEmbedding
    .map((p) => ({
      ...p,
      _similarity: cosineSimilarity(queryEmbedding, p.embedding),
    }))
    .filter((p) => p._similarity > 0)
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, limit)
    .map(({ embedding, _similarity, ...rest }) => rest); // bỏ embedding & score khỏi kết quả trả về

  return scored;
};

// Common Vietnamese typos and variations
const TYPO_CORRECTIONS = {
  // Tác giả Việt Nam (không dấu -> có dấu)
  'nguyen nhat anh': 'nguyễn nhật ánh',
  'nna': 'nguyễn nhật ánh',
  'nguyen ngoc tu': 'nguyễn ngọc tư',
  'nguyen phong viet': 'nguyễn phong việt',
  'nam cao': 'nam cao',
  'ngo tat to': 'ngô tất tố',
  'vu trong phung': 'vũ trọng phụng',
  'to hoai': 'tô hoài',
  'nguyen du': 'nguyễn du',
  'xuan dieu': 'xuân diệu',
  'nguyen tuan': 'nguyễn tuân',
  'thach lam': 'thạch lam',
  'bao ninh': 'bảo ninh',
  'nguyen huy thiep': 'nguyễn huy thiệp',
  'tony buoi sang': 'tony buổi sáng',
  'rosie nguyen': 'rosie nguyễn',
  'thich nhat hanh': 'thích nhất hạnh',
  
  // Tác giả quốc tế (viết tắt/sai chính tả)
  'jk rowling': 'j.k. rowling',
  'rowling': 'j.k. rowling',
  'haruki': 'haruki murakami',
  'keigo': 'keigo higashino',
  'stephen hawking': 'stephen hawking',
  'dale carnagie': 'dale carnegie',
  'carnegie': 'dale carnegie',
  'robert kiyosaki': 'robert kiyosaki',
  'kiyosaki': 'robert kiyosaki',
  'adam khoo': 'adam khoo',
  'paulo coehlo': 'paulo coelho',
  'coelho': 'paulo coelho',
  'agata christie': 'agatha christie',
  'christie': 'agatha christie',
  'sherlock': 'arthur conan doyle',
  'tolkein': 'j.r.r. tolkien',
  
  // Thể loại
  'sach hay': 'sách hay',
  'tieu thuyet': 'tiểu thuyết',
  'kinh doanh': 'kinh doanh',
  'tam ly': 'tâm lý',
  'ky nang song': 'kỹ năng sống',
  'truyen tranh': 'truyện tranh',
  'khoa hoc': 'khoa học',
  'lich su': 'lịch sử',
  'van hoc': 'văn học',
  'thieu nhi': 'thiếu nhi',
  'trinh tham': 'trinh thám',
  'kinh di': 'kinh dị',
  'ngon tinh': 'ngôn tình',
  'light novel': 'light novel',
  'manga': 'manga',
  'triet hoc': 'triết học',
  'sach triet': 'sách triết',
  'triet': 'triết',
  
  // Từ khóa chung
  're': 'rẻ',
  'dat': 'đắt',
  'moi': 'mới',
  'cu': 'cũ',
  'hay': 'hay',
  'tot': 'tốt',
  'dep': 'đẹp',
  'hot': 'hot',
  'ban chay': 'bán chạy',
  'giam gia': 'giảm giá',
  'khuyen mai': 'khuyến mãi'
};

/**
 * Correct common Vietnamese typos
 */
const correctTypos = (query) => {
  let corrected = query.toLowerCase();
  for (const [typo, correct] of Object.entries(TYPO_CORRECTIONS)) {
    corrected = corrected.replace(new RegExp(typo, 'gi'), correct);
  }
  return corrected;
};

/**
 * Check if a name matches any famous author
 */
const matchFamousAuthor = (name) => {
  const lowerName = name.toLowerCase().trim();
  
  // Check aliases first
  if (FAMOUS_AUTHORS.aliases && FAMOUS_AUTHORS.aliases[lowerName]) {
    return FAMOUS_AUTHORS.aliases[lowerName];
  }
  
  const allAuthors = [...FAMOUS_AUTHORS.vietnamese, ...FAMOUS_AUTHORS.international];
  
  for (const author of allAuthors) {
    // Exact match
    if (lowerName === author) return author;
    // Partial match
    if (author.includes(lowerName) || lowerName.includes(author)) {
      return author;
    }
    // Check if name contains key parts of author name
    const nameParts = lowerName.split(/\s+/);
    const authorParts = author.split(/\s+/);
    const matchingParts = nameParts.filter(p => authorParts.some(ap => ap.includes(p) || p.includes(ap)));
    if (matchingParts.length >= Math.min(2, authorParts.length - 1)) {
      return author;
    }
    
    // Check last name match (cho tên nước ngoài)
    const lastName = authorParts[authorParts.length - 1];
    if (lowerName === lastName && lastName.length > 3) {
      return author;
    }
  }
  
  // Check aliases with partial match
  if (FAMOUS_AUTHORS.aliases) {
    for (const [alias, fullName] of Object.entries(FAMOUS_AUTHORS.aliases)) {
      if (lowerName.includes(alias) || alias.includes(lowerName)) {
        return fullName;
      }
    }
  }
  
  return null;
};

/**
 * Extract author name from query
 * Handles patterns like: "sách của X", "tác giả X", "X viết", etc.
 */
const extractAuthorFromQuery = (query) => {
  const lowerQuery = correctTypos(query);
  
  // Check for famous author names directly in query
  const allAuthors = [...FAMOUS_AUTHORS.vietnamese, ...FAMOUS_AUTHORS.international];
  for (const author of allAuthors) {
    if (lowerQuery.includes(author)) {
      return author;
    }
  }
  
  // Pattern 1: "sách của [tên tác giả]"
  let match = query.match(/sách\s+(?:của|do)\s+(.+?)(?:\s*$|\s+(?:hay|giá|dưới|trên|về))/i);
  if (match) {
    const found = matchFamousAuthor(match[1].trim());
    return found || match[1].trim();
  }
  
  // Pattern 2: "của [tên tác giả]"
  match = query.match(/của\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:\s*$|\s+(?:hay|giá|có))/i);
  if (match && match[1].trim().length > 2) {
    const found = matchFamousAuthor(match[1].trim());
    return found || match[1].trim();
  }
  
  // Pattern 3: "tác giả [tên]"
  match = query.match(/tác\s*giả\s+(.+?)(?:\s*$|\s+(?:có|viết|hay))/i);
  if (match) {
    const found = matchFamousAuthor(match[1].trim());
    return found || match[1].trim();
  }
  
  // Pattern 4: "[tên] viết"
  match = query.match(/([A-ZÀ-Ỹa-zà-ỹ\s]+?)\s+viết/i);
  if (match && match[1].trim().length > 2) {
    const found = matchFamousAuthor(match[1].trim());
    return found || match[1].trim();
  }
  
  // Pattern 5: Direct author name detection (proper Vietnamese names - starts with capital)
  // Check if query looks like a name (2-4 words, each capitalized)
  const words = query.trim().split(/\s+/);
  if (words.length >= 2 && words.length <= 5) {
    const looksLikeName = words.every(w => /^[A-ZÀ-Ỹ]/.test(w));
    if (looksLikeName) {
      const found = matchFamousAuthor(query.trim());
      return found || query.trim();
    }
  }
  
  return null;
};

/**
 * Extract book name from query
 * Handles patterns like: "sách [tên sách]", "cuốn [tên sách]", "[tên sách]"
 */
const extractBookNameFromQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Pattern 1: "sách [tên sách]" or "cuốn [tên sách]"
  let match = query.match(/(?:sách|cuốn|quyển)\s+["']?([^"']+?)["']?(?:\s*$|\s+(?:của|giá|hay))/i);
  if (match) return match[1].trim();
  
  // Pattern 2: Text in quotes
  match = query.match(/["']([^"']+)["']/);
  if (match) return match[1].trim();
  
  // Pattern 3: "tìm [tên sách]"
  match = query.match(/tìm\s+(.+?)(?:\s*$|\s+(?:của|giá|hay))/i);
  if (match) {
    const result = match[1].trim();
    // Exclude common words
    const excludeWords = ['sách', 'cuốn', 'cho', 'tôi', 'thể', 'loại'];
    if (!excludeWords.some(w => result.toLowerCase().startsWith(w))) {
      return result;
    }
  }
  
  return null;
};

/**
 * Analyze user intent from query and conversation history
 */
const analyzeIntent = (query, conversationHistory = []) => {
  const lowerQuery = correctTypos(query.toLowerCase());
  
  // Check for follow-up questions
  const isFollowUp = conversationHistory.length > 0 && (
    lowerQuery.includes('còn') ||
    lowerQuery.includes('thêm') ||
    lowerQuery.includes('khác') ||
    lowerQuery.includes('nữa') ||
    lowerQuery.includes('tương tự') ||
    lowerQuery.includes('giống') ||
    lowerQuery.includes('như vậy') ||
    lowerQuery.includes('cái đó') ||
    lowerQuery.includes('cuốn đó') ||
    lowerQuery.includes('sách đó') ||
    lowerQuery.match(/^(vậy|thế|ừ|ok|được|có)/)
  );
  
  // Check for author search
  const isAuthorSearch = lowerQuery.includes('tác giả') ||
                        lowerQuery.includes('của ') ||
                        lowerQuery.match(/\s+viết/) ||
                        matchFamousAuthor(lowerQuery) !== null;
  
  // Check for book name search
  const isBookSearch = lowerQuery.includes('sách ') ||
                      lowerQuery.includes('cuốn ') ||
                      lowerQuery.includes('quyển ') ||
                      query.includes('"') ||
                      query.includes("'");
  
  // Check for comparison/recommendation questions
  const isComparison = lowerQuery.includes('so sánh') || 
                       lowerQuery.includes('nên mua') ||
                       lowerQuery.includes('nên chọn') ||
                       lowerQuery.includes('hay hơn') ||
                       lowerQuery.includes('tốt hơn');
  
  // Check for detail questions
  const isDetailQuestion = lowerQuery.includes('nói thêm') ||
                          lowerQuery.includes('chi tiết') ||
                          lowerQuery.includes('về sách') ||
                          lowerQuery.includes('nội dung') ||
                          lowerQuery.includes('tóm tắt');
  
  // Check for greeting
  const isGreeting = lowerQuery.match(/^(xin chào|chào|hi|hello|hey|ê|ơi|yo)/);
  
  // Check for thanks
  const isThanks = lowerQuery.match(/(cảm ơn|cám ơn|thanks|thank you|tks|cmon)/);
  
  // Check for price-related queries
  const isPriceQuery = lowerQuery.match(/(giá|rẻ|đắt|tiền|dưới|trên|từ|đến|khoảng|tầm|\d+k|\d+\.?\d*\s*(nghìn|ngàn|triệu|tr|đ|vnd))/);
  
  // Check for rating-related queries
  const isRatingQuery = lowerQuery.match(/(sao|đánh giá|rating|hay|tốt|bán chạy|nổi tiếng|phổ biến|hot)/);
  
  // Check for recommendation request
  const isRecommendation = lowerQuery.match(/(gợi ý|đề xuất|recommend|suggest|giới thiệu|nên đọc|nên mua|hay nhất|tốt nhất)/);
  
  // Check for language preference
  const isLanguageQuery = lowerQuery.match(/(tiếng việt|việt nam|tiếng anh|english|ngoại ngữ|nước ngoài|dịch)/);
  
  // Check for specific genre
  let detectedGenre = null;
  for (const [genre, keywords] of Object.entries(BOOK_GENRES)) {
    if (lowerQuery.includes(genre) || keywords.some(k => lowerQuery.includes(k))) {
      detectedGenre = genre;
      break;
    }
  }
  
  // Check for negative sentiment (complaints, issues)
  const isNegative = lowerQuery.match(/(không tìm thấy|không có|hết hàng|không thấy|lỗi|sai|chán)/);
  
  // Check for help request
  const isHelp = lowerQuery.match(/(giúp|help|hướng dẫn|cách|làm sao|như thế nào|thế nào)/);
  
  return {
    isFollowUp,
    isAuthorSearch,
    isBookSearch,
    isComparison,
    isDetailQuestion,
    isGreeting,
    isThanks,
    isPriceQuery,
    isRatingQuery,
    isRecommendation,
    isLanguageQuery,
    isNegative,
    isHelp,
    detectedGenre
  };
};

/**
 * Extract context from conversation history
 */
const extractContextFromHistory = (conversationHistory = []) => {
  if (conversationHistory.length === 0) return null;
  
  // Find the last search query and results mentioned
  let lastCategory = null;
  let lastPriceRange = null;
  let lastAuthor = null;
  let mentionedBooks = [];
  
  for (const msg of conversationHistory) {
    const content = msg.content.toLowerCase();
    
    // Extract categories
    const categories = ['tiểu thuyết', 'kinh doanh', 'khoa học', 'thiếu nhi', 'tâm lý', 'lịch sử', 'truyện tranh', 'văn học'];
    for (const cat of categories) {
      if (content.includes(cat)) lastCategory = cat;
    }
    
    // Extract price mentions
    const priceMatch = content.match(/(\d+)\s*(k|nghìn|ngàn|triệu)/i);
    if (priceMatch) {
      let price = parseInt(priceMatch[1]);
      if (priceMatch[2].toLowerCase() === 'triệu') price *= 1000000;
      else price *= 1000;
      lastPriceRange = price;
    }
    
    // Extract author mentions  
    const authorMatch = content.match(/tác giả[:\s]*([^,.\n]+)/i);
    if (authorMatch) lastAuthor = authorMatch[1].trim();
  }
  
  return {
    lastCategory,
    lastPriceRange,
    lastAuthor,
    mentionedBooks
  };
};

/**
 * Parse price from Vietnamese text
 */
const parsePrice = (text) => {
  const lowerText = text.toLowerCase();
  
  // Match patterns like: 100k, 100K, 100 nghìn, 100.000, 100000, 1tr, 1 triệu
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*tr(?:iệu)?/i, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*k/i, multiplier: 1000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:nghìn|ngàn)/i, multiplier: 1000 },
    { regex: /(\d{1,3}(?:\.\d{3})+)(?:\s*đ|vnd)?/i, multiplier: 1, isFormatted: true },
    { regex: /(\d+)(?:\s*đ|vnd|\s*$)/i, multiplier: 1 }
  ];
  
  for (const { regex, multiplier, isFormatted } of patterns) {
    const match = lowerText.match(regex);
    if (match) {
      let num = isFormatted 
        ? parseFloat(match[1].replace(/\./g, ''))
        : parseFloat(match[1]);
      return num * multiplier;
    }
  }
  
  return null;
};

/**
 * Extract price range from query
 */
const extractPriceRange = (query) => {
  const lowerQuery = query.toLowerCase();
  let minPrice = null;
  let maxPrice = null;
  
  // "từ X đến Y"
  const rangeMatch = lowerQuery.match(/từ\s*(\d+[^\s]*)\s*(?:đến|tới|-)\s*(\d+[^\s]*)/i);
  if (rangeMatch) {
    minPrice = parsePrice(rangeMatch[1]);
    maxPrice = parsePrice(rangeMatch[2]);
    return { minPrice, maxPrice };
  }
  
  // "khoảng X", "tầm X"
  const aroundMatch = lowerQuery.match(/(?:khoảng|tầm|around)\s*(\d+[^\s]*)/i);
  if (aroundMatch) {
    const price = parsePrice(aroundMatch[1]);
    if (price) {
      return { minPrice: price * 0.7, maxPrice: price * 1.3 };
    }
  }
  
  // "dưới X", "under X"
  const underMatch = lowerQuery.match(/(?:dưới|under|<|ít hơn)\s*(\d+[^\s]*)/i);
  if (underMatch) {
    maxPrice = parsePrice(underMatch[1]);
    return { minPrice: null, maxPrice };
  }
  
  // "trên X", "over X"
  const overMatch = lowerQuery.match(/(?:trên|over|>|hơn)\s*(\d+[^\s]*)/i);
  if (overMatch) {
    minPrice = parsePrice(overMatch[1]);
    return { minPrice, maxPrice: null };
  }
  
  // Just number with context
  if (lowerQuery.includes('rẻ') || lowerQuery.includes('giá tốt')) {
    maxPrice = 100000;
  } else if (lowerQuery.includes('đắt') || lowerQuery.includes('cao cấp') || lowerQuery.includes('premium')) {
    minPrice = 300000;
  }
  
  return { minPrice, maxPrice };
};

/**
 * Smart keyword search - tìm kiếm thông minh theo từ khóa
 */
export const smartSearch = async (query, options = {}) => {
  try {
    const {
      limit = 6,
      filter = { isAvailable: true },
      context = null
    } = options;

    // Apply typo correction
    const correctedQuery = correctTypos(query);
    const lowerQuery = correctedQuery.toLowerCase();
    const intent = analyzeIntent(query, []);
    
    let searchFilter = { ...filter };
    let sortOption = { rating: -1, ratingCount: -1, createdAt: -1 };
    let searchType = 'general';
    
    console.log(`🧠 Intent analysis:`, JSON.stringify(intent, null, 2));
    
    // ===== PRIORITY 1: Author search =====
    const extractedAuthor = extractAuthorFromQuery(query);
    if (extractedAuthor) {
      // Use flexible regex for author matching
      const authorParts = extractedAuthor.split(/\s+/);
      if (authorParts.length > 1) {
        // Multi-word author name - match any part
        searchFilter.author = { $regex: authorParts.join('.*'), $options: 'i' };
      } else {
        searchFilter.author = { $regex: extractedAuthor, $options: 'i' };
      }
      searchType = 'author';
      console.log(`🔍 Searching by author: "${extractedAuthor}"`);
    }
    
    // ===== PRIORITY 2: Genre detection (đặt TRƯỚC book name để "sách trinh thám" tìm theo genre, không tìm tên) =====
    if (intent.detectedGenre && searchType !== 'author') {
      const genreToSlugs = {
        'tiểu thuyết': ['tieu-thuyet', 'van-hoc-nuoc-ngoai'],
        'trinh thám': ['trinh-tham'],
        'kinh dị': ['kinh-di'],
        'khoa học viễn tưởng': ['khoa-hoc-tu-nhien'],
        'giả tưởng': ['light-novel'],
        'lãng mạn': ['lang-man'],
        'lịch sử': ['lich-su-the-gioi', 'lich-su-viet-nam'],
        'self-help': ['phat-trien-ban-than', 'ky-nang-giao-tiep'],
        'kinh doanh': ['quan-tri', 'khoi-nghiep', 'marketing', 'ban-hang', 'kinh-te-hoc'],
        'tâm lý': ['tam-ly-hoc', 'phat-trien-ban-than'],
        'khoa học': ['khoa-hoc-tu-nhien', 'toan-hoc'],
        'công nghệ': ['cong-nghe-thong-tin', 'ai-machine-learning'],
        'thiếu nhi': ['truyen-tranh', 'sach-mau', 'stem-cho-tre'],
        'truyện tranh': ['truyen-tranh'],
        'triết học': ['triet-hoc'],
        'hồi ký': ['tieu-thuyet'],
        'hài hước': ['tieu-thuyet'],
      };
      const slugs = genreToSlugs[intent.detectedGenre];
      if (slugs) {
        searchFilter.categories = { $in: slugs };
        searchType = 'genre';
        console.log(`🔍 Searching by genre: "${intent.detectedGenre}" → slugs: [${slugs.join(', ')}]`);
      }
    }

    // ===== PRIORITY 2b: Book name search (chỉ khi chưa tìm theo genre/author) =====
    if (searchType === 'general') {
      const extractedBookName = extractBookNameFromQuery(query);
      if (extractedBookName) {
        searchFilter.name = { $regex: extractedBookName, $options: 'i' };
        searchType = 'book_name';
        console.log(`🔍 Searching by book name: "${extractedBookName}"`);
      }
    }
    
    // ===== PRIORITY 3: Use context from conversation =====
    if (searchType === 'general' && context) {
      if (context.lastCategory && (lowerQuery.includes('thêm') || lowerQuery.includes('khác') || lowerQuery.includes('nữa'))) {
        const contextSlugs = {
          'tiểu thuyết': ['tieu-thuyet', 'van-hoc-nuoc-ngoai'],
          'văn học': ['tieu-thuyet', 'van-hoc-nuoc-ngoai'],
          'kinh doanh': ['quan-tri', 'khoi-nghiep', 'marketing', 'ban-hang'],
          'khoa học': ['khoa-hoc-tu-nhien', 'toan-hoc'],
          'thiếu nhi': ['truyen-tranh', 'sach-mau'],
          'tâm lý': ['tam-ly-hoc', 'phat-trien-ban-than'],
          'lịch sử': ['lich-su-the-gioi', 'lich-su-viet-nam'],
          'truyện tranh': ['truyen-tranh'],
          'trinh thám': ['trinh-tham'],
          'triết học': ['triet-hoc'],
        };
        if (contextSlugs[context.lastCategory]) {
          searchFilter.categories = { $in: contextSlugs[context.lastCategory] };
          searchType = 'category_followup';
        }
      }
      if (context.lastPriceRange && lowerQuery.includes('rẻ hơn')) {
        searchFilter.price = { $lt: context.lastPriceRange };
      }
      if (context.lastAuthor && (lowerQuery.includes('tác giả') || lowerQuery.includes('cùng'))) {
        searchFilter.author = { $regex: context.lastAuthor, $options: 'i' };
        searchType = 'author_followup';
      }
    }
    
    // ===== PRIORITY 4: Price filter (improved) =====
    const priceRange = extractPriceRange(query);
    if (priceRange.minPrice || priceRange.maxPrice) {
      searchFilter.price = {};
      if (priceRange.minPrice) searchFilter.price.$gte = priceRange.minPrice;
      if (priceRange.maxPrice) searchFilter.price.$lte = priceRange.maxPrice;
      console.log(`💰 Price filter: ${priceRange.minPrice || 0} - ${priceRange.maxPrice || '∞'}`);
    }
    
    // ===== PRIORITY 5: Rating filter (improved) =====
    if (intent.isRatingQuery) {
      const ratingMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*sao/);
      if (ratingMatch && parseFloat(ratingMatch[1]) <= 5) {
        searchFilter.rating = { $gte: parseFloat(ratingMatch[1]) };
      } else if (lowerQuery.match(/(hay|tốt|đánh giá cao|best|top)/)) {
        searchFilter.rating = { $gte: 4 };
      }
    }
    
    // ===== PRIORITY 6: Hot/New/Featured sorting (improved) =====
    if (lowerQuery.includes('hot') || lowerQuery.includes('bán chạy') || lowerQuery.includes('phổ biến') || lowerQuery.includes('nổi tiếng')) {
      sortOption = { ratingCount: -1, rating: -1 };
      if (!searchFilter.rating) searchFilter.rating = { $gte: 3.5 };
    } else if (lowerQuery.includes('mới nhất') || lowerQuery.includes('mới ra') || lowerQuery.includes('latest')) {
      sortOption = { createdAt: -1 };
    } else if (lowerQuery.includes('giá thấp') || lowerQuery.includes('rẻ nhất')) {
      sortOption = { price: 1 };
    } else if (lowerQuery.includes('giá cao') || lowerQuery.includes('đắt nhất')) {
      sortOption = { price: -1 };
    }
    
    // ===== PRIORITY 7: Language filter =====
    if (intent.isLanguageQuery) {
      if (lowerQuery.match(/(tiếng việt|việt nam|sách việt)/)) {
        searchFilter.language = 'vi';
      } else if (lowerQuery.match(/(tiếng anh|english|sách anh)/)) {
        searchFilter.language = 'en';
      }
    }
    
    // (Genre detection đã xử lý ở PRIORITY 2)
    
    // ===== PRIORITY 9: Category mapping (slug) =====
    if (searchType === 'general' && !searchFilter.categories) {
      const keywordToSlugs = {
        'tiểu thuyết': ['tieu-thuyet', 'van-hoc-nuoc-ngoai'],
        'văn học': ['tieu-thuyet', 'van-hoc-nuoc-ngoai', 'tho'],
        'kinh doanh': ['quan-tri', 'khoi-nghiep', 'marketing', 'ban-hang'],
        'kinh tế': ['kinh-te-hoc', 'dau-tu-tai-chinh'],
        'đầu tư': ['dau-tu-tai-chinh'],
        'marketing': ['marketing', 'ban-hang'],
        'khoa học': ['khoa-hoc-tu-nhien', 'toan-hoc'],
        'thiếu nhi': ['truyen-tranh', 'sach-mau', 'stem-cho-tre'],
        'trẻ em': ['truyen-tranh', 'sach-mau', 'stem-cho-tre'],
        'tâm lý': ['tam-ly-hoc', 'phat-trien-ban-than'],
        'kỹ năng': ['ky-nang-giao-tiep', 'phat-trien-ban-than'],
        'phát triển bản thân': ['phat-trien-ban-than', 'ky-nang-giao-tiep'],
        'lịch sử': ['lich-su-the-gioi', 'lich-su-viet-nam'],
        'truyện tranh': ['truyen-tranh'],
        'manga': ['truyen-tranh'],
        'comic': ['truyen-tranh'],
        'light novel': ['light-novel'],
        'giáo dục': ['giao-trinh', 'sach-hoc-tieng-anh'],
        'ngoại ngữ': ['sach-hoc-tieng-anh'],
        'tiếng anh': ['sach-hoc-tieng-anh'],
        'self-help': ['phat-trien-ban-than', 'ky-nang-giao-tiep'],
        'trinh thám': ['trinh-tham'],
        'kinh điển': ['van-hoc-nuoc-ngoai', 'tieu-thuyet'],
        'ngôn tình': ['lang-man'],
        'triết học': ['triet-hoc'],
        'chính trị': ['chinh-tri-phap-luat'],
        'tôn giáo': ['tam-linh', 'thien-song-toi-gian'],
      };

      for (const [key, slugs] of Object.entries(keywordToSlugs)) {
        if (lowerQuery.includes(key)) {
          searchFilter.categories = { $in: slugs };
          searchType = 'category';
          console.log(`🔍 Category mapping: "${key}" → [${slugs.join(', ')}]`);
          break;
        }
      }
    }
    
    // ===== PRIORITY 10: General keyword search =====
    if (searchType === 'general' && !searchFilter.author && !searchFilter.name && !searchFilter.categories) {
      // Filter out common words
      const stopWords = ['sách', 'tìm', 'cho', 'tôi', 'muốn', 'cần', 'có', 'những', 'cuốn', 'quyển', 'về', 'của', 'và', 'hay', 'tốt', 'đẹp', 'giá', 'nào', 'gì', 'đi', 'nhé', 'ạ', 'với', 'thì', 'là', 'được', 'xin', 'hãy', 'bạn'];
      const keywords = lowerQuery.split(/\s+/).filter(k => !stopWords.includes(k) && k.length > 1);
      
      if (keywords.length > 0) {
        // Try exact phrase match first, then individual keywords
        const searchPhrase = keywords.join(' ');
        searchFilter.$or = [
          { name: { $regex: searchPhrase, $options: 'i' } },
          { author: { $regex: searchPhrase, $options: 'i' } },
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { author: { $regex: keywords.join('|'), $options: 'i' } },
          { shortDescription: { $regex: keywords.join('|'), $options: 'i' } },
          { categories: { $regex: keywords.join('|'), $options: 'i' } },
          { genres: { $regex: keywords.join('|'), $options: 'i' } }
        ];
      }
    }

    console.log(`🔍 Search filter:`, JSON.stringify(searchFilter, null, 2));

    let products = await Product.find(searchFilter)
      .sort(sortOption)
      .limit(limit)
      .select('name slug price compareAtPrice images categories author stock isAvailable rating ratingCount shortDescription language')
      .lean();

    // If no results and we have an author filter, try broader search
    if (products.length === 0 && extractedAuthor) {
      console.log(`🔄 No results, trying broader author search...`);
      const broaderFilter = { ...filter };
      const authorWords = extractedAuthor.split(/\s+/);
      broaderFilter.$or = authorWords.map(word => ({
        author: { $regex: word, $options: 'i' }
      }));
      
      products = await Product.find(broaderFilter)
        .sort(sortOption)
        .limit(limit)
        .select('name slug price compareAtPrice images categories author stock isAvailable rating ratingCount shortDescription language')
        .lean();
    }
    
    // If still no results and we have keywords, try even broader
    if (products.length === 0 && searchType === 'general') {
      console.log(`🔄 No results, trying without strict filters...`);
      const fallbackProducts = await Product.find({ isAvailable: true })
        .sort({ rating: -1, ratingCount: -1 })
        .limit(limit)
        .select('name slug price compareAtPrice images categories author stock isAvailable rating ratingCount shortDescription language')
        .lean();
      
      if (fallbackProducts.length > 0) {
        return fallbackProducts;
      }
    }

    console.log(`📚 Found ${products.length} products`);
    
    return products;
  } catch (error) {
    console.error('Error in smart search:', error);
    throw error;
  }
};

// ===== OLLAMA — Tầng sinh văn bản (GPU), axios → /api/generate =====

/** System prompt cố định: chỉ tư vấn theo Context, không bịa */
const BOOKLE_SYSTEM_PROMPT = `Bạn là nhân viên tư vấn sách của nhà sách trực tuyến Bookle — chuyên nghiệp, nhiệt tình, thân thiện.
Bạn trả lời bằng tiếng Việt tự nhiên, mượt mà, súc tích (khoảng 3–8 câu).
Tuyệt đối chỉ giới thiệu và nhận xét dựa trên danh sách sách trong phần Context được cung cấp bên dưới.
Không được bịa tên sách, tác giả, giá hoặc mô tả không có trong Context.
Nếu Context rỗng hoặc không có cuốn nào phù hợp, hãy nói rõ là hiện không có dữ liệu sách phù hợp trong kho và mời khách mô tả thêm nhu cầu hoặc xem danh mục cửa hàng.`;

/** Giới hạn ký tự mô tả trang sách đưa vào prompt (tránh vượt context Qwen2.5 3B) */
const MAX_PRODUCT_PAGE_DESC_CHARS = 10_000;

/**
 * Nạp sản phẩm từ DB để làm ngữ cảnh trang chi tiết (slug hoặc _id).
 */
async function loadProductForPageContext(rawId) {
  const id = String(rawId || '').trim();
  if (!id) return null;
  const filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id };
  return Product.findOne(filter)
    .select(
      'name author price categories shortDescription description language stock slug images compareAtPrice isAvailable rating ratingCount'
    )
    .lean();
}

/**
 * Khối văn bản: toàn bộ mô tả có trong CSDL cho cuốn khách đang xem (ưu tiên cho Ollama).
 */
function buildProductPageContextBlock(product) {
  if (!product) return '';
  const price =
    typeof product.price === 'number' ? `${product.price.toLocaleString('vi-VN')}đ` : '—';
  const cats = Array.isArray(product.categories) && product.categories.length
    ? product.categories.join(', ')
    : '—';
  const short = plainTextSnippet(product.shortDescription, 2500) || '(Chưa có mô tả ngắn trong CSDL.)';
  const body =
    plainTextSnippet(product.description, MAX_PRODUCT_PAGE_DESC_CHARS) ||
    '(Chưa có mô tả chi tiết trong CSDL — chỉ có thể dựa vào mô tả ngắn.)';
  return [
    `Tên sách: ${product.name || '—'}`,
    `Tác giả: ${product.author || '—'}`,
    `Giá: ${price}`,
    `Danh mục: ${cats}`,
    '',
    '--- Mô tả ngắn ---',
    short,
    '',
    '--- Mô tả & nội dung giới thiệu (đầy đủ nhất trong hệ thống) ---',
    body,
  ].join('\n');
}

/**
 * Gọi Ollama HTTP API POST /api/generate (stream: false).
 * Tách system / prompt theo API Ollama; bắt lỗi mạng thân thiện.
 */
async function callOllamaGenerate(system, prompt, { numPredict = 900 } = {}) {
  const url = `${OLLAMA_BASE_URL}/api/generate`;
  let data;
  let status;
  try {
    const res = await axios.post(
      url,
      {
        model: OLLAMA_MODEL,
        system,
        prompt,
        stream: false,
        options: {
          temperature: 0.65,
          num_predict: numPredict,
        },
      },
      {
        timeout: OLLAMA_TIMEOUT_MS,
        validateStatus: () => true,
        headers: { 'Content-Type': 'application/json' },
      }
    );
    data = res.data;
    status = res.status;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const code = err.code;
      if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
        throw new Error(
          `Không kết nối được Ollama tại ${OLLAMA_BASE_URL} — hãy chạy lệnh "ollama serve" và đảm bảo đã "ollama pull ${OLLAMA_MODEL}".`
        );
      }
      if (err.code === 'ECONNABORTED') {
        throw new Error('Ollama phản hồi quá lâu (timeout). Thử tăng OLLAMA_TIMEOUT_MS hoặc kiểm tra GPU/RAM.');
      }
    }
    throw err instanceof Error ? err : new Error(String(err));
  }

  if (status < 200 || status >= 300) {
    const errMsg = typeof data?.error === 'string' ? data.error : `HTTP ${status}`;
    throw new Error(errMsg);
  }

  if (data?.error) {
    const errMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    throw new Error(errMsg);
  }

  const text = data?.response;
  if (!text || typeof text !== 'string') {
    throw new Error('Ollama trả về thiếu trường response');
  }
  return text.trim();
}

/**
 * Rút gọn HTML/text để đưa vào prompt (giảm token & RAM).
 */
function plainTextSnippet(raw, maxLen) {
  if (!raw || typeof raw !== 'string') return '';
  const t = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

/**
 * Chuyển tối đa 3 cuốn từ DB thành Context (chỉ name, author, price, shortDescription theo kiến trúc RAG).
 */
function buildRagContextBlock(products) {
  const top = products.slice(0, 3);
  if (!top.length) {
    return '(Không có cuốn sách nào trong Context — kho không khớp vector hoặc chưa có embedding.)';
  }
  return top
    .map((p, idx) => {
      const price = typeof p.price === 'number' ? `${p.price.toLocaleString('vi-VN')}đ` : '—';
      const short = plainTextSnippet(p.shortDescription, 360) || '(Chưa có mô tả ngắn)';
      const author = p.author ? String(p.author) : '—';
      return [
        `--- Sách ${idx + 1} ---`,
        `Tên: ${p.name}`,
        `Tác giả: ${author}`,
        `Giá: ${price}`,
        `Mô tả ngắn: ${short}`,
      ].join('\n');
    })
    .join('\n\n');
}

/** Thông báo thân thiện khi Ollama lỗi chung (mạng, model, v.v.) */
const OLLAMA_DOWN_MESSAGE =
  'Xin lỗi bạn, hiện hệ thống tư vấn AI (Ollama) tạm thời không phản hồi — có thể dịch vụ chưa chạy hoặc model chưa được tải. ' +
  'Bạn vui lòng thử lại sau. Nếu có sách gợi ý bên dưới, bạn có thể bấm xem chi tiết nhé.';

/**
 * Sinh câu trả lời: System + user prompt.
 * Nếu có `pageProduct`: khách đang xem trang một cuốn — ưu tiên mô tả đầy đủ từ DB; RAG là gợi ý thêm.
 */
export const generateAIResponse = async (userQuery, products, conversationHistory = [], opts = {}) => {
  const { pageProduct } = opts;
  const ragBlock = buildRagContextBlock(products);

  const historyContext =
    conversationHistory.length > 0
      ? `Lịch sử trò chuyện gần đây:\n${conversationHistory
          .slice(-4)
          .map((m) => `${m.role === 'user' ? 'Khách' : 'Bookle'}: ${String(m.content).slice(0, 200)}`)
          .join('\n')}\n\n`
      : '';

  const safe = userQuery.replace(/"""/g, '"');

  const systemWithPage = `${BOOKLE_SYSTEM_PROMPT}

Khách đang mở trang chi tiết MỘT cuốn sách trên Bookle. Phần "Nội dung trang sách (ưu tiên)" lấy từ mô tả trong CSDL — dùng để trả lời chi tiết (ví dụ có dạy gấp quần áo không, tóm tắt ý chính). Phần "Gợi ý thêm từ kho" là tối đa 3 cuốn liên quan — chỉ nhắc khi khách hỏi sách tương tự hoặc so sánh. Nếu CSDL không chứa thông tin khách hỏi, hãy nói thẳng là trong mô tả Bookle không có, không đoán mò.`;

  let system = BOOKLE_SYSTEM_PROMPT;
  let userPrompt = `${historyContext}Câu hỏi của khách hàng:\n"""${safe}"""\n\nContext (tối đa 3 cuốn, stock > 0; chỉ dùng thông tin sau để tư vấn):\n${ragBlock}`;
  let numPredict = 900;

  if (pageProduct) {
    system = systemWithPage;
    const pageBlock = buildProductPageContextBlock(pageProduct);
    userPrompt = `${historyContext}Câu hỏi của khách hàng:\n"""${safe}"""\n\n=== Nội dung trang sách (ưu tiên) ===\n${pageBlock}\n\n=== Gợi ý thêm từ kho (tối đa 3 cuốn) ===\n${ragBlock}`;
    numPredict = 1400;
  }

  try {
    return await callOllamaGenerate(system, userPrompt, { numPredict });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Ollama generate error:', msg);
    if (/requires more system memory|more system memory than is available/i.test(msg)) {
      console.error(
        '💡 [Ollama] Thiếu RAM hệ thống — với Bookle nên dùng qwen2.5:3b trên GPU ~4GB; đóng bớt ứng dụng hoặc giảm model khác đang chiếm VRAM.'
      );
      return (
        'Xin lỗi bạn, máy chủ không đủ bộ nhớ để chạy model AI lúc này. Bạn vẫn có thể xem sách gợi ý bên dưới. ' +
        'Quản trị viên: đảm bảo chỉ chạy `qwen2.5:3b` và giải phóng RAM/VRAM.'
      );
    }
    if (/Không kết nối được Ollama|ECONNREFUSED|ENOTFOUND|timeout/i.test(msg)) {
      return 'Hiện không kết nối được dịch vụ tư vấn AI trên máy chủ (Ollama). Bạn thử lại sau nhé — phía cửa hàng sẽ kiểm tra `ollama serve` và model `qwen2.5:3b`.';
    }
    return OLLAMA_DOWN_MESSAGE;
  }
};

/**
 * RAG cơ bản: từ câu khách → tìm trong Product (từ khóa / mô tả) tối đa `limit` cuốn, stock > 0.
 */
async function retrieveProductsForRag(userQuery, conversationHistory = [], { limit = 3 } = {}) {
  const context = extractContextFromHistory(conversationHistory);
  const inStockFilter = { isAvailable: true, stock: { $gt: 0 } };
  return smartSearch(userQuery, { limit, filter: inStockFilter, context });
}

/**
 * Generate simple response without AI (fallback) — giọng thân thiện, như bạn đọc sách
 */
const generateSimpleResponse = (userQuery, products) => {
  const extractedAuthor = extractAuthorFromQuery(userQuery);
  const extractedBookName = extractBookNameFromQuery(userQuery);
  const intent = analyzeIntent(userQuery, []);
  const lowerQuery = userQuery.toLowerCase();

  // Tán gẫu đơn giản (khi không liên quan đến sách)
  const bookTip = products.length > 0
    ? `\n\n📖 Nhân tiện, mình gợi ý bạn cuốn **"${products[0].name}"**${products[0].author ? ` của ${products[0].author}` : ''} — ${products[0].shortDescription ? products[0].shortDescription.substring(0, 80) + '...' : 'rất hay đấy!'}`
    + (products.length > 1 ? `\nHoặc cuốn **"${products[1].name}"**${products[1].author ? ` của ${products[1].author}` : ''} cũng đáng đọc lắm! ✨` : '')
    : '';

  if (intent.isGreeting) {
    return `Chào bạn! 😊 Mình là Bookle — một người bạn yêu sách. Bạn muốn tán gẫu hay đang tìm cuốn gì hay đọc nè?${bookTip}`;
  }
  if (intent.isThanks) {
    return `Hihi, không có gì đâu! 😊 Lúc nào muốn tìm sách hay tâm sự gì cứ nhắn mình nhé.${bookTip}`;
  }
  if (lowerQuery.match(/bạn là (ai|gì)/)) {
    return `Mình là Bookle — một người bạn mê đọc sách! 📚 Mình không phải nhân viên bán hàng đâu, chỉ là thích chia sẻ những cuốn sách hay thôi.${bookTip}`;
  }
  if (lowerQuery.match(/(buồn|chán|mệt|stress|lo lắng|cô đơn)/)) {
    return `Ôi, mình hiểu cảm giác đó. Đôi khi cầm một cuốn sách lên đọc cũng là cách hay để tĩnh tâm lại nè. 💛${bookTip}`;
  }

  if (products.length > 0) {
    let response = '';

    if (extractedAuthor) {
      response = `Ồ, bạn thích ${extractedAuthor} à? Mình cũng thích lắm! 😄 Đây là mấy cuốn mình tìm được nè:\n\n`;
    } else if (extractedBookName) {
      response = `Mình tìm thấy mấy cuốn liên quan đến "${extractedBookName}" nè:\n\n`;
    } else if (intent.detectedGenre) {
      response = `Sách **${intent.detectedGenre}** thì mình thấy mấy cuốn này hay lắm:\n\n`;
    } else {
      response = `Mình tìm được mấy cuốn bạn có thể thích nè:\n\n`;
    }

    const topBooks = products.slice(0, 3);
    topBooks.forEach((book, idx) => {
      response += `${idx + 1}. **"${book.name}"**`;
      if (book.author) response += ` — ${book.author}`;
      response += '\n';
      if (book.price) response += `   💰 ${book.price.toLocaleString('vi-VN')}đ`;
      if (book.rating >= 3.5) response += ` · ⭐ ${book.rating}/5`;
      if (book.shortDescription) {
        response += `\n   📖 ${book.shortDescription.substring(0, 100)}${book.shortDescription.length > 100 ? '...' : ''}`;
      }
      response += '\n\n';
    });

    if (products.length > 3) {
      response += `Còn ${products.length - 3} cuốn nữa trong danh sách bên dưới, bạn xem thử nhé! 👇`;
    }

    return response.trim();
  }

  if (extractedAuthor) {
    return `Hmm, mình chưa tìm thấy sách của "${extractedAuthor}" trong kho. 🤔 Bạn thử nhắc tên cuốn cụ thể được không? Hoặc cho mình biết bạn thích đọc thể loại gì, mình gợi ý cho!`;
  }

  if (extractedBookName) {
    return `Tiếc quá, mình chưa thấy cuốn "${extractedBookName}" trong kho. 😅 Thử tìm theo tác giả hoặc thể loại xem sao nhé?`;
  }

  return `Hmm, mình chưa hiểu rõ lắm. 😊 Bạn đang muốn tìm sách hay muốn tâm sự gì nè? Ví dụ:\n• "Sách của Nguyễn Nhật Ánh"\n• "Tìm sách triết hay"\n• "Hôm nay buồn quá"\n\nCứ thoải mái nhắn mình nhé!`;
};

/**
 * Kiểm tra nhanh xem câu hỏi có liên quan đến sách/mua hàng không.
 * Nếu chỉ là tán gẫu ("bạn là ai", "hôm nay buồn") thì không cần gọi RAG.
 */
const isBookRelatedQuery = (query, conversationHistory = []) => {
  const intent = analyzeIntent(query, conversationHistory);
  if (intent.isGreeting || intent.isThanks) return false;

  const lower = query.toLowerCase();

  // Các pattern rõ ràng KHÔNG liên quan đến sách
  const chatPatterns = /^(bạn là (ai|gì)|bạn tên gì|mày là ai|ê|ơi|yo|hey|hello|hi|xin chào|chào|cảm ơn|cám ơn|tks|ok|ừ|được rồi|bye|tạm biệt)$/i;
  if (chatPatterns.test(lower.trim())) return false;

  // Tâm sự thuần túy (không nhắc đến sách/đọc)
  const pureChat = /^(hôm nay|tui|tôi|mình|em|anh|chị).{0,30}(buồn|chán|mệt|vui|khỏe|ổn|stress|lo|sợ|yêu|ghét|giận)/i;
  if (pureChat.test(lower) && !lower.match(/(sách|đọc|tìm|gợi ý|cuốn|tác giả|mua)/)) return false;

  return true;
};

/**
 * Luồng RAG chính: Embedding (CPU Singleton) → vector DB (3 cuốn, 4 trường) → Ollama qwen2.5:3b (GPU).
 * Bổ sung select phụ theo _id để trả slug/ảnh cho giao diện (không đưa vào prompt LLM).
 */
async function enrichBooksForClient(ragDocs) {
  const ids = ragDocs.map((p) => p._id).filter(Boolean);
  if (!ids.length) return [];
  const extra = await Product.find({ _id: { $in: ids } })
    .select(
      'name slug price compareAtPrice images categories author stock isAvailable rating ratingCount shortDescription'
    )
    .lean();
  const byId = new Map(extra.map((p) => [String(p._id), p]));
  return ragDocs.map((p) => {
    const full = byId.get(String(p._id));
    return { ...(full || {}), ...p };
  });
}

export const processAIQuery = async (userQuery, conversationHistory = [], options = {}) => {
  try {
    const contextProductId = options.contextProductId
      ? String(options.contextProductId).trim()
      : '';
    let pageProduct = null;
    if (contextProductId) {
      pageProduct = await loadProductForPageContext(contextProductId);
      if (!pageProduct) {
        console.warn('[AI] contextProductId không khớp sản phẩm:', contextProductId);
      }
    }

    let ragProducts = [];
    try {
      ragProducts = await retrieveTopProductsByVector(userQuery, { limit: 3 });
      console.log(`📦 [RAG/DB] vector → ${ragProducts.length} cuốn (name, author, price, shortDescription)`);
    } catch (vecErr) {
      console.error('📦 [RAG/DB] Lỗi truy vấn vector:', vecErr?.message || vecErr);
    }

    const aiResponse = await generateAIResponse(userQuery, ragProducts, conversationHistory, {
      pageProduct,
    });

    const isDirectBookQuery =
      !!pageProduct || isBookRelatedQuery(userQuery, conversationHistory);
    const merged = await enrichBooksForClient(ragProducts);

    const mapCard = (p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      categories: p.categories,
      author: p.author,
      stock: p.stock,
      isAvailable: p.isAvailable,
      rating: p.rating || 0,
      ratingCount: p.ratingCount || 0,
    });

    let booksToShow = merged.map(mapCard);
    if (pageProduct?._id) {
      const cur = mapCard(pageProduct);
      booksToShow = [
        cur,
        ...booksToShow.filter((b) => String(b._id) !== String(pageProduct._id)),
      ];
    }
    booksToShow = (isDirectBookQuery ? booksToShow.slice(0, 3) : booksToShow.slice(0, 2)).slice(
      0,
      3
    );

    return {
      response: aiResponse,
      books: booksToShow,
    };
  } catch (error) {
    console.error('Error processing AI query:', error);
    throw error;
  }
};

export { warmUpEmbeddingService };

export default {
  smartSearch,
  generateAIResponse,
  processAIQuery,
  generateProductEmbedding,
  warmUpEmbeddingService,
  analyzeIntent,
  extractContextFromHistory,
  extractAuthorFromQuery,
  extractBookNameFromQuery
};


