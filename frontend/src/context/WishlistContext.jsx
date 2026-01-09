import React, { createContext, useState, useEffect } from 'react';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedWishlist = localStorage.getItem('bookle_wishlist');
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch (error) {
          console.error('Error loading wishlist:', error);
          localStorage.removeItem('bookle_wishlist');
        }
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('bookle_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  // Add item to wishlist
  const addToWishlist = (product) => {
    setWishlist(prevWishlist => {
      // Check if product already exists in wishlist
      const exists = prevWishlist.some(item => item._id === product._id);
      
      if (exists) {
        // If already in wishlist, don't add again
        return prevWishlist;
      } else {
        // Add new item to wishlist
        return [...prevWishlist, {
          _id: product._id,
          slug: product.slug,
          name: product.name,
          author: product.author,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          images: product.images,
          stock: product.stock,
          isAvailable: product.isAvailable,
          categories: product.categories,
          addedAt: new Date().toISOString()
        }];
      }
    });
  };

  // Remove item from wishlist
  const removeFromWishlist = (productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item._id !== productId));
  };

  // Toggle item in wishlist (add if not exists, remove if exists)
  const toggleWishlist = (product) => {
    const exists = isInWishlist(product._id);
    if (exists) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  // Clear entire wishlist
  const clearWishlist = () => {
    setWishlist([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('bookle_wishlist');
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    isInWishlist,
    getWishlistCount
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

