import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n/config'; 

// Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// ⚡️ LAZY LOADING: Chỉ tải file khi người dùng truy cập route đó
const HomePage = lazy(() => import('./pages/HomePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const ShopListPage = lazy(() => import('./pages/ShopListPage'));
const ShopDetailsPage = lazy(() => import('./pages/ShopDetailsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsDetailsPage = lazy(() => import('./pages/NewsDetailsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const TeamDetailsPage = lazy(() => import('./pages/TeamDetailsPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const ShopCartPage = lazy(() => import('./pages/ShopCartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Admin
const AdminLogin = lazy(() => import('./admin/pages/Login'));
const PrivateRoute = lazy(() => import('./admin/components/PrivateRoute'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const BookManagement = lazy(() => import('./admin/pages/BookManagement'));
const EventManagement = lazy(() => import('./admin/pages/EventManagement'));
const OrderManagement = lazy(() => import('./admin/pages/OrderManagement'));
const ReviewManagement = lazy(() => import('./admin/pages/ReviewManagement'));
const UserManagement = lazy(() => import('./admin/pages/UserManagement'));
const ContactManagement = lazy(() => import('./admin/pages/ContactManagement'));

// Component gộp các Provider lại cho gọn App.js
const AppProviders = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  </ThemeProvider>
);

function App() {
  return (
    <AppProviders>
      <Router>
        <div className="App">
          {/* Suspense hiển thị Loading trong lúc chờ tải trang */}
          <Suspense fallback={<LoadingSpinner fullScreen={true} variant="spinner" size="large" />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="shop-list" element={<ShopListPage />} />
                <Route path="shop-details/:id" element={<ShopDetailsPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="news-details/:id" element={<NewsDetailsPage />} />
                <Route path="blog" element={<BlogPage />} />
                {/* Authors - giữ cả team và authors để tương thích */}
                <Route path="authors" element={<TeamPage />} />
                <Route path="author/:id" element={<TeamDetailsPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="team-details/:id" element={<TeamDetailsPage />} />
                <Route path="faq" element={<FAQPage />} />
                <Route path="shop-cart" element={<ShopCartPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              
              {/* Route nằm ngoài Layout (Không Header/Footer) */}
              <Route path="reset-password" element={<ResetPasswordPage />} />

              {/* Admin — Login nằm ngoài PrivateRoute */}
              <Route path="admin/login" element={<AdminLogin />} />

              {/* Admin Panel — bảo vệ bởi PrivateRoute (kiểm tra JWT token) */}
              <Route path="admin" element={<PrivateRoute />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<BookManagement />} />
                  <Route path="events" element={<EventManagement />} />
                  <Route path="orders" element={<OrderManagement />} />
                  <Route path="reviews" element={<ReviewManagement />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="contacts" element={<ContactManagement />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AppProviders>
  );
}

export default App;