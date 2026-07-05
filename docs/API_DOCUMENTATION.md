/**
 * API Documentation - Authentication & Clothing Management
 */

# API Documentation

## Authentication

### Register User
```bash
POST /api/auth/register

Body:
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### Login
```bash
POST /api/auth/login

Body:
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

### Refresh Token
```bash
POST /api/auth/refresh

Body:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGc..."
}
```

### Logout
```bash
POST /api/auth/logout

Response (200):
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Clothing Management

### Upload Clothing Image
```bash
POST /api/upload
Headers: Authorization: Bearer <accessToken>
Body: FormData with file

Response (200):
{
  "success": true,
  "data": {
    "public_id": "uploads/user-id/abc123",
    "url": "https://res.cloudinary.com/...",
    "secure_url": "https://res.cloudinary.com/...",
    "width": 1000,
    "height": 800,
    "format": "jpg"
  }
}
```

### Create Clothing Item
```bash
POST /api/clothing
Headers: Authorization: Bearer <accessToken>

Body:
{
  "name": "Blue T-Shirt",
  "description": "Classic blue cotton t-shirt",
  "type": "shirt",
  "color": "blue",
  "size": "M",
  "price": 29.99,
  "imagePublicId": "uploads/user-id/abc123",
  "imageUrl": "https://res.cloudinary.com/..."
}

Response (201):
{
  "success": true,
  "message": "Clothing item created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Blue T-Shirt",
    "description": "Classic blue cotton t-shirt",
    "type": "shirt",
    "color": "blue",
    "size": "M",
    "price": 29.99,
    "image_public_id": "uploads/user-id/abc123",
    "image_url": "https://res.cloudinary.com/...",
    "created_at": "2026-07-05T12:00:00Z",
    "updated_at": "2026-07-05T12:00:00Z"
  }
}
```

### Get All Clothing Items
```bash
GET /api/clothing/get
Headers: Authorization: Bearer <accessToken>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Blue T-Shirt",
      "type": "shirt",
      "color": "blue",
      "size": "M",
      "price": 29.99,
      "image_url": "https://res.cloudinary.com/...",
      "created_at": "2026-07-05T12:00:00Z"
    },
    // ... more items
  ]
}
```

### Get Single Clothing Item
```bash
GET /api/clothing/get?id=550e8400-e29b-41d4-a716-446655440000
Headers: Authorization: Bearer <accessToken>

Response (200):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Blue T-Shirt",
    "type": "shirt",
    "color": "blue",
    "size": "M",
    "price": 29.99,
    "image_url": "https://res.cloudinary.com/...",
    "created_at": "2026-07-05T12:00:00Z"
  }
}
```

### Update Clothing Item
```bash
PUT /api/clothing/update
Headers: Authorization: Bearer <accessToken>

Body:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "price": 24.99,
  "description": "Updated description"
}

Response (200):
{
  "success": true,
  "message": "Clothing item updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Blue T-Shirt",
    "price": 24.99,
    "description": "Updated description",
    "updated_at": "2026-07-05T13:30:00Z"
  }
}
```

### Delete Clothing Item
```bash
DELETE /api/clothing/delete?id=550e8400-e29b-41d4-a716-446655440000
Headers: Authorization: Bearer <accessToken>

Response (200):
{
  "success": true,
  "message": "Clothing item deleted successfully"
}
```

---

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### Bad Request (400)
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Clothing item not found"
}
```

### Conflict (409)
```json
{
  "success": false,
  "error": "Email or username already exists"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Flow Example: Register & Add Clothing

### Step 1: Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "designer@example.com",
    "username": "fashiondesigner",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

### Step 2: Upload Clothing Image
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@clothing.jpg"
```

### Step 3: Create Clothing Item
```bash
curl -X POST http://localhost:3000/api/clothing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "Blue T-Shirt",
    "type": "shirt",
    "color": "blue",
    "size": "M",
    "price": 29.99,
    "imagePublicId": "uploads/user-id/abc123",
    "imageUrl": "https://res.cloudinary.com/..."
  }'
```

### Step 4: Get All Items
```bash
curl -X GET http://localhost:3000/api/clothing/get \
  -H "Authorization: Bearer <accessToken>"
```
