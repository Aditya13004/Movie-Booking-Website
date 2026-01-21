# 🎬 Eventura - Movie Booking Platform

A modern, full-stack movie ticket booking application built with vanilla JavaScript frontend and Node.js/Express backend with optional MongoDB integration.

## ✨ Features

### 🎭 **Movie Booking**
- Browse now-playing movies from TMDB API
- Interactive cinema seating selection
- Multiple showtime options
- Real-time seat availability
- Advanced search functionality

### 💳 **Payment Gateway Integration**
- **Credit/Debit Cards** with input masking (4242 4242 4242 4242)
- **UPI Payments** with ID validation (user@paytm)
- **Net Banking** with major Indian banks
- **Digital Wallets** (Paytm, PhonePe, Google Pay, etc.)
- Backend payment processing with MongoDB tracking
- Success/failure popups for all payment methods

### 🔐 **Authentication**
- OTP-based mobile authentication
- Secure sign-in flow
- Session management with localStorage
- Optional MongoDB user storage

### 🎨 **Modern UI/UX**
- Responsive design with dark theme
- Interactive animations and transitions
- Professional cinema-style seating layout
- Enhanced payment method cards
- Input masking for card details and dates

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB (optional)
- TMDB API key (for movie data)

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/eventura  # Optional
TMDB_API_KEY=your_tmdb_api_key_here
```

### 3. Frontend Configuration
Update `config.js` with your API keys:
```javascript
const CONFIG = {
  TMDB_API_KEY: 'your_tmdb_api_key_here',
  // ... other config
};
```

### 4. Start the Application
```bash
# Start backend server
npm start

# Open frontend
# Navigate to http://localhost:4000
```

## 📱 Key Enhancements Added

### ✅ Search Functionality
- Type movie names in the search bar
- Press Enter or click Search button
- Real-time filtering of movie results
- "No movies found" message for empty results

### ✅ Input Masking & Validation
- **Card Number**: Automatic spacing every 4 digits
- **Expiry Date**: MM/YY format with auto-slash insertion
- **CVC**: Numeric only, max 4 digits
- **Mobile**: 10-digit validation
- **OTP**: 6-digit numeric input

### ✅ Payment Gateway Integration
- All payment methods now show success popups
- Backend API processes all payment types
- Payment IDs generated and displayed
- Method-specific validation and error handling
- Loading states during payment processing

### ✅ OTP Authentication System
- Mobile number entry with validation
- OTP generation and verification
- Success messages and error handling
- Automatic redirection after sign-in
- Sign out functionality

### ✅ Enhanced Cinema Seating
- Row labels (A, B, C, etc.)
- Improved visual design with gradients
- Better seat states (available, selected, reserved, wheelchair)
- Hover effects and animations
- Professional screen display

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP for mobile
- `POST /api/auth/verify-otp` - Verify OTP and sign in

### Payments
- `POST /api/payments/create` - Process payment with all methods

### Movie Data Proxy
- `GET /movieglu/*` - MovieGlu API proxy for cinema data

## 🧪 Testing the Features

### Search Testing
1. Go to the home page
2. Type a movie name in the search bar
3. Press Enter or click Search
4. Results should filter in real-time

### Payment Testing
1. Select a movie and proceed through booking
2. Try each payment method:
   - **Card**: Use `4242 4242 4242 4242`, `12/25`, `123`
   - **UPI**: Enter `test@paytm` or any valid UPI ID
   - **NetBanking**: Select any bank from dropdown
   - **Wallet**: Select any wallet from dropdown
3. Each should show a success popup with payment details

### Authentication Testing
1. Click "Sign In" button
2. Enter a 10-digit mobile number
3. Click "Send OTP"
4. Check server console for OTP code
5. Enter the OTP and verify
6. Should redirect to main page with "Sign Out" button

## 💾 Database Integration (MongoDB)

The application now supports optional MongoDB integration:
- User authentication storage
- Payment transaction tracking
- Automatic fallback to in-memory storage if MongoDB unavailable

## 📁 Project Structure

```
Events Booking Web/
├── 🎯 Frontend Files
│   ├── index.html          # Main movie listing page
│   ├── signin.html         # OTP authentication page
│   ├── theatres.html       # Theatre selection
│   ├── seating.html        # Seat selection
│   ├── app.js             # Main application logic + search
│   ├── auth.js            # Authentication handling
│   ├── seating.js         # Seat selection logic
│   ├── theatres.js        # Theatre logic
│   └── styles.css         # Enhanced styling
├── ⚙️ Backend Files
│   ├── server.js          # Express server + API routes
│   ├── models.js          # MongoDB schemas
│   └── package.json       # Updated dependencies
└── 📄 Configuration
    ├── config.js          # Frontend configuration
    ├── cities.js          # Indian cities data
    ├── .env.example       # Environment template
    └── README.md          # This file
```

## 🎯 What Works Now

✅ **Search Bar** - Type movie names and get filtered results
✅ **All Payment Methods** - Card, UPI, NetBanking, Wallet with popups
✅ **Input Masking** - Card numbers, expiry dates auto-format
✅ **OTP Authentication** - Mobile + OTP sign-in flow
✅ **Enhanced Seating** - Professional cinema layout
✅ **Backend Integration** - Full MERN stack with MongoDB support
✅ **Responsive Design** - Works on all devices
✅ **Error Handling** - Proper validation and error messages

## 🚀 Next Steps for Production

1. **Real SMS Integration**: Replace console OTP with Twilio/TextLocal
2. **Environment Setup**: Configure `.env` with real API keys
3. **Database**: Set up MongoDB Atlas for cloud storage
4. **SSL/HTTPS**: Enable secure connections
5. **Hosting**: Deploy on Heroku, Vercel, or AWS

---

**Your full-stack movie booking platform is now ready! 🎬✨**
