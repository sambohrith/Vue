# IMS Backend - C# .NET 10

This is the C# .NET 10 backend for the Information Management System (IMS).

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Full CRUD operations for users with admin controls
- **Chat System**: Private messaging between users with read receipts
- **Social Features**: Posts, likes, and comments
- **Rooms**: Public and private chat rooms
- **System Settings**: Configurable system parameters
- **Database Support**: SQLite (default), MySQL, PostgreSQL, SQL Server
- **Password Encryption**: MD5 hashing

## Requirements

- .NET 10.0 SDK
- Database (SQLite included by default)

## Project Structure

```
backend-C#/
├── Controllers/          # API Controllers
├── Data/                # Database Context and Initializer
├── DTOs/                # Data Transfer Objects
│   ├── Requests/        # Request DTOs
│   └── Responses/       # Response DTOs
├── Middleware/          # Custom Middleware
├── Models/              # Entity Models
├── Services/            # Business Logic Services
├── appsettings.json     # Configuration
├── Program.cs           # Application Entry Point
└── IMS.csproj           # Project File
```

## Getting Started

### 1. Install .NET 10 SDK

Download and install from: https://dotnet.microsoft.com/download/dotnet/10.0

### 2. Run the Application

```bash
cd backend-C#
dotnet restore
dotnet run
```

The API will be available at:
- HTTP: http://localhost:3001
- API Documentation: http://localhost:3001/swagger

### 3. Default Admin Account

- Username: `admin`
- Password: `admin123`
- Email: `admin@ims.com`

## Configuration

Edit `appsettings.json` to configure:

### Database

```json
"Database": {
  "Driver": "sqlite",  // Options: sqlite, mysql, postgresql, sqlserver
  ...
}
```

### JWT

```json
"JWT": {
  "Secret": "your-secret-key",
  "Expiration": "24h"
}
```

### Server

```json
"Server": {
  "Port": 3001,
  "AllowedOrigins": ["http://localhost:5173"]
}
```

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Protected Endpoints

#### Authentication
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

#### Users (Admin)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `PATCH /api/users/{id}/toggle` - Toggle user status
- `GET /api/users/stats` - User statistics

#### Profile
- `GET /api/profile` - Get my profile
- `PUT /api/profile` - Update my profile
- `GET /api/users/me` - Get my info (alternate)
- `PUT /api/users/me` - Update my info (alternate)

#### Contacts
- `GET /api/contacts` - Get all contacts
- `GET /api/users/contacts` - Get all contacts (alternate)

#### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics

#### Chat
- `GET /api/chat/list` - Get chat list
- `GET /api/chat/history/{userId}` - Get chat history
- `POST /api/chat/send` - Send message
- `PUT /api/chat/read/{userId}` - Mark as read
- `GET /api/chat/unread` - Get unread count
- `GET /api/chat/admin/messages` - Get all messages (Admin)
- `GET /api/chat/admin/conversations` - Get all conversations (Admin)

#### Social (Posts)
- `GET /api/social/posts` - Get posts
- `POST /api/social/posts` - Create post
- `DELETE /api/social/posts/{id}` - Delete post
- `POST /api/social/posts/{id}/like` - Toggle like
- `POST /api/social/posts/{id}/comment` - Add comment
- `GET /api/social/posts/{id}/comments` - Get comments

#### Rooms
- `GET /api/social/rooms/public` - Get public rooms
- `GET /api/social/rooms/my` - Get my rooms
- `GET /api/social/rooms/{id}` - Get room
- `POST /api/social/rooms` - Create room
- `DELETE /api/social/rooms/{id}` - Delete room
- `POST /api/social/rooms/{id}/join` - Join room
- `POST /api/social/rooms/{id}/leave` - Leave room
- `GET /api/social/rooms/{id}/members` - Get room members
- `GET /api/social/rooms/{id}/messages` - Get room messages
- `POST /api/social/rooms/{id}/messages` - Send room message

#### System (Admin)
- `GET /api/system/settings` - Get settings
- `PUT /api/system/settings` - Update settings
- `POST /api/system/backup` - Backup database

## Migration Guide from Go Backend

The C# backend maintains API compatibility with the original Go backend:

1. Same route structure (`/api/*`)
2. Same response format (`{ success, message, data }`)
3. Same authentication (JWT Bearer token)
4. Same database schema

## Development

### Add Migration

```bash
dotnet ef migrations add InitialCreate
```

### Update Database

```bash
dotnet ef database update
```

### Build

```bash
dotnet build
```

### Test

```bash
dotnet test
```

## License

MIT
