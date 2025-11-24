# Setup Guide - AI CRM Feedback Frontend

## Quick Start (5 minutes)

### Step 1: Navigate to Client Directory

```bash
cd client
```

### Step 2: Install Dependencies

```bash
npm install
```

**What gets installed:**

- React 18.3.1 - Modern UI library
- Vite 5.2.11 - Lightning-fast build tool
- Tailwind CSS 3.4.1 - Utility-first CSS framework
- Axios 1.7.9 - HTTP client
- React Router DOM 6.26.1 - Client-side routing
- js-cookie 3.0.5 - Cookie management

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=AI CRM Feedback
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open browser: `http://localhost:3000`

---

## Detailed Installation Guide

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Backend server running on port 4000

### Full Setup Process

#### 1. Clone/Navigate to Project

```bash
cd c:\Project\ai-feedback-crm\client
```

#### 2. Install All Dependencies

```bash
npm install
```

This installs:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1",
    "axios": "^1.7.9",
    "js-cookie": "^3.0.5",
    "prop-types": "^15.8.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.2.11",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19"
  }
}
```

#### 3. Environment Setup

**Copy example file:**

```bash
cp .env.example .env
```

**Update .env if needed:**

```env
# API Configuration
VITE_API_URL=http://localhost:4000

# App Name
VITE_APP_NAME=AI CRM Feedback
```

#### 4. Verify Backend Connection

Before starting the frontend, ensure:

- Backend running: `npm run dev` in `/server` directory
- Port 4000 is accessible
- `.env` has correct API URL

#### 5. Start Development Server

```bash
npm run dev
```

Output should show:

```
  VITE v5.2.11  ready in 245 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

---

## Available Scripts

### Development

```bash
npm run dev
```

- Starts Vite dev server with hot reload
- Proxy configured for API calls
- Open `http://localhost:3000`

### Build for Production

```bash
npm run build
```

- Optimizes and bundles code
- Generates `dist/` folder
- Ready for deployment

### Preview Build

```bash
npm run preview
```

- Preview production build locally
- Test optimizations
- Port: 4173

### Linting (Optional)

```bash
npm run lint
```

- Check code quality
- ESLint configuration ready

---

## Project Structure Explained

```
client/
├── src/
│   ├── assets/                 # Images, SVGs, icons
│   │   ├── logo.svg
│   │   ├── mail_icon.svg
│   │   ├── lock_icon.svg
│   │   ├── person_icon.svg
│   │   ├── hand_wave.png
│   │   ├── header_img.png
│   │   └── index.js           # Export assets
│   │
│   ├── components/            # Reusable components
│   │   └── PrivateRoute.jsx   # Protected route wrapper
│   │
│   ├── context/               # Global state
│   │   └── AuthContext.jsx    # Auth state & functions
│   │
│   ├── pages/                 # Page components
│   │   ├── Home.jsx          # Landing page
│   │   ├── Register.jsx      # User registration
│   │   ├── Login.jsx         # User login
│   │   ├── VerifyEmail.jsx   # Email verification
│   │   ├── ForgotPassword.jsx # Password reset
│   │   └── Dashboard.jsx     # User dashboard
│   │
│   ├── services/             # API & external services
│   │   └── api.js           # Axios setup & endpoints
│   │
│   ├── styles/               # Stylesheets
│   │   ├── globals.css      # Tailwind & global styles
│   │   └── index.css        # CSS imports
│   │
│   ├── utils/                # Helper functions
│   │   └── validation.js    # Form validation
│   │
│   ├── constants/            # App constants
│   │   └── index.js         # Messages, routes, etc
│   │
│   ├── App.jsx              # Main app router
│   └── main.jsx             # React entry point
│
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── package.json            # Dependencies
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # Documentation
```

---

## Features Overview

### 1. Authentication System

**Files:** `pages/Login.jsx`, `pages/Register.jsx`, `context/AuthContext.jsx`

- User registration with validation
- Secure login with JWT
- Session persistence
- Logout functionality

**Usage:**

```jsx
const { user, login, logout, isAuthenticated } = useAuth();
```

### 2. Email Verification

**File:** `pages/VerifyEmail.jsx`

- 6-digit OTP input
- Resend OTP with timer
- Auto-validation

### 3. Password Reset

**File:** `pages/ForgotPassword.jsx`

- 3-step process:
  1. Email verification
  2. OTP validation
  3. New password setup

### 4. Protected Routes

**File:** `components/PrivateRoute.jsx`

- Redirects unauthenticated users
- Loading states
- Automatic route protection

### 5. Dashboard

**File:** `pages/Dashboard.jsx`

- User profile display
- Verification status
- Feature showcase

---

## API Integration

### Base URL

```
http://localhost:4000/api
```

### Endpoints Used

**Authentication:**

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/send-verify-otp` - Send OTP
- `POST /auth/verify-email` - Verify email
- `POST /auth/send-reset-otp` - Send reset OTP
- `POST /auth/reset-password` - Reset password
- `GET /auth/is-authenticated` - Check auth

**User:**

- `POST /user/get-user-data` - Fetch user info

### Example API Call

```jsx
import { authAPI } from "@/services/api";

// Register user
const response = await authAPI.register({
  name: "John",
  email: "john@example.com",
  password: "password123",
});
```

---

## Styling

### Tailwind CSS Classes Used

- `bg-gradient-to-br` - Gradient backgrounds
- `hover:` - Hover effects
- `focus-within:` - Focus states
- `rounded-lg` - Rounded corners
- `shadow-lg` - Drop shadows
- `transition` - Smooth animations

### Custom Theme

See `tailwind.config.js`:

```js
colors: {
  primary: '#4C83EE',
  success: '#22D172',
  danger: '#FF6B6B',
}
```

---

## Troubleshooting

### Issue: Port 3000 already in use

**Solution:**

```bash
npm run dev -- --port 3001
```

### Issue: API connection error

**Checklist:**

- [ ] Backend running on port 4000
- [ ] Check .env file
- [ ] Verify VITE_API_URL is correct
- [ ] Check browser console for errors

### Issue: Dependencies not installing

**Solution:**

```bash
rm -r node_modules package-lock.json
npm install
```

### Issue: Tailwind CSS not working

**Solution:**

```bash
npm run build
```

### Issue: Hot reload not working

**Solution:**

1. Clear browser cache
2. Restart dev server
3. Check Vite output

---

## Browser Compatibility

| Browser | Version | Status           |
| ------- | ------- | ---------------- |
| Chrome  | Latest  | ✅ Full support  |
| Firefox | Latest  | ✅ Full support  |
| Safari  | Latest  | ✅ Full support  |
| Edge    | Latest  | ✅ Full support  |
| IE 11   | -       | ❌ Not supported |

---

## Performance Tips

1. **Optimize Images**

   - Use WebP format
   - Compress images
   - Lazy load where possible

2. **Code Splitting**

   - React Router handles this
   - Dynamic imports ready

3. **Build Optimization**
   - Vite minifies by default
   - Source maps excluded in production
   - Tree-shaking enabled

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure .env
3. ✅ Start dev server
4. ✅ Test login/register
5. 📝 Customize branding
6. 🚀 Deploy to production

---

## Need Help?

1. Check browser console for errors
2. Review backend logs
3. Verify environment configuration
4. Check API connectivity
5. Review README.md

---

**Happy coding! 🚀**
