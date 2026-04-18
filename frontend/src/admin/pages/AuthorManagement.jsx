import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Button, Space, Input, Modal, Form, Switch, Typography,
  Row, Col, message, Popconfirm, Tooltip,
} from 'antd';
import {
  UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAuthorsAPI } from '../../lib/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AuthorManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [filterActive, setFilterActive] = useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchAuthors = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchText) params.q = searchText;
      if (filterActive !== undefined) params.isActive = filterActive;

      const res = await adminAuthorsAPI.list(params);
      setData(res.items || []);
      setPagination((prev) => ({
        ...prev,
        current: res.page || page,
        total: res.total || 0,
        pageSize: limit,
      }));
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải danh sách tác giả');
    } finally {
      setLoading(false);
    }
  }, [filterActive, searchText]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const handleTableChange = (pag) => {
    fetchAuthors(pag.current, pag.pageSize);
  };

  const handleOpenCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      awardsText: '',
      imagesText: '',
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name || '',
      slug: record.slug || '',
      title: record.title || '',
      avatar: record.avatar || '',
      bio: record.bio || '',
      isActive: record.isActive !== false,
      awardsText: Array.isArray(record.awards) ? record.awards.join('\n') : '',
      imagesText: Array.isArray(record.images) ? record.images.join('\n') : '',
      facebook: record.social?.facebook || '',
      twitter: record.social?.twitter || '',
      instagram: record.social?.instagram || '',
      linkedin: record.social?.linkedin || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const parseLineList = (text = '') =>
    String(text)
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        slug: values.slug || undefined,
        title: values.title || '',
        avatar: values.avatar || '',
        bio: values.bio || '',
        isActive: values.isActive === true,
        awards: parseLineList(values.awardsText),
        images: parseLineList(values.imagesText),
        social: {
          facebook: values.facebook || '',
          twitter: values.twitter || '',
          instagram: values.instagram || '',
          linkedin: values.linkedin || '',
        },
      };

      setSaving(true);
      if (editing?._id) {
        await adminAuthorsAPI.update(editing._id, payload);
        message.success('Cập nhật tác giả thành công');
      } else {
        await adminAuthorsAPI.create(payload);
        message.success('Tạo tác giả thành công');
      }

      closeModal();
      fetchAuthors(pagination.current, pagination.pageSize);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || e?.message || 'Lỗi lưu tác giả');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAuthorsAPI.delete(id);
      message.success('Đã xóa tác giả');
      fetchAuthors(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi xóa tác giả');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Tác giả',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.title || '—'}</Text>
        </div>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 180,
      ellipsis: true,
      render: (v) => <Text code>{v || '—'}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (v) => (v ? <Tag color="green">Hoạt động</Tag> : <Tag>Ẩn</Tag>),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa tác giả"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Quản lý Tác giả
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Tạo tác giả
          </Button>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => fetchAuthors(1, pagination.pageSize)}
            placeholder="Tìm theo tên / slug / nghề nghiệp"
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col>
          <select
            className="form-select"
            value={filterActive === undefined ? '' : String(filterActive)}
            onChange={(e) => {
              const value = e.target.value;
              setFilterActive(value === '' ? undefined : value === 'true');
            }}
            style={{ minWidth: 140 }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động</option>
            <option value="false">Ẩn</option>
          </select>
        </Col>
        <Col>
          <Button icon={<SearchOutlined />} onClick={() => fetchAuthors(1, pagination.pageSize)}>Lọc</Button>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('');
              setFilterActive(undefined);
              fetchAuthors(1, pagination.pageSize);
            }}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} tác giả`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 980 }}
      />

      <Modal
        title={editing ? 'Chỉnh sửa tác giả' : 'Tạo tác giả mới'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        width={900}
        okText={editing ? 'Lưu thay đổi' : 'Tạo'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item
                name="name"
                label="Tên tác giả"
                rules={[{ required: true, message: 'Nhập tên tác giả' }]}
              >
                <Input placeholder="Gabriel Garcia Marquez" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="slug" label="Slug">
                <Input placeholder="tu-dong-neu-bo-trong" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="title" label="Nghề nghiệp / Chức danh">
                <Input placeholder="Nhà văn, nhà báo..." />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="isActive" label="Hiển thị" valuePropName="checked">
                <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="avatar" label="Ảnh đại diện">
            <Input placeholder="/uploads/... hoặc https://..." />
          </Form.Item>

          <Form.Item name="imagesText" label="Ảnh bổ sung (mỗi dòng 1 URL)">
            <TextArea rows={3} placeholder="/uploads/author-1.jpg&#10;/uploads/author-2.jpg" />
          </Form.Item>

          <Form.Item name="bio" label="Tiểu sử">
            <TextArea rows={6} placeholder="Tiểu sử tác giả..." />
          </Form.Item>

          <Form.Item name="awardsText" label="Giải thưởng (mỗi dòng 1 mục)">
            <TextArea rows={4} placeholder="Nobel 1982&#10;Pulitzer Prize" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="facebook" label="Facebook">
                <Input placeholder="https://facebook.com/..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="twitter" label="Twitter/X">
                <Input placeholder="https://x.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="instagram" label="Instagram">
                <Input placeholder="https://instagram.com/..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="linkedin" label="LinkedIn">
                <Input placeholder="https://linkedin.com/in/..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AuthorManagement;
