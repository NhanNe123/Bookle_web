import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Button, Space, Input, Typography, Row, Col,
  message, Avatar, Tooltip, Popconfirm,
} from 'antd';
import {
  UserOutlined, SearchOutlined, ReloadOutlined,
  LockOutlined, UnlockOutlined, CrownOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Title, Text } = Typography;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [searchText, setSearchText] = useState('');

  const fetchUsers = useCallback(async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchText) params.q = searchText;
      const { data } = await api.get('/auth/admin/users', { params });
      if (data.success) {
        setUsers(data.users || []);
        setPagination((p) => ({ ...p, current: data.page, total: data.total, pageSize: limit }));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [searchText]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleTableChange = (pag) => fetchUsers(pag.current, pag.pageSize);
  const handleSearch = () => fetchUsers(1, pagination.pageSize);
  const handleRefresh = () => { setSearchText(''); fetchUsers(1, pagination.pageSize); };

  const handleToggleLock = async (id) => {
    try {
      const { data } = await api.patch(`/auth/admin/users/${id}/toggle`);
      if (data.success) {
        message.success(data.message);
        setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: !u.isActive } : u));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi cập nhật');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Người dùng',
      key: 'user',
      width: 240,
      render: (_, r) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={r.avatar || undefined} style={{ backgroundColor: r.role === 'admin' ? '#722ed1' : '#1677ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      render: (v) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (v) => v === 'admin'
        ? <Tag icon={<CrownOutlined />} color="purple">Admin</Tag>
        : <Tag color="blue">User</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (v) => v
        ? <Tag color="green">Hoạt động</Tag>
        : <Tag color="red">Đã khóa</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format('DD/MM/YY HH:mm')}</Text>,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title={record.isActive ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?'}
          onConfirm={() => handleToggleLock(record._id)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <Tooltip title={record.isActive ? 'Khóa' : 'Mở khóa'}>
            <Button
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              danger={record.isActive}
              type={record.isActive ? 'default' : 'primary'}
              size="small"
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col><Title level={4} style={{ margin: 0 }}><UserOutlined style={{ marginRight: 8 }} />Quản lý Người dùng</Title></Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input placeholder="Tìm tên, email, SĐT…" prefix={<SearchOutlined />} value={searchText}
            onChange={(e) => setSearchText(e.target.value)} onPressEnter={handleSearch} allowClear />
        </Col>
        <Col><Button icon={<SearchOutlined />} onClick={handleSearch}>Tìm</Button></Col>
        <Col><Button icon={<ReloadOutlined />} onClick={handleRefresh}>Làm mới</Button></Col>
      </Row>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `Tổng ${t} người dùng` }}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
        size="middle"
      />
    </div>
  );
};

export default UserManagement;
