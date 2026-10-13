# Arcstep - Personal Learning & Productivity Platform

A comprehensive MERN stack application for managing personal learning paths, study sessions, todos, goals, and journals.

## 🚀 Features

### ✅ Implemented
- **Authentication System**
  - User registration and login
  - JWT-based authentication
  - Protected routes
  - Session management

- **Today/Dashboard Page** (Fully Functional)
  - Hero card showing current learning path
  - Study time, tasks, progress, and streak statistics
  - Interactive todo list with completion tracking
  - Focus card with current learning module
  - Today's study activity timeline
  - Weekly study chart
  - Learning progress across all paths
  - Daily goals overview with completion tracking
  - Journal preview with quick reflection input

- **Application Structure**
  - Full navigation sidebar with all routes
  - Learning paths section in sidebar
  - User profile and logout
  - Responsive layout
  - Clean, modern UI based on design system

### 🚧 Placeholder Pages
The following pages have navigation and structure but await full implementation:
- Learning Paths Management
- Journal (Full Editor)
- Calendar
- Resources
- Study Timer
- Analytics
- Settings

## 📁 Project Structure

```
Productive/
├── Productive_backend/          # Node.js + Express API
│   ├── models/                  # MongoDB schemas
│   │   ├── User.js
│   │   ├── LearningPath.js
│   │   ├── Todo.js
│   │   ├── Goal.js
│   │   ├── StudySession.js
│   │   └── Journal.js
│   ├── routes/                  # API endpoints
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── learningPaths.js
│   │   ├── todos.js
│   │   ├── goals.js
│   │   ├── studySessions.js
│   │   ├── journals.js
│   │   └── dashboard.js
│   ├── middleware/              # Authentication middleware
│   │   └── auth.js
│   ├── server.js                # Express server
│   ├── .env                     # Environment variables
│   └── package.json
│
└── Productive_frontend/         # React + Vite
    ├── src/
    │   ├── components/          # Reusable components
    │   │   ├── AppLayout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── PageHeader.jsx
    │   │   ├── HeroCard.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── TodoOverview.jsx
    │   │   ├── FocusCard.jsx
    │   │   ├── StudyActivity.jsx
    │   │   ├── StudyChart.jsx
    │   │   ├── LearningProgress.jsx
    │   │   ├── GoalsOverview.jsx
    │   │   └── JournalPreview.jsx
    │   ├── pages/               # Page components
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── TodayPage.jsx
    │   │   └── PlaceholderPage.jsx
    │   ├── context/             # React context
    │   │   └── AuthContext.jsx
    │   ├── services/            # API service
    │   │   └── api.js
    │   ├── App.jsx              # Main app with routing
    │   ├── main.jsx             # Entry point
    │   └── index.css            # Global styles
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (via Mongoose ODM)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router Dom** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **CSS Variables** - Design system

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd Productive_backend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Configure environment variables:
Edit `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/productive
JWT_SECRET=your-secret-key-change-this-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

4. Start MongoDB (if running locally):
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

5. Start the backend server:
```bash
npm start
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Productive_frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview data

### Learning Paths
- `GET /api/learning-paths` - Get all learning paths
- `POST /api/learning-paths` - Create learning path
- `PUT /api/learning-paths/:id` - Update learning path
- `DELETE /api/learning-paths/:id` - Delete learning path

### Todos
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Study Sessions
- `GET /api/study-sessions` - Get all study sessions
- `POST /api/study-sessions` - Create study session
- `PUT /api/study-sessions/:id` - Update study session
- `DELETE /api/study-sessions/:id` - Delete study session
- `GET /api/study-sessions/stats/summary` - Get study statistics

### Journals
- `GET /api/journals` - Get all journals
- `POST /api/journals` - Create journal entry
- `PUT /api/journals/:id` - Update journal entry
- `DELETE /api/journals/:id` - Delete journal entry

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## 🎨 Design System

The application follows a comprehensive design system with:

### Colors
- **Primary**: `#6C63FF` (Purple)
- **Success**: `#22C55E` (Green)
- **Warning**: `#F59E0B` (Orange)
- **Danger**: `#EF4444` (Red)

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: 11px - 36px with semantic naming

### Spacing
- Consistent 4px base unit
- Spacing scale from 4px to 64px

### Components
- Cards with subtle borders and hover effects
- Smooth animations and transitions
- Responsive layout with mobile support

## 🔄 Development Workflow

### Adding New Features

1. **Backend**: Create model → Create routes → Test API endpoints
2. **Frontend**: Create component → Connect to API → Style with design system
3. **Integration**: Test end-to-end functionality

### Mock Data Fallback

The application includes comprehensive mock data for development:
- Falls back to mock data if backend is unavailable
- Allows frontend development without database
- Easy transition to real API

## 📊 Dashboard Features

### Current Learning Path Card
- Shows active learning path with progress
- Topics completed/total
- Current module being studied
- Next milestone
- Quick actions to continue learning

### Daily Statistics
- **Study Time**: Total minutes/hours studied today
- **Tasks**: Completed vs total tasks
- **Learning Progress**: Overall progress percentage
- **Streak**: Consecutive days of learning

### Todo Overview
- Display top 6 todos (pending first, then completed)
- Checkbox to mark complete/incomplete
- Priority indicators
- Category tags
- Estimated duration
- Real-time updates with backend sync

### Focus Card
- Current learning module
- Module progress with visual bar
- Next scheduled session
- Quick action to start timer

### Study Activity Timeline
- Chronological list of today's study sessions
- Subject and topic for each session
- Duration for each session
- Color-coded by subject
- Total study time for the day

### Weekly Study Chart
- Bar chart showing hours studied each day
- Monday through Sunday
- Highlights current day
- Visual comparison of weekly activity

### Learning Progress
- All active learning paths
- Progress percentage for each
- Color-coded progress bars
- At-a-glance overview

### Daily Goals
- List of goals for the day
- Completion checkboxes
- Summary showing completed/total
- Strike-through styling for completed goals

### Journal Preview
- Quick reflection input
- Save to backend
- Link to full journal page
- Encourages daily reflection

## 🔒 Authentication Flow

1. User registers/logs in
2. Backend generates JWT token
3. Token stored in localStorage
4. Token sent with each API request via Authorization header
5. Backend middleware validates token
6. Protected routes accessible only when authenticated

## 🌐 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/productive
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify PORT 5000 is not in use
- Check .env file exists and is configured

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check CORS configuration in server.js
- Verify API_URL in frontend/src/services/api.js

### Authentication not working
- Check JWT_SECRET is set in .env
- Verify token is being stored in localStorage
- Check Authorization header is being sent with requests

### Mock data showing instead of real data
- This is expected if backend is unavailable
- Check backend console for errors
- Verify MongoDB connection

## 📈 Next Steps

To complete the application, implement:

1. **Learning Paths Management**
   - CRUD operations for learning paths
   - Module/topic management
   - Progress tracking

2. **Full Journal Editor**
   - Rich text editing
   - Mood tracking
   - Tags and categories
   - Search and filter

3. **Calendar View**
   - Study schedule visualization
   - Deadline tracking
   - Event management

4. **Resources Library**
   - Save articles, videos, courses
   - Organize by learning path
   - Notes and highlights

5. **Study Timer**
   - Pomodoro timer
   - Session tracking
   - Break reminders

6. **Analytics**
   - Detailed charts and graphs
   - Trends and insights
   - Export data

7. **Settings**
   - Profile management
   - Preferences
   - Notifications
   - Theme customization

## 👤 Default User for Testing

When the database is empty, you can register a new user or use seed data:

**Name**: Het
**Email**: het@arcstep.com
**Password**: password123

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Design inspired by modern productivity tools
- Built with the MERN stack
- Icons from Lucide React
- Typography from Google Fonts (Inter)

---

**Arcstep** - One step at a time. 🚀
