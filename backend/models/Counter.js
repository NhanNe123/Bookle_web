// models/Counter.js
import mongoose from 'mongoose';

// Simple atomic counter for generating human-friendly codes (SKU, order number, etc.)
const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // counter key
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.model('Counter', CounterSchema);

