import React from 'react';
import { Typography, Card, Row, Col, Statistic } from 'antd';
import {
  BookOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Dashboard = () => {
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
              value="—"
              prefix={<BookOutlined />}
              valueStyle={{ color: '#036280' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Đơn hàng"
              value="—"
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Sự kiện"
              value="—"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Người dùng"
              value="—"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
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
