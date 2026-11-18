# 11 — Local Environment Setup

## Prerequisites
- Node.js LTS
- npm
- MongoDB local instance or managed MongoDB connection
- Git
- VS Code or another editor

Check versions:
```bash
node --version
npm --version
git --version
```

## Suggested repository layout
```text
banklytics/
  client/
  server/
  docs/
  .gitignore
  README.md
```

## Backend bootstrap
```bash
mkdir banklytics
cd banklytics
mkdir server
cd server
npm init -y
npm install express mongoose cors dotenv cookie-parser bcryptjs jsonwebtoken multer zod csv-parse pdfjs-dist helmet express-rate-limit
npm install -D nodemon vitest supertest
```

## Frontend bootstrap
From the repository root:
```bash
npm create vite@latest client -- --template react
cd client
npm install
npm install axios react-router-dom recharts
```

Add Tailwind using the current official installation instructions for your Vite version; its setup changes between major versions.

## Example server environment
Create `server/.env` (never commit it):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/banklytics
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
MAX_UPLOAD_MB=10
```

## Example scripts
In `server/package.json`, configure scripts such as:
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "test": "vitest run"
  }
}
```

## Git ignore
```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
uploads/
coverage/
.DS_Store
```

Do not put real statements, credentials, or production secrets in the repository. Keep sanitized parser fixtures only.
