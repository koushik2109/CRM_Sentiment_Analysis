# Server Setup

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `PORT` - Server port (default: 4000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SMTP_USER` - SMTP username (Brevo)
- `SMTP_PASS` - SMTP password (Brevo)
- `SENDER_EMAIL` - Email address to send from
- `CLIENT_URL` - Client URL for CORS (default: `http://localhost:3000`)

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```
