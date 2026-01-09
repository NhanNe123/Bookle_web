import React, { useState, useEffect, useRef } from 'react';
import { aiChatAPI } from '../../lib/api';
import { Link } from 'react-router-dom';


const AIChatAssistant = ({ isOpenExternal = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedBooks, setSuggestedBooks] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync with external open state
  useEffect(() => {
    if (isOpenExternal) {
      setIsOpen(true);
    }
  }, [isOpenExternal]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'bot',
        text: 'Xin chào! Tôi là trợ lý AI của cửa hàng sách. Tôi có thể giúp bạn:\n\n📚 Tìm kiếm sách theo tên, tác giả, thể loại\n💡 Đề xuất sách phù hợp với sở thích của bạn\n💰 Tìm sách theo giá\n⭐ Tìm sách theo đánh giá\n\nBạn muốn tìm loại sách nào?',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setSuggestedBooks([]);
    if (onClose) {
      onClose();
    }
  };

  // Scroll to bottom when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, suggestedBooks]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Build conversation history for context
  const buildConversationHistory = () => {
    // Get last 6 messages (3 exchanges) for context
    return messages.slice(-6).map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  // Process message using AI API
  const processMessage = async (userMessage) => {
    try {
      // Send conversation history for context
      const conversationHistory = buildConversationHistory();
      const result = await aiChatAPI.search(userMessage, conversationHistory);
      
      // Check if API returned error
      if (!result.success && result.error) {
        console.warn('API returned error:', result.error);
        return {
          response: result.error || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
          books: result.books || []
        };
      }
      
      return {
        response: result.response || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
        books: result.books || []
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401 || error.message?.includes('401')) {
        return {
          response: 'Tính năng AI đang được cấu hình. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
          books: []
        };
      }
      
      return {
        response: 'Xin lỗi, đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.',
        books: []
      };
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSuggestedBooks([]);

    // Add user message
    const newUserMessage = {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 800));

    // Process message
    const { response, books } = await processMessage(userMessage);

    // Add bot response
    const botMessage = {
      type: 'bot',
      text: response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
    setSuggestedBooks(books);
    setIsTyping(false);
  };

  const handleQuickAction = (action) => {
    const quickMessages = {
      'hot': 'Sách hot',
      'cheap': 'Sách dưới 100k',
      'high-rating': 'Sách trên 4 sao',
      'novel': 'Sách tiểu thuyết',
      'business': 'Sách kinh doanh',
      'science': 'Sách khoa học'
    };

    const message = quickMessages[action];
    if (message) {
      setInputMessage(message);
      // Trigger send after a brief delay
      setTimeout(() => {
        const form = document.querySelector('.ai-chat-input-form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <h5>AI Trợ lý Sách</h5>
                <span className="ai-chat-status">Đang hoạt động</span>
              </div>
            </div>
            <button
              className="ai-chat-close"
              onClick={handleClose}
              aria-label="Đóng chat"
              title="Đóng"
            >
              <i className="fa-solid fa-times" aria-hidden="true"></i>
            </button>
          </div>

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

            {isTyping && (
              <div className="ai-chat-message ai-chat-message-bot">
                <div className="ai-chat-avatar-small">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="ai-chat-message-content">
                  <div className="ai-chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {suggestedBooks.length > 0 && (
              <div className="ai-chat-suggested-books">
                <h6>📚 Sách đề xuất:</h6>
                <div className="ai-chat-books-grid">
                  {suggestedBooks.map((book) => (
                    <Link
                      key={book._id}
                      to={`/shop-details/${book.slug || book._id}`}
                      className="ai-chat-book-card"
                    >
                      <div className="ai-chat-book-image">
                        <img
                          src={book.images?.[0] || '/assets/img/book/01.png'}
                          alt={book.name}
                        />
                      </div>
                      <div className="ai-chat-book-info">
                        <h6>{book.name}</h6>
                        {book.author && <p className="ai-chat-book-author">{book.author}</p>}
                        <p className="ai-chat-book-price">{formatPrice(book.price)}</p>
                        {book.rating > 0 && (
                          <div className="ai-chat-book-rating">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={i < Math.floor(book.rating) ? "fa-solid fa-star" : "fa-regular fa-star"}
                              ></i>
                            ))}
                            <span>({book.ratingCount || 0})</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="ai-chat-quick-actions">
              <button onClick={() => handleQuickAction('hot')}>🔥 Sách Hot</button>
              <button onClick={() => handleQuickAction('cheap')}>💰 Dưới 100k</button>
              <button onClick={() => handleQuickAction('high-rating')}>⭐ Trên 4 sao</button>
              <button onClick={() => handleQuickAction('novel')}>📖 Tiểu thuyết</button>
            </div>
          )}

          <form className="ai-chat-input-form" onSubmit={handleSendMessage}>
            <div className="ai-chat-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="ai-chat-input"
                placeholder="Nhập câu hỏi hoặc từ khóa tìm kiếm..."
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
          </form>
        </div>
      )}

      <style>{`
        .ai-chat-window {
          position: fixed !important;
          bottom: 30px !important;
          right: 30px !important;
          width: 420px;
          max-width: calc(100vw - 60px);
          height: 600px;
          max-height: calc(100vh - 60px);
          background: white !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
          z-index: 99999999 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .ai-chat-header {
          background: linear-gradient(135deg, #3040D6 0%, #56CCF2 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ai-chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-chat-avatar {
          width: 45px;
          height: 45px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .ai-chat-header h5 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .ai-chat-status {
          font-size: 12px;
          opacity: 0.9;
        }

        .ai-chat-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .ai-chat-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
        }

        .ai-chat-message {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-chat-message-user {
          flex-direction: row-reverse;
        }

        .ai-chat-avatar-small {
          width: 35px;
          height: 35px;
          background: linear-gradient(135deg, #3040D6 0%, #56CCF2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          flex-shrink: 0;
        }

        .ai-chat-message-content {
          max-width: 75%;
        }

        .ai-chat-message-user .ai-chat-message-content {
          background: #3040D6;
          color: white;
          padding: 12px 16px;
          border-radius: 18px 18px 4px 18px;
        }

        .ai-chat-message-bot .ai-chat-message-content {
          background: white;
          color: #333;
          padding: 12px 16px;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .ai-chat-message-text {
          white-space: pre-wrap;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .ai-chat-message-time {
          font-size: 11px;
          opacity: 0.6;
          margin-top: 4px;
        }

        .ai-chat-typing {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .ai-chat-typing span {
          width: 8px;
          height: 8px;
          background: #3040D6;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .ai-chat-typing span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .ai-chat-typing span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
          30% { transform: translateY(-10px); opacity: 1; }
        }

        .ai-chat-suggested-books {
          margin-top: 20px;
          padding: 15px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .ai-chat-suggested-books h6 {
          margin: 0 0 15px 0;
          color: #3040D6;
          font-size: 16px;
        }

        .ai-chat-books-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .ai-chat-book-card {
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
          border-radius: 8px;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s;
        }

        .ai-chat-book-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .ai-chat-book-image {
          width: 100%;
          height: 120px;
          overflow: hidden;
          background: #e9ecef;
        }

        .ai-chat-book-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ai-chat-book-info {
          padding: 10px;
        }

        .ai-chat-book-info h6 {
          font-size: 13px;
          margin: 0 0 5px 0;
          color: #333;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ai-chat-book-author {
          font-size: 11px;
          color: #666;
          margin: 0 0 5px 0;
        }

        .ai-chat-book-price {
          font-size: 14px;
          font-weight: 600;
          color: #3040D6;
          margin: 0 0 5px 0;
        }

        .ai-chat-book-rating {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
        }

        .ai-chat-book-rating i {
          color: #ffc107;
          font-size: 10px;
        }

        .ai-chat-quick-actions {
          padding: 15px 20px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: white;
          border-top: 1px solid #e9ecef;
        }

        .ai-chat-quick-actions button {
          padding: 8px 12px;
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s;
          color: #333;
        }

        .ai-chat-quick-actions button:hover {
          background: #3040D6;
          color: white;
          border-color: #3040D6;
        }

        .ai-chat-input-form {
          padding: 15px 20px;
          background: white;
          border-top: 1px solid #e9ecef;
        }

        .ai-chat-input-wrapper {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .ai-chat-input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid #e9ecef;
          border-radius: 25px;
          font-size: 14px;
          outline: none;
          transition: all 0.3s;
        }

        .ai-chat-input:focus {
          border-color: #3040D6;
          box-shadow: 0 0 0 3px rgba(48, 64, 214, 0.1);
        }

        .ai-chat-send-button {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3040D6 0%, #56CCF2 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .ai-chat-send-button:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(48, 64, 214, 0.4);
        }

        .ai-chat-send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .ai-chat-window {
            width: calc(100vw - 20px);
            height: calc(100vh - 20px);
            bottom: 10px;
            right: 10px;
            border-radius: 15px;
          }

          .ai-chat-books-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default AIChatAssistant;
