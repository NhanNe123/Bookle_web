// scripts/backfillProductSku.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../db/index.js';
import Product from '../models/Product.js';
import Counter from '../models/Counter.js';

function skuPrefixFromDate(date = new Date()) {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `BK${yy}${mm}`;
}

async function getNextSequence(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc.seq;
}

async function main() {
  await connectDB();

  const cursor = Product.find({
    $or: [{ sku: { $exists: false } }, { sku: null }, { sku: '' }],
  })
    .select('_id sku createdAt')
    .sort({ createdAt: 1 })
    .cursor();

  let updated = 0;
  let scanned = 0;

  for await (const p of cursor) {
    scanned++;
    const prefix = skuPrefixFromDate(p.createdAt || new Date());
    const key = `product:${prefix}`;
    const seq = await getNextSequence(key);
    const sku = `${prefix}-${String(seq).padStart(5, '0')}`;

    // Use updateOne to avoid triggering "isNew" logic and to reduce overhead
    await Product.updateOne({ _id: p._id }, { $set: { sku } });
    updated++;

    if (updated % 50 === 0) {
      process.stdout.write(`Đã cập nhật SKU: ${updated} (đã quét ${scanned})\r`);
    }
  }

  console.log(`\n✅ Backfill xong. Đã quét ${scanned}, cập nhật ${updated} sản phẩm.`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('❌ Backfill SKU lỗi:', e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exitCode = 1;
});

