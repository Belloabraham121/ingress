// Script to drop the phoneNumber index from wallets collection
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://iteoluwakisibello_db_user:WgvcjU9TyjCVM1dz@cluster1.gzkfjro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";

async function dropIndex() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const collection = db.collection('wallets');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:', JSON.stringify(indexes, null, 2));
    
    // Drop the phoneNumber index
    try {
      await collection.dropIndex('phoneNumber_1');
      console.log('\n✅ Successfully dropped phoneNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  Index phoneNumber_1 does not exist (already dropped)');
      } else {
        throw error;
      }
    }
    
    // List indexes after dropping
    const indexesAfter = await collection.indexes();
    console.log('\nIndexes after drop:', JSON.stringify(indexesAfter, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

dropIndex();
