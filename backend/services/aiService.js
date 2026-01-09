// services/aiService.js
// Sử dụng Google Gemini API - MIỄN PHÍ 1500 requests/ngày
import { GoogleGenerativeAI } from '@google/generative-ai';
import Product from '../models/Product.js';

// Initialize Google Gemini client
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const GEMINI_MODEL = 'gemini-1.5-flash'; // Fast and free

/**
 * Extract author name from query
 * Handles patterns like: "sách của X", "tác giả X", "X viết", etc.
 */
const extractAuthorFromQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Pattern 1: "sách của [tên tác giả]"
  let match = query.match(/sách\s+(?:của|do)\s+(.+?)(?:\s*$|\s+(?:hay|giá|dưới|trên|về))/i);
  if (match) return match[1].trim();
  
  // Pattern 2: "của [tên tác giả]"
  match = query.match(/của\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:\s*$|\s+(?:hay|giá|có))/i);
  if (match && match[1].trim().length > 2) return match[1].trim();
  
  // Pattern 3: "tác giả [tên]"
  match = query.match(/tác\s*giả\s+(.+?)(?:\s*$|\s+(?:có|viết|hay))/i);
  if (match) return match[1].trim();
  
  // Pattern 4: "[tên] viết"
  match = query.match(/([A-ZÀ-Ỹa-zà-ỹ\s]+?)\s+viết/i);
  if (match && match[1].trim().length > 2) return match[1].trim();
  
  // Pattern 5: Direct author name detection (proper Vietnamese names - starts with capital)
  // Check if query looks like a name (2-4 words, each capitalized)
  const words = query.trim().split(/\s+/);
  if (words.length >= 2 && words.length <= 5) {
    const looksLikeName = words.every(w => /^[A-ZÀ-Ỹ]/.test(w));
    if (looksLikeName) {
      return query.trim();
    }
  }
  
  return null;
};

/**
 * Extract book name from query
 * Handles patterns like: "sách [tên sách]", "cuốn [tên sách]", "[tên sách]"
 */
const extractBookNameFromQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Pattern 1: "sách [tên sách]" or "cuốn [tên sách]"
  let match = query.match(/(?:sách|cuốn|quyển)\s+["']?([^"']+?)["']?(?:\s*$|\s+(?:của|giá|hay))/i);
  if (match) return match[1].trim();
  
  // Pattern 2: Text in quotes
  match = query.match(/["']([^"']+)["']/);
  if (match) return match[1].trim();
  
  // Pattern 3: "tìm [tên sách]"
  match = query.match(/tìm\s+(.+?)(?:\s*$|\s+(?:của|giá|hay))/i);
  if (match) {
    const result = match[1].trim();
    // Exclude common words
    const excludeWords = ['sách', 'cuốn', 'cho', 'tôi', 'thể', 'loại'];
    if (!excludeWords.some(w => result.toLowerCase().startsWith(w))) {
      return result;
    }
  }
  
  return null;
};

/**
 * Analyze user intent from query and conversation history
 */
const analyzeIntent = (query, conversationHistory = []) => {
  const lowerQuery = query.toLowerCase();
  
  // Check for follow-up questions
  const isFollowUp = conversationHistory.length > 0 && (
    lowerQuery.includes('còn') ||
    lowerQuery.includes('thêm') ||
    lowerQuery.includes('khác') ||
    lowerQuery.includes('nữa') ||
    lowerQuery.includes('tương tự') ||
    lowerQuery.includes('giống') ||
    lowerQuery.includes('như vậy') ||
    lowerQuery.includes('cái đó') ||
    lowerQuery.includes('cuốn đó') ||
    lowerQuery.includes('sách đó') ||
    lowerQuery.match(/^(vậy|thế|ừ|ok|được|có)/)
  );
  
  // Check for author search
  const isAuthorSearch = lowerQuery.includes('tác giả') ||
                        lowerQuery.includes('của ') ||
                        lowerQuery.match(/\s+viết/);
  
  // Check for book name search
  const isBookSearch = lowerQuery.includes('sách ') ||
                      lowerQuery.includes('cuốn ') ||
                      lowerQuery.includes('quyển ') ||
                      query.includes('"') ||
                      query.includes("'");
  
  // Check for comparison/recommendation questions
  const isComparison = lowerQuery.includes('so sánh') || 
                       lowerQuery.includes('nên mua') ||
                       lowerQuery.includes('nên chọn') ||
                       lowerQuery.includes('hay hơn') ||
                       lowerQuery.includes('tốt hơn');
  
  // Check for detail questions
  const isDetailQuestion = lowerQuery.includes('nói thêm') ||
                          lowerQuery.includes('chi tiết') ||
                          lowerQuery.includes('về sách') ||
                          lowerQuery.includes('nội dung') ||
                          lowerQuery.includes('tóm tắt');
  
  // Check for greeting
  const isGreeting = lowerQuery.match(/^(xin chào|chào|hi|hello|hey)/);
  
  // Check for thanks
  const isThanks = lowerQuery.match(/(cảm ơn|cám ơn|thanks|thank you)/);
  
  return {
    isFollowUp,
    isAuthorSearch,
    isBookSearch,
    isComparison,
    isDetailQuestion,
    isGreeting,
    isThanks
  };
};

/**
 * Extract context from conversation history
 */
const extractContextFromHistory = (conversationHistory = []) => {
  if (conversationHistory.length === 0) return null;
  
  // Find the last search query and results mentioned
  let lastCategory = null;
  let lastPriceRange = null;
  let lastAuthor = null;
  let mentionedBooks = [];
  
  for (const msg of conversationHistory) {
    const content = msg.content.toLowerCase();
    
    // Extract categories
    const categories = ['tiểu thuyết', 'kinh doanh', 'khoa học', 'thiếu nhi', 'tâm lý', 'lịch sử', 'truyện tranh', 'văn học'];
    for (const cat of categories) {
      if (content.includes(cat)) lastCategory = cat;
    }
    
    // Extract price mentions
    const priceMatch = content.match(/(\d+)\s*(k|nghìn|ngàn|triệu)/i);
    if (priceMatch) {
      let price = parseInt(priceMatch[1]);
      if (priceMatch[2].toLowerCase() === 'triệu') price *= 1000000;
      else price *= 1000;
      lastPriceRange = price;
    }
    
    // Extract author mentions  
    const authorMatch = content.match(/tác giả[:\s]*([^,.\n]+)/i);
    if (authorMatch) lastAuthor = authorMatch[1].trim();
  }
  
  return {
    lastCategory,
    lastPriceRange,
    lastAuthor,
    mentionedBooks
  };
};

/**
 * Smart keyword search - tìm kiếm thông minh theo từ khóa
 */
export const smartSearch = async (query, options = {}) => {
  try {
    const {
      limit = 6,
      filter = { isAvailable: true },
      context = null
    } = options;

    const lowerQuery = query.toLowerCase();
    const intent = analyzeIntent(query, []);
    
    let searchFilter = { ...filter };
    let sortOption = { rating: -1, ratingCount: -1, createdAt: -1 };
    let searchType = 'general';
    
    // ===== PRIORITY 1: Author search =====
    const extractedAuthor = extractAuthorFromQuery(query);
    if (extractedAuthor) {
      searchFilter.author = { $regex: extractedAuthor, $options: 'i' };
      searchType = 'author';
      console.log(`🔍 Searching by author: "${extractedAuthor}"`);
    }
    
    // ===== PRIORITY 2: Book name search =====
    if (searchType === 'general') {
      const extractedBookName = extractBookNameFromQuery(query);
      if (extractedBookName) {
        searchFilter.name = { $regex: extractedBookName, $options: 'i' };
        searchType = 'book_name';
        console.log(`🔍 Searching by book name: "${extractedBookName}"`);
      }
    }
    
    // ===== PRIORITY 3: Use context from conversation =====
    if (searchType === 'general' && context) {
      if (context.lastCategory && (lowerQuery.includes('thêm') || lowerQuery.includes('khác') || lowerQuery.includes('nữa'))) {
        const categoryKeywords = {
          'tiểu thuyết': ['Tiểu thuyết', 'Văn học Việt Nam', 'Văn học nước ngoài'],
          'văn học': ['Văn học Việt Nam', 'Văn học nước ngoài', 'Tiểu thuyết'],
          'kinh doanh': ['Kinh doanh', 'Marketing - Bán hàng', 'Quản trị - Lãnh đạo'],
          'khoa học': ['Khoa học', 'Công nghệ thông tin', 'Khoa học - Kỹ thuật'],
          'thiếu nhi': ['Thiếu nhi', 'Truyện tranh'],
          'tâm lý': ['Tâm lý - Kỹ năng sống', 'Tâm lý học'],
          'lịch sử': ['Lịch sử', 'Văn hóa - Xã hội'],
          'truyện tranh': ['Truyện tranh', 'Manga - Comic'],
        };
        if (categoryKeywords[context.lastCategory]) {
          searchFilter.categories = { $in: categoryKeywords[context.lastCategory] };
          searchType = 'category_followup';
        }
      }
      if (context.lastPriceRange && lowerQuery.includes('rẻ hơn')) {
        searchFilter.price = { $lt: context.lastPriceRange };
      }
      if (context.lastAuthor && (lowerQuery.includes('tác giả') || lowerQuery.includes('cùng'))) {
        searchFilter.author = { $regex: context.lastAuthor, $options: 'i' };
        searchType = 'author_followup';
      }
    }
    
    // ===== PRIORITY 4: Price filter =====
    if (lowerQuery.includes('dưới') || lowerQuery.includes('duoi') || lowerQuery.includes('rẻ')) {
      const priceMatch = lowerQuery.match(/(\d+)/);
      if (priceMatch) {
        const num = parseInt(priceMatch[1]);
        // If number is small (1-999), multiply by 1000
        const maxPrice = num < 1000 ? num * 1000 : num;
        searchFilter.price = { $lte: maxPrice };
      } else if (lowerQuery.includes('rẻ') && !searchFilter.price) {
        searchFilter.price = { $lte: 100000 };
      }
    }
    
    // ===== PRIORITY 5: Rating filter =====
    if (lowerQuery.includes('sao') || lowerQuery.includes('đánh giá cao')) {
      const ratingMatch = lowerQuery.match(/(\d+)\s*sao/);
      if (ratingMatch && parseInt(ratingMatch[1]) <= 5) {
        searchFilter.rating = { $gte: parseFloat(ratingMatch[1]) };
      }
    } else if (lowerQuery.includes('hay') && !lowerQuery.includes('hay hơn')) {
      searchFilter.rating = { $gte: 4 };
    }
    
    // ===== PRIORITY 6: Hot/New sorting =====
    if (lowerQuery.includes('hot') || lowerQuery.includes('bán chạy') || lowerQuery.includes('phổ biến')) {
      sortOption = { ratingCount: -1, rating: -1 };
    } else if (lowerQuery.includes('mới nhất') || lowerQuery.includes('mới ra')) {
      sortOption = { createdAt: -1 };
    }
    
    // ===== PRIORITY 7: Category mapping =====
    if (searchType === 'general' && !searchFilter.categories) {
      const categoryKeywords = {
        'tiểu thuyết': ['Tiểu thuyết', 'Văn học Việt Nam', 'Văn học nước ngoài'],
        'văn học': ['Văn học Việt Nam', 'Văn học nước ngoài', 'Tiểu thuyết'],
        'kinh doanh': ['Kinh doanh', 'Marketing - Bán hàng', 'Quản trị - Lãnh đạo'],
        'khoa học': ['Khoa học', 'Công nghệ thông tin', 'Khoa học - Kỹ thuật'],
        'thiếu nhi': ['Thiếu nhi', 'Truyện tranh'],
        'trẻ em': ['Thiếu nhi', 'Truyện tranh'],
        'tâm lý': ['Tâm lý - Kỹ năng sống', 'Tâm lý học'],
        'kỹ năng': ['Tâm lý - Kỹ năng sống', 'Kỹ năng sống'],
        'lịch sử': ['Lịch sử', 'Văn hóa - Xã hội'],
        'truyện tranh': ['Truyện tranh', 'Manga - Comic'],
        'manga': ['Manga - Comic', 'Truyện tranh'],
        'comic': ['Manga - Comic', 'Truyện tranh'],
        'giáo dục': ['Giáo dục', 'Sách giáo khoa'],
        'ngoại ngữ': ['Ngoại ngữ', 'Tiếng Anh'],
        'tiếng anh': ['Tiếng Anh', 'Ngoại ngữ'],
        'self-help': ['Tâm lý - Kỹ năng sống'],
        'trinh thám': ['Trinh thám', 'Văn học nước ngoài'],
        'kinh điển': ['Văn học nước ngoài', 'Văn học Việt Nam'],
      };
      
      for (const [key, categories] of Object.entries(categoryKeywords)) {
        if (lowerQuery.includes(key)) {
          searchFilter.categories = { $in: categories };
          searchType = 'category';
          break;
        }
      }
    }
    
    // ===== PRIORITY 8: General keyword search =====
    if (searchType === 'general' && !searchFilter.author && !searchFilter.name && !searchFilter.categories) {
      // Filter out common words
      const stopWords = ['sách', 'tìm', 'cho', 'tôi', 'muốn', 'cần', 'có', 'những', 'cuốn', 'quyển', 'về', 'của', 'và', 'hay', 'tốt', 'đẹp', 'giá'];
      const keywords = lowerQuery.split(/\s+/).filter(k => !stopWords.includes(k) && k.length > 1);
      
      if (keywords.length > 0) {
        // Try exact phrase match first, then individual keywords
        const searchPhrase = keywords.join(' ');
        searchFilter.$or = [
          { name: { $regex: searchPhrase, $options: 'i' } },
          { author: { $regex: searchPhrase, $options: 'i' } },
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { author: { $regex: keywords.join('|'), $options: 'i' } },
          { shortDescription: { $regex: keywords.join('|'), $options: 'i' } },
          { categories: { $regex: keywords.join('|'), $options: 'i' } }
        ];
      }
    }

    console.log(`🔍 Search filter:`, JSON.stringify(searchFilter, null, 2));

    const products = await Product.find(searchFilter)
      .sort(sortOption)
      .limit(limit)
      .select('name slug price compareAtPrice images categories author stock isAvailable rating ratingCount shortDescription')
      .lean();

    console.log(`📚 Found ${products.length} products`);
    
    return products;
  } catch (error) {
    console.error('Error in smart search:', error);
    throw error;
  }
};

/**
 * Generate AI response using Google Gemini API (FREE) with conversation context
 */
export const generateAIResponse = async (userQuery, products, conversationHistory = []) => {
  try {
    // Check if Gemini is configured
    if (!genAI || !process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not configured. Using simple response.');
      return generateSimpleResponse(userQuery, products);
    }

    const intent = analyzeIntent(userQuery, conversationHistory);
    
    // Handle special intents
    if (intent.isGreeting) {
      return 'Xin chào! 👋 Tôi là trợ lý AI của cửa hàng sách Bookle. Tôi có thể giúp bạn:\n• Tìm sách theo tên, tác giả, thể loại\n• Đề xuất sách hay\n• Tìm sách theo giá hoặc đánh giá\n\nBạn muốn tìm loại sách nào?';
    }
    
    if (intent.isThanks) {
      return 'Không có gì ạ! 😊 Nếu bạn cần tìm thêm sách gì, cứ hỏi tôi nhé!';
    }

    // Prepare product information for context
    const productContext = products.slice(0, 6).map((p, idx) => {
      return `${idx + 1}. "${p.name}" - Tác giả: ${p.author || 'N/A'}, Giá: ${p.price?.toLocaleString('vi-VN') || 'N/A'} VND, Đánh giá: ${p.rating || 0}/5 (${p.ratingCount || 0} đánh giá)`;
    }).join('\n');

    // Build conversation context
    const historyContext = conversationHistory.length > 0 
      ? `\n\nLịch sử trò chuyện gần đây:\n${conversationHistory.slice(-4).map(m => `${m.role === 'user' ? 'Khách' : 'Bot'}: ${m.content.substring(0, 150)}`).join('\n')}`
      : '';

    // Determine what user was searching for
    const extractedAuthor = extractAuthorFromQuery(userQuery);
    const extractedBookName = extractBookNameFromQuery(userQuery);
    
    let searchContext = '';
    if (extractedAuthor) {
      searchContext = `\n\nKhách đang tìm sách của tác giả "${extractedAuthor}".`;
    } else if (extractedBookName) {
      searchContext = `\n\nKhách đang tìm sách có tên "${extractedBookName}".`;
    }

    const prompt = `Bạn là trợ lý AI thông minh, thân thiện của cửa hàng sách Bookle. 

NGUYÊN TẮC QUAN TRỌNG:
1. Trả lời ngắn gọn, thân thiện, tự nhiên như đang nói chuyện
2. Hiểu ngữ cảnh cuộc trò chuyện
3. Có thể dùng emoji phù hợp để tạo cảm xúc 📚 ⭐ 💡
4. Nếu không tìm thấy sách, gợi ý cách tìm khác
5. Khi giới thiệu sách, nêu điểm nổi bật ngắn gọn (1-2 câu)
${historyContext}${searchContext}

Khách hỏi: "${userQuery}"

${products.length > 0 
  ? `Tìm thấy ${products.length} sách phù hợp:\n${productContext}\n\nHãy giới thiệu các sách này một cách tự nhiên, hấp dẫn.${extractedAuthor ? ` Nhấn mạnh đây là sách của tác giả ${extractedAuthor}.` : ''}`
  : `Không tìm thấy sách phù hợp.${extractedAuthor ? ` Có thể tác giả "${extractedAuthor}" chưa có trong hệ thống.` : ''}\n\nHãy:\n1. Thông báo không tìm thấy\n2. Gợi ý khách thử cách khác (tên sách, thể loại)\n3. Hỏi xem khách muốn tìm loại sách gì`}`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 400,
      },
    });

    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    
    // Handle specific Gemini errors
    if (error.message?.includes('API key') || error.status === 400 || error.status === 403) {
      console.warn('⚠️  Gemini API key issue. Using simple response.');
    }
    
    // Fallback to simple response
    return generateSimpleResponse(userQuery, products);
  }
};

/**
 * Generate simple response without AI (fallback)
 */
const generateSimpleResponse = (userQuery, products) => {
  const extractedAuthor = extractAuthorFromQuery(userQuery);
  const extractedBookName = extractBookNameFromQuery(userQuery);
  
  if (products.length > 0) {
    const topBook = products[0];
    let response = '';
    
    if (extractedAuthor) {
      response = `📚 Tìm thấy ${products.length} sách của tác giả ${extractedAuthor}!\n\n`;
    } else if (extractedBookName) {
      response = `📚 Tìm thấy ${products.length} sách phù hợp với "${extractedBookName}":\n\n`;
    } else {
      response = `📚 Tìm thấy ${products.length} sách phù hợp:\n\n`;
    }
    
    response += `Đặc biệt giới thiệu "${topBook.name}"`;
    if (topBook.author) response += ` của ${topBook.author}`;
    if (topBook.rating >= 4) response += ` - được đánh giá ${topBook.rating}/5 ⭐`;
    response += '!';
    return response;
  }
  
  if (extractedAuthor) {
    return `Xin lỗi, tôi không tìm thấy sách nào của tác giả "${extractedAuthor}". 🤔\n\nBạn có thể thử:\n• Kiểm tra lại tên tác giả\n• Tìm theo tên sách cụ thể\n• Tìm theo thể loại sách`;
  }
  
  return `Xin lỗi, tôi không tìm thấy sách nào phù hợp với "${userQuery}". 🤔\n\nBạn có thể thử:\n• Tìm theo thể loại: tiểu thuyết, kinh doanh, khoa học...\n• Tìm theo tác giả: "sách của [tên tác giả]"\n• Tìm theo giá: "sách dưới 100k"`;
};

/**
 * Process AI chat query - Main function with conversation context
 */
export const processAIQuery = async (userQuery, conversationHistory = []) => {
  try {
    // Extract context from conversation history
    const context = extractContextFromHistory(conversationHistory);
    
    // Step 1: Smart search for products with context
    const products = await smartSearch(userQuery, {
      limit: 6,
      context
    });

    // Step 2: Generate AI response using Gemini with conversation history
    const aiResponse = await generateAIResponse(userQuery, products, conversationHistory);

    return {
      response: aiResponse,
      books: products.map(p => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: p.images,
        categories: p.categories,
        author: p.author,
        stock: p.stock,
        isAvailable: p.isAvailable,
        rating: p.rating || 0,
        ratingCount: p.ratingCount || 0
      }))
    };
  } catch (error) {
    console.error('Error processing AI query:', error);
    throw error;
  }
};

export default {
  smartSearch,
  generateAIResponse,
  processAIQuery,
  analyzeIntent,
  extractContextFromHistory,
  extractAuthorFromQuery,
  extractBookNameFromQuery
};
