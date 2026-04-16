import React, { useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme, Avatar, Dropdown, Space, Typography, Divider } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  MailOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  TeamOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '../pages/Login';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/admin/products',
    icon: <BookOutlined />,
    label: 'Quản lý Sách',
  },
  {
    key: '/admin/orders',
    icon: <ShoppingCartOutlined />,
    label: 'Đơn hàng',
  },
  {
    key: '/admin/reviews',
    icon: <StarOutlined />,
    label: 'Đánh giá',
  },
  {
    key: '/admin/users',
    icon: <TeamOutlined />,
    label: 'Người dùng',
  },
  {
    key: '/admin/contacts',
    icon: <MailOutlined />,
    label: 'Liên hệ',
  },
  {
    key: '/admin/events',
    icon: <CalendarOutlined />,
    label: 'Sự kiện',
  },
];

function pageTitleFromPath(pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/admin';
  const match = menuItems.find(
    (item) => item.key !== '/admin' && normalized.startsWith(item.key),
  );
  if (match) return match.label;
  if (normalized === '/admin') return 'Dashboard';
  return 'Quản trị';
}

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_USER_KEY));
    } catch {
      return null;
    }
  }, []);

  const pageTitle = useMemo(
    () => pageTitleFromPath(location.pathname),
    [location.pathname],
  );

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    navigate('/admin/login', { replace: true });
  };

  const selectedKey =
    menuItems.find((item) => item.key !== '/admin' && location.pathname.startsWith(item.key))?.key
    || '/admin';

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              minHeight: 64,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: collapsed ? '12px 8px' : '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: collapsed ? 16 : 18,
                fontWeight: 700,
                letterSpacing: collapsed ? 0 : 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {collapsed ? 'B' : 'Bookle'}
            </span>
            {!collapsed ? (
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center' }}>
                Bảng quản trị
              </Text>
            ) : null}
          </div>

          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[selectedKey]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ borderRight: 0 }}
            />
          </div>

          <div style={{ padding: collapsed ? 8 : '12px 16px', flexShrink: 0 }}>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '8px 0' }} />
            <Button
              type="text"
              block
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{
                color: 'rgba(255,255,255,0.85)',
                textAlign: collapsed ? 'center' : 'left',
                height: 'auto',
                padding: collapsed ? '8px 0' : '8px 12px',
              }}
            >
              {!collapsed ? 'Về website' : null}
            </Button>
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <Space align="center" size="middle" style={{ minWidth: 0, flex: 1 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 48, height: 48, flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.3 }}>
                {pageTitle}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Quản trị nội bộ · React + Ant Design
              </Text>
            </div>
          </Space>

          <Space size="middle" style={{ flexShrink: 0 }}>
            <Button type="default" icon={<HomeOutlined />} onClick={() => navigate('/')}>
              Cửa hàng
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: token.colorPrimary }}
                />
                <span style={{ fontWeight: 500 }}>
                  {adminUser?.name || adminUser?.email || 'Admin'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            paddingBottom: location.pathname.startsWith('/admin/events') ? 40 : 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            minHeight: 360,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
