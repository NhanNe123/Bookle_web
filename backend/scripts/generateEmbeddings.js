// scripts/generateEmbeddings.js
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../db/index.js';
import Product from '../models/Product.js';
import { generateProductEmbedding } from '../services/aiService.js';

/**
 * Generate embeddings for all products that don't have embeddings yet
 */
async function generateEmbeddingsForAllProducts() {
  try {
    await connectDB();
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

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      try {
        console.log(`[${i + 1}/${products.length}] Generating embedding for: ${product.name}`);
        
        const embedding = await generateProductEmbedding(product);
        
        await Product.findByIdAndUpdate(product._id, {
          embedding: embedding
        });

        successCount++;
        console.log(`✅ Successfully generated embedding (${embedding.length} dimensions)\n`);

        // Rate limiting: wait a bit to avoid hitting API limits
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error for product "${product.name}":`, error.message);
        
        // If it's an API key error, stop the process
        if (error.message.includes('API key') || error.message.includes('401')) {
          console.error('\n❌ Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.');
          process.exit(1);
        }
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEmbeddingsForAllProducts();
}

export default generateEmbeddingsForAllProducts;
