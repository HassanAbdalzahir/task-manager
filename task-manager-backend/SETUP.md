# Setup Guide for Hierarchical Task Management System

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The `.env` file is already created with default values. Update it if needed:

```env
PORT=3100
MONGO_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
SOCKET_PATH=/socket.io
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Ubuntu/Debian
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# On Windows
# Start MongoDB service from Services
```

### 4. Run the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # HTTP server and Socket.io setup
├── config/
│   ├── env.ts            # Environment configuration
│   └── socket.ts         # Socket.io configuration
├── routes/
│   ├── auth.routes.ts    # Authentication routes
│   ├── user.routes.ts    # User management routes
│   └── task.routes.ts    # Task management routes
├── controllers/
│   ├── auth.controller.ts # Authentication logic
│   ├── user.controller.ts # User management logic
│   └── task.controller.ts # Task management logic
├── services/
│   ├── auth.service.ts   # Authentication business logic
│   ├── user.service.ts   # User management business logic
│   └── task.service.ts   # Task management business logic
├── models/
│   ├── user.model.ts     # User data model
│   └── task.model.ts     # Task data model
├── middleware/
│   ├── auth.middleware.ts # JWT authentication middleware
│   └── errorHandler.ts   # Error handling middleware
├── sockets/
│   └── task.socket.ts    # Socket.io event handlers
├── types/
│   └── express.d.ts      # TypeScript type declarations
└── utils/
    └── logger.ts         # Logging utility
```

## 🔧 Current Status

### ✅ Completed Features

- ✅ Project structure and configuration
- ✅ Environment configuration with dotenv
- ✅ MongoDB connection with Mongoose
- ✅ User model with hierarchical structure
- ✅ Task model with comments and status tracking
- ✅ JWT authentication middleware
- ✅ Error handling middleware
- ✅ Logger utility
- ✅ Socket.io configuration
- ✅ Authentication service (register, login, token validation)
- ✅ User service (hierarchical user management)
- ✅ Task service (task management with access control)
- ✅ Authentication controller
- ✅ User controller
- ✅ Task controller
- ✅ Route definitions
- ✅ Express app configuration
- ✅ HTTP server with Socket.io
- ✅ Graceful shutdown handling
- ✅ TypeScript configuration
- ✅ Package.json with scripts

### ⚠️ Known Issues

- TypeScript compilation errors due to strict typing
- MongoDB authentication may be required depending on setup

### 🔄 Next Steps

1. Fix TypeScript compilation errors
2. Add comprehensive testing
3. Add input validation middleware
4. Add rate limiting
5. Add API documentation (Swagger)
6. Add database migrations
7. Add Docker configuration

## 🧪 Testing the API

Once the server is running, you can test the endpoints:

### 1. Health Check

```bash
curl http://localhost:3100/health
```

### 2. Register a CEO

```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CEO User",
    "email": "ceo@company.com",
    "password": "password123",
    "role": "CEO"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@company.com",
    "password": "password123"
  }'
```

## 🔌 Socket.io Testing

Connect to Socket.io for real-time notifications:

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:3100", {
  path: "/socket.io",
  auth: {
    token: "your_jwt_token_here",
  },
});

socket.on("connect", () => {
  console.log("Connected to Socket.io");
});

socket.on("task:assigned", (data) => {
  console.log("New task assigned:", data);
});
```

## 🛠 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Code Style

- TypeScript with strict mode enabled
- ESLint configuration (to be added)
- Prettier configuration (to be added)

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3100
MONGO_URI=mongodb://your-production-mongo-uri
JWT_SECRET=your-very-secure-jwt-secret
JWT_EXPIRES_IN=7d
SOCKET_PATH=/socket.io
CLIENT_URL=https://your-frontend-domain.com
```

## 📚 Documentation

For detailed API documentation, see the main README.md file.

## 🆘 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check if authentication is required
- Verify the connection string in .env

### TypeScript Compilation Errors

- The current version has some TypeScript strict mode issues
- These are mainly related to type assertions and can be resolved with proper typing

### Port Already in Use

- Change the PORT in .env file
- Or kill the process using the port: `lsof -ti:3100 | xargs kill -9`
