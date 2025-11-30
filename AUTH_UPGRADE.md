# Authentication & Authorization Upgrade

## Overview
This upgrade adds comprehensive user management with role-based access control (RBAC) and bucket-level permissions to the Garage WebUI.

## Features

### 1. User Management
- **Create Users**: Admin can create new user accounts with username, password, and role
- **Edit Users**: Admin can update user details, change passwords, and modify permissions
- **Delete Users**: Admin can remove users (with protection for last admin)
- **User Roles**: Two roles available - Admin and User
  - **Admin**: Full access to all features and buckets
  - **User**: Limited access based on assigned bucket permissions

### 2. Role-Based Access Control
- **Admin Role**: 
  - Full system access
  - Can manage users
  - Can access all buckets regardless of permissions
  - Can view cluster and keys
  
- **User Role**:
  - Limited to assigned buckets only
  - Cannot access user management
  - Cannot create/delete keys (only view assigned)
  - Can browse and manage only permitted buckets

### 3. Bucket Permissions
- Fine-grained bucket access control
- Admin can assign specific buckets to users
- Users only see buckets they have permission for
- Permission validation on backend for security

### 4. Session Management
- Secure session-based authentication
- User information stored in session
- Automatic logout on unauthorized access
- Session persistence across page refreshes

## Backend Changes

### New Files
- `backend/schema/user.go` - User data structures and types
- `backend/utils/users.go` - User store and management logic
- `backend/router/users.go` - User management API endpoints

### Modified Files
- `backend/router/auth.go` - Updated login to use user store
- `backend/middleware/auth.go` - Added role and permission checking
- `backend/router/router.go` - Added user routes and permission middleware
- `backend/router/buckets.go` - Added bucket filtering by permissions
- `backend/main.go` - Initialize user store on startup

### API Endpoints

#### User Management (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Get auth status and current user

## Frontend Changes

### New Pages
- `src/pages/users/page.tsx` - User management page with table and dialogs

### New Components
- `src/pages/users/components/create-user-dialog.tsx` - Create user dialog
- `src/pages/users/components/edit-user-dialog.tsx` - Edit user dialog

### New Files
- `src/pages/users/schema.ts` - User validation schemas
- `src/pages/users/types.ts` - User TypeScript types
- `src/pages/users/hooks.ts` - User API hooks

### Modified Files
- `src/hooks/useAuth.ts` - Added user and role information
- `src/components/containers/sidebar.tsx` - Added Users menu for admin
- `src/app/router.tsx` - Added users route
- `src/components/ui/input.tsx` - Added SelectField component
- `src/components/ui/checkbox.tsx` - Enhanced CheckboxField for arrays

## Data Storage

### User Data
User information is stored in `users.json` file in the backend directory with the following structure:

```json
[
  {
    "id": "unique-user-id",
    "username": "admin",
    "password_hash": "bcrypt-hashed-password",
    "role": "admin",
    "created_at": "2025-11-30T...",
    "updated_at": "2025-11-30T...",
    "bucket_permissions": []
  }
]
```

### Default Admin Account
On first startup, a default admin account is created:
- **Username**: `admin`
- **Password**: Set via `ADMIN_PASSWORD` environment variable (default: `admin`)

**⚠️ IMPORTANT**: Change the default admin password immediately after first login!

## Environment Variables

### New Variables
- `ADMIN_PASSWORD` - Password for default admin account (default: "admin")

### Deprecated Variables
- `AUTH_USER_PASS` - No longer used (replaced by user store)

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Session Security**: Server-side session management with secure cookies
3. **Role Validation**: Backend validates user role for protected routes
4. **Permission Checking**: Bucket access verified on every request
5. **CSRF Protection**: Built-in with session management
6. **Admin Protection**: Cannot delete last admin user

## Migration Guide

### For Existing Installations

1. **Backup Your Data**: 
   ```bash
   cp -r backend/ backend_backup/
   ```

2. **Set Admin Password** (before starting):
   ```bash
   export ADMIN_PASSWORD="your-secure-password"
   ```

3. **Start the Application**:
   The system will automatically create the default admin user on first run.

4. **Login with Admin**:
   - Username: `admin`
   - Password: Your `ADMIN_PASSWORD`

5. **Create Users**:
   - Navigate to Users page (admin only)
   - Create user accounts
   - Assign bucket permissions

6. **Remove Old Auth** (optional):
   - Remove `AUTH_USER_PASS` from environment variables

## Usage Examples

### Creating a User
1. Login as admin
2. Navigate to Users page
3. Click "Create User"
4. Fill in username, password, role
5. Select bucket permissions (if user role)
6. Click "Create User"

### Managing Bucket Permissions
1. Edit an existing user
2. In the Bucket Permissions section, check/uncheck buckets
3. Click "Update User"
4. User will only see and access selected buckets

### Testing Permissions
1. Create a test user with limited bucket access
2. Logout from admin account
3. Login with test user
4. Verify only permitted buckets are visible
5. Try accessing Users page (should be hidden/forbidden)

## Best Practices

1. **Always use strong passwords** for admin accounts
2. **Follow principle of least privilege** - give users only necessary permissions
3. **Regularly review user access** and remove inactive accounts
4. **Keep at least 2 admin accounts** to prevent lockout
5. **Change default admin password immediately** after installation

## Troubleshooting

### Cannot Login
- Check `users.json` file exists in backend directory
- Verify `ADMIN_PASSWORD` environment variable is set
- Check backend logs for authentication errors

### Permission Denied
- Verify user role (admin vs user)
- Check bucket permissions for the user
- Ensure bucket names match exactly

### Users.json Not Found
- File is created automatically on first run
- Ensure backend has write permissions to directory
- Check backend logs for initialization errors

## Future Enhancements

Potential future improvements:
- LDAP/OAuth integration
- Group-based permissions
- Audit logging for user actions
- Password reset functionality
- Multi-factor authentication
- API key authentication
- User activity monitoring
