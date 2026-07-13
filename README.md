# 🚀 DevSphere — Build Together. Ship Together.

An AI-powered developer collaboration platform built with Alibaba Cloud Qwen.

DevSphere helps developers discover projects, build teams, collaborate in real time, and transform ideas into successful products. Instead of working alone or abandoning great ideas, developers can find teammates, manage projects, communicate, and receive AI-powered project guidance—all within one platform.

---

## 🌍 Global AI Hackathon

**Track:** AI Application

DevSphere showcases how AI can become an intelligent project manager that understands a project's context, team structure, development stage, and goals to help software teams build better products together.

---

## ✨ Features

### 🤝 Project Discovery
- Browse community projects
- Discover startup ideas
- Search by skills and technologies
- View project stages and requirements

### 👥 Team Formation
- Request to join projects
- Accept or reject applicants
- Project member management
- Team role organization
- Group collaboration

### 🤖 AI Project Manager (Powered by Qwen)
Every project includes an intelligent AI Project Manager that understands the project before responding.

The AI can:
- Explain the project
- Suggest features
- Generate development roadmaps
- Break features into tasks
- Recommend technologies
- Suggest architecture improvements
- Assist with debugging
- Help onboard new contributors
- Generate sprint plans
- Identify technical risks
- Recommend best practices

Unlike a general chatbot, the AI responds using the project's context, current team information, development stage, and user role.

### 💬 Real-Time Collaboration
- One-to-one messaging
- Project group chats
- System events for team activity
- Read receipts
- Chat management
- Notification integration

### 🔔 Smart Notifications
Receive notifications for:
- Project join requests
- Request approvals
- Team activity
- Messages
- Project updates
- System events

Includes customizable notification preferences and optional notification sounds.

### 👤 Developer Profiles
Create a professional developer profile featuring:
- Skills
- Bio
- Portfolio
- Experience
- Title
- Profile picture

Helping teams identify the right contributors quickly.

### 🎁 Referral System
Invite developers to join DevSphere and earn referral points toward future platform rewards.

Current implementation includes:
- Referral codes
- Referral tracking
- Points system
- Progress statistics
- Future-ready reward architecture

---

## 🏗️ Technical Architecture

DevSphere combines real-time collaboration with contextual AI assistance.

### Collaboration Layer
- User authentication
- Project management
- Team management
- Messaging
- Notifications
- Referral system

### Intelligence Layer
The AI Project Manager follows a contextual reasoning workflow:
1. Retrieve project information
2. Retrieve creator and team context
3. Identify the user's project role
4. Build a project-aware system prompt
5. Generate responses using Alibaba Cloud Qwen
6. Return actionable recommendations tailored to the current project

This ensures responses remain relevant instead of behaving like a generic chatbot.

---

## 🧠 AI Project Manager Implementation

The AI Project Manager provides contextual assistance through four core capabilities.

### Project Awareness
The AI understands:
- Project title
- Description
- Problem statement
- Proposed solution
- Development stage
- Required skills
- Team members
- Founder information

### Role-Based Intelligence
Responses adapt depending on who is interacting:
- **Visitors:** Learn what the project is about, understand required skills, decide whether to join.
- **Applicants:** Receive onboarding guidance, learn project expectations, identify preparation steps.
- **Team Members:** Receive implementation advice, task breakdowns, architecture recommendations, debugging assistance.
- **Project Owners:** Sprint planning, roadmaps, milestones, hiring recommendations, scaling strategies, MVP planning, release planning.

### Contextual Reasoning
The AI remains focused on the current project instead of acting as a general-purpose assistant. It avoids inventing missing project details and recommends scalable engineering practices whenever possible.

### Secure Design
Sensitive information such as authentication tokens, API keys, and private backend details are never exposed through AI responses.

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

### Backend
- Supabase
- PostgreSQL
- Row-Level Security (RLS)
- Supabase Edge Functions

### AI
- Alibaba Cloud Qwen Plus
- Workspace OpenAI-Compatible API

### Realtime
- Supabase Realtime

### Deployment
- Vercel

---

## 🚀 Getting Started

1. Clone the repository.
2. Create a Supabase project.
3. Configure the required database schema and RLS policies.
4. Deploy the Supabase Edge Functions.
5. Configure the following environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
   - `QWEN_API_KEY`
6. Configure the Alibaba Cloud Qwen Workspace endpoint.
7. Start the development server.

---

## 🔒 Security

DevSphere is designed with security in mind:
- Row-Level Security (RLS)
- Secure authentication
- Backend authorization
- Role-based project permissions
- Protected Edge Functions
- Secure AI integration using server-side API keys

---

## 🌱 Vision

DevSphere aims to become the platform where developers don't just showcase ideas—they build them together.

By combining intelligent AI assistance, real-time collaboration, project discovery, and startup-focused team formation, DevSphere lowers the barrier between having an idea and launching a successful product.

Built for the Global AI Hackathon 2026. 🚀