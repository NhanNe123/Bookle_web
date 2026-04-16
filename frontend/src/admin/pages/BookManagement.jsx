import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Table, Button, Space, Input, Modal, Form, InputNumber, Select,
  Popconfirm, Tag, Image, message, Typography, Row, Col, Switch, Tooltip, Upload, Tabs, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined, BookOutlined,
  UploadOutlined, PictureOutlined,
} from '@ant-design/icons';
import { adminProductsAPI, adminUploadAPI } from '../../lib/api';

const { Title } = Typography;
const { TextArea } = Input;

const CATEGORY_OPTIONS = [
  { group: 'Văn học – Nghệ thuật', children: [
    { value: 'tieu-thuyet', label: 'Tiểu thuyết' },
    { value: 'trinh-tham', label: 'Trinh thám' },
    { value: 'lang-man', label: 'Lãng mạn' },
    { value: 'kinh-di', label: 'Kinh dị' },
    { value: 'tho', label: 'Thơ' },
    { value: 'light-novel', label: 'Light Novel' },
    { value: 'van-hoc-nuoc-ngoai', label: 'Văn học nước ngoài' },
  ]},
  { group: 'Kinh tế – Kinh doanh', children: [
    { value: 'quan-tri', label: 'Quản trị' },
    { value: 'khoi-nghiep', label: 'Khởi nghiệp' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'dau-tu-tai-chinh', label: 'Đầu tư – tài chính' },
    { value: 'ban-hang', label: 'Bán hàng' },
    { value: 'kinh-te-hoc', label: 'Kinh tế học' },
  ]},
  { group: 'Khoa học – Công nghệ', children: [
    { value: 'khoa-hoc-tu-nhien', label: 'Khoa học tự nhiên' },
    { value: 'cong-nghe-thong-tin', label: 'Công nghệ thông tin' },
    { value: 'ai-machine-learning', label: 'AI – Machine Learning' },
    { value: 'ky-thuat', label: 'Kỹ thuật' },
    { value: 'toan-hoc', label: 'Toán học' },
  ]},
  { group: 'Lịch sử – Chính trị – Xã hội', children: [
    { value: 'lich-su-the-gioi', label: 'Lịch sử thế giới' },
    { value: 'lich-su-viet-nam', label: 'Lịch sử Việt Nam' },
    { value: 'chinh-tri-phap-luat', label: 'Chính trị – pháp luật' },
    { value: 'triet-hoc', label: 'Triết học' },
    { value: 'xa-hoi-hoc', label: 'Xã hội học' },
  ]},
  { group: 'Tâm lý – Kỹ năng sống', children: [
    { value: 'tam-ly-hoc', label: 'Tâm lý học' },
    { value: 'tam-linh', label: 'Tâm linh' },
    { value: 'ky-nang-giao-tiep', label: 'Kỹ năng giao tiếp' },
    { value: 'phat-trien-ban-than', label: 'Phát triển bản thân' },
    { value: 'thien-song-toi-gian', label: 'Thiền – sống tối giản' },
  ]},
  { group: 'Thiếu nhi – Giáo dục', children: [
    { value: 'truyen-tranh', label: 'Truyện tranh' },
    { value: 'sach-mau', label: 'Sách màu' },
    { value: 'giao-trinh', label: 'Giáo trình' },
    { value: 'sach-hoc-tieng-anh', label: 'Sách học tiếng Anh' },
    { value: 'stem-cho-tre', label: 'STEM cho trẻ' },
  ]},
];

const selectCategoryOptions = CATEGORY_OPTIONS.map((g) => ({
  label: g.group,
  options: g.children,
}));

const categoryLabelMap = {};
CATEGORY_OPTIONS.forEach((g) =>
  g.children.forEach((c) => { categoryLabelMap[c.value] = c.label; })
);

const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' },
  { value: 'zh', label: 'Tiếng Trung' },
  { value: 'ja', label: 'Tiếng Nhật' },
  { value: 'ko', label: 'Tiếng Hàn' },
  { value: 'fr', label: 'Tiếng Pháp' },
];

const formatVND = (v) =>
  v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—';

const FALLBACK_COVER = '/assets/img/no-book-cover.svg';

function coverSrc(item) {
  const raw = item?.coverImage || (item?.images && item.images[0]);
  if (!raw) return FALLBACK_COVER;
  const s = String(raw).trim();
  if (/^https?:\/\//.test(s)) return s;
  return s.startsWith('/') ? s : `/${s}`;
}

function toImageSrc(u) {
  if (!u) return undefined;
  const s = String(u).trim();
  if (/^https?:\/\//.test(s)) return s;
  if (s.startsWith('blob:')) return s;
  return s.startsWith('/') ? s : `/${s}`;
}

/** coverImage trong form luôn nên là string URL — lọc object (RcFile / UploadFile). */
function normalizeCoverImageField(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object' && v !== null) {
    if (typeof v.url === 'string') return v.url.trim();
    if (typeof v.thumbUrl === 'string') return v.thumbUrl.trim();
    if (v.response && typeof v.response.url === 'string') return v.response.url.trim();
  }
  return '';
}

function extractImageUrlFromPaste(text) {
  if (!text || typeof text !== 'string') return '';
  const t = text.trim();
  const direct = t.match(
    /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s"'<>]*)?/i
  );
  if (direct) return direct[0];
  const any = t.match(/https?:\/\/[^\s]+/);
  if (any) return any[0].replace(/[),.;'"'\]}>]+$/, '');
  return t;
}

function uploadErrorMessage(err) {
  const d = err?.response?.data;
  if (d && typeof d.error === 'string') return d.error;
  if (typeof d === 'string') return d;
  return err?.message || 'Tải ảnh thất bại';
}

/** Editor nhận value / onChange từ Form.Item name="images" */
function ProductGalleryEditor({ value = [], onChange }) {
  const inflightRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const urls = Array.isArray(value) ? value : [];
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  const appendUrl = (url) => {
    const list = urlsRef.current;
    if (!url || list.includes(url)) return;
    const next = [...list, url];
    urlsRef.current = next;
    onChange?.(next);
  };

  const handleGalleryUpload = async ({ file, onSuccess, onError }) => {
    inflightRef.current += 1;
    if (inflightRef.current === 1) setBusy(true);
    try {
      const data = await adminUploadAPI.postFile(file);
      if (data?.url) appendUrl(data.url);
      message.success('Đã thêm ảnh vào thư viện');
      onSuccess?.(data, file);
    } catch (e) {
      message.error(uploadErrorMessage(e));
      onError?.(e);
    } finally {
      inflightRef.current = Math.max(0, inflightRef.current - 1);
      if (inflightRef.current === 0) setBusy(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Upload
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        showUploadList={false}
        customRequest={handleGalleryUpload}
      >
        <Button type="default" icon={<UploadOutlined />} loading={busy}>
          Tải ảnh phụ từ máy (có thể chọn nhiều file)
        </Button>
      </Upload>
      {urls.length > 0 && (
        <Space wrap size={[8, 8]}>
          {urls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              style={{
                position: 'relative',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <Image
                src={toImageSrc(url)}
                alt=""
                width={72}
                height={96}
                style={{ objectFit: 'cover', display: 'block' }}
                preview={{ mask: 'Xem' }}
              />
              <Button
                type="text"
                danger
                size="small"
                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,255,255,0.9)' }}
                onClick={() => onChange?.(urls.filter((_, i) => i !== idx))}
              >
                Xóa
              </Button>
            </div>
          ))}
        </Space>
      )}
    </Space>
  );
}

const BookManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [searchText, setSearchText] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const watchedCoverImage = Form.useWatch('coverImage', form);
  const [coverPreviewError, setCoverPreviewError] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverInputMode, setCoverInputMode] = useState('link');
  /** Blob URL tạm từ chọn file / dán ảnh (onChange Upload + createObjectURL) — không ghi đè bởi revoke trước khi upload */
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewBlobRef = useRef(null);

  const revokePreviewBlob = useCallback(() => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current);
      previewBlobRef.current = null;
    }
  }, []);

  const clearPreviewBlob = useCallback(() => {
    revokePreviewBlob();
    setPreviewUrl(null);
  }, [revokePreviewBlob]);

  const setPreviewFromFile = useCallback(
    (file) => {
      if (!(file instanceof Blob) || !file.size) return;
      revokePreviewBlob();
      const u = URL.createObjectURL(file);
      previewBlobRef.current = u;
      setPreviewUrl(u);
      setCoverPreviewError(false);
    },
    [revokePreviewBlob]
  );

  const coverDisplaySrc = useMemo(() => {
    const blob = previewUrl && String(previewUrl).startsWith('blob:') ? String(previewUrl) : null;
    if (blob) return blob;
    const w = normalizeCoverImageField(watchedCoverImage);
    if (w) {
      const s = toImageSrc(w);
      return typeof s === 'string' && s ? s : FALLBACK_COVER;
    }
    return FALLBACK_COVER;
  }, [previewUrl, watchedCoverImage]);

  /** Upload file bằng FormData + fetch POST /api/upload (preview blob đã tạo ở onChange / paste) */
 const uploadCoverFromFile = useCallback(
  async (file) => {
    if (!file) return;
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('bookle_admin_token'); // Đảm bảo key token đúng
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // KHÔNG set Content-Type ở đây, để trình duyệt tự set kèm boundary
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok && data.url) {
        // Cập nhật giá trị thật vào Form
        form.setFieldsValue({ coverImage: data.url });
        // KHÔNG setPreviewUrl(null) ngay lập tức để tránh mất ảnh hiển thị
        message.success('Tải ảnh lên thành công');
      } else {
        throw new Error(data.error || 'Upload thất bại');
      }
    } catch (e) {
      message.error(e.message);
      setPreviewUrl(null); // Nếu lỗi thì mới xóa ảnh xem trước
    } finally {
      setCoverUploading(false);
    }
  },
  [form]
);

  useEffect(() => {
    if (!modalOpen) {
      revokePreviewBlob();
      setPreviewUrl(null);
    }
  }, [modalOpen, revokePreviewBlob]);

  const fetchBooks = useCallback(async (page = 1, limit = 10, q = '') => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (q) params.q = q;
      const res = await adminProductsAPI.list(params);
      setData(res.items || []);
      setPagination((prev) => ({
        ...prev,
        current: res.page || page,
        total: res.total || 0,
        pageSize: limit,
      }));
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi tải danh sách sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleTableChange = (pag) => {
    fetchBooks(pag.current, pag.pageSize, searchText);
  };

  const handleSearch = () => {
    fetchBooks(1, pagination.pageSize, searchText);
  };

  const handleRefresh = () => {
    setSearchText('');
    fetchBooks(1, pagination.pageSize, '');
  };

  // ── Modal open/close ──
  const openCreate = () => {
    setEditingBook(null);
    clearPreviewBlob();
    form.resetFields();
    form.setFieldsValue({ language: 'vi', isAvailable: true, stock: 0, price: 0, images: [] });
    setCoverPreviewError(false);
    setCoverInputMode('link');
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingBook(record);
    clearPreviewBlob();
    setCoverPreviewError(false);
    form.setFieldsValue({
      name: record.name,
      author: record.author,
      price: record.price,
      compareAtPrice: record.compareAtPrice,
      categories: record.categories || [],
      isbn: record.isbn,
      stock: record.stock ?? 0,
      isAvailable: record.isAvailable !== false,
      language: record.language || 'vi',
      publisher: record.publisher,
      pages: record.pages,
      shortDescription: record.shortDescription,
      description: record.description,
      coverImage: record.coverImage,
      images: Array.isArray(record.images) ? [...record.images] : [],
    });
    setCoverInputMode('link');
    setModalOpen(true);
  };

  const closeModal = () => {
    clearPreviewBlob();
    setModalOpen(false);
    setEditingBook(null);
    form.resetFields();
  };

  // ── Save (create / update) ──
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        coverImage: normalizeCoverImageField(values.coverImage),
        images: (values.images || []).map((s) => String(s).trim()).filter(Boolean),
      };
      setSaving(true);

      if (editingBook) {
        await adminProductsAPI.update(editingBook._id, payload);
        message.success('Cập nhật sách thành công');
      } else {
        await adminProductsAPI.create(payload);
        message.success('Thêm sách mới thành công');
      }

      closeModal();
      fetchBooks(pagination.current, pagination.pageSize, searchText);
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || e?.message || 'Lỗi lưu sách');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    try {
      await adminProductsAPI.delete(id);
      message.success('Đã xóa sách');
      fetchBooks(pagination.current, pagination.pageSize, searchText);
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi xóa sách');
    }
  };

  const handleCoverUploadChange = (info) => {
    const raw = info?.file?.originFileObj;
    if (raw instanceof File && raw.size > 0) {
      setCoverPreviewError(false);
      setPreviewFromFile(raw);
    }
  };

  const handleCoverUpload = async ({ file, onSuccess, onError }) => {
    const raw = file?.originFileObj ?? file;
    if (raw instanceof File && raw.size > 0) {
      setPreviewFromFile(raw);
    }
    try {
      await uploadCoverFromFile(raw);
      onSuccess?.({ url: form.getFieldValue('coverImage') }, file);
    } catch (e) {
      onError?.(e);
    }
  };

  const handlePaste = async (e) => {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const blob = items[i].getAsFile();
      if (blob) {
        e.preventDefault();
        // Tạo preview ngay lập tức
        const tempUrl = URL.createObjectURL(blob);
        setPreviewUrl(tempUrl);
        // Upload lên server
        await uploadCoverFromFile(blob);
        return;
      }
    }
  }
};

    const fileList = cd.files?.length ? Array.from(cd.files) : [];
    const fromFiles = fileList.find((x) => x.type?.startsWith('image/') && x.size > 0);
    if (fromFiles) {
      e.preventDefault();
      setPreviewFromFile(fromFiles);
      try {
        await uploadCoverFromFile(fromFiles);
      } catch {
        /* */
      }
      return;
    }

    const rawText = cd.getData('text/plain') || cd.getData('text') || '';
    const url = extractImageUrlFromPaste(rawText);
    if (url) {
      e.preventDefault();
      clearPreviewBlob();
      form.setFieldsValue({ coverImage: url });
      setCoverPreviewError(false);
    }
  };

  // ── Table columns ──
  const columns = useMemo(() => [
    {
      title: 'Ảnh bìa',
      dataIndex: 'coverImage',
      key: 'cover',
      width: 80,
      render: (_, record) => (
        <Image
          src={coverSrc(record)}
          alt={record.name}
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 6 }}
          fallback={FALLBACK_COVER}
          preview={{ mask: 'Xem' }}
        />
      ),
    },
    {
      title: 'Tên sách',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      sorter: (a, b) => (a.name || '').localeCompare(b.name || '', 'vi'),
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{text}</div>
          {record.sku && (
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>SKU: {record.sku}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
      width: 160,
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#bfbfbf' }}>—</span>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
      render: (v) => <span style={{ fontWeight: 500 }}>{formatVND(v)}</span>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'categories',
      key: 'categories',
      width: 200,
      render: (cats) =>
        (cats || []).slice(0, 3).map((c) => (
          <Tag key={c} color="blue" style={{ marginBottom: 2 }}>
            {categoryLabelMap[c] || c}
          </Tag>
        )),
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.stock || 0) - (b.stock || 0),
      render: (v) => (
        <Tag color={v > 0 ? 'green' : 'red'}>{v ?? 0}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa sách"
            description="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button danger icon={<DeleteOutlined />} size="small" />
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
            <BookOutlined style={{ marginRight: 8 }} />
            Quản lý Sách
          </Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Thêm sách mới
          </Button>
        </Col>
      </Row>

      {/* Search bar */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            placeholder="Tìm theo tên, tác giả, SKU, ISBN…"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
        </Col>
        <Col>
          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm
          </Button>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} sách`,
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
        size="middle"
      />

      {/* Modal Create / Edit */}
      <Modal
        title={editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        confirmLoading={saving}
        okText={editingBook ? 'Lưu thay đổi' : 'Tạo sách'}
        cancelText="Hủy"
        width={820}
        destroyOnClose
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên sách"
                rules={[{ required: true, message: 'Nhập tên sách' }]}
              >
                <Input placeholder="Nhập tên sách" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isbn" label="ISBN">
                <Input placeholder="978-..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="author" label="Tác giả">
                <Input placeholder="Tên tác giả" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="publisher" label="Nhà xuất bản">
                <Input placeholder="NXB..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Giá bán (₫)"
                rules={[{ required: true, message: 'Nhập giá' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v.replace(/,/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="compareAtPrice" label="Giá so sánh (₫)">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => v.replace(/,/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stock" label="Tồn kho">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="categories" label="Danh mục">
                <Select
                  mode="multiple"
                  placeholder="Chọn danh mục"
                  options={selectCategoryOptions}
                  maxTagCount={3}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="language" label="Ngôn ngữ">
                <Select options={LANGUAGE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="pages" label="Số trang">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="isAvailable"
                label="Đang bán"
                valuePropName="checked"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
          </Row>

          {/* Không dùng Form.Item có label bọc Row/Tabs — trình duyệt báo label[for] không khớp id */}
          <div style={{ marginBottom: 24 }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
              Ảnh bìa
            </Typography.Text>
            <Row gutter={20} align="top">
              <Col xs={24} md={14}>
                <Tabs
                  activeKey={coverInputMode}
                  onChange={setCoverInputMode}
                  items={[
                    {
                      key: 'link',
                      label: 'Dán link',
                      children: (
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 13 }}>
                          Dán link ảnh có đuôi .jpg / .png … hoặc dán dòng chứa URL; ô nhập nằm ngay bên dưới (luôn
                          gắn với form).
                        </Typography.Paragraph>
                      ),
                    },
                    {
                      key: 'upload',
                      label: 'Tải lên',
                      children: (
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Typography.Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                            Chọn ảnh từ máy — gửi <Typography.Text code>POST /api/upload</Typography.Text> kèm{' '}
                            <Typography.Text code>Authorization: Bearer</Typography.Text> (token admin). Định dạng:
                            JPG, PNG, GIF, WEBP; tối đa 5MB.
                          </Typography.Paragraph>
                          <Upload
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            maxCount={1}
                            showUploadList={false}
                            onChange={handleCoverUploadChange}
                            customRequest={handleCoverUpload}
                          >
                            <Button type="primary" icon={<UploadOutlined />} loading={coverUploading}>
                              Chọn ảnh từ máy
                            </Button>
                          </Upload>
                        </Space>
                      ),
                    },
                  ]}
                />
                <Form.Item
                  name="coverImage"
                  label={coverInputMode === 'link' ? 'URL ảnh bìa' : undefined}
                  style={{ marginBottom: 0, marginTop: 8, display: coverInputMode === 'link' ? 'block' : 'none' }}
                  getValueFromEvent={(e) => {
                    if (typeof e === 'string') return e;
                    return e?.target?.value ?? '';
                  }}
                >
                  <Input
                    placeholder="https://… hoặc /uploads/ten-anh.jpg — có thể dán ảnh từ clipboard"
                    allowClear
                    onChange={() => setCoverPreviewError(false)}
                    onPaste={handlePaste}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  Xem trước (cập nhật ngay khi chọn file / dán link hoặc ảnh)
                </Typography.Text>
                <div
                  style={{
                    position: 'relative',
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 8,
                    textAlign: 'center',
                    border: '1px solid #f0f0f0',
                    minHeight: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {coverUploading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.65)',
                        borderRadius: 8,
                      }}
                    >
                      <Spin size="large" tip="Đang tải lên…" />
                    </div>
                  )}
                  {coverPreviewError ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <PictureOutlined style={{ fontSize: 56, color: '#bfbfbf' }} />
                      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                        Không tải được ảnh — kiểm tra link hoặc thử upload lại.
                      </Typography.Paragraph>
                    </div>
                  ) : (
                    <Image
                      key={coverDisplaySrc}
                      src={typeof coverDisplaySrc === 'string' ? coverDisplaySrc : FALLBACK_COVER}
                      alt="Xem trước ảnh bìa"
                      width="100%"
                      style={{ maxWidth: 220, height: 280, objectFit: 'cover', borderRadius: 8 }}
                      fallback={FALLBACK_COVER}
                      preview={
                        coverDisplaySrc && coverDisplaySrc !== FALLBACK_COVER ? { mask: 'Xem' } : false
                      }
                      onError={() => setCoverPreviewError(true)}
                    />
                  )}
                </div>
              </Col>
            </Row>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Tooltip title="Ảnh bổ sung hiển thị trên trang chi tiết sản phẩm">
              <Typography.Text strong style={{ display: 'inline-block', marginBottom: 12, cursor: 'help' }}>
                Ảnh phụ (gallery)
              </Typography.Text>
            </Tooltip>
            <Form.Item name="images" style={{ marginBottom: 0 }}>
              <ProductGalleryEditor />
            </Form.Item>
          </div>

          <Form.Item name="shortDescription" label="Mô tả ngắn">
            <TextArea rows={2} placeholder="Mô tả ngắn hiển thị trên card…" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết">
            <TextArea rows={4} placeholder="Nội dung mô tả đầy đủ…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookManagement;
Tôi là code hãy kiểm tra logic