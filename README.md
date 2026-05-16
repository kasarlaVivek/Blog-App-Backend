# Blog Application Backend

This project serves as the robust backend for a multi-user blog application, providing specialized APIs for users, authors, and administrators. It handles authentication, article management, media uploads, and secure data persistence.

## Technology Stack

- Node.js: JavaScript runtime environment.
- Express.js: Web application framework for building APIs.
- MongoDB: NoSQL database for data storage.
- Mongoose: ODM (Object Data Modeling) library for MongoDB.
- JSON Web Token (JWT): Used for secure authentication and authorization.
- Cloudinary: Cloud-based service for image and video management.
- Multer: Middleware for handling multi-part/form-data, primarily used for uploading files.
- Bcryptjs: Library for hashing passwords.
- Cookie-parser: Middleware to parse cookies attached to the client request.

## Project Flow

The application follows a structured data flow to ensure security and scalability:

1. Initialization:
   - The server starts via server.js.
   - It establishes a connection to the MongoDB database using the URI provided in the environment variables.
   - Global middlewares like CORS, express.json, and cookie-parser are initialized to handle cross-origin requests, JSON parsing, and authentication tokens respectively.

2. Routing:
   - Incoming requests are routed based on their path prefixes:
     - /user-api: Handles operations related to general users (viewing articles, comments).
     - /author-api: Handles operations for content creators (creating, editing, deleting articles).
     - /admin-api: Handles administrative tasks and user management.
     - /common-api: Provides shared functionality like authentication and registration.

3. Authentication and Authorization:
   - During login, the server verifies credentials and generates a JWT.
   - The JWT is sent to the client as a secure HTTP-only cookie.
   - Subsequent requests are validated by checking the JWT to ensure the user has the correct permissions for the requested resource.

4. Media Management:
   - When an author uploads an image for an article, Multer processes the file.
   - The image is then uploaded to Cloudinary for optimized storage and delivery.
   - The resulting URL is stored in the MongoDB document for the article.

5. Database Interaction:
   - Business logic interacts with Mongoose models (User, Article, etc.) to perform CRUD operations.
   - Schema validation ensures data integrity before persistence.

6. Error Handling:
   - A centralized error-handling middleware catches exceptions from all routes.
   - It provides descriptive responses for common issues like validation failures, duplicate keys, or server errors.

## Development Setup

Follow these steps to set up the backend environment locally:

### Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB account or local installation
- Cloudinary account for media storage

### Installation

1. Clone the repository to your local machine.
2. Navigate to the project directory:
   cd Blog-App-Backend
3. Install the required dependencies:
   npm install

### Configuration

Create a .env file in the root directory and populate it with the following environment variables:

DB_URL=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_secret_key
CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=your_frontend_url (optional, defaults to localhost)

### Running the Server

To start the server in development mode, run:
node server.js

The server will listen on the port specified in your .env file (default is 3000). You should see a message indicating that the database is connected and the server is listening.

## API Endpoints Overview

- User API: Registration, Login, Profile Management.
- Article API: Create, Read, Update, Delete articles (Role-based).
- Media: Image uploads via Cloudinary integration.
- Health Check: GET /health to verify server status.
