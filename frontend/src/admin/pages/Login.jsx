import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { LockOutlined, MailOutlined, BookOutlined } from '@ant-design/icons';
import api from '../../lib/api';

const { Title, Text } = Typography;

const ADMIN_TOKEN_KEY = 'bookle_admin_token';
const ADMIN_USER_KEY = 'bookle_admin_user';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) navigate('/admin', { replace: true });
  }, [navigate]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', {
        email: values.email,
        password: values.password,
      });

      if (data.success && data.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
        message.success(`Xin chào, ${data.user.name}!`);
        navigate('/admin', { replace: true });
      } else {
        message.error(data.error || 'Đăng nhập thất bại');
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Sai email hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c1e30 0%, #1a3a5c 50%, #0f2942 100%)',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none',
        }}
        styles={{ body: { padding: '40px 36px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #036280, #1677ff)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <BookOutlined style={{ fontSize: 28, color: '#fff' }} />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Bookle Admin
          </Title>
          <Text type="secondary">Đăng nhập để quản lý hệ thống</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Email quản trị"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 48,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 16,
                background: 'linear-gradient(135deg, #036280, #1677ff)',
                border: 'none',
              }}
            >
              {loading ? 'Đang xác thực…' : 'Đăng nhập'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/')} style={{ color: '#8c8c8c' }}>
            ← Về trang chủ Bookle
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
export { ADMIN_TOKEN_KEY, ADMIN_USER_KEY };
