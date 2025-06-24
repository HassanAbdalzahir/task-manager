# Hierarchical Task Management System Backend

A robust Node.js backend for managing tasks in a hierarchical organizational structure with real-time notifications using Socket.io.

## 🚀 Features

- **Hierarchical User Management**: CEO → Manager → Employee structure
- **Role-based Access Control**: Different permissions for different roles
- **Task Management**: Create, assign, update, and track tasks
- **Real-time Notifications**: Socket.io integration for instant updates
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Scalable NoSQL database with Mongoose ODM
- **TypeScript**: Full type safety and better development experience
- **API Documentation**: Complete Swagger/OpenAPI 3.0 documentation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd task-manager-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   PORT=3100
   MONGO_URI=mongodb://localhost:27017/task-manager
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRES_IN=7d
   SOCKET_PATH=/socket.io
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start MongoDB**

   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## 📚 API Documentation

The API is fully documented using Swagger/OpenAPI 3.0. Once the server is running, you can access:

- **Interactive Documentation**: http://localhost:3100/api-docs
- **API Information**: http://localhost:3100/api
- **Detailed Guide**: See [SWAGGER.md](./SWAGGER.md) for comprehensive documentation

### Quick Start with Swagger UI

1. Start the server: `npm run dev`
2. Open http://localhost:3100/api-docs in your browser
3. Click "Authorize" and enter your JWT token
4. Test endpoints directly from the interface

## 📁 Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # HTTP server and Socket.io setup
├── config/
│   ├── env.ts            # Environment configuration
│   ├── socket.ts         # Socket.io configuration
│   └── swagger.ts        # Swagger/OpenAPI configuration
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
└── utils/
    └── logger.ts         # Logging utility
```

## 🔐 Authentication

### Register a new user

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Employee",
  "managerId": "manager_id_here"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get user profile

```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

## 👥 User Management

### Get all subordinates (recursive)

```http
GET /api/users/subordinates
Authorization: Bearer <jwt_token>
```

### Get direct subordinates only

```http
GET /api/users/direct
Authorization: Bearer <jwt_token>
```

### Get user hierarchy

```http
GET /api/users/hierarchy
Authorization: Bearer <jwt_token>
```

### Get user by ID

```http
GET /api/users/:userId
Authorization: Bearer <jwt_token>
```

### Update user profile

```http
PUT /api/users/:userId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

## 📋 Task Management

### Create a new task

```http
POST /api/tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the new feature",
  "assignedTo": "user_id_here",
  "deadline": "2024-01-15T23:59:59.000Z"
}
```

### Get tasks assigned to me

```http
GET /api/tasks/assigned
Authorization: Bearer <jwt_token>
```

### Get tasks created by me

```http
GET /api/tasks/created
Authorization: Bearer <jwt_token>
```

### Get tasks for subordinates

```http
GET /api/tasks/subordinates
Authorization: Bearer <jwt_token>
```

### Get task by ID

```http
GET /api/tasks/:taskId
Authorization: Bearer <jwt_token>
```

### Update task status

```http
PUT /api/tasks/:taskId/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "in_progress"
}
```

### Add comment to task

```http
POST /api/tasks/:taskId/comments
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "Working on this task now"
}
```

### Get tasks by status

```http
GET /api/tasks/status/pending
Authorization: Bearer <jwt_token>
```

### Get overdue tasks

```http
GET /api/tasks/overdue
Authorization: Bearer <jwt_token>
```

## 🔌 Socket.io Events

### Client Events

- `connect`: Connect to Socket.io server
- `disconnect`: Disconnect from server

### Server Events

- `task:assigned`: New task assigned
- `task:updated`: Task status updated
- `task:completed`: Task marked as completed
- `task:deadline`: Task deadline approaching/overdue

### Socket.io Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:3100", {
  path: "/socket.io",
  auth: {
    token: "your_jwt_token_here",
  },
});

socket.on("task:assigned", (data) => {
  console.log("New task assigned:", data);
});

socket.on("task:updated", (data) => {
  console.log("Task updated:", data);
});
```

## 🏗 System Architecture

### User Hierarchy

- **CEO**: Top level, can manage all users and tasks
- **Manager**: Mid level, can manage their subordinates
- **Employee**: Leaf level, can only manage their own tasks

### Task Assignment Rules

- Users can only assign tasks to their **direct subordinates**
- Users can view tasks of all their subordinates (recursive)
- Only the assigned user can update task status
- Only the task creator can update task details

### Access Control

- JWT tokens for authentication
- Role-based permissions
- Hierarchical access control
- Resource ownership validation

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Database Schema

### User Model

```typescript
{
  name: string;
  email: string;
  password: string; // hashed
  role: 'CEO' | 'Manager' | 'Employee';
  managerId?: ObjectId; // reference to manager
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Model

```typescript
{
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: ObjectId; // reference to user
  createdBy: ObjectId; // reference to user
  deadline?: Date;
  comments: [{
    message: string;
    createdAt: Date;
    createdBy: ObjectId;
  }];
  createdAt: Date;
  updatedAt: Date;
}
```

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the repository.
