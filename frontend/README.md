# Connectly — Modern Social Media Platform (Frontend)

Connectly is a production-quality, responsive social media platform built with **React**, **Vite**, **Tailwind CSS**, and **React Router**. It connects to your existing backend at `http://localhost:3000`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- Your backend server running locally on `http://localhost:3000`

### 2. Environment Configuration
The frontend uses `VITE_API_BASE_URL` to route requests to your backend. A `.env` file is already configured:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture & Folder Structure

```
├── .env                      # Environment configuration
├── index.html                # Application entry HTML
├── vite.config.js            # Vite configuration with API proxy
├── tailwind.config.js        # Tailwind styling & brand palette
├── src/
│   ├── main.jsx              # React root entry
│   ├── App.jsx               # Application routing & providers
│   ├── index.css             # Global styles and scrollbar definitions
│   │
│   ├── services/             # Centralized API service layer
│   │   ├── api.js            # Axios client, auth token interceptors & error handler
│   │   ├── authService.js    # Register, login, me, logout endpoints
│   │   ├── postService.js    # Feed, create post, like/unlike, delete, user posts
│   │   ├── commentService.js # Get, add, delete comments
│   │   └── userService.js    # Profile, follow/unfollow, followers, search
│   │
│   ├── context/              # State management
│   │   ├── AuthContext.jsx   # Authentication session & user state
│   │   └── ToastContext.jsx  # Notification toasts (success, error, info)
│   │
│   ├── components/           # Reusable UI components
│   │   ├── common/           # Button, Input, Modal, UserAvatar, LoadingSkeleton, etc.
│   │   ├── layout/           # AppLayout, Navbar, Sidebar, RightSidebar, MobileNavigation
│   │   ├── posts/            # PostCard, PostActions, CommentSection, CreatePostModal
│   │   └── profile/          # ProfileHeader, EditProfileModal, FollowersModal
│   │
│   ├── pages/                # Application views
│   │   ├── LandingPage.jsx   # Public product landing page
│   │   ├── LoginPage.jsx     # User authentication
│   │   ├── RegisterPage.jsx  # Account registration with validation
│   │   ├── FeedPage.jsx      # Social feed with creation box, cards, and skeletons
│   │   ├── ExplorePage.jsx   # Search users and discover posts with debouncing
│   │   ├── ProfilePage.jsx   # User profile, statistics, posts, follow action
│   │   ├── PostDetailPage.jsx# Single post view with complete comments thread
│   │   └── NotFoundPage.jsx  # 404 page with return links
│   │
│   └── utils/                # Helpers & formatters
│       ├── dateUtils.js      # Relative and full date formatting
│       └── formatters.js     # Number abbreviation & initials
```

---

## 🔌 Integrated API Endpoints

The centralized API client communicates directly with your backend (`http://localhost:3000`):

| Domain | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | User registration |
| | `POST` | `/api/auth/login` | User authentication |
| | `GET` | `/api/auth/me` | Fetch active session & user details |
| | `POST` | `/api/auth/logout` | Session invalidation |
| **Posts** | `GET` | `/api/posts/feed` (fallback: `/api/posts`) | Paginated feed retrieval |
| | `POST` | `/api/posts` | Create new post (supports JSON or multipart image) |
| | `GET` | `/api/posts/:id` | Single post details |
| | `DELETE` | `/api/posts/:id` | Delete post |
| | `POST` | `/api/posts/:id/like` | Like a post |
| | `DELETE` | `/api/posts/:id/like` (fallback: `/unlike`) | Unlike a post |
| | `GET` | `/api/posts/user/:id` | Posts by specific creator |
| **Comments** | `GET` | `/api/posts/:id/comments` | Retrieve comments for a post |
| | `POST` | `/api/posts/:id/comments` | Add new comment |
| | `DELETE` | `/api/posts/:id/comments/:commentId` | Delete comment |
| **Users** | `GET` | `/api/users/:id` | Get user profile & stats |
| | `PUT` | `/api/users/profile` (fallback: `/me`) | Update profile details / avatar |
| | `POST` | `/api/users/:id/follow` | Follow user |
| | `POST` | `/api/users/:id/unfollow` (fallback: `DELETE`) | Unfollow user |
| | `GET` | `/api/users/:id/followers` | Get user's followers list |
| | `GET` | `/api/users/:id/following` | Get user's following list |
| | `GET` | `/api/users/search?q=` | Search users with query |
| | `GET` | `/api/users/suggested` | Suggested creator recommendations |

---

## 🎨 UI & UX Highlights

- **Responsive Grid:** Desktop sidebar layout, tablet-friendly navigation, and a dedicated mobile bottom navigation bar.
- **Micro-Interactions:** Heart like animation, optimistic state updates, debounced live search, and modal transitions.
- **Resilience:** Graceful skeleton loaders, comprehensive error boundaries with retry buttons, and fallback avatar generators.

