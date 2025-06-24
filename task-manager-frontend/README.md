# Hierarchical Task Management System - Frontend

A modern Next.js frontend application for managing tasks in a hierarchical organizational structure with real-time notifications.

## 🚀 Features

- **Hierarchical User Management**: CEO → Manager → Employee structure
- **Role-based Access Control**: Different permissions for different roles
- **Task Management**: Create, assign, update, and track tasks
- **Real-time Notifications**: Socket.io integration for instant updates
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Admin-only Registration**: Only CEOs and Managers can create new users
- **Responsive Design**: Modern UI with Tailwind CSS
- **TypeScript**: Full type safety and better development experience

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running (see backend README)

## 🛠 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd task-manager-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3100/api
   NEXT_PUBLIC_SOCKET_PATH=/socket.io
   NEXT_PUBLIC_SOCKET_SERVER=http://localhost:3100
   ```

4. **Run the application**

   ```bash
   # Development mode
   npm run dev

   # Production build
   npm run build
   npm start
   ```

   The application will be available at http://localhost:3000

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with header
│   ├── page.tsx           # Home page (redirects to login/dashboard)
│   ├── login/page.tsx     # Login page
│   ├── register/page.tsx  # CEO registration page
│   ├── dashboard/page.tsx # Main dashboard
│   ├── tasks/
│   │   ├── page.tsx       # Tasks list
│   │   └── [id]/page.tsx  # Task detail page
│   └── users/page.tsx     # Users management
├── components/            # Reusable UI components
│   ├── Header.tsx         # Navigation header
│   ├── TaskCard.tsx       # Task display card
│   ├── UserList.tsx       # User list component
│   ├── AssignTaskForm.tsx # Task assignment form
│   └── CreateUserForm.tsx # User creation form (admin only)
├── lib/                   # Utility libraries
│   ├── axios.ts          # HTTP client with JWT interceptors
│   └── socket.ts         # Socket.io client configuration
├── store/                 # State management
│   └── authStore.ts      # Zustand auth store
└── types/                 # TypeScript type definitions
    ├── user.ts           # User-related types
    └── task.ts           # Task-related types
```

## 🔐 Authentication Flow

### Initial Setup

1. **First CEO Registration**: Visit `/register` to create the first CEO account
2. **Login**: Use `/login` to sign in with existing credentials

### User Creation (Admin Only)

- **CEOs** can create Managers and Employees
- **Managers** can create Employees
- **Employees** cannot create new users

### JWT Token Management

- Access tokens are automatically included in API requests
- Refresh tokens handle automatic token renewal
- Failed authentication redirects to login

## 👥 User Roles & Permissions

### CEO

- ✅ Create Managers and Employees
- ✅ Assign tasks to any subordinate
- ✅ View all users and tasks in the system
- ✅ Full system access

### Manager

- ✅ Create Employees
- ✅ Assign tasks to direct subordinates
- ✅ View subordinates and their tasks
- ❌ Cannot create other Managers or CEOs

### Employee

- ✅ View and update assigned tasks
- ✅ Add comments to tasks
- ❌ Cannot create users
- ❌ Cannot assign tasks

## 📋 Task Management

### Task Lifecycle

1. **Created** by CEO/Manager
2. **Assigned** to Employee
3. **In Progress** when Employee starts working
4. **Completed** when Employee finishes

### Task Features

- **Status Updates**: Employees can update task status
- **Comments**: All users can add comments to tasks
- **Deadlines**: Optional deadline tracking with overdue alerts
- **Real-time Updates**: Socket.io notifications for task changes

## 🔌 Real-time Features

### Socket.io Integration

- **Connection**: Automatic connection on login
- **Events**: Task assignments, status updates, comments
- **Authentication**: JWT token-based socket authentication

### Supported Events

- `task:assigned` - New task assigned
- `task:updated` - Task status updated
- `task:completed` - Task marked as completed
- `task:deadline` - Task deadline approaching/overdue

## 🎨 UI Components

### Design System

- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Responsive**: Mobile-first design approach
- **Accessibility**: ARIA labels and keyboard navigation

### Key Components

- **TaskCard**: Displays task information with status indicators
- **UserList**: Shows hierarchical user structure
- **Forms**: React Hook Form with validation
- **Loading States**: Spinner components for async operations

## 🚀 Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with Next.js rules
- **Prettier**: Code formatting (if configured)

## 🔧 Configuration

### Environment Variables

| Variable                    | Description          | Default                     |
| --------------------------- | -------------------- | --------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | Backend API base URL | `http://localhost:3100/api` |
| `NEXT_PUBLIC_SOCKET_PATH`   | Socket.io path       | `/socket.io`                |
| `NEXT_PUBLIC_SOCKET_SERVER` | Socket.io server URL | `http://localhost:3100`     |

### API Configuration

- **Base URL**: Configured in `lib/axios.ts`
- **JWT Interceptors**: Automatic token handling
- **Error Handling**: Consistent error responses
- **CORS**: Configured for backend integration

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile**: Responsive design for mobile devices
- **JavaScript**: ES6+ features required

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

- **Netlify**: Static site hosting
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

### Environment Variables for Production

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_SOCKET_PATH=/socket.io
NEXT_PUBLIC_SOCKET_SERVER=https://your-backend-domain.com
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

For support and questions:

- Check the backend README for API documentation
- Open an issue in the repository
- Review the Swagger documentation at `/api-docs` on your backend

## 🔗 Related

- **Backend**: [Hierarchical Task Manager Backend](../task-manager-backend)
- **API Documentation**: See backend README for complete API reference
- **Swagger UI**: Available at `http://localhost:3100/api-docs` when backend is running
