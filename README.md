# DevSphere 🚀

DevSphere is a social collaboration platform for developers, designers, and builders to discover projects, find teammates, and collaborate in real time.

---

## 🌟 Core Features

* **Project Discovery**
  Explore trending and newly created projects.

* **Team Collaboration**
  Create projects, manage join requests, and build teams.

* **Real-time Messaging**
  Chat with individuals or project groups.

* **Skill Matching**
  Find collaborators based on required skills.

* **Notifications System**
  Stay updated with project invites, approvals, and activity.

* **Pro (Coming Soon)**

  * Priority project visibility
  * Advanced search & filtering
  * Enhanced profiles

---

## 🧠 User Flow

### New User

Splash → Onboarding → Auth (Sign Up / Sign In) → Home

### Returning User

Splash → Auto Login → Home
OR
Splash → Auth (if session expired)

---

## 🔐 Authentication

* Email & Password (Supabase Auth)
* OAuth (Google & GitHub)
* Password Reset via Email
* Session persistence (auto login)

---

## 🛠 Tech Stack

### Web App

* React (Vite) + TypeScript
* Tailwind CSS
* shadcn/ui components
* TanStack Query

### Backend

* Supabase (PostgreSQL, Auth, Storage, Realtime)

### Other

* Framer Motion (animations)
* Lucide Icons
* Vercel (deployment)

---

## 📁 Project Structure

```bash
src/
  components/     # Reusable UI components
  context/        # Global state
  hooks/          # Custom hooks
  pages/          # App screens/routes
  utils/          # Helpers
```

---

## 🚀 Getting Started

### 1. Clone project

```bash
git clone <your-repo-url>
cd DevSphere
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create `.env`:

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 4. Run app

```bash
npm run dev
```

---

## 🌐 Live App

👉 https://dev-sphere-kappa.vercel.app/

---

## 📱 Future Plans

* Mobile app (React Native / Expo)
* AI-powered team matching
* In-app project funding system
* Advanced analytics

---

## 🤝 Contributing

1. Fork repo
2. Create a feature branch
3. Commit changes
4. Open PR

---

## 📄 License

MIT License
