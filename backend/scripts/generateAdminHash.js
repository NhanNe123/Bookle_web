// Script để tạo hash mật khẩu cho admin
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateAdminHash() {
  try {
    console.log('🔐 Tạo hash mật khẩu cho tài khoản quản trị\n');
    
    const email = await question('Nhập email admin: ');
    const password = await question('Nhập mật khẩu admin: ');
    
    if (!email || !password) {
      console.error('❌ Email và mật khẩu không được để trống!');
      process.exit(1);
    }
    
    // Tạo hash với salt rounds = 10
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n✅ Thành công! Thêm các dòng sau vào file .env:\n');
    console.log('─'.repeat(60));
    console.log(`ADMIN_EMAIL=${email}`);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('─'.repeat(60));
    console.log('\n⚠️  Lưu ý: Giữ file .env an toàn và không commit vào git!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

generateAdminHash();










