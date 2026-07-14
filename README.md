# 🚀 DevSphere — Build Together. Ship Together.

**An AI-Powered Developer Collaboration Platform built with Alibaba Cloud Qwen-Plus.**

> *"DevSphere doesn't simply showcase ideas, it helps teams build them together."*

> *"DevSphere communicates with Alibaba Cloud Qwen models through the DashScope Workspace OpenAI-compatible API."*

![DevSphere Logo](assets/images/icon.jpeg)

## 🛡️ Badges

### Global AI Hackathon_AI Application & Alibaba Cloud_Qwen

| Global AI Hackathon_AI Application | Alibaba Cloud_Qwen |
| :---: | :---: |
| ![Track](https://img.shields.io/badge/Global_AI_Hackathon-AI_Application-blue) | ![Alibaba Cloud](https://img.shields.io/badge/Alibaba%20Cloud-Qwen-orange) |

---

## 🌍 Global AI Hackathon — Track 2: AI Application

DevSphere is an intelligent developer collaboration platform that combines real-time team formation, project discovery, and contextual AI assistance to help software teams build better products together. Instead of working alone or abandoning great ideas, developers can find teammates, manage projects, communicate, and receive AI-powered project guidance—all within one platform.

## 🧠 AI Project Manager Engine

Every project interaction follows a complete project management lifecycle:

• Retrieve project details (Problem, Solution, Stage, Skills)
• Retrieve creator and team context
• Identify the user's project role (Visitor, Applicant, Member, Owner)
• Reason with Alibaba Cloud Qwen-Plus
• Return actionable recommendations tailored to the current project

This ensures responses remain highly relevant instead of behaving like a generic chatbot.

### Contextual Reasoning Loop

DevSphere continuously:

- Analyzes project metadata and development stages
- Adapts responses based on the user's role and permissions
- Generates roadmaps, task lists, and sprint plans
- Recommends scalable engineering practices and architectures

This enables long-term personalized project guidance while maintaining an efficient context window.

---

## 📱 Application Interface

### 🏠 Home Dashboard & 🤖 AI Project Manager
| Home Dashboard | AI Project Manager |
| :---: | :---: |
| ![Home Page](.dyad/screenshot/8c1d7ae2237ff17b250f3d602ad95e449bc923a6.png) | ![AI Manager Page](.dyad/screenshot/36ace0317ba48f4705003ff3bebf309796920fe5.png) |

### 🔍 Explore Projects & 👥 Team Management
| Explore Projects | Team Management |
| :---: | :---: |
| ![Explore Page](.dyad/screenshot/bfac52a98498e73393d6a07ec5168ae0a5fb7ec5.png) | ![Manage Team Page](.dyad/screenshot/87e3c9a8d2a7f438d15173586fae6a306b7a6c67.png) |

## 🎥 Demo

Live Demo:
https://dev-sphere-kappa.vercel.app/

Demo Video:
https://www.youtube.com/watch?v=dQw4w9WgXcQ

---

## ✨ Core Features

- 🤝 **Project Discovery:** Browse community projects, discover startup ideas, and search by skills, technologies, and stages.
- 👥 **Team Formation:** Request to join projects, accept or reject applicants, and manage project members and roles.
- 🤖 **AI Project Manager (Powered by Qwen):** Every project includes an intelligent AI PM that understands the project context before responding.
- 💬 **Real-Time Collaboration:** One-to-one messaging, project group chats, read receipts, and system events for team activity.
- 🔔 **Smart Notifications:** Receive alerts for join requests, approvals, team activity, messages, and project updates.
- 👤 **Developer Profiles:** Create a professional developer profile featuring skills, bio, portfolio, experience, and title.
- 🎁 **Referral System:** Invite developers to join DevSphere and earn referral points toward future platform rewards.

---

## 🏗️ Technical Architecture

DevSphere's end-to-end AI and collaboration architecture is illustrated below:

```text
┌──────────────────────────────────────────┐
│             React Frontend               │
│   Home • Explore • Create • Chat • Team  │
└──────────────────┬───────────────────────┘
                   │
                   ▼
        ┌────────────────────────┐
        │  Supabase Auth (JWT)   │
        └───────────┬────────────┘
                    │
                    ▼
        ┌────────────────────────┐
        │ PostgreSQL Database    │
        │ • Profiles             │
        │ • Projects             │
        │ • Join Requests        │
        │ • Messages             │
        │ • Notifications        │
        │ • Referral Points      │
        └───────────┬────────────┘
                    │
                    ▼
      ┌────────────────────────────────┐
      │ Supabase Edge Functions        │
      │ • project-manager              │
      └───────────────┬────────────────┘
                      │
                      ▼
      ┌────────────────────────────────┐
      │ Alibaba Cloud DashScope API    │
      └───────────────┬────────────────┘
                      │
                      ▼
      ┌────────────────────────────────┐
      │ Qwen-Plus AI Reasoning         │
      │ • Project Awareness            │
      │ • Role-Based Intelligence      │
      │ • Contextual Reasoning         │
      │ • Secure Design                │
      └───────────────┬────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│      Live Dashboard & AI Project PM      │
│  Roadmaps • Task Lists • Chat • UI       │
└──────────────────────────────────────────┘
```

1. **Project Setup:** Users create or join projects, establishing their roles and permissions.
2. **Contextual Reasoning:** Supabase Edge Functions (Qwen-Plus) analyze the project metadata, factoring in the user's role and permissions.
3. **State Synthesis:** The AI updates the project's roadmap, task lists, and sprint plans, providing fresh insights and recommended actions on the dashboard.

---

## 📂 Project Structure

```text
devsphere/
├── assets/
│   ├── images/             # App screenshots and brand logos
│   └── sounds/             # Custom notification chimes
├── supabase/
│   └── functions/          # Qwen-powered Edge Functions
│       └── project-manager/# AI Project Manager chat reasoning
└── src/
    ├── components/         # Reusable UI components (ProjectCard, AIManager, etc.)
    ├── context/            # Global state management (AppContext)
    ├── hooks/              # Custom React hooks (useIsMobile, useToast)
    ├── integrations/       # Supabase client & SQL logic
    ├── pages/              # App pages (Index, Explore, CreateProject, ChatScreen, etc.)
    ├── utils/              # Helper utilities (NotificationService, toasts)
    ├── App.tsx             # Main router and layout controller
    └── main.tsx            # Application entry point
```

---

## 🧠 AI Project Manager Implementation

DevSphere satisfies the AI Application requirements through four core capabilities:

### Project Awareness
The AI understands the project title, description, problem statement, proposed solution, development stage, required skills, team members, and founder information.

### Role-Based Intelligence
Responses adapt depending on who is interacting:
- **Visitors:** Learn what the project is about, understand required skills, and decide whether to join.
- **Applicants:** Receive onboarding guidance, learn project expectations, and identify preparation steps.
- **Team Members:** Receive implementation advice, task breakdowns, architecture recommendations, and debugging assistance.
- **Project Owners:** Sprint planning, roadmaps, milestones, hiring recommendations, scaling strategies, MVP planning, and release planning.

### Contextual Reasoning
The AI remains focused on the current project instead of acting as a general-purpose assistant. It avoids inventing missing project details and recommends scalable engineering practices whenever possible.

### Secure Design
Sensitive information such as authentication tokens, API keys, and private backend details are never exposed through AI responses.

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Database/Auth:** Supabase (PostgreSQL + RLS)
- **AI Engine:** Alibaba Cloud Qwen-Plus (DashScope Workspace Endpoint)
- **Deployment:** Vercel
- **Backend:** Supabase Edge Functions

## ☁️ Alibaba Cloud Integration

DevSphere communicates with Alibaba Cloud Qwen through the official DashScope Workspace OpenAI-compatible endpoint:

https://ws-12c4bsjrjqxy8v2b.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions

The application performs AI reasoning using Alibaba Cloud Qwen models via Supabase Edge Functions.

---

## 🚀 Getting Started

1. Set up your Supabase project.
2. Configure the `QWEN_API_KEY` in your Supabase Edge Function secrets.
3. Use the integrated SQL tools to set up the `profiles`, `projects`, `join_requests`, `messages`, and `notifications` schema.

```text
Clone Repository
      │
      ▼
Install Dependencies
      │
      ▼
Configure Supabase
      │
      ▼
Set QWEN_API_KEY
      │
      ▼
Deploy Edge Functions
      │
      ▼
npm install
      │
      ▼
npm run dev

```
---

## ❤️ Why DevSphere?

Most collaboration platforms record tasks.

DevSphere builds teams.

By combining intelligent AI assistance, real-time collaboration, project discovery, and startup-focused team formation, DevSphere lowers the barrier between having an idea and launching a successful product.

## 🚀 What Makes DevSphere Different?

Unlike traditional project management tools that require manual updates, DevSphere continuously builds a contextual understanding of the project.

It learns from team activity, adapts its guidance based on the user's role, and provides objective technical reasoning using Alibaba Cloud Qwen as its reasoning engine.

The result is an AI Project Manager that becomes more personalized with every interaction.

---

## 📄 License

MIT License

Built with Alibaba Cloud Qwen

Built for Global AI Hackathon 2026