# 🚀 DevSphere

DevSphere is a developer collaboration platform where builders can discover projects, form teams, and collaborate in real time to turn ideas into working products.

## 🌟 Core Features

- **Project Discovery**
  Explore trending and newly created projects across different tech stacks.
- **Team Collaboration**
  Create projects, manage join requests, and build developer teams.
- **Real-time Messaging**
  Chat with individuals or project-based groups instantly.
- **Skill-based Matching**
  Connect with collaborators based on required skills and interests.
- **Notifications System**
  Stay updated with project invites, approvals, and platform activity.
- **Pro (Coming Soon)**
  - Priority project visibility
  - Advanced search & filtering
  - Enhanced developer profiles

## 🧠 User Flow

### New User

`Splash → Onboarding → Authentication (Sign Up / Sign In) → Home`

### Returning User

`Splash → Auto-login → Home`

or

`Splash → Authentication (if session expired)`

## 🔐 Authentication

- Email & Password (Supabase Auth)
- OAuth (Google & GitHub)
- Password Reset via Email
- Persistent sessions (auto-login support)

## 🛠 Tech Stack

### Web App

- React (Vite) + TypeScript
- Tailwind CSS
- shadcn/ui components
- TanStack Query

### Backend

- Supabase (PostgreSQL, Auth, Storage, Realtime)

### Additional Tools

- Framer Motion (animations)
- Lucide Icons
- Vercel (deployment)

## 📁 Project Structure

```text
src/
  components/   # Reusable UI components
  context/      # Global state management
  hooks/        # Custom React hooks
  pages/        # Application screens/routes
  utils/        # Helper functions
```

## 🚀 Getting Started

### 1) Clone the project

```bash
git clone <your-repo-url>
cd DevSphere
```

### 2) Install dependencies

```bash
npm install
```

### 3) Setup environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 4) Run the development server

```bash
npm run dev
```

## 🌐 Live Demo

👉 https://dev-sphere-kappa.vercel.app/

## 📱 Future Vision

- Mobile application (React Native / Expo)
- AI-powered team and project matching
- Developer marketplace for collaboration
- Investor discovery and project funding layer
- Advanced analytics for project growth

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## 📄 License

MIT License
