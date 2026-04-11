# 🫙 Chekku Oil Shop — Billing Software

A production-ready online billing system for traditional Chekku oil shops in Tamil Nadu.
Built with React + Vite + Supabase. Works offline (PWA). Supports thermal printing.

---

## Features

- Fast POS billing screen with product search (English + Tamil)
- Products: Gingely, Coconut, Groundnut, Sesame Oil, Ghee (200ml / 500ml / 1L)
- Products: Toor Dal, Nattu Sakkarai (500g / 1Kg)
- Cash / UPI / Card payment modes
- Customer name & phone tracking
- Discount per bill
- Auto-print 80mm thermal receipt (Tamil footer included)
- Bill history with daily totals
- Monthly reports & top products
- Realtime sync across devices (Supabase)
- Offline support (PWA — works without internet, syncs when back online)
- Manage product prices without any code changes

---

## Tech Stack

| Layer      | Technology            | Why                              |
|------------|-----------------------|----------------------------------|
| Frontend   | React 18 + Vite       | Fast, modern, PWA-capable        |
| Database   | Supabase (PostgreSQL) | Realtime, Auth, free tier        |
| Hosting    | Vercel                | Free, auto-deploy from GitHub    |
| Code repo  | GitHub                | Free, industry standard          |
| Printing   | react-to-print        | Browser print → thermal printer  |

---

## Step-by-Step Setup Guide

### STEP 1 — Install tools on your computer

You need Node.js installed. Download from: https://nodejs.org (choose LTS version)

After installing, open Terminal (Mac/Linux) or Command Prompt (Windows) and check:
```
node --version    # should show v18 or higher
npm --version     # should show v9 or higher
```

---

### STEP 2 — Create a free GitHub account & upload the code

1. Go to https://github.com and create a free account
2. Click the "+" button → "New repository"
3. Name it: `chekku-billing`
4. Set it to **Private** (so your business data stays safe)
5. Click "Create repository"

Upload the code:
```bash
cd chekku-billing          # go into the project folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chekku-billing.git
git push -u origin main
```

---

### STEP 3 — Create a free Supabase project (your database)

1. Go to https://supabase.com → Sign up free
2. Click "New Project"
3. Fill in:
   - **Name**: chekku-billing
   - **Database Password**: choose a strong password (save it somewhere safe!)
   - **Region**: Southeast Asia (Singapore) — closest to Tamil Nadu
4. Wait 2 minutes for the project to be created

Get your credentials:
- Go to your project → **Settings** → **API**
- Copy the **Project URL** (looks like: https://abcxyz.supabase.co)
- Copy the **anon / public** key

---

### STEP 4 — Set up the database

1. In Supabase dashboard → click **SQL Editor** → click **New Query**
2. Open the file `supabase/schema.sql` from this project
3. Copy ALL the contents and paste into the SQL editor
4. Click **Run** (green button)
5. You should see "Success" — your tables and products are now created!

Verify: Click **Table Editor** in the sidebar → you should see: products, bills, bill_items, customers

---

### STEP 5 — Create your login account

1. In Supabase → go to **Authentication** → **Users** → **Add User**
2. Enter your email and a strong password
3. Click "Create User"
4. This is the email/password you'll use to log in to the billing app

---

### STEP 6 — Configure your shop details

1. In the project folder, copy `.env.example` to a new file called `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and fill in your details:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   VITE_SHOP_NAME=Your Shop Name Here
   VITE_SHOP_ADDRESS=Your Address, City, Tamil Nadu - PIN
   VITE_SHOP_PHONE=+91 XXXXX XXXXX
   VITE_SHOP_GST=GSTIN: XXXXXXXXXXXXX
   ```

---

### STEP 7 — Test it locally on your computer

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and go to: http://localhost:3000

Log in with the email/password you created in Step 5.
Try creating a bill and saving it — check Supabase Table Editor to see it saved!

---

### STEP 8 — Deploy to Vercel (make it live online)

1. Go to https://vercel.com → Sign up with your GitHub account
2. Click **"Add New Project"**
3. Select your `chekku-billing` repository
4. Vercel auto-detects Vite — no build settings needed
5. Before clicking Deploy, click **"Environment Variables"** and add:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
   - `VITE_SHOP_NAME` → your shop name
   - `VITE_SHOP_ADDRESS` → your address
   - `VITE_SHOP_PHONE` → your phone
   - `VITE_SHOP_GST` → your GST number
6. Click **Deploy**
7. In ~2 minutes, you get a live URL like: `https://chekku-billing.vercel.app`

---

### STEP 9 — Set up your thermal printer

**Recommended printer**: Xprinter XP-58 (₹2,500–₹3,000 on Amazon India)
- 80mm paper width
- Bluetooth + USB
- No ink needed (thermal paper)

**To print from the browser:**
1. Connect the printer to your computer/tablet via USB or Bluetooth
2. Install the printer driver (comes in the box)
3. In your system Printer Settings → set it as the default printer
4. In the billing app → after saving a bill, the print dialog opens automatically
5. Select the Xprinter and click Print

**For tablet use (Android)**:
- Use Chrome browser → connect printer via Bluetooth
- Go to Chrome Settings → enable "Print Preview"
- The print receipt is pre-formatted for 80mm paper

---

### STEP 10 — Access from any device

Your billing app is now live at your Vercel URL.

**From shop counter (tablet/computer)**:
- Open the URL in Chrome
- Log in once — browser remembers you
- Bookmark it or Add to Home Screen

**Add to Home Screen (makes it feel like an app)**:
- On Android: Chrome → menu (⋮) → "Add to Home Screen"
- On iPad: Safari → Share → "Add to Home Screen"
- On Windows: Chrome → menu → "Install Chekku Oil Billing"

---

## Updating Prices

No coding needed! Just:
1. Log in to the billing app
2. Go to **Products** page in the sidebar
3. Enter the new price next to any product
4. Click **Save** — price updates immediately across all devices

---

## Daily Use Workflow

1. Open the app on your tablet/computer at the shop counter
2. **New Bill** page → search or tap products → tap size (200ml, 500ml, 1L)
3. Enter customer name + phone (optional but useful for loyalty tracking)
4. Choose Cash / UPI / Card
5. Click **Save & Print** → receipt prints automatically
6. End of day → check **Bill History** for the day's total
7. Monthly → check **Reports** for product-wise revenue

---

## Backup & Data Safety

Your data lives in Supabase (PostgreSQL) — a proper database, not a spreadsheet.

**Free tier**: Supabase keeps your data safe, no automatic backup.
Manual backup (do this monthly):
1. Supabase → your project → **Database** → **Backups** → Download

**Paid tier ($25/month)**: Automatic daily backups, point-in-time recovery. Recommended once you have 6+ months of billing data.

---

## Folder Structure

```
chekku-billing/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx      ← Navigation sidebar
│   │   ├── Receipt.jsx      ← Thermal print receipt
│   │   └── Toast.jsx        ← Notification popups
│   ├── pages/
│   │   ├── Billing.jsx      ← Main POS billing screen
│   │   ├── History.jsx      ← View past bills
│   │   ├── Products.jsx     ← Manage product prices
│   │   └── Reports.jsx      ← Monthly sales reports
│   ├── hooks/
│   │   ├── useAuth.js       ← Login state
│   │   └── useProducts.js   ← Product data with realtime
│   ├── lib/
│   │   └── supabase.js      ← All database functions
│   ├── App.jsx              ← Main app with routing
│   ├── main.jsx             ← React entry point
│   └── index.css            ← All styles
├── supabase/
│   └── schema.sql           ← Database setup (run once)
├── public/
│   └── favicon.svg
├── .env.example             ← Copy to .env and fill in
├── index.html
├── vite.config.js
└── package.json
```

---

## Common Issues & Fixes

**"Missing Supabase environment variables" error**
→ Make sure you created `.env` file (not just `.env.example`) and filled in the values.

**Login not working**
→ Check Supabase → Authentication → Users — make sure your email is there and confirmed.

**Products not showing**
→ Go to Supabase → Table Editor → products → confirm rows exist. If empty, re-run the seed part of schema.sql.

**Print not working**
→ Make sure the thermal printer is set as the default printer in your OS settings.

**App not loading after deployment**
→ Check Vercel → your project → Settings → Environment Variables are all filled in correctly.

---

## Support & Future Upgrades

Possible future features to add:
- WhatsApp receipt sharing
- Stock/inventory tracking
- Multiple user accounts (owner + staff)
- Daily expense tracking
- Customer loyalty / points system
- GST invoice with detailed breakdown

To get help, open an issue on your GitHub repository or contact a local web developer.
