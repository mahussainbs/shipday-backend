# 🚀 Swift-Ship Backend

Node.js/Express backend for Swift-Ship delivery management system.

## 🌐 Live Deployment

**API URL**: [Add your deployment URL here]

## 📋 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Payment**: PayFast
- **Notifications**: Firebase Cloud Messaging

## 📚 API Documentation

Base URL: `http://localhost:5000/api`

### Health Check
```
GET /
```

### Authentication
```
POST /api/auth/login
POST /api/auth/register
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

## 📦 Deployment Platforms

- ✅ **Render.com** (Recommended)
- ✅ **Railway.app**
- ⚠️ **Vercel** (Limited - Socket.io not supported)

## 📞 Support

For deployment help, see the detailed guide in `DEPLOYMENT_GUIDE.md`

## 📄 License

Private - All rights reserved
