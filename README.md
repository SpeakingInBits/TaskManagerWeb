# Task Manager Pro 📋

A comprehensive Progressive Web App (PWA) for managing tasks, projects, habits, and finances with gamification features.

## 📖 Project Description

Task Manager Pro is a powerful, all-in-one productivity application that combines task management, project organization, habit tracking, and personal finance management into a single, intuitive interface. Built as a Progressive Web App, it works seamlessly across all devices and can be installed on your phone or computer for offline access.

The app features a gamification system with points, levels, and daily streaks to keep you motivated, along with a customizable rewards shop where you can redeem your earned points.

## ✨ Current Features

### 🎯 Task Management
- Create, edit, and delete tasks with detailed information
- Set due dates, priorities (low, medium, high), and point values
- Categorize tasks with custom categories
- Filter and search tasks by category, status, or keywords
- **Recurring Tasks** with multiple options:
  - Daily, weekly, monthly, yearly
  - Custom day intervals
  - Movable tasks (reschedule from completion date)
  - Custom days of the week
- Assign tasks to projects
- Track completed tasks with completion dates
- Automatic overdue detection

### 📁 Project Management
- Create projects with color tags for easy identification
- Track project progress with task completion statistics
- View detailed project breakdowns with task lists
- Organize tasks within projects
- Monitor active projects on dashboard

### ⭐ Habit Tracking
- Create daily habits with custom icons (emoji picker)
- Set target completion goals per day
- Track habit streaks
- View habit history and completion patterns
- Quick habit logging from dashboard
- Filter habits by custom categories
- Monitor incomplete habits for the day

### 💰 Finance Management
- Track three types of financial records:
  - **Expenses**: Daily spending and costs
  - **Revenue**: Income and earnings
  - **Charges**: Recurring bills and subscriptions
- Categorize all financial entries
- Date range filtering for financial reports
- View financial summaries and totals
- Add descriptions and amounts for each entry

### 🎮 Gamification System
- Earn points by completing tasks and habits
- Level up based on accumulated points
- Maintain daily streaks for consecutive days
- Visual progress tracking in header

### 🛒 Rewards Shop
- Create custom rewards with point costs
- Redeem rewards using earned points
- Manage and edit available rewards
- Track when rewards are purchased

### 🏠 Dashboard
- Today's overview with task and habit summaries
- Quick access to incomplete habits
- Recent activity feed
- Active projects summary
- Real-time statistics display

### ⚙️ Settings & Data Management
- **Export Data**: Download all your data as a JSON file
- **Import Data**: Restore data from a backup file
- **Clear All Data**: Factory reset option
- Responsive design for mobile, tablet, and desktop
- Hamburger menu for mobile navigation

### 🔄 Progressive Web App Features
- **Offline Support**: Works without internet connection
- **Installable**: Add to home screen on Android and iOS
- **Fast Loading**: Cached resources for instant access
- **Responsive**: Adapts to any screen size
- **Service Worker**: Background sync and updates

## 📱 Installation Instructions

### Installing on Android

1. **Open in Chrome**
   - Open Google Chrome on your Android device
   - Navigate to your Task Manager Pro website URL

2. **Install the App**
   - Tap the three-dot menu (⋮) in the top-right corner
   - Select **"Add to Home screen"** or **"Install app"**
   - A prompt will appear - tap **"Install"** or **"Add"**
   - The app icon will be added to your home screen

3. **Launch the App**
   - Tap the new Task Manager Pro icon on your home screen
   - The app will launch in full-screen mode, just like a native app

**Alternative Method:**
- Look for the install banner that appears at the bottom of the screen when you first visit the site
- Tap **"Install"** on the banner

### Installing on iOS (iPhone/iPad)

1. **Open in Safari**
   - Open Safari browser (must use Safari, not Chrome)
   - Navigate to your Task Manager Pro website URL

2. **Add to Home Screen**
   - Tap the **Share** button (square with arrow pointing up) at the bottom of the screen
   - Scroll down and tap **"Add to Home Screen"**
   - Edit the name if desired (or keep "TaskManager")
   - Tap **"Add"** in the top-right corner

3. **Launch the App**
   - Go to your home screen
   - Tap the Task Manager Pro icon
   - The app will open in standalone mode without Safari's browser chrome

**Note:** iOS has limited PWA support compared to Android. Some features like background sync may not work as expected.

### Installing on Desktop (Windows/Mac/Linux)

1. **Open in Chrome, Edge, or Brave**
   - Navigate to your Task Manager Pro website URL

2. **Install the App**
   - Click the install icon in the address bar (⊕ or computer icon)
   - OR click the three-dot menu → **"Install Task Manager Pro"**
   - Confirm the installation

3. **Launch the App**
   - The app will appear in your applications menu
   - You can also launch it from the browser's apps page: `chrome://apps`

## �️ Development (TypeScript)

This project is written in **TypeScript**. The source files live in `src/` and are compiled to `js/` for the browser.

### Project Structure

```
src/              # TypeScript source files
  storage.ts      # Data layer – StorageManager class & interfaces
  app.ts          # UI layer – TaskManager class
js/               # Compiled JavaScript (generated – do not edit)
tests/            # Vitest unit tests
e2e/              # Playwright end-to-end tests
```

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)

### Setup

```bash
npm install                # Install dependencies
npx playwright install     # Install Playwright browsers (first time only)
```

### Build

```bash
npm run build              # Compile TypeScript → js/
npm run build:watch        # Compile in watch mode (auto-rebuild on save)
```

### Run Locally

```bash
npm run serve              # Start a local dev server at http://localhost:3000
```

### Testing

```bash
npm test                   # Run unit tests (Vitest)
npm run test:watch         # Run unit tests in watch mode
npm run test:e2e           # Run end-to-end tests (Playwright)
npm run test:e2e:ui        # Run E2E tests with the Playwright UI
```

### Workflow

1. Edit TypeScript files in `src/`.
2. Run `npm run build` (or `build:watch`) to compile.
3. Open the app via `npm run serve` or the `index.html` file.
4. Run `npm test` to verify unit tests and `npm run test:e2e` for browser tests.

> **Note:** Never edit files in `js/` directly — they are overwritten on every build.

## �🚀 Getting Started

1. **First Launch**
   - The app will load with empty data
   - All data is stored locally in your browser

2. **Create Your First Task**
   - Go to the Tasks tab
   - Click "+ Add Task"
   - Fill in the details and save

3. **Set Up Daily Habits**
   - Navigate to the Habits tab
   - Create habits you want to track daily
   - Complete them to earn points and build streaks

4. **Track Your Finances**
   - Use the Finances tab to log expenses and revenue
   - Set up recurring charges for bills
   - Filter by date range to see spending patterns

5. **Organize with Projects**
   - Create projects to group related tasks
   - Assign tasks to projects for better organization
   - Monitor progress from the dashboard

## 💾 Data Storage

- All data is stored locally in your browser using IndexedDB
- Data persists across sessions and survives browser restarts
- Use Export/Import in Settings to backup or transfer your data
- Clearing browser data will delete all app data (use export first!)

## 🌐 Browser Compatibility

- **Chrome/Edge/Brave**: Full support (recommended)
- **Safari (iOS)**: Good support with minor limitations
- **Firefox**: Basic support (PWA features may vary)

## 📄 License

This project is open source and available for personal use.

---

**Built with ❤️ as a Progressive Web App**