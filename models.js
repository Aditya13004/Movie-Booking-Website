/*
  Mongoose models for Eventura (optional MongoDB integration)
  - User model for authentication
  - Payment model for transaction tracking
*/

const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{10}$/
  },
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String, // mobile number for now
    required: true
  },
  method: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'redirect'],
    default: 'pending'
  },
  movieTitle: String,
  theatreName: String,
  showtime: String,
  seats: [String],
  ticketCount: Number,
  meta: mongoose.Schema.Types.Mixed, // Payment method specific data
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Export models
const User = mongoose.model('User', userSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// Database connection function
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventura';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('💡 Continuing with in-memory storage...');
  }
}

module.exports = {
  User,
  Payment,
  connectDB,
  isConnected: () => mongoose.connection.readyState === 1
};