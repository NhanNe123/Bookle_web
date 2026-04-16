import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Select, Button, Space, Input, Drawer, Descriptions,
  Typography, Row, Col, message, Image, Divider, Badge,
} from 'antd';
import {
  ShoppingCartOutlined, SearchOutlined, ReloadOutlined,
  EyeOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  pending:    { color: 'gold',      label: 'Chờ xử lý' },
  confirmed:  { color: 'blue',      label: 'Đã xác nhận' },
  processing: { color: 'cyan',      label: 'Đang xử lý' },
  shipping:   { color: 'geekblue',  label: 'Đang giao' },
  delivered:  { color: 'green',     label: 'Đã giao' },
  cancelled:  { color: 'red',       label: 'Đã hủy' },
  refunded:   { color: 'volcano',   label: 'Hoàn tiền' },
};

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

const PAYMENT_LABELS = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay',
  zalopay: 'ZaloPay',
};

const formatVND = (v) =>
  v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async (page = 1, limit = 15) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchText) params.q = searchText;
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
      const { data } = await api.get('/orders/admin/list', { params });
      if (data.success) {
        setOrders(data.orders || []);
        setPagination((p) => ({ ...p, current: data.page, total: data.total, pageSize: limit }));
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [searchText, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleTableChange = (pag) => {
    fetchOrders(pag.current, pag.pageSize);
  };

  const handleSearch = () => fetchOrders(1, pagination.pageSize);
  const handleRefresh = () => { setSearchText(''); setFilterStatus('all'); fetchOrders(1, pagination.pageSize); };

  // ── Change status ──
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (data.success) {
        message.success(data.message || 'Đã cập nhật trạng thái');
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) => prev && { ...prev, status: newStatus });
        }
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── View detail ──
  const openDetail = async (record) => {
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/orders/${record._id}`);
      if (data.success) {
        setSelectedOrder(data.order);
      } else {
        setSelectedOrder(record);
      }
    } catch {
      setSelectedOrder(record);
    } finally {
      setDetailLoading(false);
    }
  };

  const customerName = (record) => {
    if (record.shippingAddress?.fullName) return record.shippingAddress.fullName;
    if (record.user?.name) return record.user.name;
    return record.guestEmail || '—';
  };

  // ── Columns ──
  const columns = useMemo(() => [
    {
      title: 'Mã đơn',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150,
      render: (v) => <Text strong copyable={{ text: v }} style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 180,
      ellipsis: true,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500 }}>{customerName(r)}</div>
          {r.shippingAddress?.phone && (
            <Text type="secondary" style={{ fontSize: 12 }}>{r.shippingAddress.phone}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (v) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs(v).format('DD/MM/YY HH:mm')}
        </Text>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      sorter: (a, b) => (a.total || 0) - (b.total || 0),
      render: (v) => <Text strong style={{ color: '#cf1322' }}>{formatVND(v)}</Text>,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'payment',
      width: 110,
      render: (v) => <Tag>{PAYMENT_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status, record) => (
        <Select
          value={status}
          size="small"
          style={{ width: 140 }}
          loading={updatingId === record._id}
          onChange={(val) => handleStatusChange(record._id, val)}
          options={STATUS_OPTIONS.map((o) => ({
            ...o,
            label: (
              <Badge color={STATUS_CONFIG[o.value]?.color} text={o.label} />
            ),
          }))}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ], [updatingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addr = selectedOrder?.shippingAddress;

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            Quản lý Đơn hàng
          </Title>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            placeholder="Tìm mã đơn, tên khách, SĐT, email…"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col>
          <Select
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            style={{ width: 160 }}
            options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...STATUS_OPTIONS]}
          />
        </Col>
        <Col>
          <Button icon={<SearchOutlined />} onClick={handleSearch}>Tìm</Button>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>Làm mới</Button>
        </Col>
      </Row>

      {/* Table */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đơn hàng`,
          pageSizeOptions: ['10', '15', '30', '50'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
        size="middle"
      />

      {/* Drawer chi tiết */}
      <Drawer
        title={
          selectedOrder
            ? `Đơn hàng ${selectedOrder.orderNumber}`
            : 'Chi tiết đơn hàng'
        }
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedOrder(null); }}
        width={560}
        loading={detailLoading}
      >
        {selectedOrder && (
          <>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Mã đơn" span={2}>
                <Text strong>{selectedOrder.orderNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_CONFIG[selectedOrder.status]?.color}>
                  {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {PAYMENT_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                {' '}
                <Tag color={selectedOrder.paymentStatus === 'paid' ? 'green' : 'orange'} style={{ marginLeft: 4 }}>
                  {selectedOrder.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú KH">
                {selectedOrder.customerNotes || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ fontSize: 14 }}>
              <EnvironmentOutlined /> Địa chỉ giao hàng
            </Divider>

            {addr ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Họ tên">{addr.fullName}</Descriptions.Item>
                <Descriptions.Item label={<><PhoneOutlined /> SĐT</>}>{addr.phone}</Descriptions.Item>
                {addr.email && (
                  <Descriptions.Item label={<><MailOutlined /> Email</>}>{addr.email}</Descriptions.Item>
                )}
                <Descriptions.Item label="Địa chỉ">
                  {[addr.address, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                </Descriptions.Item>
                {addr.notes && (
                  <Descriptions.Item label="Ghi chú">{addr.notes}</Descriptions.Item>
                )}
              </Descriptions>
            ) : (
              <Text type="secondary">Không có thông tin</Text>
            )}

            <Divider orientation="left" style={{ fontSize: 14 }}>
              <ShoppingCartOutlined /> Sản phẩm ({selectedOrder.items?.length || 0})
            </Divider>

            <Table
              rowKey={(r, i) => `${r.product?._id || r.product || i}`}
              dataSource={selectedOrder.items || []}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Ảnh',
                  key: 'img',
                  width: 56,
                  render: (_, r) => {
                    const src = r.image || r.product?.images?.[0];
                    return src ? (
                      <Image
                        src={src.startsWith('/') ? src : `/${src}`}
                        width={40}
                        height={52}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="/assets/img/no-book-cover.svg"
                      />
                    ) : <div style={{ width: 40, height: 52, background: '#f0f0f0', borderRadius: 4 }} />;
                  },
                },
                {
                  title: 'Sản phẩm',
                  key: 'name',
                  render: (_, r) => (
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{r.name || r.product?.name || '—'}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>x{r.quantity}</Text>
                    </div>
                  ),
                },
                {
                  title: 'Đơn giá',
                  dataIndex: 'price',
                  key: 'price',
                  width: 110,
                  render: (v) => formatVND(v),
                },
                {
                  title: 'Thành tiền',
                  key: 'lineTotal',
                  width: 120,
                  render: (_, r) => <Text strong>{formatVND(r.price * r.quantity)}</Text>,
                },
              ]}
            />

            <Descriptions column={1} size="small" style={{ marginTop: 16 }} bordered>
              <Descriptions.Item label="Tạm tính">{formatVND(selectedOrder.subtotal)}</Descriptions.Item>
              <Descriptions.Item label="Phí ship">{formatVND(selectedOrder.shippingFee)}</Descriptions.Item>
              {selectedOrder.discount > 0 && (
                <Descriptions.Item label="Giảm giá">-{formatVND(selectedOrder.discount)}</Descriptions.Item>
              )}
              <Descriptions.Item label={<Text strong>Tổng cộng</Text>}>
                <Text strong style={{ color: '#cf1322', fontSize: 16 }}>{formatVND(selectedOrder.total)}</Text>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default OrderManagement;
