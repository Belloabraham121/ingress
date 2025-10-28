// Script to drop the phoneNumber index from wallets collection
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://iteoluwakisibello_db_user:WgvcjU9TyjCVM1dz@cluster1.gzkfjro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";

async function dropIndex() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const collection = db.collection("wallets");

    // List all indexes
    console.log("Current indexes on wallets collection:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the phoneNumber index
    console.log("\nDropping phoneNumber_1 index...");
    try {
      await collection.dropIndex("phoneNumber_1");
      console.log("✅ Successfully dropped phoneNumber_1 index\n");
    } catch (error) {
      if (error.code === 27) {
        console.log(
          "⚠️  Index phoneNumber_1 does not exist (already dropped)\n"
        );
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    console.log("Remaining indexes on wallets collection:");
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log("\n✅ Done! You can now register multiple users.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

dropIndex();
