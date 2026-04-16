# GigsNest 🪺

> **Hyperlocal job & skill exchange platform** — Find gigs, hire talent, connect instantly with people in your city.

![GigsNest](https://img.shields.io/badge/GigsNest-Live-brightgreen?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

---

## 🔥 What is GigsNest?

GigsNest is a **hyperlocal job marketplace** built for people who want to find real work or hire real talent — fast, simple, and without the noise of big platforms.

Think of it as **Mini Fiverr + OLX + WhatsApp groups** — combined into one clean platform.

- A developer in Srinagar can post a React project
- A local plumber can list their services
- A student can find a tutoring gig nearby
- Anyone can connect via WhatsApp in one click

---

## ✨ Features

- 🔐 **Google Sign-In** — one click authentication
- 📋 **Post Jobs** — title, category, description, pay range, location, tags
- 🗂️ **Browse & Filter** — by category (Tech / Design / Local / Content / Education)
- 🔍 **Live Search** — filter by title, description, tags or location instantly
- 📌 **Save Jobs** — bookmark listings to revisit later
- 📁 **My Posts** — manage all your job listings in one place
- 🗑️ **Delete Posts** — remove your own listings
- 💬 **WhatsApp Integration** — contact poster directly with a pre-filled message
- 📱 **Fully Responsive** — works on mobile, tablet and desktop
- ⚡ **Real-time Firestore** — data syncs instantly

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Google Auth |
| Routing | React Router v6 |
| Deployment | Vercel |

---

## 📁 Project Structure

```
gigs-nest/
├── src/
│   ├── firebase/
│   │   ├── config.js         # Firebase init & exports
│   │   └── db.js             # All Firestore CRUD operations
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state (Google Sign-In)
│   ├── hooks/
│   │   └── useJobs.js        # Custom hook for fetching jobs
│   ├── components/
│   │   ├── Navbar.jsx        # Top navigation bar
│   │   └── JobCard.jsx       # Job listing card component
│   ├── pages/
│   │   ├── Home.jsx          # Main feed — search, filter, browse
│   │   ├── PostJob.jsx       # Create a new job listing
│   │   ├── JobDetail.jsx     # Single job view + apply/contact
│   │   ├── MyJobs.jsx        # User's own posts dashboard
│   │   └── SavedJobs.jsx     # Bookmarked jobs
│   ├── App.jsx               # Route definitions
│   ├── main.jsx              # React entry point
│   └── index.css             # Tailwind + global styles
├── firestore.rules           # Firestore security rules
├── index.html                # HTML entry point
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase account (free)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/gigs-nest.git
cd gigs-nest
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database** (region: `asia-south1`)
4. Enable **Authentication → Google**
5. Go to Project Settings → Web App → copy your config

### 4. Add your Firebase config

Open `src/firebase/config.js` and paste your config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 5. Add Firestore security rules

In Firebase Console → Firestore → Rules, paste the contents of `firestore.rules` and publish.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 🌍 Deployment

### Deploy to Vercel

```bash
# Make sure the build works first
npm run build

# Push to GitHub, then import on Vercel
```

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Vercel auto-detects Vite → click **Deploy**
4. Add your Vercel domain to Firebase → Authentication → Authorized domains

---

## 🔒 Firestore Security Rules

```
- Anyone can read job listings (public feed)
- Only signed-in users can create jobs
- Only the job owner can update or delete their post
- Any signed-in user can bookmark (update savedBy field only)
```

---

## 🔜 Roadmap

- [ ] Edit job post
- [ ] Image/thumbnail upload (Firebase Storage)
- [ ] Location picker with map (Google Maps API)
- [ ] Nearby jobs filter (geolocation)
- [ ] Job expiry (auto-delete after 30 days)
- [ ] Push notifications (FCM)
- [ ] Dark mode
- [ ] Rating & reviews system
- [ ] In-app chat

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [yourprofile](https://linkedin.com/in/yourprofile)

---

## 📄 License

MIT License — feel free to use this project for learning or your portfolio.

---

## 💼 Resume Line

> Built **GigsNest** — a full-stack hyperlocal job marketplace enabling users to post, discover, and apply to gigs with real-time filtering, Google authentication, and WhatsApp integration using React, Firebase Firestore, and Tailwind CSS — deployed on Vercel.
