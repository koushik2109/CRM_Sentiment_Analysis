# 🚀 QUICK START REFERENCE

## Installation & Running

```bash
# Navigate to client folder
cd client

# Install dependencies (already done ✅)
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

---

## File Structure at a Glance

```
client/
├── src/
│   ├── pages/          # All page components
│   │   ├── Home.jsx              (/)
│   │   ├── Register.jsx          (/register)
│   │   ├── Login.jsx             (/login)
│   │   ├── VerifyEmail.jsx       (/verify-email)
│   │   ├── ForgotPassword.jsx    (/forgot-password)
│   │   └── Dashboard.jsx         (/dashboard) [Protected]
│   │
│   ├── components/     # Reusable components
│   │   └── PrivateRoute.jsx      (Route protection)
│   │
│   ├── context/        # State management
│   │   └── AuthContext.jsx       (Auth state & functions)
│   │
│   ├── services/       # API calls
│   │   └── api.js                (Axios setup)
│   │
│   ├── utils/          # Helpers
│   │   └── validation.js         (Form validation)
│   │
│   ├── constants/      # App constants
│   │   └── index.js              (Routes, messages, etc)
│   │
│   ├── styles/         # Stylesheets
│   │   ├── globals.css           (Tailwind + globals)
│   │   └── index.css             (CSS imports)
│   │
│   ├── assets/         # Images & icons
│   │   ├── logo.svg
│   │   ├── mail_icon.svg
│   │   └── ... (other assets)
│   │
│   ├── App.jsx         # Main router
│   └── main.jsx        # Entry point
│
├── index.html          # HTML template
├── package.json        # Dependencies ✅
├── vite.config.js      # Build config
├── tailwind.config.js  # Styling config
└── .env               # Environment variables
```

---

## Key Files to Know

| File                      | Purpose         | When to Edit      |
| ------------------------- | --------------- | ----------------- |
| `App.jsx`                 | Main router     | Add new routes    |
| `context/AuthContext.jsx` | Auth state      | Modify auth logic |
| `services/api.js`         | API endpoints   | Add new API calls |
| `tailwind.config.js`      | Colors/theme    | Change branding   |
| `pages/*`                 | Page components | Customize pages   |
| `.env`                    | Environment     | Update API URL    |

---

## Routes Available

| Route              | Page           | Status       |
| ------------------ | -------------- | ------------ |
| `/`                | Home           | Public       |
| `/register`        | Registration   | Public       |
| `/login`           | Login          | Public       |
| `/verify-email`    | Email OTP      | Public       |
| `/forgot-password` | Password Reset | Public       |
| `/dashboard`       | User Dashboard | Protected ✅ |

---

## NPM Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint code (ready to configure)
```

---

## Authentication Flow

```
1. HOME (/home)
   ↓
2. REGISTER (/register)
   ↓
3. VERIFY EMAIL (/verify-email)
   ↓
4. LOGIN (/login)
   ↓
5. DASHBOARD (/dashboard) ✅ Protected
   ↓
6. LOGOUT (/login)
```

---

## Environment Variables

```env
# File: .env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=AI CRM Feedback

# Access in code:
import.meta.env.VITE_API_URL
```

---

## Using Context (Auth)

```jsx
import { useAuth } from "@/context/AuthContext";

export default function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // user = { userId, name, email, isAccountVerified }
  // isAuthenticated = boolean
  // login(email, password) = async function
  // logout() = async function
}
```

---

## Using API

```jsx
import { authAPI, userAPI } from "@/services/api";

// Example: Login
const response = await authAPI.login({
  email: "test@example.com",
  password: "password123",
});

// Example: Get User Data
const userData = await userAPI.getUserData(userId);
```

---

## Form Validation

```jsx
import { validateRegisterForm, isValidEmail } from "@/utils/validation";

// Validate entire form
const errors = validateRegisterForm(formData);

// Check individual field
if (isValidEmail(email)) {
  // Valid email
}
```

---

## Add New Page

1. Create `/src/pages/NewPage.jsx`:

```jsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

2. Add route in `/src/App.jsx`:

```jsx
<Route path="/new-page" element={<NewPage />} />
```

3. Navigate to `/new-page`

---

## Add New Component

1. Create `/src/components/NewComponent.jsx`:

```jsx
export default function NewComponent() {
  return <div>Component</div>;
}
```

2. Import in page:

```jsx
import NewComponent from "@/components/NewComponent";
```

---

## Add New API Endpoint

1. Update `/src/services/api.js`:

```jsx
export const myAPI = {
  myFunction: (data) => api.post("/endpoint", data),
};
```

2. Use in component:

```jsx
import { myAPI } from "@/services/api";

const response = await myAPI.myFunction(data);
```

---

## Styling with Tailwind

### Basic Classes

```jsx
// Colors
<div className="text-blue-600">Blue text</div>
<div className="bg-gray-100">Gray background</div>

// Layout
<div className="flex gap-4">Column layout</div>
<div className="grid grid-cols-3">3 columns</div>

// Responsive
<div className="md:text-lg lg:text-xl">Responsive text</div>

// Hover & Focus
<button className="hover:bg-blue-700 focus:ring-2">Button</button>
```

### Custom Theme Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#4C83EE',
      success: '#22D172',
    }
  }
}
```

---

## Debug Tips

### Check Authentication

```jsx
const { isAuthenticated, loading } = useAuth();
console.log("Auth:", isAuthenticated, loading);
```

### Check API Response

```jsx
try {
  const res = await authAPI.login(data);
  console.log("Response:", res);
} catch (err) {
  console.error("Error:", err.response?.data);
}
```

### Check Environment

```jsx
console.log("API URL:", import.meta.env.VITE_API_URL);
```

### Browser DevTools

- **Network tab**: Check API requests
- **Console**: See errors & logs
- **React DevTools**: Inspect components
- **Storage**: Check cookies & localStorage

---

## Deployment

### Build for Production

```bash
npm run build
```

Creates optimized `dist/` folder

### Deploy Steps

1. Run build command
2. Upload `dist/` folder to hosting
3. Configure API URL for production
4. Set environment variables
5. Test all flows

### Hosting Options

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- DigitalOcean
- Heroku

---

## Common Commands

```bash
# Start dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Install specific package
npm install package-name

# Remove package
npm uninstall package-name

# Check for vulnerabilities
npm audit

# Update packages
npm update
```

---

## Keyboard Shortcuts in Dev

| Shortcut | Action         |
| -------- | -------------- |
| `H`      | Show Vite help |
| `R`      | Restart server |
| `Q`      | Quit server    |

---

## Important: Before Deploying

- [ ] Build successfully: `npm run build`
- [ ] No console errors
- [ ] All routes working
- [ ] API endpoints correct
- [ ] Environment variables set
- [ ] Security features enabled
- [ ] Responsive on mobile
- [ ] Form validation working
- [ ] Error handling in place
- [ ] Documentation updated

---

## Need Help?

1. **Check Documentation**: `README.md`, `SETUP_GUIDE.md`
2. **Check Errors**: Browser console (F12)
3. **Check Network**: Network tab for API calls
4. **Check Backend**: Ensure server is running
5. **Check Config**: Verify `.env` file

---

## Quick Links

- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Tailwind Docs**: https://tailwindcss.com
- **Axios Docs**: https://axios-http.com
- **React Router**: https://reactrouter.com

---

**Happy Coding! 🚀**

_For detailed info, see SETUP_GUIDE.md or FRONTEND_COMPLETE.md_
