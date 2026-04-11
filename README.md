# 🫙 Chekku Oil Shop — Billing Software

Production-ready billing system for traditional Chekku oil shops in Tamil Nadu.
Built with React + Vite + Supabase. Works offline (PWA). Supports thermal printing.

---

## Hosting on GitHub Pages (Free)

### Important notes about GitHub Pages
- GitHub Pages is **static hosting** — it serves files, not a server
- Your Supabase credentials are injected at **build time** via GitHub Secrets (never visible in code)
- Your live URL will be: `https://YOUR_USERNAME.github.io/chekku-billing/`
- Every push to the `main` branch auto-deploys in ~2 minutes

---

## Complete Setup — Step by Step

### STEP 1 — Install Node.js
Download from https://nodejs.org (choose LTS). Verify:
```
node --version   # should show v18 or higher
npm --version
```

### STEP 2 — Create GitHub account & repository
1. Go to https://github.com → Sign up free
2. Click "+" → "New repository"
3. Name it exactly: `chekku-billing`
4. Set to **Private** (your credentials stay safe)
5. Click "Create repository"

### STEP 3 — Upload code to GitHub
Extract the zip, open terminal in the folder:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chekku-billing.git
git push -u origin main
```

### STEP 4 — Create Supabase project
1. Go to https://supabase.com → Sign up free
2. New Project → Name: `chekku-billing` → Region: **Southeast Asia (Singapore)**
3. Wait ~2 minutes for setup
4. Go to **Settings → API** → copy:
   - Project URL (like `https://abcxyz.supabase.co`)
   - `anon` / public key

### STEP 5 — Run database schema
1. Supabase → **SQL Editor** → New Query
2. Open `supabase/schema.sql` from this project
3. Paste all contents → Click **Run**
4. Verify: Table Editor should show products, bills, customers tables

### STEP 6 — Create your login account
1. Supabase → **Authentication** → **Users** → **Add User**
2. Enter your email + a strong password
3. This is what you'll use to log in to the billing app

### STEP 7 — Add secrets to GitHub
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"** for each of these:

| Secret Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_SHOP_NAME` | J Oil Mill |
| `VITE_SHOP_ADDRESS` | 4/461-B, Kappar Nagar, Kongalapuram, Sivakasi - 626189 |
| `VITE_SHOP_PHONE` | +91 88709 32321 |
| `VITE_SHOP_GST` | GST: 33XXXXX0000X1Z5 |
| `VITE_ADMIN_PIN` | Your chosen 4-6 digit PIN |

### STEP 8 — Enable GitHub Pages
1. Your repo → **Settings** → **Pages**
2. Under "Source" select **"GitHub Actions"**
3. Save

### STEP 9 — Trigger first deployment
1. Go to your repo → **Actions** tab
2. Click "Deploy to GitHub Pages" → "Run workflow" → "Run workflow"
3. Wait ~2 minutes — you'll see a green tick when done
4. Your app is now live at: `https://YOUR_USERNAME.github.io/chekku-billing/`

> After this first setup, every time you push code changes to `main`, it redeploys automatically.

### STEP 10 — Test locally (optional)
```bash
# Copy and fill in your credentials
cp .env.example .env
# Edit .env with your actual values

npm install
npm run dev
# Open http://localhost:3000
```

---

## Updating the Repository Name

If your GitHub repository is named something other than `chekku-billing`:
1. Open `vite.config.js`
2. Change line 9: `const REPO_NAME = 'chekku-billing'` to your repo name
3. Commit and push

---

## Admin PIN (Products Page)

The Products page is PIN-protected. Set your PIN in GitHub Secrets as `VITE_ADMIN_PIN`.

Default PIN if not set: `1234` (change this!)

The PIN session auto-locks when the browser tab is closed.
After 5 wrong attempts → locked out for 30 seconds.

---

## Features

- Fast POS billing with product search (English + Tamil)
- Oils: Gingely, Coconut, Groundnut, Sesame (200ml / 500ml / 1L)
- Ghee (200ml / 500ml / 1L)
- Toor Dal, Nattu Sakkarai (500g / 1Kg)
- Cash / UPI / Card payment modes
- Customer name & phone (required) with returning customer auto-fill
- Discount per bill
- Thermal receipt printing (80mm popup)
- WhatsApp bill sharing
- Bill History: print, save as PDF, cancel, delete
- Monthly reports & top products
- Realtime sync via Supabase
- Offline support (PWA)
- Products page: add, update price, hide/show, delete (PIN protected)

---

## Folder Structure

```
chekku-billing/
├── .github/workflows/deploy.yml  ← Auto GitHub Pages deployment
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── components/
│   │   ├── AdminPinGate.jsx   ← PIN lock screen
│   │   ├── Receipt.jsx
│   │   ├── Sidebar.jsx
│   │   └── Toast.jsx
│   ├── hooks/
│   │   ├── useAdminPin.js
│   │   ├── useAuth.jsx
│   │   └── useProducts.js
│   ├── lib/
│   │   ├── printReceipt.js    ← Popup-based thermal print
│   │   └── supabase.js
│   └── pages/
│       ├── Billing.jsx        ← Main POS screen
│       ├── History.jsx        ← Bill history with print/PDF/delete
│       ├── Login.jsx
│       ├── Products.jsx       ← PIN-protected product management
│       └── Reports.jsx
├── supabase/schema.sql
├── .env.example
├── vite.config.js             ← GitHub Pages base path configured
└── package.json
```
