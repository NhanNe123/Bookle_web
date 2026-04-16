import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// JWT admin: chỉ gắn khi gọi API quản trị — không gắn vào GET /auth/me (session khách).
// Nếu gắn Bearer admin vào /auth/me, server chỉ đọc cookie session → thiếu session → 401.
function isCustomerAuthMeRequest(config) {
  const path = String(config.url || '').split('?')[0].replace(/\/$/, '') || '';
  return path === '/auth/me' || path === 'auth/me';
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bookle_admin_token');
  if (token && !isCustomerAuthMeRequest(config)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nếu server trả 401 trên trang admin → xóa token, chuyển về login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err?.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      !window.location.pathname.includes('/admin/login')
    ) {
      localStorage.removeItem('bookle_admin_token');
      localStorage.removeItem('bookle_admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// Products API
export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Get related products based on AI recommendation
export const getRelatedProducts = async (id, limit = 8) => {
  const response = await api.get(`/products/${id}/related`, { params: { limit } });
  return response.data;
};

// Get available book languages
export const getBookLanguages = async () => {
  const response = await api.get('/products/languages');
  return response.data;
};

// Auth API
export const authAPI = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (payload = {}) => {
    let body;

    if (payload instanceof FormData) {
      body = payload;
    } else {
      body = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          body.append(key, value);
        }
      });
    }

    const response = await api.put('/auth/profile', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Contact API
export const contactAPI = {
  sendMessage: async (data) => {
    const response = await api.post('/contact', data);
    return response.data;
  }
};

// Authors API
export const getAuthors = async (params = {}) => {
  const response = await api.get('/authors', { params });
  return response.data;
};

export const getAuthorById = async (id) => {
  const response = await api.get(`/authors/${id}`);
  return response.data;
};

export const getAuthorBySlug = async (slug) => {
  const response = await api.get(`/authors/slug/${slug}`);
  return response.data;
};

export const getAuthorProducts = async (authorId, params = {}) => {
  const response = await api.get(`/authors/${authorId}/products`, { params });
  return response.data;
};

// Posts API
export const getPosts = async (params = {}) => {
  const response = await api.get('/posts', { params });
  return response.data;
};

export const getPostById = async (id) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

export const getPostBySlug = async (slug) => {
  const response = await api.get(`/posts/slug/${slug}`);
  return response.data;
};

// Reviews API
export const reviewsAPI = {
  getReviews: async (productId, params = {}) => {
    const response = await api.get(`/products/${productId}/reviews`, { params });
    return response.data;
  },
  
  createReview: async (productId, rating, comment) => {
    const response = await api.post(`/products/${productId}/reviews`, { rating, comment });
    return response.data;
  }
};

// AI Chat API
export const aiChatAPI = {
  /** @param {string|null|undefined} contextProductId - _id hoặc slug sản phẩm khi mở chat từ trang chi tiết */
  search: async (query, conversationHistory = [], contextProductId = null) => {
    const body = { query, conversationHistory };
    if (contextProductId) {
      body.contextProductId = String(contextProductId);
    }
    const response = await api.post('/products/ai-search', body);
    return response.data;
  },
};

// Admin Products CRUD
export const adminProductsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/products', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

/** Upload ảnh admin → POST /api/upload (Bearer tự gắn qua interceptor) */
export const adminUploadAPI = {
  /** @param {File} file */
  postFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData);
    return response.data;
  },
};

// Events API (quản trị / theme động)
export const eventsAPI = {
  list: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  suggest: async (prompt) => {
    const response = await api.post('/events/suggest', { prompt });
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/events', payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.put(`/events/${id}`, payload);
    return response.data;
  },
  deactivate: async (id) => {
    const response = await api.patch(`/events/${id}/deactivate`);
    return response.data;
  },
  remove: async (id) => {
    const rid = id != null && typeof id === 'object' && typeof id.toString === 'function'
      ? id.toString()
      : String(id ?? '');
    if (!rid || rid === 'undefined') {
      throw new Error('Thiếu ID sự kiện');
    }
    const response = await api.post(`/events/${encodeURIComponent(rid)}/delete`);
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  // Get user's orders
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },
  
  // Get order details
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },
  
  // Cancel order
  cancelOrder: async (id, reason) => {
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
  
  // Track order by order number
  trackOrder: async (orderNumber, email) => {
    const response = await api.get(`/orders/track/${orderNumber}`, { 
      params: { email } 
    });
    return response.data;
  }
};

export default api;