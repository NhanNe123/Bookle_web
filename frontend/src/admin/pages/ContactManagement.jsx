import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Button, Space, Select, Typography, Row, Col,
  message, Popconfirm, Tooltip, Modal,
} from 'antd';
import {
  MailOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Title, Text, Paragraph } = Typography;

const STATUS_MAP = {
  new:      { color: 'blue',    label: 'Mới' },
  read:     { color: 'green',   label: 'Đã đọc' },
  replied:  { color: 'cyan',    label: 'Đã phản hồi' },
  archived: { color: 'default', label: 'Lưu trữ' },
};

const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMsg, setViewMsg] = useState(null);

  const fetchContacts = useCallback(async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/contact', { params });
      if (data.success) {
        setContacts(data.contacts || []);
        const pg = data.pagination || {};
        setPagination((p) => ({ ...p, current: pg.page || page, total: pg.total || 0, pageSize: limit }));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleTableChange = (pag) => fetchContacts(pag.current, pag.pageSize);

  const handleMarkStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/contact/${id}/status`, { status });
      if (data.success) {
        message.success(`Đã đánh dấu ${STATUS_MAP[status]?.label || status}`);
        setContacts((prev) => prev.map((c) => c._id === id ? { ...c, status } : c));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi cập nhật');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/contact/${id}`);
      if (data.success) {
        message.success('Đã xóa');
        fetchContacts(pagination.current, pagination.pageSize);
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi xóa');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Người gửi',
      key: 'sender',
      width: 180,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.name}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>{r.email}</Text>
          {r.phone && <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.phone}</div>}
        </div>
      ),
    },
    {
      title: 'Chủ đề',
      dataIndex: 'subject',
      key: 'subject',
      width: 200,
      ellipsis: true,
      render: (v, r) => (
        <Text strong={r.status === 'new'} style={r.status === 'new' ? {} : { fontWeight: 400 }}>{v}</Text>
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (v) => <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 13 }}>{v}</Paragraph>,
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(v).format('DD/MM/YY HH:mm')}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v) => <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.label || v}</Tag>,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem">
            <Button size="small" type="text" icon={<EyeOutlined />}
              onClick={() => {
                setViewMsg(record);
                if (record.status === 'new') handleMarkStatus(record._id, 'read');
              }}
            />
          </Tooltip>
          {record.status === 'new' && (
            <Tooltip title="Đánh dấu đã đọc">
              <Button size="small" type="text" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleMarkStatus(record._id, 'read')}
              />
            </Tooltip>
          )}
          <Popconfirm title="Xóa tin nhắn này?" onConfirm={() => handleDelete(record._id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
            <Button danger size="small" type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col><Title level={4} style={{ margin: 0 }}><MailOutlined style={{ marginRight: 8 }} />Quản lý Liên hệ</Title></Col>
        <Col>
          <Space>
            <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 150 }} allowClear placeholder="Lọc trạng thái"
              options={Object.entries(STATUS_MAP).map(([v, { label }]) => ({ value: v, label }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchContacts(1, pagination.pageSize)}>Làm mới</Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={contacts}
        loading={loading}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `Tổng ${t} tin nhắn` }}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
        size="middle"
        rowClassName={(r) => r.status === 'new' ? 'ant-table-row-new' : ''}
      />

      <Modal
        title={viewMsg ? `📩 ${viewMsg.subject}` : 'Chi tiết'}
        open={!!viewMsg}
        onCancel={() => setViewMsg(null)}
        footer={null}
        width={520}
      >
        {viewMsg && (
          <div>
            <p><Text strong>Từ:</Text> {viewMsg.name} ({viewMsg.email})</p>
            {viewMsg.phone && <p><Text strong>SĐT:</Text> {viewMsg.phone}</p>}
            <p><Text strong>Ngày:</Text> {dayjs(viewMsg.createdAt).format('DD/MM/YYYY HH:mm')}</p>
            <div style={{ marginTop: 12, padding: 16, background: '#fafafa', borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>
              {viewMsg.message}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContactManagement;
