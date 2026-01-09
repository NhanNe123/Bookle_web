// db/index.js
import mongoose from 'mongoose';

// 1. Định nghĩa hằng số để tránh lặp lại code (DRY)
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/doan1_webbansach';

/**
 * Connect to MongoDB
 */
export const connectDB = async (maxRetries = 5, retryDelay = 2000) => {
  // 2. Sử dụng state có sẵn của Mongoose thay vì biến 'isConnected' tự tạo
  // 1: Connected, 2: Connecting
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  const uri = process.env.DATABASE_URL || DEFAULT_URI;

  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  Using default Local DB. Remember to set DATABASE_URL in .env for Production.');
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    // bufferCommands: false, // Cân nhắc: Bật cái này lên (mặc định true) để tránh lỗi query khi DB đang khởi động
  };

  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Mongoose 6+ mặc định buffer commands, không cần options retryWrites thừa
      await mongoose.connect(uri, options);
      
      // Log thông tin
      const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      console.log(`✅ MongoDB connected: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host} | URL: ${safeUri}`);
      
      setupConnectionHandlers();
      return; // Kết nối thành công, thoát hàm

    } catch (error) {
      attempt++;
      console.error(`❌ Connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt >= maxRetries) {
        console.error('❌ Failed to connect to MongoDB. Exiting...');
        throw error; // Ném lỗi ra để index.js chính biết là app không chạy được
      }

      console.log(`⏳ Retrying in ${retryDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

/**
 * Event Handlers
 */
const setupConnectionHandlers = () => {
    // Tránh đăng ký trùng lặp listener
    if (mongoose.connection.listeners('error').length > 0) return;

    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
    });
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Closing MongoDB connection...`);
    await disconnectDB();
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default connectDB;