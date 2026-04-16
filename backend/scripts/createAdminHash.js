// Script để tạo hash từ mật khẩu
import bcrypt from 'bcrypt';

const password = 'admin123'; // Mật khẩu từ .env
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('\n✅ Hash đã được tạo:\n');
    console.log('─'.repeat(70));
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
    console.log('─'.repeat(70));
    console.log('\n📝 Thông tin đăng nhập trang quản trị:');
    console.log(`   Email: admin@bookle.com`);
    console.log(`   Password: admin123`);
    console.log('\n⚠️  Hãy thêm dòng ADMIN_PASSWORD_HASH vào file .env\n');
  })
  .catch(err => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  });










