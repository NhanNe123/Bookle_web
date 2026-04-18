import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Tag, Button, Space, Input, Modal, Form, Select, Switch, Typography,
  Row, Col, message, Popconfirm, Tooltip,
} from 'antd';
import {
  FileTextOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminPostsAPI } from '../../lib/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = ['Activities', 'News', 'Blog', 'Events', 'Announcements'].map((v) => ({
  label: v,
  value: v,
}));

const PostManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPublished, setFilterPublished] = useState(undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchPosts = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (searchText) params.q = searchText;
      if (filterCategory) params.category = filterCategory;
      if (filterPublished !== undefined) params.isPublished = filterPublished;

      const res = await adminPostsAPI.list(params);
      setData(res.items || []);
      setPagination((prev) => ({
        ...prev,
        current: res.page || page,
        total: res.total || 0,
        pageSize: limit,
      }));
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải bài viết');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterPublished, searchText]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleTableChange = (pag) => {
    fetchPosts(pag.current, pag.pageSize);
  };

  const handleOpenCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'News',
      isPublished: false,
      author: 'Admin',
      tagsText: '',
      imagesText: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      slug: record.slug,
      excerpt: record.excerpt,
      content: record.content,
      featuredImage: record.featuredImage,
      category: record.category || 'News',
      author: record.author || 'Admin',
      isPublished: record.isPublished === true,
      tagsText: Array.isArray(record.tags) ? record.tags.join(', ') : '',
      imagesText: Array.isArray(record.images) ? record.images.join('\n') : '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const parseCommaList = (text = '') =>
    String(text)
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

  const parseLineList = (text = '') =>
    String(text)
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        slug: values.slug || undefined,
        excerpt: values.excerpt || '',
        content: values.content,
        featuredImage: values.featuredImage || '',
        category: values.category,
        author: values.author || 'Admin',
        isPublished: values.isPublished === true,
        tags: parseCommaList(values.tagsText),
        images: parseLineList(values.imagesText),
      };

      setSaving(true);
      if (editing?._id) {
        await adminPostsAPI.update(editing._id, payload);
        message.success('Cập nhật bài viết thành công');
      } else {
        await adminPostsAPI.create(payload);
        message.success('Tạo bài viết thành công');
      }

      closeModal();
      fetchPosts(pagination.current, pagination.pageSize);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || e?.message || 'Lỗi lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminPostsAPI.delete(id);
      message.success('Đã xóa bài viết');
      fetchPosts(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi xóa bài viết');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>/{r.slug || 'no-slug'}</Text>
        </div>
      ),
    },
    {
      title: 'Chuyên mục',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (v) => <Tag color="blue">{v || '—'}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 120,
      render: (v) => (v ? <Tag color="green">Đã đăng</Tag> : <Tag>Nháp</Tag>),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'views',
      key: 'views',
      width: 90,
      align: 'right',
      render: (v) => v ?? 0,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (v) => dayjs(v).format('DD/MM/YYYY'),
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
            title="Xóa bài viết"
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
            <FileTextOutlined style={{ marginRight: 8 }} />
            Quản lý Bài viết
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Tạo bài viết
          </Button>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => fetchPosts(1, pagination.pageSize)}
            placeholder="Tìm theo tiêu đề / slug / tác giả"
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col>
          <Select
            style={{ width: 160 }}
            allowClear
            value={filterCategory}
            onChange={(v) => setFilterCategory(v)}
            placeholder="Chuyên mục"
            options={CATEGORY_OPTIONS}
          />
        </Col>
        <Col>
          <Select
            style={{ width: 140 }}
            allowClear
            value={filterPublished}
            onChange={(v) => setFilterPublished(v)}
            placeholder="Trạng thái"
            options={[
              { label: 'Đã đăng', value: true },
              { label: 'Nháp', value: false },
            ]}
          />
        </Col>
        <Col>
          <Button icon={<SearchOutlined />} onClick={() => fetchPosts(1, pagination.pageSize)}>Lọc</Button>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText('');
              setFilterCategory('');
              setFilterPublished(undefined);
              fetchPosts(1, pagination.pageSize);
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
          showTotal: (total) => `Tổng ${total} bài viết`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 980 }}
      />

      <Modal
        title={editing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        width={860}
        okText={editing ? 'Lưu thay đổi' : 'Tạo'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[{ required: true, message: 'Nhập tiêu đề' }]}
              >
                <Input placeholder="Nhập tiêu đề bài viết" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="slug" label="Slug">
                <Input placeholder="tu-dong-neu-bo-trong" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="category" label="Chuyên mục" rules={[{ required: true, message: 'Chọn chuyên mục' }]}>
                <Select options={CATEGORY_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="author" label="Tác giả">
                <Input placeholder="Admin" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isPublished" label="Đã đăng" valuePropName="checked">
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="featuredImage" label="Ảnh đại diện">
            <Input placeholder="/uploads/... hoặc https://..." />
          </Form.Item>

          <Form.Item name="imagesText" label="Danh sách ảnh (mỗi dòng 1 URL)">
            <TextArea rows={3} placeholder="/uploads/a.jpg&#10;/uploads/b.jpg" />
          </Form.Item>

          <Form.Item name="excerpt" label="Tóm tắt">
            <TextArea rows={3} placeholder="Mô tả ngắn bài viết..." />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Nhập nội dung bài viết' }]}
          >
            <TextArea rows={10} placeholder="Nội dung chi tiết..." />
          </Form.Item>

          <Form.Item name="tagsText" label="Tags (ngăn cách bằng dấu phẩy)">
            <Input placeholder="sach, review, khuyen-doc" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PostManagement;
