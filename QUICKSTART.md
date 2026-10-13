# Arcstep Quick Start Guide

## 🚀 Get Up and Running in 3 Minutes

### Step 1: Start the Backend (Terminal 1)

```bash
cd Productive_backend
npm start
```

You should see:
```
Arcstep server running on port 5000
MongoDB connected successfully
```

If MongoDB is not installed or running, the server will still start and use mock data.

---

### Step 2: Start the Frontend (Terminal 2)

```bash
cd Productive_frontend
npm run dev
```

The browser will automatically open to `http://localhost:5173`

---

### Step 3: Create Your Account

1. Click **"Create one"** on the login page
2. Fill in your details:
   - Name: Your Name
   - Email: you@example.com
   - Password: (at least 6 characters)
3. Click **"Create account"**

You'll be automatically logged in and redirected to your dashboard!

---

## 📊 Using the Dashboard

### What You Can Do Right Now:

✅ **View your current learning path**
- See progress and topics completed
- Click "Continue Learning" to explore

✅ **Manage your todos**
- Check/uncheck tasks to mark them complete
- View tasks by category and priority

✅ **Track your goals**
- Mark daily goals as complete
- See completion percentage

✅ **Log study sessions**
- View today's study timeline
- See weekly study chart

✅ **Write journal reflections**
- Quick reflection input at the bottom
- Click "Open journal" for full editor (coming soon)

---

## 🗄️ Optional: Seed Sample Data

If you want to start with realistic demo data:

```bash
cd Productive_backend
npm run seed
```

Then log in with:
- **Email**: het@arcstep.com
- **Password**: password123

---

## 🛠️ Troubleshooting

### Backend Issues
- **Port 5000 already in use**: Change PORT in `.env` file
- **MongoDB error**: App works without MongoDB using mock data
- **Can't connect**: Check firewall settings

### Frontend Issues
- **Can't connect to backend**: Make sure backend is running on port 5000
- **Blank page**: Check browser console for errors (F12)
- **Authentication not working**: Clear localStorage and try again

---

## 📱 Navigation

Use the sidebar to explore:
- **Today** - Your main dashboard (fully functional)
- **Learning** - Manage learning paths (placeholder)
- **Journal** - Daily reflections (placeholder)
- **Calendar** - Schedule view (placeholder)
- **Resources** - Save articles and videos (placeholder)
- **Study Timer** - Pomodoro timer (placeholder)
- **Analytics** - Progress insights (placeholder)
- **Settings** - Preferences (placeholder)

---

## 🎯 What Works Right Now

### ✅ Fully Functional
- User registration and login
- JWT authentication
- Today/Dashboard page with all features
- Real-time todo completion
- Real-time goal tracking
- Journal entry creation
- MongoDB persistence (if connected)
- Mock data fallback (if offline)

### 🚧 Coming Soon
All other pages are placeholders waiting for implementation.

---

## 🔄 Making Changes

### Add a Todo
Currently via the API. Full UI coming soon.

### Create a Learning Path
Currently via the API. Full UI coming soon.

### Log Study Session
Currently via the API. Timer integration coming soon.

---

## 📚 Learn More

See `README.md` for:
- Complete API documentation
- Architecture details
- Design system guide
- Development workflow
- Feature roadmap

---

**Happy learning! 🚀**

One step at a time with Arcstep.
