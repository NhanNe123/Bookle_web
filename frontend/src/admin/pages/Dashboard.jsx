import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import {
  BookOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { adminDashboardAPI } from '../../lib/api';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    posts: 0,
    users: 0,
    revenue: 0,
    revenueThisMonth: 0,
  });

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        const res = await adminDashboardAPI.getStats();
        if (!mounted) return;
        setStats({
          products: Number(res?.products || 0),
          orders: Number(res?.orders || 0),
          posts: Number(res?.posts || 0),
          users: Number(res?.users || 0),
          revenue: Number(res?.revenue || 0),
          revenueThisMonth: Number(res?.revenueThisMonth || 0),
        });
      } catch {
        // keep defaults
      }
    };
    fetchStats();
    return () => { mounted = false; };
  }, []);

  const formatVND = (v) =>
    Number(v || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Chào mừng đến với Bookle Admin
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Tổng sách"
              value={stats.products}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#036280' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Đơn hàng"
              value={stats.orders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Doanh thu tháng"
              value={formatVND(stats.revenueThisMonth)}
              valueRender={(node) => <span style={{ fontSize: 18 }}>{node}</span>}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Người dùng"
              value={stats.users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={formatVND(stats.revenue)}
              valueRender={(node) => <span style={{ fontSize: 22 }}>{node}</span>}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <Statistic
              title="Bài viết"
              value={stats.posts}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Paragraph>
          Đây là trang quản trị React tùy chỉnh dùng Ant Design. Sử dụng menu bên
          trái để điều hướng đến các chức năng quản lý.
        </Paragraph>
      </Card>
    </div>
  );
};

export default Dashboard;
