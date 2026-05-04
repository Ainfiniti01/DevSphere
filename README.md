# DevSphere 🚀

DevSphere is a social collaboration platform designed for developers to find teammates, showcase their projects, and grow their skills through real-world collaboration.

## 🌟 Features

- **Project Discovery**: Explore trending and new projects across various tech stacks.
- **Team Management**: Create projects and manage join requests from other developers.
- **Real-time Messaging**: Chat with individuals or project teams.
- **Skill Matching**: Find collaborators based on specific technical requirements.
- **Pro Waitlist**: Early access to advanced filtering and priority visibility.

## 🛠 Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Framer Motion, Lucide Icons
- **Backend/Auth**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Context API + TanStack Query
- **Analytics**: Vercel Analytics

## 🔐 Authentication Flow

1.  **Splash**: Initial entry point that checks for existing sessions and onboarding status.
2.  **Onboarding**: A one-time introduction for new users.
3.  **Auth**: Unified Sign In/Sign Up with support for Email/Password and OAuth (Google/GitHub).
4.  **Recovery**: Secure password reset flow triggered via email links.

## 🚀 Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Set up your Supabase environment variables.
4.  Run the development server: `npm run dev`.

## 📄 License

This project is licensed under the MIT License.