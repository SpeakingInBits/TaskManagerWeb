// ========================
// Storage Management with Versioning
// ========================

const STORAGE_VERSION = '1.0.0';
const STORAGE_KEY = 'taskManagerData';
const DATA_SCHEMA_VERSION = 1;

class StorageManager {
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
            categories: {
                tasks: ['Work', 'Personal', 'Home', 'Shopping'],
                habits: ['Health', 'Fitness', 'Learning', 'Productivity'],
                finance: ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Income']
            },
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
            }
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }

    getData() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    saveData(data) {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Task Management
    addTask(task) {
        const data = this.getData();
        task.id = this.generateId();
        task.createdDate = new Date().toISOString();
        task.completed = false;
        data.tasks.push(task);
        this.saveData(data);
        return task;
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
        project.id = this.generateId();
        project.createdDate = new Date().toISOString();
        data.projects.push(project);
        this.saveData(data);
        return project;
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
        habit.id = this.generateId();
        habit.createdDate = new Date().toISOString();
        habit.streak = 0;
        habit.lastCompletedDate = null;
        habit.targetGoal = habit.targetGoal || 1;
        data.habits.push(habit);
        this.saveData(data);
        return habit;
    }

    updateHabit(habitId, updates) {
        const data = this.getData();
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            Object.assign(habit, updates);
            if (!habit.targetGoal) habit.targetGoal = 1;
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

        // Update habit streak
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            habit.lastCompletedDate = dateStr;
            habit.streak = (habit.streak || 0) + 1;
        }

        this.saveData(data);
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

    // Finance Management
    addExpense(expense) {
        const data = this.getData();
        expense.id = this.generateId();
        expense.createdDate = new Date().toISOString();
        data.expenses.push(expense);
        this.saveData(data);
        return expense;
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
        revenue.id = this.generateId();
        revenue.createdDate = new Date().toISOString();
        data.revenue.push(revenue);
        this.saveData(data);
        return revenue;
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
        charge.id = this.generateId();
        charge.createdDate = new Date().toISOString();
        data.charges.push(charge);
        this.saveData(data);
        return charge;
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
        reward.id = this.generateId();
        reward.createdDate = new Date().toISOString();
        reward.purchased = false;
        reward.repeatable = typeof reward.repeatable === 'undefined' ? true : reward.repeatable;
        data.rewards.push(reward);
        this.saveData(data);
        return reward;
    }

    updateReward(rewardId, updates) {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        const reward = data.rewards.find(r => r.id === rewardId);
        if (reward) {
            Object.assign(reward, updates);
            if (typeof reward.repeatable === 'undefined') reward.repeatable = true;
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

    // 

    // Points Management
    addPoints(amount, source) {
        const data = this.getData();
        data.userStats.totalPoints += amount;
        if (data.userStats.pointsBreakdown[source]) {
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
                } else {
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
        } catch (e) {
            console.error('Import error:', e);
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
    getCategories(type) {
        const data = this.getData();
        return (data.categories && data.categories[type]) || [];
    }

    addCategory(type, categoryName) {
        const data = this.getData();
        if (!data.categories) {
            data.categories = { tasks: [], habits: [], finance: [] };
        }
        if (!data.categories[type]) {
            data.categories[type] = [];
        }

        const trimmedName = categoryName.trim();
        if (trimmedName && !data.categories[type].includes(trimmedName)) {
            data.categories[type].push(trimmedName);
            this.saveData(data);
            return true;
        }
        return false;
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
            data.settings = {};
        }
        Object.assign(data.settings, settings);
        // Recalculate level with new settings
        this.updateLevel();
        this.saveData(data);
    }
}
// Initialize global storage manager
const storage = new StorageManager();