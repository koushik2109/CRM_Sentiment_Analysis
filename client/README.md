# AI CRM Feedback - Frontend

A modern, production-ready React frontend for the AI CRM Feedback system with authentication, email verification, and password reset capabilities.

## Features

✅ **User Authentication**

- Secure login and registration
- JWT-based session management
- Password encryption

✅ **Email Verification**

- OTP-based email verification
- Automated email sending
- Resend OTP functionality

✅ **Password Management**

- Secure password reset via OTP
- Email confirmation
- Password strength validation

✅ **Modern UI/UX**

- Responsive design with Tailwind CSS
- Smooth animations and transitions
- Mobile-friendly interface

✅ **Best Practices**

- React 18+ with hooks
- Context API for state management
- Axios for API calls
- Vite for fast development

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── PrivateRoute.jsx        # Route protection component
│   ├── context/
│   │   └── AuthContext.jsx         # Authentication context
│   ├── pages/
│   │   ├── Home.jsx                # Landing page
│   │   ├── Register.jsx            # Registration page
│   │   ├── Login.jsx               # Login page
│   │   ├── VerifyEmail.jsx         # Email verification
│   │   ├── ForgotPassword.jsx      # Password reset
│   │   └── Dashboard.jsx           # User dashboard
│   ├── services/
│   │   └── api.js                  # API service configuration
│   ├── assets/
│   │   ├── logo.svg
│   │   ├── mail_icon.svg
│   │   ├── lock_icon.svg
│   │   ├── person_icon.svg
│   │   ├── hand_wave.png
│   │   └── header_img.png
│   ├── styles/
│   │   ├── globals.css             # Global styles
│   │   └── index.css               # Tailwind imports
│   ├── App.jsx                     # Main App component
│   └── main.jsx                    # React entry point
├── index.html                       # HTML template
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
├── package.json                    # Dependencies
└── .env.example                    # Environment variables template
```

## Installation

### 1. Navigate to client directory

```bash
cd client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` and update if needed:

```
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=AI CRM Feedback
```

## Development

### Start development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Technology Stack

### Frontend Framework

- **React 18.3.1** - UI library
- **Vite 5.2.11** - Build tool

### Styling

- **Tailwind CSS 3.4.1** - Utility-first CSS
- **PostCSS 8.4.38** - CSS processing
- **Autoprefixer 10.4.19** - Vendor prefixes

### HTTP Client

- **Axios 1.7.9** - HTTP requests
- **js-cookie 3.0.5** - Cookie management

### Routing & State

- **React Router DOM 6.26.1** - Client-side routing
- **Context API** - State management

### Utilities

- **PropTypes 15.8.1** - Type checking

## API Endpoints Integration

The frontend connects to these backend endpoints:

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/send-verify-otp` - Send verification OTP
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/send-reset-otp` - Send password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/is-authenticated` - Check auth status

### User

- `POST /api/user/get-user-data` - Get user information

## Component Shortcuts

Each authentication handler has a dedicated component:

| Handler            | Component            | Route              |
| ------------------ | -------------------- | ------------------ |
| Register           | `Register.jsx`       | `/register`        |
| Login              | `Login.jsx`          | `/login`           |
| Email Verification | `VerifyEmail.jsx`    | `/verify-email`    |
| Forgot Password    | `ForgotPassword.jsx` | `/forgot-password` |
| Dashboard          | `Dashboard.jsx`      | `/dashboard`       |
| Home               | `Home.jsx`           | `/`                |

## Features Implemented

### 1. **User Registration**

- Form validation
- Password strength indicators
- Secure password hashing on backend
- Automatic email verification after registration

### 2. **User Login**

- Email and password validation
- JWT token management
- Remember me functionality
- Password visibility toggle

### 3. **Email Verification**

- OTP input with 6-digit format
- Auto-focus handling
- Resend OTP with cooldown timer
- Email confirmation

### 4. **Password Reset**

- 3-step password reset process
- Email verification
- OTP validation
- Secure password update

### 5. **Dashboard**

- User profile information
- Account verification status
- Welcome message
- Feature cards
- Quick access to main features

### 6. **Authentication Context**

- Global authentication state
- User data management
- Loading states
- Protected routes

## Security Features

✅ **HTTP Only Cookies** - Secure token storage
✅ **CORS Configuration** - Protected API access
✅ **JWT Authentication** - Secure token-based auth
✅ **Password Hashing** - bcryptjs on backend
✅ **OTP Verification** - Email-based verification
✅ **HTTPS Ready** - Production-ready security

## Environment Configuration

### Development

- API URL: `http://localhost:4000`
- Port: `3000`
- Proxy: Configured for API calls

### Production

- Update `VITE_API_URL` to production API
- Build optimizations enabled
- Source maps excluded

## Performance Optimizations

- Code splitting with React.lazy()
- Image optimization
- CSS minification with Tailwind
- JavaScript bundling with Vite
- Fast refresh during development

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port 3000 already in use

```bash
npm run dev -- --port 3001
```

### API Connection Issues

- Check if backend server is running on port 4000
- Verify `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### Build Issues

```bash
npm run build
```

## Contributing

Guidelines for contributing:

1. Follow the existing code structure
2. Use functional components with hooks
3. Maintain consistent styling with Tailwind
4. Add prop validation with PropTypes
5. Test on multiple devices

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:

1. Check existing documentation
2. Review error messages in console
3. Verify backend connectivity
4. Check environment configuration

---

**Built with ❤️ for the AI CRM Feedback System**
