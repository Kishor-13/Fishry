# Smart Aquaculture Feed Manager
### स्मार्ट मत्स्य खाद्य व्यवस्थापक

A production-quality, mobile-first bilingual web application engineered for fish farmers in India, specifically tailored for aquaculture conditions in Maharashtra.

> **Core Philosophy:**
> **“The farmer enters observations; the system does the calculations.”**
> *(शेतकरी नोंदी भरतो; प्रणाली स्वयंचलित गणना करते.)*

---

## 🐟 Key Highlights & Features

1. **Farmer Authentication & Login Page**
   - Clean, mobile-friendly login screen with **10-digit Mobile Number** (`+91` prefix) and **Password** (with show/hide toggle).
   - 1-Click Demo Login (`9876543210` / `farmer123`) for rapid testing.
   - Farmer registration tab and Guest mode support.
   - Session persistence in local storage with logout support.

2. **Farmer-Centric Mobile-First UI**
   - High-contrast green/teal aquaculture palette with large touch targets.
   - Designed for easy single-hand operation on Android smartphones in direct sunlight.
   - PWA-enabled with manifest and offline service worker.

2. **Automated Scientific Calculations**
   - **Surviving Fish** = Number Stocked × Survival % ÷ 100
   - **Biomass (kg)** = Surviving Fish × Average Sample Weight (g) ÷ 1000
   - **Daily Feed (kg)** = Biomass (kg) × Feeding Rate (%) ÷ 100
   - **Morning Feed (kg)** = Daily Feed × 50% (7:00 – 8:00 AM)
   - **Evening Feed (kg)** = Daily Feed × 50% (4:00 – 5:00 PM)
   - **Daily Feed Cost** = Daily Feed × Feed Price per kg (₹)

3. **Critical Custom Species Rule (Section 3 & 10)**
   - When **Species = Other / Custom**, the system displays **Manual Feeding Rate (%)** (`स्वतः खाद्य दर (%)`).
   - For all predefined species, the feeding rate is strictly automatic, read-only, and transparently explained.
   - Switching from *Other / Custom* to a predefined species immediately hides the manual rate field, clears the value, and applies the scientific rule.

4. **Transparent Rule Engine (Section 14 & 42)**
   - Predefined species display the exact ICAR-CIFA protocol applied (e.g., `Rohu → Rearing → 6–8% biomass/day (Selected: 7%)`).
   - Respects weight-based priorities (e.g., Common Carp 35g automatically selects 10% from the 10–90g range).
   - Supports special aquaculture protocols without inventing arbitrary percentages:
     - **IMC Nursery**: Requires initial spawn weight (`INITIAL_SPAWN_WEIGHT`).
     - **Magur**: Requires verified feeding protocol (`VERIFIED_PROTOCOL`).
     - **Grass Carp**: Supplementary feeding with aquatic forage schedule (`FORAGE_BASED`).
     - **Pangasius**: Culture-period month rules (Months 1–2: 5%, Months 3–5: 3%, Month 6+: 2%).

5. **Feed History & UTF-8 BOM CSV Export**
   - Past calculations stored in Supabase PostgreSQL with local offline fallback.
   - One-click CSV export with UTF-8 Byte Order Mark (BOM) ensuring Marathi characters open flawlessly in Microsoft Excel.

6. **Independent Pond Management & FCR Calculator**
   - Pond Management is independent (pond selection is non-blocking for quick calculations).
   - Dedicated Feed Conversion Ratio (FCR) calculator adhering to the core principle:
     `FCR = Total Actual Feed Given ÷ Net Biomass Gain`.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, JavaScript (ESM)
- **Styling**: Tailwind CSS v3, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Cloud Database**: Supabase PostgreSQL (`feeding_rules`, `feed_history`, `ponds`)
- **Offline Fallback**: LocalStorage & IndexedDB dual-sync
- **Deployment**: Vercel-ready with `vercel.json` SPA rewrites

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js v18 or higher (Node v22.14.0 recommended)
- npm v10 or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your smartphone or browser.

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Bundle
```bash
npm run preview
```

### 6. Run Acceptance Tests
```bash
node test_acceptance.js
```

---

## 🗄️ Supabase Database Setup

1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the file [`supabase_schema.sql`](file:///d:/Fishery/supabase_schema.sql) in this repository, copy its contents, and execute it.
   - Creates `feeding_rules`, `feed_history`, and `ponds` tables.
   - Configures indexes and Row Level Security (RLS) policies.
   - Seeds all initial feeding rules for Rohu, Catla, Mrigal, Common Carp, Tilapia, Pangasius, Magur, and Grass Carp.
4. Copy your Project URL and Anon/Public Key from **Project Settings > API**.
5. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Credentials are managed strictly on the developer/deployment side via `.env` or Vercel Environment Variables — farmers never see or configure technical keys).*

---

## ☁️ Vercel Deployment Instructions

1. Push this repository to GitHub or GitLab.
2. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import your repository.
4. Under **Build and Output Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon public key
6. Click **Deploy**.
7. The included `vercel.json` automatically handles client-side routing rewrites for `/`, `/calculator`, `/history`, `/ponds`, and `/help`.

---

## 📋 Scientific Note & Disclaimer
> *Feeding rates provided by this application are reference starting values based on ICAR-CIFA and FAO aquaculture guidelines. Actual daily feeding should always be adjusted according to fish appetite, dissolved oxygen levels, water temperature, feed pellet quality, and observed health.*
