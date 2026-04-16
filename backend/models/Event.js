// models/Event.js
import mongoose from 'mongoose';

const ThemeConfigSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: '#036280', trim: true },
    secondaryColor: { type: String, default: '#FF6500', trim: true },
    /** Kiểu trang trí UI: snow, firework, none, ... */
    decorationType: { type: String, default: 'none', trim: true },
    /** Chữ trên nền primary (header / nút). Hex #RRGGBB; để trống = tự động theo độ sáng primary */
    textOnPrimary: { type: String, trim: true },
    /** Màu giá sản phẩm storefront */
    priceColor: { type: String, trim: true },
    /** Màu trạng thái “còn hàng” */
    statusSuccessColor: { type: String, trim: true },
  },
  { _id: false }
);

const DiscountConfigSchema = new mongoose.Schema(
  {
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    /** ID danh mục (khớp `categories` của Product, ví dụ: tieu-thuyet) */
    targetCategories: { type: [String], default: [] },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sự kiện là bắt buộc'],
      trim: true,
      maxlength: 200,
    },
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc'],
    },
    endDate: {
      type: Date,
      required: [true, 'Ngày kết thúc là bắt buộc'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    themeConfig: {
      type: ThemeConfigSchema,
      default: () => ({}),
    },
    discountConfig: {
      type: DiscountConfigSchema,
      default: () => ({}),
    },
    suggestedSlogan: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

EventSchema.pre('validate', function validateDates(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'endDate phải sau hoặc bằng startDate');
  }
  next();
});

EventSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
EventSchema.index({ startDate: -1 });

export default mongoose.model('Event', EventSchema);
