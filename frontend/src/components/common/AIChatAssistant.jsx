import React, { useState, useEffect, useRef } from 'react';
import { aiChatAPI } from '../../lib/api';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { getProductImage } from '../../utils/categoryUtils';

const DEFAULT_BOT_WELCOME =
  'Xin chào! 👋 Tôi là trợ lý AI của Bookle.\n\nTôi có thể giúp bạn:\n• Tìm sách theo tên, tác giả, thể loại\n• Đề xuất sách phù hợp sở thích\n• So sánh và tư vấn sách\n\nHãy hỏi tôi bất cứ điều gì về sách!';

const AIChatAssistant = ({ isOpenExternal = false, onClose, pageBookContext = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedBooks, setSuggestedBooks] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { addToCart } = useCart();

  // Quick suggestions based on context
  const contextSuggestions = [
    { icon: '🔥', text: 'Sách bán chạy nhất', query: 'sách bán chạy nhất hiện nay' },
    { icon: '📚', text: 'Sách mới ra mắt', query: 'sách mới nhất' },
    { icon: '⭐', text: 'Sách đánh giá cao', query: 'sách được đánh giá trên 4 sao' },
    { icon: '💰', text: 'Sách giá rẻ', query: 'sách hay giá dưới 100k' },
    { icon: '📖', text: 'Tiểu thuyết hay', query: 'tiểu thuyết hay nhất' },
    { icon: '💼', text: 'Sách kinh doanh', query: 'sách về kinh doanh khởi nghiệp' },
    { icon: '🧠', text: 'Sách tâm lý', query: 'sách tâm lý phát triển bản thân' },
    { icon: '🎨', text: 'Truyện tranh', query: 'truyện tranh manga hay' },
  ];

  // Follow-up suggestions
  const getFollowUpSuggestions = () => {
    if (suggestedBooks.length > 0) {
      return [
        { text: 'Sách tương tự', query: 'còn sách nào tương tự không?' },
        { text: 'Giá rẻ hơn', query: 'có sách nào rẻ hơn không?' },
        { text: 'Cùng tác giả', query: 'còn sách nào của tác giả này?' },
        { text: 'Xem thêm', query: 'cho tôi xem thêm sách khác' },
      ];
    }
    return [];
  };

  // Mở từ Header / sự kiện trang sách: đồng bộ + tin nhắn chào (có hoặc không ngữ cảnh cuốn sách)
  useEffect(() => {
    if (!isOpenExternal) return;
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    if (pageBookContext?.id && pageBookContext?.name) {
      setMessages([
        {
          type: 'bot',
          text:
            `Bạn đang xem **${pageBookContext.name}** 📖\n\n` +
            'Mình đã nạp mô tả & nội dung giới thiệu cuốn sách này từ Bookle làm ngữ cảnh . ' +
            'Bạn có thể hỏi ví dụ: *Sách này có gì hay?* hoặc *Tóm tắt 3 ý chính* — mình chỉ trả lời dựa trên dữ liệu có trong kho.',
          timestamp: new Date(),
        },
      ]);
      setSuggestedBooks([]);
      setShowSuggestions(false);
    } else {
      setMessages([{ type: 'bot', text: DEFAULT_BOT_WELCOME, timestamp: new Date() }]);
      setSuggestedBooks([]);
      setShowSuggestions(true);
    }
  }, [isOpenExternal, pageBookContext?.id, pageBookContext?.name]);

  // Mở bằng nút nổi (không qua Header): chào mặc định khi chưa có tin nhắn
  useEffect(() => {
    if (isOpenExternal) return;
    if (isOpen && messages.length === 0) {
      setMessages([{ type: 'bot', text: DEFAULT_BOT_WELCOME, timestamp: new Date() }]);
    }
  }, [isOpen, isOpenExternal, messages.length]);

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(true);
  };

  // Handle restore
  const handleRestore = () => {
    setIsMinimized(false);
    setUnreadCount(0);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, suggestedBooks]);

  // Focus input
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Build conversation history
  const buildConversationHistory = () => {
    return messages.slice(-8).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  // Process message
  const processMessage = async (userMessage) => {
    try {
      const conversationHistory = buildConversationHistory();
      const result = await aiChatAPI.search(
        userMessage,
        conversationHistory,
        pageBookContext?.id || null
      );
      
      if (!result.success && result.error) {
        return {
          response: result.error || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
          books: result.books || []
        };
      }
      
      return {
        response: result.response || 'Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể diễn đạt lại được không?',
        books: result.books || []
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Fallback responses
      const fallbackResponses = [
        'Xin lỗi, tôi đang gặp sự cố kết nối. Bạn có thể thử lại sau ít phút nhé! 🔄',
        'Hệ thống đang bận, vui lòng đợi một chút và thử lại. ⏳',
        'Kết nối không ổn định. Hãy thử lại hoặc tìm kiếm trực tiếp trên trang /shop nhé! 🔍'
      ];
      
      return {
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        books: []
      };
    }
  };

  // Handle send message
  const handleSendMessage = async (e, customMessage = null) => {
    if (e) e.preventDefault();
    const userMessage = customMessage || inputMessage.trim();
    if (!userMessage || isTyping) return;

    setInputMessage('');
    setSuggestedBooks([]);
    setShowSuggestions(false);

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    }]);

    setIsTyping(true);

    // Add delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

    const { response, books } = await processMessage(userMessage);

    setMessages(prev => [...prev, {
      type: 'bot',
      text: response,
      timestamp: new Date()
    }]);
    
    setSuggestedBooks(books);
    setIsTyping(false);

    // Update unread count if minimized
    if (isMinimized) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Handle quick suggestion click
  const handleSuggestionClick = (query) => {
    handleSendMessage(null, query);
  };

  // Handle add to cart from chat
  const handleAddToCart = (book, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(book, 1);
    
    // Show feedback message
    setMessages(prev => [...prev, {
      type: 'bot',
      text: `✅ Đã thêm "${book.name}" vào giỏ hàng!`,
      timestamp: new Date()
    }]);
  };

  // Clear chat
  const handleClearChat = () => {
    if (pageBookContext?.id && pageBookContext?.name) {
      setMessages([
        {
          type: 'bot',
          text:
            `Cuộc trò chuyện đã làm mới — vẫn đang gắn với **${pageBookContext.name}** 📖\n\nBạn tiếp tục hỏi về cuốn này nhé.`,
          timestamp: new Date(),
        },
      ]);
      setShowSuggestions(false);
    } else {
      setMessages([
        {
          type: 'bot',
          text: 'Cuộc trò chuyện đã được làm mới! 🔄\n\nBạn muốn tìm sách gì?',
          timestamp: new Date(),
        },
      ]);
      setShowSuggestions(true);
    }
    setSuggestedBooks([]);
  };

  // Toggle button when closed
  if (!isOpen) {
    return (
      <button 
        className="ai-chat-toggle-btn"
        onClick={() => { setIsOpen(true); setUnreadCount(0); }}
        aria-label="Mở trợ lý AI"
      >
        <i className="fa-solid fa-comments"></i>
        <span className="ai-chat-toggle-text">Hỗ trợ</span>
        <style>{`
          .ai-chat-toggle-btn {
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: #036280;
            color: white;
            border: none;
            padding: 12px 18px;
            border-radius: 30px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 3px 15px rgba(3, 98, 128, 0.3);
            z-index: 99999;
            transition: all 0.3s ease;
          }
          .ai-chat-toggle-btn:hover {
            background: #024a5f;
            box-shadow: 0 4px 20px rgba(3, 98, 128, 0.4);
          }
          .ai-chat-toggle-text {
            font-size: 13px;
          }
          @media (max-width: 768px) {
            .ai-chat-toggle-btn {
              bottom: 80px;
              right: 15px;
              padding: 10px 14px;
            }
          }
        `}</style>
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <button 
        className="ai-chat-minimized"
        onClick={handleRestore}
      >
        <i className="fa-solid fa-comments"></i>
        {unreadCount > 0 && <span className="ai-chat-badge">{unreadCount}</span>}
        <style>{`
          .ai-chat-minimized {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 54px;
            height: 54px;
            background: #036280;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 3px 15px rgba(3, 98, 128, 0.35);
            z-index: 99999;
          }
          .ai-chat-minimized:hover {
            background: #024a5f;
          }
          .ai-chat-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #FF6500;
            color: white;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
          }
        `}</style>
      </button>
    );
  }

  return (
    <>
      <div className="ai-chat-window">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-info">
            <div className="ai-chat-avatar">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h5>AI Trợ lý Bookle</h5>
              <span className="ai-chat-status">
                <span className="status-dot"></span>
                Sẵn sàng hỗ trợ
              </span>
            </div>
          </div>
          <div className="ai-chat-header-actions">
            <button onClick={handleClearChat} title="Làm mới" className="ai-header-btn">
              <i className="fa-solid fa-rotate-right"></i>
            </button>
            <button onClick={handleMinimize} title="Thu nhỏ" className="ai-header-btn">
              <i className="fa-solid fa-minus"></i>
            </button>
            <button onClick={handleClose} title="Đóng" className="ai-header-btn close-btn">
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`ai-chat-message ai-chat-message-${msg.type}`}>
              {msg.type === 'bot' && (
                <div className="ai-chat-avatar-small">
                  <i className="fa-solid fa-robot"></i>
                </div>
              )}
              <div className="ai-chat-message-content">
                <div className="ai-chat-message-text">{msg.text}</div>
                <div className="ai-chat-message-time">
                  {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="ai-chat-message ai-chat-message-bot">
              <div className="ai-chat-avatar-small">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div className="ai-chat-message-content">
                <div className="ai-chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Books */}
          {suggestedBooks.length > 0 && (
            <div className="ai-chat-suggested-books">
              <h6>📚 Sách gợi ý cho bạn:</h6>
              <div className="ai-chat-books-grid">
                {suggestedBooks.slice(0, 6).map((book) => (
                  <div key={book._id} className="ai-chat-book-card">
                    <Link to={`/shop-details/${book.slug || book._id}`} className="ai-chat-book-link">
                      <div className="ai-chat-book-image">
                        <img src={getProductImage(book.images, book.coverImage)} alt={book.name} />
                        {book.compareAtPrice && book.compareAtPrice > book.price && (
                          <span className="ai-chat-book-discount">
                            -{Math.round((1 - book.price / book.compareAtPrice) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="ai-chat-book-info">
                        <h6 title={book.name}>{book.name}</h6>
                        {book.author && <p className="ai-chat-book-author">{book.author}</p>}
                        <div className="ai-chat-book-price-row">
                          <span className="ai-chat-book-price">{formatPrice(book.price)}</span>
                          {book.compareAtPrice && book.compareAtPrice > book.price && (
                            <span className="ai-chat-book-old-price">{formatPrice(book.compareAtPrice)}</span>
                          )}
                        </div>
                        {book.rating > 0 && (
                          <div className="ai-chat-book-rating">
                            <i className="fa-solid fa-star"></i>
                            <span>{book.rating.toFixed(1)}</span>
                            <span className="rating-count">({book.ratingCount || 0})</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <button 
                      className="ai-chat-add-cart-btn"
                      onClick={(e) => handleAddToCart(book, e)}
                      title="Thêm vào giỏ"
                    >
                      <i className="fa-solid fa-cart-plus"></i>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Follow-up suggestions */}
              <div className="ai-chat-followup">
                {getFollowUpSuggestions().map((suggestion, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion.query)}
                    className="ai-followup-btn"
                  >
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="ai-chat-suggestions">
            <p className="suggestions-title">Gợi ý tìm kiếm:</p>
            <div className="suggestions-grid">
              {contextSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(item.query)}
                  className="suggestion-btn"
                >
                  <span className="suggestion-icon">{item.icon}</span>
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form className="ai-chat-input-form" onSubmit={handleSendMessage}>
          <div className="ai-chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="ai-chat-input"
              placeholder="Hỏi về sách, tác giả, thể loại..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              className="ai-chat-send-button"
              disabled={!inputMessage.trim() || isTyping}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
          <p className="ai-chat-disclaimer">AI có thể mắc lỗi. Hãy kiểm tra thông tin sách.</p>
        </form>
      </div>

      <style>{`
        .ai-chat-window {
          position: fixed !important;
          bottom: 30px !important;
          right: 30px !important;
          width: 400px;
          max-width: calc(100vw - 40px);
          height: 580px;
          max-height: calc(100vh - 60px);
          background: white !important;
          border-radius: 16px !important;
          box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15) !important;
          z-index: 99999999 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          animation: slideUp 0.25s ease;
          border: 1px solid #e5e5e5;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-chat-header {
          background: #036280;
          color: white;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ai-chat-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-chat-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .ai-chat-header h5 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
        }

        .ai-chat-status {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0.85;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          background: #2ecc71;
          border-radius: 50%;
        }

        .ai-chat-header-actions {
          display: flex;
          gap: 6px;
        }

        .ai-header-btn {
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 13px;
        }

        .ai-header-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .ai-header-btn.close-btn:hover {
          background: rgba(255, 100, 100, 0.8);
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #fafafa;
        }

        .ai-chat-message {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-chat-message-user {
          flex-direction: row-reverse;
        }

        .ai-chat-avatar-small {
          width: 32px;
          height: 32px;
          background: #036280;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          flex-shrink: 0;
        }

        .ai-chat-message-content {
          max-width: 80%;
        }

        .ai-chat-message-user .ai-chat-message-content {
          background: #036280;
          color: white;
          padding: 10px 14px;
          border-radius: 14px 14px 4px 14px;
        }

        .ai-chat-message-bot .ai-chat-message-content {
          background: white;
          color: #333;
          padding: 10px 14px;
          border-radius: 14px 14px 14px 4px;
          border: 1px solid #e9ecef;
        }

        .ai-chat-message-text {
          white-space: pre-wrap;
          line-height: 1.5;
          word-wrap: break-word;
          font-size: 13px;
        }

        .ai-chat-message-time {
          font-size: 10px;
          opacity: 0.5;
          margin-top: 5px;
        }

        .ai-chat-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .ai-chat-typing span {
          width: 7px;
          height: 7px;
          background: #036280;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .ai-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .ai-chat-typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        /* Suggested Books */
        .ai-chat-suggested-books {
          margin-top: 14px;
          padding: 14px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }

        .ai-chat-suggested-books h6 {
          margin: 0 0 12px 0;
          color: #036280;
          font-size: 13px;
          font-weight: 600;
        }

        .ai-chat-books-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .ai-chat-book-card {
          position: relative;
          background: #f8f9fa;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s;
          border: 1px solid #eee;
        }

        .ai-chat-book-card:hover {
          border-color: #036280;
          box-shadow: 0 4px 12px rgba(3, 98, 128, 0.1);
        }

        .ai-chat-book-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .ai-chat-book-image {
          position: relative;
          width: 100%;
          aspect-ratio: 2 / 3;
          overflow: hidden;
          background: #eceef1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-chat-book-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }

        .ai-chat-book-discount {
          position: absolute;
          top: 5px;
          left: 5px;
          background: #FF6500;
          color: white;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
        }

        .ai-chat-book-info {
          padding: 8px;
        }

        .ai-chat-book-info h6 {
          font-size: 11px;
          margin: 0 0 3px 0;
          color: #333;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.35;
        }

        .ai-chat-book-author {
          font-size: 9px;
          color: #888;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ai-chat-book-price-row {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 3px;
        }

        .ai-chat-book-price {
          font-size: 12px;
          font-weight: 600;
          color: #036280;
        }

        .ai-chat-book-old-price {
          font-size: 9px;
          color: #999;
          text-decoration: line-through;
        }

        .ai-chat-book-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #666;
        }

        .ai-chat-book-rating i {
          color: #ffc107;
          font-size: 9px;
        }

        .rating-count {
          color: #999;
        }

        .ai-chat-add-cart-btn {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          background: #036280;
          border: none;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          transition: all 0.2s;
          opacity: 0;
        }

        .ai-chat-book-card:hover .ai-chat-add-cart-btn {
          opacity: 1;
        }

        .ai-chat-add-cart-btn:hover {
          background: #024a5f;
        }

        /* Follow-up suggestions */
        .ai-chat-followup {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .ai-followup-btn {
          padding: 5px 10px;
          background: #f0f7f9;
          border: 1px solid #036280;
          border-radius: 15px;
          color: #036280;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-followup-btn:hover {
          background: #036280;
          color: white;
        }

        /* Quick Suggestions */
        .ai-chat-suggestions {
          padding: 10px 14px;
          background: #f8f9fa;
          border-top: 1px solid #eee;
        }

        .suggestions-title {
          font-size: 11px;
          color: #666;
          margin: 0 0 8px 0;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .suggestion-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          font-size: 11px;
          color: #444;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-btn:hover {
          border-color: #036280;
          color: #036280;
        }

        .suggestion-icon {
          font-size: 12px;
        }

        /* Input */
        .ai-chat-input-form {
          padding: 10px 14px 8px;
          background: white;
          border-top: 1px solid #eee;
        }

        .ai-chat-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .ai-chat-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }

        .ai-chat-input:focus {
          border-color: #036280;
        }

        .ai-chat-send-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #036280;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          font-size: 14px;
        }

        .ai-chat-send-button:hover:not(:disabled) {
          background: #024a5f;
        }

        .ai-chat-send-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .ai-chat-disclaimer {
          font-size: 9px;
          color: #aaa;
          text-align: center;
          margin: 6px 0 0 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ai-chat-window {
            width: calc(100vw - 20px);
            height: calc(100vh - 100px);
            bottom: 10px;
            right: 10px;
            border-radius: 14px;
          }

          .ai-chat-books-grid {
            grid-template-columns: 1fr;
          }

          .suggestions-grid {
            grid-template-columns: 1fr;
          }

          .ai-chat-add-cart-btn {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AIChatAssistant;
