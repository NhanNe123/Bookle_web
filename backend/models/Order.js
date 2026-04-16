// models/Order.js
import mongoose from 'mongoose';
import Counter from './Counter.js';

const OrderItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  name: { type: String, required: true },
  slug: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String }
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  ward: { type: String },
  district: { type: String, required: true },
  city: { type: String, required: true },
  notes: { type: String }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  // Order reference number (human-readable)
  orderNumber: { 
    type: String, 
    unique: true,
    required: true 
  },
  
  // Customer info
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  guestEmail: { type: String }, // For guest checkout
  
  // Order items
  items: [OrderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountCode: { type: String },
  total: { type: Number, required: true },
  
  // Shipping
  shippingAddress: ShippingAddressSchema,
  shippingMethod: { 
    type: String, 
    enum: ['standard', 'express', 'pickup'],
    default: 'standard'
  },
  
  // Payment
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'bank_transfer', 'momo', 'vnpay', 'zalopay'],
    default: 'cod'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: { type: Date },
  
  // Order status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  
  // Status history
  statusHistory: [{
    status: { type: String },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  confirmedAt: { type: Date },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  
  // Notes
  customerNotes: { type: String },
  adminNotes: { type: String }
  
}, { timestamps: true });

// Gán trước bước validate — nếu để pre('save') thì required: true chạy trước và orderNumber vẫn undefined.
OrderSchema.pre('validate', async function orderNumberPreValidate() {
  if (!this.isNew || this.orderNumber) return;
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const key = `order_${dateStr}`;
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  this.orderNumber = `BK${dateStr}${String(doc.seq).padStart(5, '0')}`;
});

// Indexes for faster queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ guestEmail: 1 });
// Note: orderNumber index is already defined via unique: true in schema

export default mongoose.model('Order', OrderSchema);
