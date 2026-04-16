import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Button, Space, Rate, Popconfirm, Typography,
  Row, Col, message, Select, Tooltip, Switch,
} from 'antd';
import {
  StarOutlined, DeleteOutlined, ReloadOutlined,
  EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Title, Text, Paragraph } = Typography;

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [filterApproved, setFilterApproved] = useState('all');

  const fetchReviews = useCallback(async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filterApproved !== 'all') params.approved = filterApproved;
      const { data } = await api.get('/reviews/admin/list', { params });
      if (data.success) {
        setReviews(data.reviews || []);
        setPagination((p) => ({ ...p, current: data.page, total: data.total, pageSize: limit }));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải đánh giá');
    } finally {
      setLoading(false);
    }
  }, [filterApproved]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleTableChange = (pag) => fetchReviews(pag.current, pag.pageSize);

  const handleToggleApproval = async (id, currentApproved) => {
    try {
      const { data } = await api.patch(`/reviews/${id}/approve`, { isApproved: !currentApproved });
      if (data.success) {
        message.success(data.message);
        setReviews((prev) => prev.map((r) => r._id === id ? { ...r, isApproved: !currentApproved } : r));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi cập nhật');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/reviews/${id}`);
      if (data.success) {
        message.success('Đã xóa đánh giá');
        fetchReviews(pagination.current, pagination.pageSize);
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi xóa');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 180,
      ellipsis: true,
      render: (_, r) => <Text strong>{r.product?.name || '—'}</Text>,
    },
    {
      title: 'Người đánh giá',
      key: 'reviewer',
      width: 150,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.user?.name || r.name}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.user?.email || r.email}</Text>
        </div>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      sorter: (a, b) => a.rating - b.rating,
      render: (v) => <Rate disabled value={v} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (v) => <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 13 }}>{v}</Paragraph>,
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format('DD/MM/YY HH:mm')}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isApproved',
      key: 'isApproved',
      width: 120,
      render: (approved, record) => (
        <Tooltip title={approved ? 'Nhấn để ẩn' : 'Nhấn để hiện'}>
          <Switch
            checked={approved}
            onChange={() => handleToggleApproval(record._id, approved)}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
          />
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Popconfirm title="Xóa đánh giá này?" onConfirm={() => handleDelete(record._id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
          <Button danger icon={<DeleteOutlined />} size="small" type="text" />
        </Popconfirm>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col><Title level={4} style={{ margin: 0 }}><StarOutlined style={{ marginRight: 8 }} />Quản lý Đánh giá</Title></Col>
        <Col>
          <Space>
            <Select value={filterApproved} onChange={setFilterApproved} style={{ width: 150 }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'true', label: 'Đang hiện' },
                { value: 'false', label: 'Đã ẩn' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchReviews(1, pagination.pageSize)}>Làm mới</Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={reviews}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `Tổng ${t} đánh giá` }}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
        size="middle"
      />
    </div>
  );
};

export default ReviewManagement;
