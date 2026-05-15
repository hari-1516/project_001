const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/visionattend';
    console.log('Attempting to connect to:', uri);
    
    await mongoose.connect(uri);
    console.log('✅ SUCCESS: Database is working and connected perfectly!');
    
    // Check if we can count collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ SUCCESS: Found ${collections.length} collections in the database.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR: Could not connect to the database.');
    console.error('Details:', error.message);
    console.error('\nPlease make sure MongoDB is installed and running on your computer!');
    process.exit(1);
  }
};

testConnection();
