Design and build a modern personal learning and productivity web application called **“Arcstep”** (name can be changed later).

The product is a **personal learning OS** for students and developers. It combines daily tasks, journaling, learning plans, study sessions, resources, progress tracking, and analytics into one calm workspace.

Use the attached reference image as the **visual direction**. Do not copy it exactly. Take inspiration from its clean SaaS dashboard layout, spacious cards, muted colors, subtle borders, rounded corners, typography hierarchy, and minimal aesthetic.

The interface should feel like a combination of **Notion + Linear + a modern learning dashboard**, but simpler and more personal.

---

# 1. DESIGN PHILOSOPHY

The application should feel:

* Minimal
* Premium
* Calm
* Focused
* Academic/productive
* Data-driven without feeling overwhelming
* Extremely easy to navigate
* Optimized for daily use

Avoid:

* Excessive gradients
* Bright neon colors
* Overly colorful dashboards
* Excessive shadows
* Crowded interfaces
* Too many buttons
* Generic admin-dashboard aesthetics

Use:

* Off-white / warm white background
* Very dark text
* Soft gray borders
* Muted purple/indigo as the primary accent
* Subtle green for completed/progress states
* Red/orange only for warnings or overdue items
* Rounded cards
* Thin borders
* Large whitespace
* Small, elegant icons
* Smooth micro-interactions

Typography should be modern and highly readable.

---

# 2. GLOBAL APPLICATION STRUCTURE

Create a persistent left sidebar.

Sidebar:

**ARCSTEP**

Navigation:

* Today
* Learning
* Journal
* Calendar
* Resources
* Study Timer
* Analytics

Then a section:

**YOUR PATHS**

Display learning paths such as:

* Data Structures & Algorithms
* Machine Learning
* Web Development
* System Design
* Competitive Programming

Each learning path should have a small progress indicator.

At the bottom of the sidebar:

* Settings
* Profile
* Theme toggle

The sidebar should remain visible on desktop and collapse into a mobile navigation drawer on smaller screens.

---

# 3. TODAY DASHBOARD

The Today page is the primary home page and should feel like a daily command center.

Header:

“Make today count, Het.”

Subtitle:

“A place for the work you do today and the person you're becoming.”

Show the current date near the top.

---

## TODAY HERO CARD

Create a large featured card similar to the reference image.

Example:

CURRENT PATH

**Data Structures & Algorithms**

“Continue building strong problem-solving fundamentals.”

Show:

Progress:
**64% complete**

Current module:
**Dynamic Programming**

Next milestone:
**Complete 15 medium-level problems**

Include a subtle abstract geometric background.

Buttons:

* Continue Learning
* View Path

---

# 4. TODAY — QUICK OVERVIEW

Below the hero card create a row of compact statistics.

Cards:

### Study Time

**4h 32m**

Compared with yesterday:

+42 min

### Tasks Completed

**8 / 10**

### Learning Progress

**72%**

### Current Streak

**12 days**

### Goals

**4 / 5 completed**

Use small visual indicators and subtle charts.

---

# 5. TODAY — TASKS / TODO

Create a section:

## What's next

Display today's tasks as clean rows.

Each task should have:

* Checkbox
* Task title
* Category
* Estimated time
* Priority
* Optional learning path
* Completion status

Example:

☐ Solve 5 Codeforces problems
DSA · 90 min

☐ Complete Binary Trees lecture
DSA · 60 min

☐ Revise probability formulas
Mathematics · 30 min

☐ Read ML notes
Machine Learning · 45 min

Allow:

* Add task
* Edit task
* Delete task
* Mark complete
* Drag to reorder
* Assign subject
* Assign learning path
* Add deadline
* Add estimated duration

Completed tasks should become visually muted and crossed out.

---

# 6. TODAY — STUDY ACTIVITY

Create a section called:

## Today's study

Display all study timer sessions completed today.

Example:

### 09:00 – 10:30

**Data Structures & Algorithms**
1h 30m

### 11:15 – 12:00

**Machine Learning**
45m

### 16:00 – 17:30

**Competitive Programming**
1h 30m

Each session should display:

* Subject
* Topic
* Duration
* Start time
* End time
* Productivity indicator

Add a small horizontal timeline showing the day's study sessions.

---

# 7. TODAY — ANALYTICS

Create a visual analytics section.

Show:

### Study Time by Subject

Use a donut/pie chart.

Example:

DSA — 42%

Machine Learning — 28%

Web Development — 18%

Mathematics — 12%

Also show:

### Weekly Study Hours

Bar chart from Monday → Sunday.

### Task Completion

Circular progress indicator:

**80%**

### Learning Progress

Horizontal progress bars for each active learning path.

Example:

DSA
████████████░░ 78%

Machine Learning
███████░░░░░░░ 52%

System Design
████░░░░░░░░░░ 31%

---

# 8. TODAY — DAILY GOALS

Add a section:

## Today's goals

Users can define goals such as:

* Complete 5 DSA problems
* Study ML for 2 hours
* Finish Binary Search module
* Read 20 pages
* Build one feature

Each goal should have:

* Checkbox
* Progress
* Optional target value
* Completion status

At the end of the day, completed goals should automatically appear inside the Journal.

---

# 9. JOURNAL PAGE

The Journal should be a combination of:

**Daily reflection + TODO planning + achievements**

At the top:

## Daily Journal

Date selector.

Create a clean editor where the user can write freely.

Sections:

### What did I do today?

Large rich-text editor.

### What did I learn?

Rich-text editor.

### What goals did I achieve?

Checklist.

### What went well?

Text area.

### What could be improved?

Text area.

### Notes

Free-form editor.

---

## JOURNAL TODO SECTION

Allow users to create today's TODOs directly from the Journal.

Example:

### Today's plan

☐ Complete DP lecture
☐ Solve 5 problems
☐ Revise SQL
☐ Work on portfolio

Each todo can have:

* Priority
* Subject
* Estimated duration
* Due time
* Learning path
* Tags

The Todo data should synchronize with the Today page and Calendar.

---

# 10. JOURNAL HISTORY

Below the editor, show previous journal entries.

Use a timeline/calendar style.

Example:

September 29

“Focused heavily on DP today…”

September 28

“Worked on Machine Learning…”

September 27

“Completed Binary Trees…”

Allow users to search and filter journal entries.

Filters:

* Date
* Subject
* Learning path
* Tags

---

# 11. CALENDAR PAGE

Create a full productivity calendar.

Support:

* Month view
* Week view
* Day view

Tasks should appear as **colored blocks/slabs** inside the calendar.

For example:

09:00–10:30
**DSA — Dynamic Programming**

11:00–12:00
**Machine Learning**

16:00–17:30
**Competitive Programming**

Different subjects should have subtle colors.

Calendar items should represent:

* TODOs
* Study sessions
* Deadlines
* Learning milestones
* Planned learning sessions

Users should be able to:

* Click a time slot
* Create task
* Schedule study session
* Drag and resize tasks
* Edit event
* Mark complete

---

# 12. LEARNING PAGE

This should be the second major feature of the application.

Header:

## Your Learning

“Build skills deliberately, one step at a time.”

Display all learning paths.

Example cards:

### Data Structures & Algorithms

78% complete

**42 / 54 topics**

Current:

Dynamic Programming

Next:

Graph Algorithms

---

### Machine Learning

52% complete

**18 / 35 topics**

Current:

Regression

Next:

Decision Trees

---

### Web Development

64% complete

---

Users should be able to:

**+ Create Learning Path**

---

# 13. CREATE LEARNING PATH

Create a beautiful multi-step form.

Fields:

Learning Path Name

Description

Goal

Start Date

Target Completion Date

Difficulty

Subject

---

Then allow the user to create modules.

Example:

Data Structures & Algorithms

### 1. Arrays

✓ Complete

### 2. Binary Search

✓ Complete

### 3. Linked Lists

✓ Complete

### 4. Trees

70%

### 5. Graphs

20%

### 6. Dynamic Programming

0%

Each module should contain:

* Topics
* Description
* Start date
* Target date
* Resources
* Notes
* Tasks
* Progress

---

# 14. LEARNING DETAIL PAGE

When opening a learning path, show:

Header:

**Data Structures & Algorithms**

78% Complete

Start Date:
Aug 12, 2026

Target:
Dec 20, 2026

---

## Progress Overview

Large progress bar.

Topics completed:

42 / 54

Study time:

86h 32m

Tasks completed:

127

Current streak:

12 days

---

## Learning Roadmap

Display modules vertically as a roadmap.

Example:

Arrays
✓ Complete

Binary Search
✓ Complete

Linked Lists
✓ Complete

Trees
→ In Progress

Graphs
○ Upcoming

Dynamic Programming
○ Upcoming

Each module should have its own progress bar.

---

# 15. LEARNING RESOURCES

Every learning module can contain resources.

Resource types:

* YouTube
* Website
* Article
* Documentation
* PDF
* GitHub repository
* Personal notes
* Book

Example:

### Binary Trees

Resources:

YouTube
“Binary Trees Complete Guide”

Article
“Tree Traversal Techniques”

GitHub
“Tree Problems Collection”

Users can add custom URLs.

---

# 16. RESOURCES PAGE

Create a personal knowledge/resource manager.

Header:

## Resources

“Everything you need, organized your way.”

Allow users to create folders.

Example:

📁 DSA

📁 Machine Learning

📁 Web Development

📁 College

📁 System Design

📁 Competitive Programming

📁 Projects

---

Users can create unlimited nested folders.

Inside each folder they can add:

* Notes
* Links
* PDFs
* Videos
* Articles
* GitHub repositories
* Bookmarks

---

# 17. RESOURCE CARD

Each resource should display:

Icon

Title

Type

Description

Tags

Folder

Date Added

Favorite button

Open button

Example:

**NeetCode Roadmap**

Website · DSA

“Complete roadmap for interview preparation.”

Tags:

#DSA #Interview #Roadmap

---

Allow:

* Search
* Sort
* Filter
* Favorite
* Move to folder
* Edit
* Delete

---

# 18. NOTES

Users should be able to create personal notes directly inside Resources.

Create a Notion-like editor with:

* Headings
* Bold
* Italic
* Bullet lists
* Numbered lists
* Code blocks
* Checklists
* Links
* Images
* Tables

Notes can be connected to:

* Learning paths
* Modules
* Subjects
* Journal entries

---

# 19. STUDY TIMER

Create a dedicated **Focus Timer** page.

This should be one of the most polished screens.

Large centered timer:

**25:00**

or

**01:30:00**

Controls:

▶ Start

⏸ Pause

↻ Reset

---

Before starting:

### What are you studying?

Select:

* DSA
* Machine Learning
* Web Development
* Mathematics
* Competitive Programming
* Other

Then:

### What topic?

Example:

Dynamic Programming

Optional:

### What are you working on?

“Solve 5 DP problems”

---

Timer modes:

* Pomodoro
* Custom
* Stopwatch

Pomodoro presets:

25 / 5

50 / 10

90 / 15

Allow custom duration.

---

# 20. ACTIVE TIMER MINI WIDGET

When a timer is running, show a small persistent timer widget across the application.

Example:

🔴 FOCUS

**01:12:34**

Dynamic Programming

[Pause]

The timer should continue running even when navigating between pages.

---

# 21. STUDY SESSION HISTORY

After stopping a timer, ask:

### What did you accomplish?

Text input.

Example:

“Completed 4 DP problems and revised memoization.”

Then save:

Subject

Topic

Duration

Date

Notes

Goal

Learning path

This data feeds automatically into Analytics and Today.

---

# 22. ANALYTICS PAGE

Create a detailed productivity analytics dashboard.

Header:

## Your Progress

“Understand how you're spending your learning time.”

---

### Total Study Time

Today
4h 32m

This Week
27h 18m

This Month
96h 42m

All Time
412h 16m

---

### Study Time by Subject

Donut chart.

---

### Weekly Study Hours

Bar chart.

---

### Monthly Study Trend

Line chart.

---

### Task Completion

Show:

Completed

Pending

Overdue

---

### Most Studied Subjects

Ranked list based purely on hours spent.

Example:

1. DSA — 42h
2. ML — 28h
3. Web Dev — 19h
4. Mathematics — 12h

---

### Learning Progress

Show every learning path with:

Progress percentage

Topics completed

Study hours

Tasks completed

Target date

---

# 23. PRODUCTIVITY HEATMAP

Create a GitHub-style activity heatmap.

Each day represents study activity.

Darker cells = more study time.

Allow switching between:

* Study time
* Tasks completed
* Journal entries

---

# 24. DASHBOARD INSIGHTS

Generate simple factual insights from the user's data.

Examples:

“You studied 6h more this week than last week.”

“DSA accounts for 46% of your study time.”

“You completed 23 tasks this week.”

“Your longest study session was 2h 15m.”

Do NOT make the UI feel judgmental.

Avoid language such as:

“You were unproductive.”

Instead use neutral language:

“Study time was lower than your weekly average.”

---

# 25. NOTIFICATIONS / REMINDERS

Allow users to optionally set:

* Task reminders
* Learning deadline reminders
* Study reminders
* Goal reminders

Show them unobtrusively.

---

# 26. GLOBAL QUICK ACTION

Add a floating or keyboard-accessible quick action button:

**+ Quick Add**

Options:

* New Todo
* Start Timer
* New Journal
* New Note
* Add Resource
* Schedule Learning
* Create Goal

Keyboard shortcut:

`Ctrl/Cmd + K`

Open a command palette.

---

# 27. SEARCH

Global search should search across:

* Todos
* Journal entries
* Learning paths
* Notes
* Resources
* Study sessions

Use a command-palette style interface.

---

# 28. DATA RELATIONSHIPS

The application should behave like one connected system.

For example:

If I create:

**Learning Path → DSA**

Inside it:

**Module → Dynamic Programming**

Then I should be able to:

* Add resources to Dynamic Programming
* Create TODOs for Dynamic Programming
* Schedule study sessions for Dynamic Programming
* Start a timer for Dynamic Programming
* Write journal notes about Dynamic Programming
* Track progress
* See all activity on the Today dashboard
* See the scheduled work on Calendar
* See study time in Analytics

Everything should be interconnected.

---

# 29. TODAY PAGE AUTOMATION

The Today dashboard should automatically aggregate data from the entire application.

For today's date, show:

* Today's TODOs
* Today's goals
* Today's scheduled learning
* Active learning progress
* Study sessions
* Total study hours
* Subjects studied
* Learning progress
* Journal status
* Upcoming deadlines

The user should not have to manually enter the same information in multiple places.

---

# 30. RESPONSIVE DESIGN

Desktop should be the primary experience.

Also support:

* Laptop
* Tablet
* Mobile

Desktop:

Sidebar + main content + optional right-side contextual panel.

Tablet:

Collapsible sidebar.

Mobile:

Bottom navigation:

Today
Learning
Timer
Journal
More

Cards should stack vertically.

Charts should remain readable on mobile.

---

# 31. COMPONENT STYLE

Use a consistent design system.

Cards:

border-radius: 12–16px

Borders:

subtle 1px border

Shadows:

very subtle or none

Buttons:

rounded 8–10px

Inputs:

clean with clear focus states

Progress bars:

thin, elegant, rounded

Charts:

minimal grid lines

Icons:

simple line icons

Animations:

subtle transitions around 150–250ms.

Use skeleton loaders for data-heavy sections.

---

# 32. COLOR SYSTEM

Primary:

Muted Indigo / Purple

Background:

Warm off-white

Surface:

White

Primary text:

Near-black

Secondary text:

Muted gray

Success:

Muted green

Warning:

Muted amber

Danger:

Muted red

Do not make every subject a bright color. Use subtle subject colors.

---

# 33. OVERALL VISUAL HIERARCHY

The most important page should be:

**Today**

The second most important:

**Learning**

Then:

Journal
Calendar
Resources
Timer
Analytics

The application should feel like a personal workspace rather than an enterprise dashboard.

Prioritize:

1. What should I do today?
2. What am I currently learning?
3. How much have I studied?
4. What have I accomplished?
5. What should I learn next?
6. Where are my resources?
7. How am I progressing over time?

---

# 34. SAMPLE TODAY SCREEN

The final Today page should approximately communicate:

Good morning, Het.

Make today count.

[Current Learning Path]

Data Structures & Algorithms
78% complete
Currently learning: Dynamic Programming

[Study Time] 4h 32m
[Tasks] 8/10
[Goals] 4/5
[Streak] 12 days

---

What's next

☐ Solve 5 DP problems — 90m
☐ Complete DP lecture — 60m
☐ Revise graphs — 45m

---

Today's study

09:00 — 10:30
DSA · Dynamic Programming

11:30 — 12:15
Machine Learning · Regression

16:00 — 17:30
Competitive Programming

---

Progress

[Weekly Study Chart]

[Study Time by Subject]

[Learning Path Progress]

---

Today's goals

✓ Complete DP lecture
✓ Solve 3 problems
○ Finish ML notes

---

Journal

“What did you accomplish today?”

[Write reflection...]

---

The final result should feel like a **personal operating system for learning** — one place where planning, studying, journaling, resources, learning paths, tasks, calendars, timers, and analytics all work together.

Do not make it look like a generic productivity SaaS dashboard. Make it feel **personal, calm, intelligent, focused, and premium**.
