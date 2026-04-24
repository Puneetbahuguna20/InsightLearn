const mongoose = require('mongoose');
const config = require('./environment');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('Database already connected');
      return this.connection;
    }

    try {
      console.log('Connecting to MongoDB...');

      this.connection = await mongoose.connect(
        config.database.mongodb.uri,
        config.database.mongodb.options
      );

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      return this.connection;

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);

      if (config.env === 'development') {
        console.log('⚠️ Continuing without DB in development mode');
        return null;
      }

      process.exit(1);
    }
  }

  async disconnect() {
    if (this.connection && this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('MongoDB connection closed');
    }
  }

  isConnectionActive() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

module.exports = new DatabaseConnection();