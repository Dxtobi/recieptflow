# ReceiptFlow

Create and share professional receipts in seconds. Free receipt generator for small businesses, freelancers, online vendors, and WhatsApp sellers.

## Features

- Generate branded receipts with 4 templates (classic, modern, minimal, thermal)
- Calculate discounts, taxes, and shipping automatically
- Export to PDF/PNG or share via WhatsApp
- Customer & product database
- Dashboard analytics with sales tracking
- Guest mode (no sign-up required)
- Mobile app (Android via Capacitor)

## Run Locally

**Prerequisites:** Node.js, MongoDB

1. Install dependencies: `npm install`
2. Set `MONGODB_URI` in `.env.local` (e.g. `mongodb://localhost:27017/receiptflow`)
3. Run the app: `npm run dev`

## Deploy

Push to GitHub and deploy on Render as a Web Service:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Env Vars:** `MONGODB_URI`, `NODE_ENV=production`
