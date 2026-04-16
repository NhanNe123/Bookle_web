// scripts/generateEmbeddings.js
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../db/index.js';
import Product from '../models/Product.js';
import { generateProductEmbedding, warmUpEmbeddingService } from '../services/aiService.js';

/**
 * Generate embeddings for all products that don't have embeddings yet
 */
async function generateEmbeddingsForAllProducts() {
  try {
    await connectDB();

    // Warm-up: đợi Python service tải model xong trước khi bắt đầu
    await warmUpEmbeddingService();

    console.log('📚 Starting embedding generation...\n');

    // Find products without embeddings or with empty embeddings
    const products = await Product.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ],
      isAvailable: true
    }).select('name author categories shortDescription description price');

    console.log(`Found ${products.length} products without embeddings\n`);

    if (products.length === 0) {
      console.log('✅ All products already have embeddings!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    let consecutiveErrors = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        const textPreview = (product.name || '').slice(0, 60);
        console.log(`[${i + 1}/${products.length}] Generating embedding for: ${textPreview}`);
        
        const embedding = await generateProductEmbedding(product);
        
        await Product.findByIdAndUpdate(product._id, {
          embedding: embedding
        });

        successCount++;
        consecutiveErrors = 0;
        console.log(`  ✅ Done (${embedding.length} dimensions)`);

        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        errorCount++;
        consecutiveErrors++;
        console.error(`  ❌ Error: ${error.message}`);

        if (error.message.includes('API key') || error.message.includes('401')) {
          console.error('\n❌ Lỗi API key. Kiểm tra OPENAI_API_KEY hoặc EMBEDDING_SERVICE_URL (Python Qwen) trong .env');
          process.exit(1);
        }
        if (error.message.includes('timeout') || error.message.includes('không phản hồi')) {
          console.error('\n❌ Embedding service timeout / không phản hồi. Kiểm tra terminal Python.');
          process.exit(1);
        }
        if (consecutiveErrors >= 3) {
          console.error(`\n❌ ${consecutiveErrors} lỗi liên tiếp, dừng sớm. Kiểm tra Embedding service.`);
          break;
        }
        console.log('  ⏭️  Bỏ qua, tiếp tục sách tiếp theo...');
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n✅ Embedding generation completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

generateEmbeddingsForAllProducts();

export default generateEmbeddingsForAllProducts;


