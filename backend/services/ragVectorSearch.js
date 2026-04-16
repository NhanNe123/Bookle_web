/**
 * Tầng Database (Mongoose) — RAG vector Bookle
 * — Lấy vector từ Singleton embedding → $vectorSearch (Atlas) hoặc cosine cục bộ.
 * — Luôn: stock > 0, isAvailable; giới hạn 3 cuốn gần nhất.
 * — Projection cho nội dung tư vấn: chỉ name, author, price, shortDescription (+ _id để map slug cho UI).
 */

import Product from '../models/Product.js';
import { getEmbeddingService } from './embeddingService.js';

const ATLAS_VECTOR = process.env.USE_ATLAS_VECTOR_SEARCH === '1';
const ATLAS_INDEX = process.env.ATLAS_VECTOR_INDEX?.trim() || '';

/** Đúng spec RAG: 4 trường hiển thị; _id để API ghép thêm slug/ảnh (không đưa _id vào prompt LLM) */
const RAG_FIELDS_PROJECT = {
  _id: 1,
  name: 1,
  author: 1,
  price: 1,
  shortDescription: 1,
};

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return -1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function searchAtlasVector(queryVector, limit) {
  const pipeline = [
    {
      $vectorSearch: {
        index: ATLAS_INDEX,
        path: 'embedding',
        queryVector,
        numCandidates: Math.min(200, Math.max(limit * 20, 50)),
        limit,
        filter: {
          stock: { $gt: 0 },
          isAvailable: true,
        },
      },
    },
    {
      $project: {
        ...RAG_FIELDS_PROJECT,
        _score: { $meta: 'vectorSearchScore' },
      },
    },
  ];
  const rows = await Product.aggregate(pipeline).allowDiskUse(true);
  return rows.map(({ _score, ...rest }) => rest);
}

async function searchLocalCosine(queryVector, limit) {
  const maxCandidates = Number(process.env.RAG_VECTOR_CANDIDATES) || 400;
  const candidates = await Product.find({
    isAvailable: true,
    stock: { $gt: 0 },
    embedding: { $exists: true, $type: 'array', $not: { $size: 0 } },
  })
    .select({ ...RAG_FIELDS_PROJECT, embedding: 1 })
    .sort({ ratingCount: -1, rating: -1, createdAt: -1 })
    .limit(maxCandidates)
    .lean();

  const qLen = queryVector.length;
  const scored = candidates
    .map((p) => {
      const emb = p.embedding;
      if (!Array.isArray(emb) || emb.length !== qLen) return null;
      const sim = cosineSimilarity(queryVector, emb);
      if (sim <= 0) return null;
      const { embedding, ...rest } = p;
      return { ...rest, _similarity: sim };
    })
    .filter(Boolean)
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, limit);

  return scored.map(({ _similarity, ...rest }) => rest);
}

/**
 * Top `limit` sản phẩm (mặc định 3) theo độ tương đồng vector.
 * @param {string} userQuery
 * @param {{ limit?: number }} [opts]
 */
export async function retrieveTopProductsByVector(userQuery, { limit = 3 } = {}) {
  const text = String(userQuery || '').trim();
  if (!text) return [];

  const embeddingSvc = getEmbeddingService();
  if (!embeddingSvc.isReady()) {
    await embeddingSvc.initialize();
  }
  const queryVector = await embeddingSvc.embed(text);

  if (ATLAS_VECTOR && ATLAS_INDEX) {
    try {
      return await searchAtlasVector(queryVector, limit);
    } catch (e) {
      console.warn('[RAG/DB] $vectorSearch thất bại, dùng cosine local:', e?.message || e);
    }
  }

  return searchLocalCosine(queryVector, limit);
}

export default { retrieveTopProductsByVector };
