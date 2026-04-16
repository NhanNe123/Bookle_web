import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Row, Col, Card, Form, Input, InputNumber, Button, Select,
  ColorPicker, Spin, Typography, Tag, Divider, message, Space,
  Table, Popconfirm, Modal, DatePicker, Switch, Tooltip, Empty,
  Skeleton, Descriptions, Badge,
} from 'antd';
import {
  ExperimentOutlined, SaveOutlined, CalendarOutlined,
  ReloadOutlined, BulbOutlined, BookOutlined, TagOutlined,
  StarOutlined, StopOutlined, HistoryOutlined, EyeOutlined,
  ThunderboltOutlined, QuestionCircleOutlined, ShoppingOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { eventsAPI } from '../../lib/api';
import {
  applyTheme, resetTheme, getContrastYIQ, getPreviewThemeStyle,
} from '../../utils/themeEngine';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AI_SUGGEST_HISTORY_KEY = 'bookle_event_ai_suggestions_v1';

const DECORATION_OPTIONS = [
  { value: 'none', label: 'Không hiệu ứng' },
  { value: 'snow', label: '❄️ Tuyết rơi (Giáng sinh)' },
  { value: 'noel', label: '🎄 Noel (Cây thông + quà)' },
  { value: 'tet', label: '🧧 Tết (Hoa mai + lì xì)' },
  { value: 'sakura', label: '🌸 Hoa anh đào' },
  { value: 'rose', label: '🌹 Hoa hồng (8/3)' },
  { value: 'hearts', label: '💕 Trái tim (Valentine)' },
  { value: 'teacher', label: '📚 Nhà giáo (20/11)' },
  { value: 'book', label: '📘 Sách bay' },
  { value: 'firework', label: '🎆 Pháo hoa' },
  { value: 'confetti', label: '🎊 Confetti' },
  { value: 'lantern', label: '🏮 Đèn lồng' },
  { value: 'leaves', label: '🍂 Lá rơi (Thu)' },
];

const DECORATION_TOOLTIP =
  'Hiệu ứng nổi (tuyết, hoa, confetti…) hiển thị trên toàn trang khách: nằm phía sau nút bấm (z-index thấp), không chặn thao tác mua hàng. Chọn "Không hiệu ứng" nếu muốn giao diện tĩnh.';

const CATEGORY_OPTIONS = [
  { value: 'tieu-thuyet', label: 'Tiểu thuyết' },
  { value: 'trinh-tham', label: 'Trinh thám' },
  { value: 'lang-man', label: 'Lãng mạn' },
  { value: 'kinh-di', label: 'Kinh dị' },
  { value: 'light-novel', label: 'Light Novel' },
  { value: 'van-hoc-nuoc-ngoai', label: 'Văn học nước ngoài' },
  { value: 'quan-tri', label: 'Quản trị' },
  { value: 'khoi-nghiep', label: 'Khởi nghiệp' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'dau-tu-tai-chinh', label: 'Đầu tư tài chính' },
  { value: 'cong-nghe-thong-tin', label: 'Công nghệ thông tin' },
  { value: 'ai-machine-learning', label: 'AI – Machine Learning' },
  { value: 'tam-ly-hoc', label: 'Tâm lý học' },
  { value: 'phat-trien-ban-than', label: 'Phát triển bản thân' },
  { value: 'truyen-tranh', label: 'Truyện tranh' },
  { value: 'giao-trinh', label: 'Giáo trình' },
];

function colorToHex(c) {
  if (!c) return undefined;
  if (typeof c === 'string') return c;
  if (typeof c?.toHexString === 'function') return c.toHexString();
  if (typeof c?.toHex === 'function') return `#${c.toHex()}`;
  return String(c);
}

function loadAiHistory() {
  try {
    return JSON.parse(localStorage.getItem(AI_SUGGEST_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAiHistoryItem(entry) {
  const arr = loadAiHistory();
  arr.unshift({ ...entry, savedAt: new Date().toISOString() });
  localStorage.setItem(AI_SUGGEST_HISTORY_KEY, JSON.stringify(arr.slice(0, 25)));
}

function eventRowStatus(row) {
  const now = Date.now();
  if (!row.isActive) {
    return { label: 'Đã tắt', status: 'default' };
  }
  const end = row.endDate ? new Date(row.endDate).getTime() : 0;
  const start = row.startDate ? new Date(row.startDate).getTime() : 0;
  if (end && end < now) {
    return { label: 'Đã kết thúc', status: 'warning' };
  }
  if (start && start > now) {
    return { label: 'Sắp diễn ra', status: 'processing' };
  }
  return { label: 'Đang diễn ra', status: 'success' };
}

const EventManagement = () => {
  const [form] = Form.useForm();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  const primaryColor = Form.useWatch('primaryColor', form);
  const secondaryColor = Form.useWatch('secondaryColor', form);
  const decorationType = Form.useWatch('decorationType', form);
  const textOnPrimaryField = Form.useWatch('textOnPrimary', form);
  const priceColorField = Form.useWatch('priceColor', form);
  const statusSuccessField = Form.useWatch('statusSuccessColor', form);
  const eventName = Form.useWatch('name', form);
  const slogan = Form.useWatch('suggestedSlogan', form);
  const discountPercent = Form.useWatch('discountPercent', form);

  const pHex = colorToHex(primaryColor) || '#036280';
  const sHex = colorToHex(secondaryColor) || '#FF6500';
  const textOnHex = colorToHex(textOnPrimaryField) || getContrastYIQ(pHex);
  const priceHex = colorToHex(priceColorField) || '#e67e22';
  const successHex = colorToHex(statusSuccessField) || '#16a34a';

  const previewScopeStyle = useMemo(
    () =>
      getPreviewThemeStyle({
        primaryColor: pHex,
        secondaryColor: sHex,
        decorationType: decorationType || 'none',
        textOnPrimary: textOnHex,
        priceColor: priceHex,
        statusSuccessColor: successHex,
      }),
    [pHex, sHex, decorationType, textOnHex, priceHex, successHex],
  );

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const data = await eventsAPI.list();
      if (data?.success && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAISuggest = async () => {
    if (!aiPrompt.trim()) {
      message.warning('Nhập ý tưởng sự kiện trước (ví dụ: "Quốc tế Phụ nữ")');
      return;
    }
    setAiLoading(true);
    try {
      const data = await eventsAPI.suggest(aiPrompt.trim());
      if (!data?.success || !data.suggestion) {
        message.error(data?.error || 'AI không trả về gợi ý hợp lệ');
        return;
      }
      const s = data.suggestion;
      const themeConfig = {
        primaryColor: s.themeConfig?.primaryColor || '#036280',
        secondaryColor: s.themeConfig?.secondaryColor || '#FF6500',
        decorationType: s.themeConfig?.decorationType || 'none',
      };
      form.setFieldsValue({
        name: s.name || '',
        ...themeConfig,
        discountPercent: s.discountConfig?.discountPercent ?? 10,
        targetCategories: s.discountConfig?.targetCategories || [],
        suggestedSlogan: s.suggestedSlogan || '',
      });
      applyTheme(themeConfig);
      saveAiHistoryItem({
        prompt: aiPrompt.trim(),
        name: s.name,
        themeConfig,
        suggestedSlogan: s.suggestedSlogan || '',
        discountPercent: s.discountConfig?.discountPercent,
      });
      setHistoryVersion((v) => v + 1);
      message.success('AI đã gợi ý thành công! Giao diện đã thay đổi theo theme.');
    } catch (e) {
      message.error(
        e?.response?.data?.error || e?.message || 'Lỗi gọi AI. Kiểm tra Ollama đang chạy.',
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyHistoryEntry = (entry) => {
    const tc = entry.themeConfig || {};
    const pc = tc.primaryColor || '#036280';
    form.setFieldsValue({
      name: entry.name || '',
      primaryColor: pc,
      secondaryColor: tc.secondaryColor || '#FF6500',
      decorationType: tc.decorationType || 'none',
      textOnPrimary: tc.textOnPrimary || getContrastYIQ(pc),
      priceColor: tc.priceColor || '#e67e22',
      statusSuccessColor: tc.statusSuccessColor || '#16a34a',
      discountPercent: entry.discountPercent ?? 10,
      suggestedSlogan: entry.suggestedSlogan || '',
    });
    applyTheme({
      primaryColor: tc.primaryColor,
      secondaryColor: tc.secondaryColor,
      decorationType: tc.decorationType,
      textOnPrimary: tc.textOnPrimary,
      priceColor: tc.priceColor,
      statusSuccessColor: tc.statusSuccessColor,
    });
    setHistoryOpen(false);
    message.success('Đã áp dụng gợi ý từ lịch sử vào form');
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        name: values.name,
        startDate: values.dateRange?.[0]?.toISOString() || new Date().toISOString(),
        endDate: values.dateRange?.[1]?.toISOString() || new Date(Date.now() + 7 * 86400000).toISOString(),
        isActive: values.isActive !== false,
        themeConfig: {
          primaryColor: colorToHex(values.primaryColor) || '#036280',
          secondaryColor: colorToHex(values.secondaryColor) || '#FF6500',
          decorationType: values.decorationType || 'none',
          textOnPrimary: colorToHex(values.textOnPrimary) || undefined,
          priceColor: colorToHex(values.priceColor) || undefined,
          statusSuccessColor: colorToHex(values.statusSuccessColor) || undefined,
        },
        discountConfig: {
          discountPercent: values.discountPercent || 0,
          targetCategories: values.targetCategories || [],
        },
        suggestedSlogan: values.suggestedSlogan || '',
      };

      if (editingEvent) {
        await eventsAPI.update(editingEvent._id || editingEvent.id, payload);
        message.success('Đã cập nhật sự kiện');
      } else {
        await eventsAPI.create(payload);
        message.success('Đã tạo sự kiện mới');
      }

      applyTheme(payload.themeConfig);
      form.resetFields();
      setEditingEvent(null);
      fetchEvents();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.error || e?.message || 'Lỗi lưu sự kiện');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setEditingEvent(null);
    setAiPrompt('');
  };

  const handleDeactivate = async (id) => {
    try {
      const data = await eventsAPI.deactivate(id);
      if (data.success) {
        message.success('Đã hủy sự kiện — giao diện trở về mặc định');
        resetTheme();
        fetchEvents();
      }
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi hủy sự kiện');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!id || String(id) === 'undefined') {
      message.error('Không xác định được ID sự kiện — tải lại trang và thử lại.');
      return;
    }
    try {
      const data = await eventsAPI.remove(id);
      if (!data.success) return;
      message.success(
        data.wasActiveNow
          ? 'Đã xóa sự kiện — đồng bộ theme theo sự kiện đang diễn ra còn lại (hoặc mặc định).'
          : 'Đã xóa sự kiện khỏi hệ thống.',
      );
      try {
        const ar = await fetch('/api/events/active').then((r) => r.json());
        if (ar?.success && ar?.event?.themeConfig) {
          applyTheme(ar.event.themeConfig);
        } else {
          resetTheme();
        }
      } catch {
        resetTheme();
      }
      fetchEvents();
    } catch (e) {
      message.error(e?.response?.data?.error || 'Lỗi xóa sự kiện');
    }
  };

  const handleReapplyTheme = (row) => {
    const tc = row.themeConfig || {};
    applyTheme({
      primaryColor: tc.primaryColor || '#036280',
      secondaryColor: tc.secondaryColor || '#FF6500',
      decorationType: tc.decorationType || 'none',
      textOnPrimary: tc.textOnPrimary,
      priceColor: tc.priceColor,
      statusSuccessColor: tc.statusSuccessColor,
    });
    message.success('Đã áp dụng lại theme của sự kiện lên toàn site (màu & biến CSS)');
  };

  const openDetail = (row) => {
    setDetailRecord(row);
    setDetailOpen(true);
  };

  const labelWithTip = (text, tooltip) => (
    <Space size={6}>
      <span>{text}</span>
      <Tooltip title={tooltip}>
        <QuestionCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );

  const historyItems = useMemo(() => loadAiHistory(), [historyVersion, historyOpen]);

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <CalendarOutlined style={{ marginRight: 8 }} />
        Quản lý Sự kiện
      </Title>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <ExperimentOutlined style={{ color: '#722ed1' }} />
                <span>Trợ lý AI</span>
              </Space>
            }
            style={{
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
              marginBottom: 24,
            }}
            styles={{ header: { borderBottom: '1px solid #e8e0ff' } }}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
              Nhập ý tưởng ngắn gọn, AI sẽ gợi ý tên, màu sắc, hiệu ứng, slogan và % giảm giá phù hợp.
            </Text>

            <Input
              size="large"
              placeholder='Ví dụ: "Quốc tế Phụ nữ", "Tết Trung Thu"'
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onPressEnter={handleAISuggest}
              disabled={aiLoading}
              prefix={<BulbOutlined style={{ color: '#faad14' }} />}
              style={{ marginBottom: 12, borderRadius: 10 }}
            />

            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Button
                type="primary"
                size="large"
                loading={aiLoading}
                onClick={handleAISuggest}
                style={{
                  flex: 1,
                  height: 48,
                  fontWeight: 700,
                  borderRadius: '10px 0 0 10px',
                  fontSize: 15,
                  background: 'linear-gradient(135deg, #722ed1 0%, #1677ff 100%)',
                  border: 'none',
                }}
              >
                {aiLoading ? 'AI đang suy nghĩ…' : '✨ Gợi ý bằng AI'}
              </Button>
              <Button
                size="large"
                icon={<HistoryOutlined />}
                onClick={() => setHistoryOpen(true)}
                style={{ height: 48, borderRadius: '0 10px 10px 0', fontWeight: 600 }}
              >
                Lịch sử
              </Button>
            </Space.Compact>

            {aiLoading && (
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <Spin size="small" tip="Đang phân tích ý tưởng…" />
              </div>
            )}
          </Card>

          {/* Interactive preview — scoped CSS variables */}
          <Card
            title="Xem trước tương tác (Header + thẻ sách)"
            style={{ borderRadius: 12, marginBottom: 24, overflow: 'hidden' }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ background: '#dfe3ea', padding: 14 }}>
              <div
                style={{
                  ...previewScopeStyle,
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  maxWidth: '100%',
                }}
              >
                <header
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--primary-color)',
                    color: 'var(--text-on-primary)',
                    fontFamily: 'var(--theme-font), system-ui, sans-serif',
                    gap: 12,
                  }}
                >
                  <Space size={10}>
                    <BookOutlined style={{ fontSize: 20 }} />
                    <span style={{ fontWeight: 800, letterSpacing: 0.5 }}>BOOKLE</span>
                    <span style={{ opacity: 0.85, fontSize: 12, fontWeight: 500 }}>Cửa hàng</span>
                  </Space>
                  <Space size={14} style={{ fontSize: 12, opacity: 0.9 }}>
                    <span>Trang chủ</span>
                    <span>Danh mục</span>
                    <ShoppingOutlined />
                  </Space>
                </header>

                <div
                  style={{
                    position: 'relative',
                    minHeight: 200,
                    padding: '14px 12px 18px',
                    background: 'var(--bg-body)',
                    fontFamily: 'var(--theme-font), system-ui, sans-serif',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--hero-overlay)',
                      opacity: 0.35,
                      pointerEvents: 'none',
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 1, marginBottom: 12 }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 17, lineHeight: 1.25 }}>
                      {eventName || 'Tên sự kiện'}
                    </div>
                    {slogan ? (
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                        “{slogan}”
                      </div>
                    ) : null}
                    {discountPercent > 0 ? (
                      <Tag color={sHex} style={{ marginTop: 8 }}>
                        <TagOutlined /> Giảm {discountPercent}%
                      </Tag>
                    ) : null}
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                    }}
                  >
                    {['Sách mẫu A', 'Sách mẫu B'].map((title) => (
                      <div
                        key={title}
                        style={{
                          background: 'var(--card-bg)',
                          borderRadius: 'var(--card-radius)',
                          boxShadow: 'var(--card-shadow)',
                          border: '1px solid var(--border-color)',
                          overflow: 'hidden',
                          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: '3 / 4',
                            width: '100%',
                            background: `linear-gradient(145deg, ${hexToRgbaForPreview(pHex, 0.25)}, ${hexToRgbaForPreview(sHex, 0.2)})`,
                            objectFit: 'cover',
                            borderBottom: '1px solid var(--border-color)',
                          }}
                        />
                        <div style={{ padding: '10px 10px 12px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--card-text)', marginBottom: 4 }}>
                            {title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Tác giả mẫu
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--price-color)', fontWeight: 800, fontSize: 14 }}>
                              189.000&nbsp;₫
                            </span>
                            <span style={{ color: 'var(--status-success)', fontSize: 11, fontWeight: 600 }}>
                              Còn hàng
                            </span>
                          </div>
                          {discountPercent > 0 ? (
                            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--secondary-color)', fontWeight: 600 }}>
                              Ưu đãi sự kiện −{discountPercent}%
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            extra={
              editingEvent && (
                <Button size="small" onClick={handleReset}>
                  Hủy sửa
                </Button>
              )
            }
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            <div style={{ position: 'relative' }}>
              {aiLoading ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 6,
                    background: 'rgba(255,255,255,0.94)',
                    padding: 20,
                    borderRadius: 8,
                    pointerEvents: 'none',
                  }}
                >
                  <Skeleton active title={{ width: '35%' }} paragraph={{ rows: 10 }} />
                </div>
              ) : null}

              <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                initialValues={{
                  primaryColor: '#036280',
                  secondaryColor: '#FF6500',
                  decorationType: 'none',
                  textOnPrimary: getContrastYIQ('#036280'),
                  priceColor: '#e67e22',
                  statusSuccessColor: '#16a34a',
                  discountPercent: 10,
                  isActive: true,
                  targetCategories: [],
                }}
              >
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item
                      name="name"
                      label={labelWithTip(
                        'Tên sự kiện',
                        'Tên hiển thị nội bộ và trên banner khách (nếu có).',
                      )}
                      rules={[{ required: true, message: 'Nhập tên sự kiện' }]}
                    >
                      <Input size="large" placeholder="Ví dụ: Lễ hội mùa hè Bookle" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="isActive"
                      label={labelWithTip(
                        'Kích hoạt',
                        'Khi tắt, sự kiện không còn áp dụng giảm giá / theme dù vẫn nằm trong khung thời gian.',
                      )}
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="dateRange"
                  label={labelWithTip(
                    'Thời gian diễn ra',
                    'Khung giờ áp dụng giảm giá và theme trên storefront.',
                  )}
                  rules={[
                    { required: true, message: 'Chọn khoảng thời gian diễn ra sự kiện' },
                    () => ({
                      validator(_, value) {
                        if (!value?.[0] || !value?.[1]) return Promise.resolve();
                        if (value[1].valueOf() < value[0].valueOf()) {
                          return Promise.reject(
                            new Error('Thời gian kết thúc không được nhỏ hơn thời gian bắt đầu'),
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker.RangePicker
                    showTime
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY HH:mm"
                    placeholder={['Bắt đầu', 'Kết thúc']}
                  />
                </Form.Item>

                <Divider orientation="left" orientationMargin={0}>
                  <StarOutlined /> Giao diện & Hiệu ứng
                </Divider>

                <Form.Item
                  name="decorationType"
                  label={labelWithTip('Hiệu ứng trang trí', DECORATION_TOOLTIP)}
                  style={{ maxWidth: 520, marginBottom: 16 }}
                >
                  <Select options={DECORATION_OPTIONS} />
                </Form.Item>

                <div
                  style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderRadius: 10,
                    padding: '16px 16px 8px',
                    marginBottom: 20,
                  }}
                >
                  <Text strong style={{ display: 'block', marginBottom: 4 }}>
                    Bảng màu storefront
                  </Text>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 14, fontSize: 12 }}>
                    Chỉnh trực tiếp các biến màu áp dụng lên trang khách và khung xem trước bên trái. Giá trị được lưu trong theme sự kiện.
                  </Text>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={4}>
                      <Form.Item
                        name="primaryColor"
                        label={labelWithTip('Primary', 'Màu chủ đạo: header, nút CTA, overlay hero.')}
                        style={{ marginBottom: 8 }}
                      >
                        <ColorPicker showText format="hex" size="small" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={4}>
                      <Form.Item
                        name="secondaryColor"
                        label={labelWithTip('Secondary', 'Màu nhấn: tag sale, liên kết phụ, gradient phối.')}
                        style={{ marginBottom: 8 }}
                      >
                        <ColorPicker showText format="hex" size="small" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={5}>
                      <Form.Item
                        name="textOnPrimary"
                        label={labelWithTip('Text trên Primary', 'Chữ trên nền màu chính (logo khu vực header, nút trùng nền primary).')}
                        style={{ marginBottom: 8 }}
                        extra={(
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, height: 'auto', fontSize: 12 }}
                            onClick={() => {
                              const ph = colorToHex(form.getFieldValue('primaryColor')) || '#036280';
                              form.setFieldsValue({ textOnPrimary: getContrastYIQ(ph) });
                            }}
                          >
                            Tự động theo Primary
                          </Button>
                        )}
                      >
                        <ColorPicker showText format="hex" size="small" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={5}>
                      <Form.Item
                        name="priceColor"
                        label={labelWithTip('Giá', 'Màu hiển thị giá bán / giá khuyến mãi trên thẻ sách và chi tiết sản phẩm.')}
                        style={{ marginBottom: 8 }}
                      >
                        <ColorPicker showText format="hex" size="small" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Form.Item
                        name="statusSuccessColor"
                        label={labelWithTip('Còn hàng', 'Màu trạng thái tích cực (còn hàng, thành công) trên storefront.')}
                        style={{ marginBottom: 8 }}
                      >
                        <ColorPicker showText format="hex" size="small" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px 20px',
                      paddingTop: 4,
                      paddingBottom: 8,
                      fontSize: 11,
                      borderTop: '1px dashed #e8e8e8',
                      marginTop: 4,
                    }}
                  >
                    {[
                      { label: 'Primary', hex: pHex },
                      { label: 'Secondary', hex: sHex },
                      { label: 'Text / Primary', hex: textOnHex, swatchBg: pHex, letter: 'A' },
                      { label: 'Giá', hex: priceHex },
                      { label: 'Còn hàng', hex: successHex },
                    ].map((item) => (
                      <Space size={6} key={item.label} align="center">
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: item.swatchBg || item.hex,
                            border: '1px solid #d9d9d9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.letter ? item.hex : undefined,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {item.letter || ''}
                        </div>
                        <Text type="secondary">{item.label}</Text>
                        <Text code style={{ fontSize: 11 }}>{item.hex}</Text>
                      </Space>
                    ))}
                  </div>
                </div>

                <Divider orientation="left" orientationMargin={0}>
                  <TagOutlined /> Khuyến mãi
                </Divider>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="discountPercent"
                      label={labelWithTip(
                        '% Giảm giá',
                        'Phần trăm giảm cho sản phẩm thuộc danh mục được chọn (tính trên server khi trả API).',
                      )}
                    >
                      <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item
                      name="targetCategories"
                      label={labelWithTip(
                        'Danh mục áp dụng',
                        'Chỉ các slug danh mục được chọn mới nhận salePrice theo sự kiện. Để trống = không áp dụng theo danh mục (tuỳ logic backend).',
                      )}
                    >
                      <Select
                        mode="multiple"
                        placeholder="Chọn danh mục được giảm giá"
                        options={CATEGORY_OPTIONS}
                        maxTagCount={4}
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="suggestedSlogan"
                  label={labelWithTip(
                    'Slogan',
                    'Câu chữ hiển thị trên trang chủ (banner / hero). Có thể chỉnh tay sau khi AI gợi ý.',
                  )}
                >
                  <TextArea rows={2} placeholder="Câu slogan cho sự kiện…" />
                </Form.Item>

                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                    style={{ borderRadius: 10, fontWeight: 600 }}
                  >
                    {editingEvent ? 'Lưu thay đổi' : 'Tạo sự kiện'}
                  </Button>
                  <Button size="large" icon={<ReloadOutlined />} onClick={handleReset} style={{ borderRadius: 10 }}>
                    Đặt lại
                  </Button>
                </Space>
              </Form>
            </div>
          </Card>

          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>Danh sách sự kiện</span>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            {events.length === 0 && !eventsLoading ? (
              <Empty description="Chưa có sự kiện nào trong hệ thống" />
            ) : (
              <Table
                rowKey={(r) => r._id || r.id}
                dataSource={events}
                loading={eventsLoading}
                pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: [8, 16, 24] }}
                size="middle"
                scroll={{ x: 1020 }}
                columns={[
                  {
                    title: 'Tên',
                    dataIndex: 'name',
                    key: 'name',
                    width: 200,
                    ellipsis: true,
                    render: (text) => <Text strong>{text}</Text>,
                  },
                  {
                    title: 'Trạng thái',
                    key: 'status',
                    width: 130,
                    render: (_, row) => {
                      const s = eventRowStatus(row);
                      return <Badge status={s.status} text={s.label} />;
                    },
                  },
                  {
                    title: 'Theme',
                    key: 'colors',
                    width: 110,
                    render: (_, r) => (
                      <Space size={4}>
                        <Tooltip title="Primary">
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: r.themeConfig?.primaryColor || '#036280',
                              border: '1px solid #d9d9d9',
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Secondary">
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: r.themeConfig?.secondaryColor || '#FF6500',
                              border: '1px solid #d9d9d9',
                            }}
                          />
                        </Tooltip>
                      </Space>
                    ),
                  },
                  {
                    title: 'Giảm giá',
                    key: 'discount',
                    width: 90,
                    render: (_, r) => {
                      const p = r.discountConfig?.discountPercent;
                      return p ? <Tag color="red">{p}%</Tag> : <Tag>0%</Tag>;
                    },
                  },
                  {
                    title: 'Thời gian',
                    key: 'dates',
                    width: 220,
                    render: (_, r) => (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {r.startDate ? dayjs(r.startDate).format('DD/MM/YY HH:mm') : '—'}
                        {' → '}
                        {r.endDate ? dayjs(r.endDate).format('DD/MM/YY HH:mm') : '—'}
                      </Text>
                    ),
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    fixed: 'right',
                    width: 360,
                    render: (_, r) => {
                      const rawId = r._id ?? r.id;
                      const id = rawId != null && typeof rawId === 'object' && typeof rawId.toString === 'function'
                        ? rawId.toString()
                        : String(rawId ?? '');
                      return (
                        <Space wrap size="small">
                          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
                            Chi tiết
                          </Button>
                          <Button size="small" type="primary" ghost icon={<ThunderboltOutlined />} onClick={() => handleReapplyTheme(r)}>
                            Áp dụng lại
                          </Button>
                          <Popconfirm
                            title="Hủy sự kiện này?"
                            description="Đặt isActive = false. Giao diện khách trở về mặc định."
                            onConfirm={() => handleDeactivate(id)}
                            okText="Hủy sự kiện"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                          >
                            <Button danger size="small" icon={<StopOutlined />} disabled={!r.isActive}>
                              Hủy
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="Xóa vĩnh viễn sự kiện này?"
                            description="Không thể hoàn tác. Nếu đây là sự kiện đang diễn ra và đang bật, theme trang khách sẽ trở về mặc định."
                            onConfirm={() => handleDeleteEvent(id)}
                            okText="Xóa"
                            cancelText="Không"
                            okButtonProps={{ danger: true }}
                          >
                            <Button danger size="small" icon={<DeleteOutlined />}>
                              Xóa
                            </Button>
                          </Popconfirm>
                        </Space>
                      );
                    },
                  },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Chi tiết sự kiện"
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setDetailRecord(null); }}
        footer={<Button type="primary" onClick={() => { setDetailOpen(false); setDetailRecord(null); }}>Đóng</Button>}
        width={640}
        destroyOnClose
      >
        {detailRecord ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Tên">{detailRecord.name}</Descriptions.Item>
            <Descriptions.Item label="Kích hoạt">{detailRecord.isActive ? 'Có' : 'Không'}</Descriptions.Item>
            <Descriptions.Item label="Bắt đầu">
              {detailRecord.startDate ? dayjs(detailRecord.startDate).format('DD/MM/YYYY HH:mm') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Kết thúc">
              {detailRecord.endDate ? dayjs(detailRecord.endDate).format('DD/MM/YYYY HH:mm') : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Slogan">{detailRecord.suggestedSlogan || '—'}</Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              {detailRecord.discountConfig?.discountPercent ?? 0}%
            </Descriptions.Item>
            <Descriptions.Item label="Danh mục áp dụng">
              {(detailRecord.discountConfig?.targetCategories || []).join(', ') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Màu chính">{detailRecord.themeConfig?.primaryColor}</Descriptions.Item>
            <Descriptions.Item label="Màu phụ">{detailRecord.themeConfig?.secondaryColor}</Descriptions.Item>
            <Descriptions.Item label="Hiệu ứng">{detailRecord.themeConfig?.decorationType || 'none'}</Descriptions.Item>
            <Descriptions.Item label="Text trên Primary">
              {detailRecord.themeConfig?.textOnPrimary || getContrastYIQ(detailRecord.themeConfig?.primaryColor || '#036280')}
            </Descriptions.Item>
            <Descriptions.Item label="Màu giá">{detailRecord.themeConfig?.priceColor || '#e67e22'}</Descriptions.Item>
            <Descriptions.Item label="Màu còn hàng">{detailRecord.themeConfig?.statusSuccessColor || '#16a34a'}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title={
          <Space>
            <HistoryOutlined />
            Lịch sử gợi ý AI
          </Space>
        }
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {historyItems.length === 0 ? (
          <Empty description="Chưa có lượt gợi ý nào trên trình duyệt này" />
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {historyItems.map((h, idx) => (
              <Card
                key={`${h.savedAt}-${idx}`}
                size="small"
                style={{ marginBottom: 10 }}
                title={
                  <Space>
                    <span style={{ fontWeight: 600 }}>{h.name || 'Không tên'}</span>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {h.savedAt ? dayjs(h.savedAt).format('DD/MM/YYYY HH:mm') : ''}
                    </Text>
                  </Space>
                }
                extra={
                  <Button type="link" size="small" onClick={() => applyHistoryEntry(h)}>
                    Áp dụng vào form
                  </Button>
                }
              >
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Prompt: {h.prompt}
                </Text>
                <Space size={8} wrap>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: h.themeConfig?.primaryColor,
                      border: '1px solid #ddd',
                    }}
                  />
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: h.themeConfig?.secondaryColor,
                      border: '1px solid #ddd',
                    }}
                  />
                  <Tag>{h.themeConfig?.decorationType || 'none'}</Tag>
                </Space>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

function hexToRgbaForPreview(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
  const c = hex.replace('#', '');
  if (c.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default EventManagement;
