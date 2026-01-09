// Shop page product rendering
(() => {
  // API endpoint
  const API_BASE = `${location.origin}/api/products`;

  // Category mapping
  const CATEGORY_GROUPS = {
    'van-hoc-nghe-thuat': {
      tabId: 'pills-arts',
      gridId: 'artsGrid',
      display: 'Văn học – Nghệ thuật'
    },
    'khoa-hoc-ky-thuat': {
      tabId: 'pills-Biographies',
      gridId: 'BiographiesGrid',
      display: 'Khoa học – Kỹ thuật'
    },
    'kinh-te-xa-hoi': {
      tabId: 'pills-ChristianBooks',
      gridId: 'ChristianBooksGrid',
      display: 'Kinh tế – Xã hội'
    },
    'lich-su-van-hoa-dia-ly': {
      tabId: 'pills-ResearchPublishing',
      gridId: 'ResearchPublishingGrid',
      display: 'Lịch sử – Văn hóa – Địa lý'
    },
    'doi-song-thuc-hanh': {
      tabId: 'pills-SportsOutdoors',
      gridId: 'SportsOutdoorsGrid',
      display: 'Đời sống – Thực hành'
    },
    'giao-duc-phap-luat': {
      tabId: 'pills-FoodDrink',
      gridId: 'FoodDrinkGrid',
      display: 'Giáo dục – Pháp luật'
    }
  };

  // State
  let currentFilters = {
    q: '',
    minPrice: null,
    maxPrice: null,
    available: true
  };

  // DOM elements
  const els = {
    resultCount: document.querySelector('#resultCount'),
    searchInput: document.querySelector('.search-container .search-input'),
    filterBtn: document.querySelector('.filter-btn'),
    minPriceInput: document.querySelector('.input-min'),
    maxPriceInput: document.querySelector('.input-max'),
    productCardTpl: document.querySelector('#productCardTpl')
  };

  // Format price in VND
  function formatVND(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  // Normalize image URL - FIXED VERSION
  function normalizeImageUrl(img) {
    console.log('Original image data:', img); // Debug log
    
    if (!img) return '/assets/img/book/01.png';
    
    // Nếu là mảng, lấy phần tử đầu tiên
    let url = Array.isArray(img) ? img[0] : img;
    if (!url) return '/assets/img/book/01.png';
    
    // Chuyển thành string và làm sạch
    url = String(url).trim().replace(/\\/g, '/');
    
    // Nếu đã là URL đầy đủ, trả về luôn
    if (/^https?:\/\//i.test(url)) {
      console.log('Full URL detected:', url);
      return url;
    }
    
    // Xóa 'public/' nếu có
    url = url.replace(/^public\//i, '');
    
    // Xử lý các trường hợp đường dẫn
    // Case 1: Đã có /uploads/ ở đầu
    if (/^\/uploads\//i.test(url)) {
      console.log('Already has /uploads/:', url);
      return url;
    }
    
    // Case 2: Có uploads/ nhưng không có /
    if (/^uploads\//i.test(url)) {
      const finalUrl = `/${url}`;
      console.log('Has uploads/, adding /:', finalUrl);
      return finalUrl;
    }
    
    // Case 3: Bắt đầu bằng products/ (format của bạn)
    if (/^products\//i.test(url)) {
      const finalUrl = `/uploads/${url}`;
      console.log('Products path, adding /uploads/:', finalUrl);
      return finalUrl;
    }
    
    // Case 4: Đường dẫn khác, xóa / ở đầu và thêm /uploads/
    url = url.replace(/^\/+/, '');
    const finalUrl = `/uploads/${url}`;
    console.log('Default case, adding /uploads/:', finalUrl);
    return finalUrl;
  }

  // Create product card from template
  function createProductCard(product) {
    if (!els.productCardTpl) return null;
    
    const clone = els.productCardTpl.content.cloneNode(true);
    
    // Product link
    const productLink = clone.querySelector('.product-link');
    if (productLink) {
      productLink.href = `/shop-details.html?slug=${product.slug || product._id}`;
    }
    
    // Product image
    const productImg = clone.querySelector('.product-img');
    if (productImg) {
      const imageUrl = normalizeImageUrl(product.images);
      productImg.src = imageUrl;
      productImg.alt = product.name || 'Product image';
      console.log('Final image URL:', imageUrl); // Debug log
      
      // Thêm error handler để debug
      productImg.onerror = function() {
        console.error('Failed to load image:', this.src);
        this.src = '/assets/img/book/01.png';
      };
    }
    
    // Title
    const titleLink = clone.querySelector('.title-link');
    if (titleLink) {
      titleLink.textContent = product.name || 'Untitled';
      titleLink.href = `/shop-details.html?slug=${product.slug || product._id}`;
    }
    
    // Price
    const priceList = clone.querySelector('.price-list');
    if (priceList) {
      priceList.innerHTML = '';
      
      const priceItem = document.createElement('li');
      priceItem.textContent = formatVND(product.price || 0);
      priceList.appendChild(priceItem);
      
      if (product.compareAtPrice && product.compareAtPrice > product.price) {
        const originalPriceItem = document.createElement('li');
        const del = document.createElement('del');
        del.textContent = formatVND(product.compareAtPrice);
        originalPriceItem.appendChild(del);
        priceList.appendChild(originalPriceItem);
      }
    }
    
    // Author (if available)
    const shopRating = clone.querySelector('.shop-rating');
    if (shopRating && product.author) {
      shopRating.innerHTML = `<small>Tác giả: ${product.author}</small>`;
    }
    
    // Add to cart button
    const addToCartBtn = clone.querySelector('.add-to-cart');
    if (addToCartBtn) {
      addToCartBtn.dataset.productId = product._id;
      addToCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addToCart(product);
      });
    }
    
    // Wishlist button
    const wishBtn = clone.querySelector('.wish-link');
    if (wishBtn) {
      wishBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleWishlist(product);
      });
    }
    
    // Quick view button
    const quickViewBtn = clone.querySelector('.quickview-link');
    if (quickViewBtn) {
      quickViewBtn.href = `/shop-details.html?slug=${product.slug || product._id}`;
    }
    
    // Stock status
    if (product.stock === 0 || !product.isAvailable) {
      const postBox = clone.querySelector('.post-box');
      if (postBox) {
        postBox.innerHTML = '<li style="background: #666;">Hết hàng</li>';
        postBox.classList.remove('d-none');
      }
    } else if (product.compareAtPrice && product.compareAtPrice > product.price) {
      const discount = Math.round((1 - product.price / product.compareAtPrice) * 100);
      const postBox = clone.querySelector('.post-box');
      if (postBox && discount > 0) {
        postBox.innerHTML = `<li>-${discount}%</li>`;
        postBox.classList.remove('d-none');
      }
    }
    
    return clone;
  }

  // Render products to a specific grid
  function renderProductsToGrid(gridId, products) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
      grid.innerHTML = '<div class="col-12 text-center py-5"><p>Không có sản phẩm nào trong danh mục này.</p></div>';
      return;
    }
    
    products.forEach(product => {
      const card = createProductCard(product);
      if (card) {
        grid.appendChild(card);
      }
    });
  }

  // Load products by category groups
  async function loadProductsByGroups() {
    try {
      const params = new URLSearchParams();
      if (currentFilters.q) params.set('q', currentFilters.q);
      if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice);
      if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice);
      params.set('limit', '12');
      
      const response = await fetch(`${API_BASE}/by-groups?${params}`);
      if (!response.ok) throw new Error('Failed to load products');
      
      const data = await response.json();
      console.log('Products data received:', data); // Debug log
      
      let totalProducts = 0;
      
      // Render products to each category grid
      for (const [groupKey, groupData] of Object.entries(data)) {
        const { gridId, products } = groupData;
        console.log(`Rendering ${products.length} products to ${gridId}`); // Debug log
        renderProductsToGrid(gridId, products);
        totalProducts += products.length;
      }
      
      // Update result count
      if (els.resultCount) {
        els.resultCount.textContent = `Hiển thị ${totalProducts} sản phẩm`;
      }
      
    } catch (error) {
      console.error('Error loading products:', error);
      if (els.resultCount) {
        els.resultCount.textContent = 'Lỗi khi tải sản phẩm';
      }
    }
  }

  // Add to cart function
  function addToCart(product) {
    const cartKey = 'bookle_cart';
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch (e) {
      cart = [];
    }
    
    const existingIndex = cart.findIndex(item => item._id === product._id);
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: normalizeImageUrl(product.images),
        slug: product.slug,
        quantity: 1
      });
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartBadges();
    showToast('Đã thêm vào giỏ hàng!');
  }

  // Toggle wishlist
  function toggleWishlist(product) {
    const wishlistKey = 'bookle_wishlist';
    let wishlist = [];
    try {
      wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    } catch (e) {
      wishlist = [];
    }
    
    const existingIndex = wishlist.findIndex(item => item._id === product._id);
    
    if (existingIndex > -1) {
      wishlist.splice(existingIndex, 1);
      showToast('Đã xóa khỏi danh sách yêu thích');
    } else {
      wishlist.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: normalizeImageUrl(product.images),
        slug: product.slug
      });
      showToast('Đã thêm vào danh sách yêu thích!');
    }
    
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    updateWishlistBadges();
  }

  // Update cart badges
  function updateCartBadges() {
    const cartKey = 'bookle_cart';
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch (e) {
      cart = [];
    }
    
    const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    document.querySelectorAll('.cart-icon .cart-count').forEach(badge => {
      if (totalCount > 0) {
        badge.textContent = totalCount;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    });
  }

  // Update wishlist badges
  function updateWishlistBadges() {
    const wishlistKey = 'bookle_wishlist';
    let wishlist = [];
    try {
      wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    } catch (e) {
      wishlist = [];
    }
    
    const badges = document.querySelectorAll('a[href="wishlist.html"] .cart-count');
    badges.forEach(badge => {
      if (wishlist.length > 0) {
        badge.textContent = wishlist.length;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    });
  }

  // Show toast message
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
      <div class="toast show bg-success text-white" role="alert">
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Initialize event listeners
  function initEventListeners() {
    if (els.searchInput) {
      let searchTimeout;
      els.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentFilters.q = e.target.value.trim();
          loadProductsByGroups();
        }, 500);
      });
    }
    
    if (els.filterBtn) {
      els.filterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentFilters.minPrice = els.minPriceInput ? parseFloat(els.minPriceInput.value) || null : null;
        currentFilters.maxPrice = els.maxPriceInput ? parseFloat(els.maxPriceInput.value) || null : null;
        
        if (currentFilters.minPrice) currentFilters.minPrice *= 1000;
        if (currentFilters.maxPrice) currentFilters.maxPrice *= 1000;
        
        loadProductsByGroups();
      });
    }
    
    const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
    tabButtons.forEach(button => {
      button.addEventListener('shown.bs.tab', () => {
        // Products are already loaded
      });
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadProductsByGroups();
    updateCartBadges();
    updateWishlistBadges();
  });

  // Update badges on storage change
  window.addEventListener('storage', (e) => {
    if (e.key === 'bookle_cart') updateCartBadges();
    if (e.key === 'bookle_wishlist') updateWishlistBadges();
  });
})();