# SECURITY_RULES.md

## Application Overview
DevSphere is a social collaboration platform where developers can:
- Create and join projects
- Chat individually and in groups
- Like, comment, and interact with projects
- Receive notifications about activity

The application uses Supabase for authentication, database, and real-time features.

---

## Security Design Principles

### 1. Role-Based Access Control
- Admin privileges are NOT stored in client-editable fields.
- Admin access is controlled via a separate `user_roles` table or server-managed assignment.
- The `profiles.is_admin` field (if present) must NOT be writable by normal users.

---

### 2. Notifications System
- Notifications are NOT created directly by client insert operations.
- Notifications should be generated via:
  - database triggers (likes, comments, messages)
  - or server-side functions (Edge Functions)
- Direct INSERT from frontend is considered invalid unless explicitly whitelisted for system actions.

---

### 3. Messaging System
- Messages are immutable after creation.
- Only allowed updates:
  - `is_read`
  - `deleted_for_user`
- Message content cannot be modified by sender or receiver.

---

### 4. Reports System
- Reports are strictly admin-only readable.
- Normal users can only INSERT their own reports.
- Report content is considered sensitive moderation data.

---

### 5. Profiles Data Exposure
- Public profile fields:
  - name
  - avatar_url
  - skills
  - title
- Sensitive fields:
  - notification_settings
  - role/admin flags
- Sensitive fields must only be accessible by the owner or admin.

---

### 6. Authentication Assumptions
- All users are authenticated via Supabase Auth.
- No anonymous write access is allowed for any core table.

---

## Accepted Behaviors (Not Security Issues)

- Users can update their own profile information (excluding role/admin fields)
- Users can create posts, messages, comments, and join requests
- Real-time subscriptions for messages and notifications are expected behavior

---

## Non-Issues for This Project

- Public read access to basic profile information is intentional for social discovery
- Real-time data exposure for messages is expected for chat functionality
- Notification visibility is required for UX responsiveness

---

## Environment Notes
- Development uses Supabase local or hosted instance
- Admin role is manually assigned or managed server-side
- Edge Functions may be used for sensitive operations in production