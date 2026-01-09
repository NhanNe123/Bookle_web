import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for session cookies
});

// Products API
export const getProducts = async (params) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
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
  search: async (query, conversationHistory = []) => {
    const response = await api.post('/products/ai-search', { 
      query,
      conversationHistory 
    });
    return response.data;
  }
};

export default api;