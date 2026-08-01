const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Disable Mongoose command buffering so DB queries never hang indefinitely
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

let isConnected = false;
let inMemoryStore = {
  spins: [],
  claims: []
};

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`====================================================`);
    console.log(`🚀 [MongoDB Atlas] CONNECTED SUCCESSFULLY TO LIVE CLUSTER0!`);
    console.log(`📦 [Database] Database: Spinwheel | Collection: luck`);
    console.log(`====================================================`);
  } catch (err) {
    console.warn(`[MongoDB Warning] External Atlas connection warning: ${err.message}`);
    isConnected = false;
  }
};

mongoose.connection.on('connected', () => { isConnected = true; });
mongoose.connection.on('error', () => { isConnected = false; });
mongoose.connection.on('disconnected', () => { isConnected = false; });

const getDbState = () => isConnected && mongoose.connection.readyState === 1;

module.exports = { connectDB, getDbState, inMemoryStore };
