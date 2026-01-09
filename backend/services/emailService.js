// services/emailService.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter
const createTransporter = () => {
  // For development: use Ethereal (fake SMTP)
  // For production: use real SMTP (Gmail, SendGrid, etc.)
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Production config
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development: console log only
    console.warn('⚠️  Email not configured. Emails will be logged to console only.');
    return null;
  }
};

// Generate verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (user, verificationToken) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Bookle'}" <${process.env.EMAIL_USER || 'noreply@bookle.com'}>`,
    to: user.email,
    subject: 'Xác thực tài khoản Bookle - Verification Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3040D6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #3040D6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Bookle - Nhà sách trực tuyến</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${user.name}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Bookle.</p>
            <p>Để hoàn tất đăng ký, vui lòng xác thực email của bạn bằng cách click vào nút bên dưới:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Xác thực Email</a>
            </div>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">
              ${verificationUrl}
            </p>
            <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 24 giờ.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi từ hệ thống tự động. Vui lòng không reply.</p>
            <p>&copy; ${new Date().getFullYear()} Bookle. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  } else {
    // Development mode: log to console
    console.log('📧 [DEV MODE] Verification Email:');
    console.log('   To:', user.email);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Verification URL:', verificationUrl);
    console.log('   Token:', verificationToken);
    return { success: true, dev: true, url: verificationUrl };
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Bookle'}" <${process.env.EMAIL_USER || 'noreply@bookle.com'}>`,
    to: user.email,
    subject: 'Chào mừng đến với Bookle! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3040D6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #3040D6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Chào mừng đến với Bookle!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${user.name}!</h2>
            <p>Tài khoản của bạn đã được xác thực thành công!</p>
            <p>Bạn có thể bắt đầu khám phá và mua sắm hàng ngàn đầu sách tại Bookle.</p>
            <div style="text-align: center;">
              <a href="${process.env.PUBLIC_URL || 'http://localhost:3000'}/shop" class="button">Khám phá sách ngay</a>
            </div>
            <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bookle. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      // Don't throw - welcome email is not critical
      return { success: false };
    }
  } else {
    console.log('📧 [DEV MODE] Welcome Email to:', user.email);
    return { success: true, dev: true };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Bookle'}" <${process.env.EMAIL_USER || 'noreply@bookle.com'}>`,
    to: user.email,
    subject: 'Đặt lại mật khẩu - Bookle',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3040D6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${user.name}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Click vào nút bên dưới để đặt lại mật khẩu:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                <li>Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn tạo mật khẩu mới</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>Email này được gửi từ hệ thống tự động. Vui lòng không reply.</p>
            <p>&copy; ${new Date().getFullYear()} Bookle. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw error;
    }
  } else {
    // Development mode: log to console
    console.log('📧 [DEV MODE] Password Reset Email:');
    console.log('   To:', user.email);
    console.log('   Subject:', mailOptions.subject);
    console.log('   Reset URL:', resetUrl);
    console.log('   Token:', resetToken);
    return { success: true, dev: true, url: resetUrl };
  }
};

export default {
  generateVerificationToken,
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};

