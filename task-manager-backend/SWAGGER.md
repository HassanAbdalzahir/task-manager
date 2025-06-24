# API Documentation Guide

## Overview

The Hierarchical Task Management System API is fully documented using Swagger/OpenAPI 3.0. The interactive documentation is available at `/api-docs` when the server is running.

## Accessing the Documentation

### Local Development

- **URL**: http://localhost:3100/api-docs
- **API Info**: http://localhost:3100/api

### Production

- **URL**: https://your-domain.com/api-docs
- **API Info**: https://your-domain.com/api

## API Structure

The API is organized into three main categories:

### 1. Authentication (`/api/auth`)

- **POST** `/register` - Register a new user
- **POST** `/login` - User login
- **POST** `/refresh-token` - Refresh access token
- **GET** `/profile` - Get current user profile

### 2. Users (`/api/users`)

- **GET** `/subordinates` - Get all subordinates (recursive)
- **GET** `/direct` - Get direct subordinates only
- **GET** `/hierarchy` - Get user hierarchy tree
- **GET** `/:userId` - Get user by ID
- **PUT** `/:userId` - Update user
- **GET** `/` - Get all users (Admin only)
- **GET** `/role/:role` - Get users by role (Admin only)
- **DELETE** `/:userId` - Delete user (Admin only)

### 3. Tasks (`/api/tasks`)

- **POST** `/` - Create a new task
- **GET** `/assigned` - Get tasks assigned to current user
- **GET** `/created` - Get tasks created by current user
- **GET** `/subordinates` - Get tasks for all subordinates
- **GET** `/:taskId` - Get task by ID
- **PUT** `/:taskId` - Update task
- **DELETE** `/:taskId` - Delete task
- **PUT** `/:taskId/status` - Update task status
- **POST** `/:taskId/comments` - Add comment to task
- **GET** `/status/:status` - Get tasks by status
- **GET** `/overdue` - Get overdue tasks

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register a new user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use the returned `accessToken` in subsequent requests

### Token Refresh

When the access token expires, use the refresh token to get a new one:

```
POST /api/auth/refresh-token
{
  "refreshToken": "your-refresh-token"
}
```

## Role-Based Access Control

The system implements a hierarchical role structure:

### Roles

- **CEO**: Full access to all users and tasks
- **Manager**: Can manage subordinates and their tasks
- **Employee**: Can only manage their own tasks

### Access Rules

- Users can only assign tasks to their direct subordinates
- Users can view tasks assigned to their subordinates
- Only managers and above can view all users
- Only the task creator or assigned user can modify task details

## Data Models

### User Schema

```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "CEO|Manager|Employee",
  "managerId": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Task Schema

```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "status": "pending|in_progress|completed",
  "assignedTo": "User",
  "createdBy": "User",
  "deadline": "date-time",
  "comments": [
    {
      "message": "string",
      "createdAt": "date-time",
      "createdBy": "User"
    }
  ],
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

## Error Responses

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request - Validation error
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **500**: Internal Server Error

## Real-time Features

The API includes Socket.IO integration for real-time notifications:

- Task assignment notifications
- Task status updates
- New comment notifications
- Deadline reminders

## Testing with Swagger UI

1. Open the Swagger UI at `/api-docs`
2. Click "Authorize" and enter your JWT token
3. Test endpoints directly from the interface
4. View request/response schemas
5. Try out different parameters and request bodies

## Example Usage

### 1. Register a CEO

```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John CEO",
    "email": "ceo@company.com",
    "password": "password123",
    "role": "CEO"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@company.com",
    "password": "password123"
  }'
```

### 3. Create a Task

```bash
curl -X POST http://localhost:3100/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation",
    "assignedTo": "USER_ID_HERE",
    "deadline": "2024-12-31T23:59:59.000Z"
  }'
```

## Development Notes

- The Swagger documentation is automatically generated from JSDoc comments
- All routes include comprehensive parameter validation
- Error handling is consistent across all endpoints
- The API supports CORS for frontend integration
- All timestamps are in ISO 8601 format

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the client URL is configured in `CLIENT_URL`
2. **Authentication Errors**: Check that the JWT token is valid and not expired
3. **Permission Errors**: Verify the user has the required role for the operation
4. **Validation Errors**: Check the request body against the schema requirements

### Getting Help

- Check the server logs for detailed error messages
- Use the Swagger UI to test endpoints interactively
- Verify your JWT token is valid using `/api/auth/profile`
- Ensure MongoDB is running and accessible
