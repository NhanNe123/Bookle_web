"use strict";

import dotenv from 'dotenv';
dotenv.config();
import Post from '../models/Post.js';
import { connectDB, disconnectDB } from '../db/index.js';

const updatePostImages = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find all posts with old image paths
    const oldImagePaths = [
      '/assets/img/news/09.jpg',
      '/assets/img/blog/blog-1.jpg',
      '/assets/img/blog/blog-2.jpg',
      '/assets/img/blog/blog-3.jpg',
      '/assets/img/news/news-1.jpg',
      '/assets/img/news/news-2.jpg',
      '/assets/img/news/news-3.jpg',
      '/assets/img/news/news-4.jpg',
      '/assets/img/news/news-5.jpg'
    ];

    const fallbackImage = '/assets/img/book/01.png';
    const imageMap = {
      '/assets/img/blog/blog-1.jpg': '/assets/img/book/01.png',
      '/assets/img/blog/blog-2.jpg': '/assets/img/book/02.png',
      '/assets/img/blog/blog-3.jpg': '/assets/img/book/03.png',
      '/assets/img/news/news-1.jpg': '/assets/img/book/04.png',
      '/assets/img/news/news-2.jpg': '/assets/img/book/05.png',
      '/assets/img/news/news-3.jpg': '/assets/img/book/06.png',
      '/assets/img/news/news-4.jpg': '/assets/img/book/07.png',
      '/assets/img/news/news-5.jpg': '/assets/img/book/08.png',
      '/assets/img/news/09.jpg': '/assets/img/book/01.png'
    };

    let updatedCount = 0;

    for (const oldPath of oldImagePaths) {
      const posts = await Post.find({ featuredImage: oldPath });
      
      if (posts.length > 0) {
        const newPath = imageMap[oldPath] || fallbackImage;
        const result = await Post.updateMany(
          { featuredImage: oldPath },
          { $set: { featuredImage: newPath } }
        );
        updatedCount += result.modifiedCount;
        console.log(`Updated ${result.modifiedCount} posts from ${oldPath} to ${newPath}`);
      }
    }

    // Also update posts with null or empty featuredImage
    const postsWithoutImage = await Post.find({
      $or: [
        { featuredImage: null },
        { featuredImage: '' },
        { featuredImage: { $exists: false } }
      ]
    });

    if (postsWithoutImage.length > 0) {
      const result = await Post.updateMany(
        {
          $or: [
            { featuredImage: null },
            { featuredImage: '' },
            { featuredImage: { $exists: false } }
          ]
        },
        { $set: { featuredImage: fallbackImage } }
      );
      updatedCount += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} posts without image to ${fallbackImage}`);
    }

    console.log(`\nTotal updated: ${updatedCount} posts`);
    console.log('Image update completed successfully!');
  } catch (error) {
    console.error('Error updating post images:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Run the update
updatePostImages()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

