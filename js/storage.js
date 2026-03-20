// ========================
// Storage Management with Versioning
// ========================
const STORAGE_VERSION = '1.0.0';
const STORAGE_KEY = 'taskManagerData';
const DATA_SCHEMA_VERSION = 1;
export class StorageManager {
    constructor() {
        this.initializeStorage();
    }
    initializeStorage() {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (!existingData) {
            this.createInitialData();
        }
    }
    createInitialData() {
        const initialData = {
            version: STORAGE_VERSION,
            schemaVersion: DATA_SCHEMA_VERSION,
            lastUpdated: new Date().toISOString(),
            tasks: [],
            projects: [],
            habits: [],
            dailyHabitLogs: [],
            expenses: [],
            revenue: [],
            charges: [],
            rewards: [],
            purchaseHistory: [],
            categories: ['Work', 'Personal', 'Home', 'Shopping', 'Health', 'Fitness', 'Learning', 'Productivity', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Income'],
            userStats: {
                totalPoints: 0,
                level: 1,
                dailyStreak: 0,
                lastActivityDate: null,
                pointsBreakdown: {
                    tasks: 0,
                    projects: 0,
                    habits: 0,
                    streakBonus: 0
                }
            },
            settings: {
                tasksPerLevel: 30
            },
            wishList: [],
            notes: []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }
    getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : this.getDefaultData();
    }
    getDefaultData() {
        this.createInitialData();
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    }
    saveData(data) {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    // Task Management
    addTask(task) {
        const data = this.getData();
        const newTask = {
            ...task,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            completed: false,
            title: task.title || '',
            priority: task.priority || 'medium',
            points: task.points || 10,
            repeatType: task.repeatType || 'none',
        };
        data.tasks.push(newTask);
        this.saveData(data);
        return newTask;
    }
    updateTask(taskId, updates) {
        const data = this.getData();
        const task = data.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
            this.saveData(data);
        }
        return task;
    }
    deleteTask(taskId) {
        const data = this.getData();
        data.tasks = data.tasks.filter(t => t.id !== taskId);
        this.saveData(data);
    }
    getTasks() {
        const data = this.getData();
        return data.tasks || [];
    }
    // Project Management
    addProject(project) {
        const data = this.getData();
        const newProject = {
            ...project,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            name: project.name || '',
        };
        data.projects.push(newProject);
        this.saveData(data);
        return newProject;
    }
    updateProject(projectId, updates) {
        const data = this.getData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            Object.assign(project, updates);
            this.saveData(data);
        }
        return project;
    }
    deleteProject(projectId) {
        const data = this.getData();
        data.projects = data.projects.filter(p => p.id !== projectId);
        // Remove project from all tasks
        data.tasks = data.tasks.map(t => {
            if (t.projectId === projectId) {
                t.projectId = null;
            }
            return t;
        });
        this.saveData(data);
    }
    getProjects() {
        const data = this.getData();
        return data.projects || [];
    }
    // Habit Management
    addHabit(habit) {
        const data = this.getData();
        const newHabit = {
            ...habit,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            streak: 0,
            lastCompletedDate: null,
            targetGoal: habit.targetGoal || 1,
            name: habit.name || '',
            icon: habit.icon || '⭐',
            points: habit.points || 10,
        };
        data.habits.push(newHabit);
        this.saveData(data);
        return newHabit;
    }
    updateHabit(habitId, updates) {
        const data = this.getData();
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            Object.assign(habit, updates);
            if (!habit.targetGoal)
                habit.targetGoal = 1;
            this.saveData(data);
        }
        return habit;
    }
    deleteHabit(habitId) {
        const data = this.getData();
        data.habits = data.habits.filter(h => h.id !== habitId);
        this.saveData(data);
    }
    getHabits() {
        const data = this.getData();
        return data.habits || [];
    }
    logHabitCompletion(habitId, date = new Date()) {
        const data = this.getData();
        const dateStr = this.formatDate(date);
        data.dailyHabitLogs.push({
            id: this.generateId(),
            habitId,
            date: dateStr,
            timestamp: new Date().toISOString()
        });
        // Update habit streak based on fully-completed consecutive days
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            habit.lastCompletedDate = dateStr;
            habit.streak = this.calculateHabitStreak(habitId, habit.targetGoal, data.dailyHabitLogs);
        }
        this.saveData(data);
    }
    calculateHabitStreak(habitId, targetGoal, logs) {
        // Count completions per date for this habit
        const habitLogs = logs.filter(l => l.habitId === habitId);
        const countsByDate = {};
        for (const log of habitLogs) {
            countsByDate[log.date] = (countsByDate[log.date] || 0) + 1;
        }
        // Get dates where fully completed (>= targetGoal), sorted most recent first
        const completedDates = Object.keys(countsByDate)
            .filter(date => countsByDate[date] >= targetGoal)
            .sort()
            .reverse();
        if (completedDates.length === 0)
            return 0;
        // Count consecutive days going backward from the most recent fully-completed day
        let streak = 1;
        let currentDate = completedDates[0];
        for (let i = 1; i < completedDates.length; i++) {
            const [year, month, day] = currentDate.split('-').map(Number);
            const prevDay = new Date(year, month - 1, day);
            prevDay.setDate(prevDay.getDate() - 1);
            const expectedDate = this.formatDate(prevDay);
            if (completedDates[i] === expectedDate) {
                streak++;
                currentDate = completedDates[i];
            }
            else {
                break;
            }
        }
        return streak;
    }
    isHabitCompletedToday(habitId) {
        const data = this.getData();
        const todayStr = this.formatDate(new Date());
        return data.dailyHabitLogs.some(log => log.habitId === habitId && log.date === todayStr);
    }
    countHabitCompletionsToday(habitId) {
        const data = this.getData();
        const todayStr = this.formatDate(new Date());
        return data.dailyHabitLogs.filter(log => log.habitId === habitId && log.date === todayStr).length;
    }
    countHabitCompletionsForDate(habitId, dateStr) {
        const data = this.getData();
        return data.dailyHabitLogs.filter(log => log.habitId === habitId && log.date === dateStr).length;
    }
    // Finance Management
    addExpense(expense) {
        const data = this.getData();
        const newExpense = {
            ...expense,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            description: expense.description || '',
            amount: expense.amount || 0,
        };
        data.expenses.push(newExpense);
        this.saveData(data);
        return newExpense;
    }
    updateExpense(expenseId, updates) {
        const data = this.getData();
        const expense = data.expenses.find(e => e.id === expenseId);
        if (expense) {
            Object.assign(expense, updates);
            this.saveData(data);
        }
        return expense;
    }
    deleteExpense(expenseId) {
        const data = this.getData();
        data.expenses = data.expenses.filter(e => e.id !== expenseId);
        this.saveData(data);
    }
    getExpenses() {
        const data = this.getData();
        return data.expenses || [];
    }
    addRevenue(revenue) {
        const data = this.getData();
        const newRevenue = {
            ...revenue,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            description: revenue.description || '',
            amount: revenue.amount || 0,
        };
        data.revenue.push(newRevenue);
        this.saveData(data);
        return newRevenue;
    }
    updateRevenue(revenueId, updates) {
        const data = this.getData();
        const item = data.revenue.find(r => r.id === revenueId);
        if (item) {
            Object.assign(item, updates);
            this.saveData(data);
        }
        return item;
    }
    deleteRevenue(revenueId) {
        const data = this.getData();
        data.revenue = data.revenue.filter(r => r.id !== revenueId);
        this.saveData(data);
    }
    getRevenue() {
        const data = this.getData();
        return data.revenue || [];
    }
    // Other Charges Management
    addCharge(charge) {
        const data = this.getData();
        if (!data.charges) {
            data.charges = [];
        }
        const newCharge = {
            ...charge,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            description: charge.description || '',
            amount: charge.amount || 0,
        };
        data.charges.push(newCharge);
        this.saveData(data);
        return newCharge;
    }
    updateCharge(chargeId, updates) {
        const data = this.getData();
        if (!data.charges) {
            data.charges = [];
        }
        const charge = data.charges.find(c => c.id === chargeId);
        if (charge) {
            Object.assign(charge, updates);
            this.saveData(data);
        }
        return charge;
    }
    deleteCharge(chargeId) {
        const data = this.getData();
        if (!data.charges) {
            data.charges = [];
        }
        data.charges = data.charges.filter(c => c.id !== chargeId);
        this.saveData(data);
    }
    getCharges() {
        const data = this.getData();
        return data.charges || [];
    }
    // Rewards Shop Management
    addReward(reward) {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        const newReward = {
            ...reward,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            purchased: false,
            repeatable: typeof reward.repeatable === 'undefined' ? true : reward.repeatable,
            name: reward.name || '',
            cost: reward.cost || 0,
        };
        data.rewards.push(newReward);
        this.saveData(data);
        return newReward;
    }
    updateReward(rewardId, updates) {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        const reward = data.rewards.find(r => r.id === rewardId);
        if (reward) {
            Object.assign(reward, updates);
            if (typeof reward.repeatable === 'undefined')
                reward.repeatable = true;
            this.saveData(data);
        }
        return reward;
    }
    deleteReward(rewardId) {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        data.rewards = data.rewards.filter(r => r.id !== rewardId);
        this.saveData(data);
    }
    getRewards() {
        const data = this.getData();
        return data.rewards || [];
    }
    purchaseReward(rewardId) {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        if (!data.purchaseHistory) {
            data.purchaseHistory = [];
        }
        const reward = data.rewards.find(r => r.id === rewardId);
        if (!reward) {
            return { success: false, message: 'Reward not found' };
        }
        if (data.userStats.totalPoints < reward.cost) {
            return { success: false, message: 'Not enough points' };
        }
        // If one-time and already purchased, block
        if (reward.repeatable === false) {
            const alreadyPurchased = data.purchaseHistory.some(ph => ph.rewardId === reward.id);
            if (alreadyPurchased) {
                return { success: false, message: 'This reward can only be purchased once.' };
            }
        }
        // Deduct points
        data.userStats.totalPoints -= reward.cost;
        // Add to purchase history
        const purchase = {
            id: this.generateId(),
            rewardId: reward.id,
            rewardName: reward.name,
            rewardDescription: reward.description,
            cost: reward.cost,
            purchaseDate: new Date().toISOString()
        };
        data.purchaseHistory.push(purchase);
        this.saveData(data);
        return { success: true, purchase };
    }
    getPurchaseHistory() {
        const data = this.getData();
        return data.purchaseHistory || [];
    }
    // Wish List Management
    addWishItem(item) {
        const data = this.getData();
        if (!data.wishList)
            data.wishList = [];
        const newItem = {
            ...item,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            title: item.title || '',
            order: data.wishList.length,
        };
        data.wishList.push(newItem);
        this.saveData(data);
        return newItem;
    }
    updateWishItem(itemId, updates) {
        const data = this.getData();
        if (!data.wishList)
            data.wishList = [];
        const item = data.wishList.find(w => w.id === itemId);
        if (item) {
            Object.assign(item, updates);
            this.saveData(data);
        }
        return item;
    }
    deleteWishItem(itemId) {
        const data = this.getData();
        if (!data.wishList)
            data.wishList = [];
        data.wishList = data.wishList.filter(w => w.id !== itemId);
        // Re-index order values
        data.wishList.forEach((w, idx) => { w.order = idx; });
        this.saveData(data);
    }
    getWishItems() {
        const data = this.getData();
        if (!data.wishList)
            return [];
        return data.wishList.slice().sort((a, b) => a.order - b.order);
    }
    reorderWishItems(orderedIds) {
        const data = this.getData();
        if (!data.wishList)
            return;
        orderedIds.forEach((id, idx) => {
            const item = data.wishList.find(w => w.id === id);
            if (item)
                item.order = idx;
        });
        this.saveData(data);
    }
    // Note Management
    addNote(note) {
        const data = this.getData();
        if (!data.notes)
            data.notes = [];
        const newNote = {
            id: this.generateId(),
            title: note.title || '',
            content: note.content || '',
            createdDate: new Date().toISOString(),
        };
        data.notes.push(newNote);
        this.saveData(data);
        return newNote;
    }
    updateNote(noteId, updates) {
        const data = this.getData();
        if (!data.notes)
            data.notes = [];
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            Object.assign(note, updates);
            note.updatedDate = new Date().toISOString();
            this.saveData(data);
        }
        return note;
    }
    deleteNote(noteId) {
        const data = this.getData();
        if (!data.notes)
            data.notes = [];
        data.notes = data.notes.filter(n => n.id !== noteId);
        this.saveData(data);
    }
    getNotes() {
        const data = this.getData();
        if (!data.notes)
            return [];
        return data.notes.slice().sort((a, b) => new Date(b.updatedDate ?? b.createdDate).getTime() - new Date(a.updatedDate ?? a.createdDate).getTime());
    }
    // Points Management
    addPoints(amount, source) {
        const data = this.getData();
        data.userStats.totalPoints += amount;
        if (data.userStats.pointsBreakdown[source] !== undefined) {
            data.userStats.pointsBreakdown[source] += amount;
        }
        // Level is now calculated based on completed tasks, not points
        this.updateLevel();
        this.saveData(data);
    }
    updateLevel() {
        const data = this.getData();
        const settings = this.getSettings();
        const completedTasksCount = data.tasks.filter(t => t.completed).length;
        data.userStats.level = Math.floor(completedTasksCount / settings.tasksPerLevel) + 1;
        this.saveData(data);
    }
    updateDailyStreak(increment = true) {
        const data = this.getData();
        const today = this.formatDate(new Date());
        if (increment) {
            if (data.userStats.lastActivityDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (data.userStats.lastActivityDate !== this.formatDate(yesterday)) {
                    data.userStats.dailyStreak = 1;
                }
                else {
                    data.userStats.dailyStreak += 1;
                }
            }
        }
        data.userStats.lastActivityDate = today;
        this.saveData(data);
    }
    getUserStats() {
        const data = this.getData();
        return data.userStats;
    }
    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    exportData() {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    }
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            // Validate that it has the required structure
            if (data.version && data.tasks !== undefined && data.projects !== undefined) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                return true;
            }
            return false;
        }
        catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
    validateImportData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const issues = [];
            if (!data.version)
                issues.push('Missing version field');
            if (data.tasks === undefined)
                issues.push('Missing tasks field');
            else if (!Array.isArray(data.tasks))
                issues.push('Tasks is not an array');
            if (data.projects === undefined)
                issues.push('Missing projects field');
            else if (!Array.isArray(data.projects))
                issues.push('Projects is not an array');
            const isValid = issues.length === 0;
            const hasPartialData = !isValid && typeof data === 'object' && data !== null &&
                (data.tasks !== undefined || data.projects !== undefined || data.version !== undefined ||
                    data.habits !== undefined || data.userStats !== undefined || data.settings !== undefined);
            return { isValid, hasPartialData, issues, parsed: data };
        }
        catch (e) {
            return { isValid: false, hasPartialData: false, issues: ['Invalid JSON format'], parsed: null };
        }
    }
    buildMigratedData(data) {
        const now = new Date().toISOString();
        // Handle category migration (old per-type structure → flat array)
        let categories;
        if (data.categories && !Array.isArray(data.categories)) {
            const catObj = data.categories;
            categories = [...new Set([
                    ...(catObj['tasks'] || []),
                    ...(catObj['habits'] || []),
                    ...(catObj['finance'] || [])
                ])];
        }
        else if (Array.isArray(data.categories) && data.categories.length > 0) {
            categories = data.categories;
        }
        else {
            categories = ['Work', 'Personal', 'Home', 'Shopping', 'Health', 'Fitness', 'Learning',
                'Productivity', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Income'];
        }
        return {
            version: STORAGE_VERSION,
            schemaVersion: DATA_SCHEMA_VERSION,
            lastUpdated: now,
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            projects: Array.isArray(data.projects) ? data.projects : [],
            habits: Array.isArray(data.habits) ? data.habits : [],
            dailyHabitLogs: Array.isArray(data.dailyHabitLogs) ? data.dailyHabitLogs : [],
            expenses: Array.isArray(data.expenses) ? data.expenses : [],
            revenue: Array.isArray(data.revenue) ? data.revenue : [],
            charges: Array.isArray(data.charges) ? data.charges : [],
            rewards: Array.isArray(data.rewards) ? data.rewards : [],
            purchaseHistory: Array.isArray(data.purchaseHistory) ? data.purchaseHistory : [],
            categories,
            userStats: data.userStats || {
                totalPoints: 0,
                level: 1,
                dailyStreak: 0,
                lastActivityDate: null,
                pointsBreakdown: { tasks: 0, projects: 0, habits: 0, streakBonus: 0 }
            },
            settings: data.settings || { tasksPerLevel: 30 },
            wishList: Array.isArray(data.wishList) ? data.wishList : [],
            notes: Array.isArray(data.notes) ? data.notes : [],
        };
    }
    migrateAndImport(data) {
        try {
            const migrated = this.buildMigratedData(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return true;
        }
        catch (e) {
            console.error('Migration error:', e);
            return false;
        }
    }
    migrateToLatest() {
        try {
            const data = this.getData();
            const migrated = this.buildMigratedData(data);
            this.saveData(migrated);
            return true;
        }
        catch (e) {
            console.error('Migration error:', e);
            return false;
        }
    }
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem(STORAGE_KEY);
            this.createInitialData();
            return true;
        }
        return false;
    }
    // ========================
    // Category Management
    // ========================
    getCategories() {
        const data = this.getData();
        // Migrate old per-type structure to a single shared array
        if (data.categories && !Array.isArray(data.categories)) {
            const catObj = data.categories;
            const merged = [...new Set([
                    ...(catObj['tasks'] || []),
                    ...(catObj['habits'] || []),
                    ...(catObj['finance'] || [])
                ])];
            data.categories = merged;
            this.saveData(data);
        }
        return Array.isArray(data.categories) ? data.categories : [];
    }
    addCategory(categoryName) {
        const data = this.getData();
        if (!Array.isArray(data.categories))
            data.categories = [];
        const trimmedName = categoryName.trim();
        if (trimmedName && !data.categories.includes(trimmedName)) {
            data.categories.push(trimmedName);
            this.saveData(data);
            return true;
        }
        return false;
    }
    updateCategory(oldName, newName) {
        const data = this.getData();
        if (!Array.isArray(data.categories))
            return false;
        const trimmedNew = newName.trim();
        if (!trimmedNew || data.categories.includes(trimmedNew))
            return false;
        const idx = data.categories.indexOf(oldName);
        if (idx === -1)
            return false;
        data.categories[idx] = trimmedNew;
        // Propagate rename to all item types
        data.tasks = data.tasks.map(t => t.category === oldName ? { ...t, category: trimmedNew } : t);
        data.habits = data.habits.map(h => h.category === oldName ? { ...h, category: trimmedNew } : h);
        data.expenses = data.expenses.map(e => e.category === oldName ? { ...e, category: trimmedNew } : e);
        data.revenue = data.revenue.map(r => r.category === oldName ? { ...r, category: trimmedNew } : r);
        if (data.charges) {
            data.charges = data.charges.map(c => c.category === oldName ? { ...c, category: trimmedNew } : c);
        }
        this.saveData(data);
        return true;
    }
    deleteCategory(categoryName) {
        const data = this.getData();
        if (!Array.isArray(data.categories))
            return false;
        const idx = data.categories.indexOf(categoryName);
        if (idx === -1)
            return false;
        data.categories.splice(idx, 1);
        // Clear category from all item types
        data.tasks = data.tasks.map(t => t.category === categoryName ? { ...t, category: null } : t);
        data.habits = data.habits.map(h => h.category === categoryName ? { ...h, category: null } : h);
        data.expenses = data.expenses.map(e => e.category === categoryName ? { ...e, category: null } : e);
        data.revenue = data.revenue.map(r => r.category === categoryName ? { ...r, category: null } : r);
        if (data.charges) {
            data.charges = data.charges.map(c => c.category === categoryName ? { ...c, category: null } : c);
        }
        this.saveData(data);
        return true;
    }
    // ========================
    // Settings Management
    // ========================
    getSettings() {
        const data = this.getData();
        // Ensure settings exist with defaults
        if (!data.settings) {
            data.settings = {
                tasksPerLevel: 30
            };
            this.saveData(data);
        }
        return data.settings;
    }
    updateSettings(settings) {
        const data = this.getData();
        if (!data.settings) {
            data.settings = { tasksPerLevel: 30 };
        }
        Object.assign(data.settings, settings);
        // Recalculate level with new settings
        this.updateLevel();
        this.saveData(data);
    }
}
// Initialize global storage manager
const storage = new StorageManager();
export { storage, STORAGE_VERSION, STORAGE_KEY };
export function getDaysUntilDueText(dueDate) {
    const todayStr = storage.formatDate(new Date());
    const todayMs = new Date(todayStr + 'T00:00:00').getTime();
    const dueMs = new Date(dueDate + 'T00:00:00').getTime();
    const days = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
    if (days < 0)
        return 'Overdue';
    if (days === 0)
        return 'Today';
    if (days === 1)
        return '1 day';
    return `${days} days`;
}
//# sourceMappingURL=storage.js.map