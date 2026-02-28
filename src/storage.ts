// ========================
// Storage Management with Versioning
// ========================

const STORAGE_VERSION = '1.0.0';
const STORAGE_KEY = 'taskManagerData';
const DATA_SCHEMA_VERSION = 1;

// ========================
// Type Definitions
// ========================

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    category?: string | null;
    priority: 'low' | 'medium' | 'high';
    points: number;
    repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'movable';
    repeatUnit?: number;
    customRepeatDays?: number;
    movableRepeatDays?: number;
    daysOfWeek?: number[];
    projectId?: string | null;
    completed: boolean;
    completedDate?: string | null;
    createdDate: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    color?: string;
    createdDate: string;
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    icon: string;
    category?: string | null;
    points: number;
    targetGoal: number;
    daysOfWeek?: number[];
    streak: number;
    lastCompletedDate?: string | null;
    createdDate: string;
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    timestamp: string;
}

export interface FinanceItem {
    id: string;
    description: string;
    amount: number;
    date?: string;
    category?: string | null;
    recurring?: 'once' | 'monthly' | 'yearly';
    createdDate: string;
}

export interface Reward {
    id: string;
    name: string;
    description?: string;
    cost: number;
    repeatable: boolean;
    purchased: boolean;
    createdDate: string;
}

export interface Purchase {
    id: string;
    rewardId: string;
    rewardName: string;
    rewardDescription?: string;
    cost: number;
    purchaseDate: string;
}

export interface PointsBreakdown {
    tasks: number;
    projects: number;
    habits: number;
    streakBonus: number;
    [key: string]: number;
}

export interface UserStats {
    totalPoints: number;
    level: number;
    dailyStreak: number;
    lastActivityDate: string | null;
    pointsBreakdown: PointsBreakdown;
}

export interface Settings {
    tasksPerLevel: number;
}

export interface AppData {
    version: string;
    schemaVersion: number;
    lastUpdated: string;
    tasks: Task[];
    projects: Project[];
    habits: Habit[];
    dailyHabitLogs: HabitLog[];
    expenses: FinanceItem[];
    revenue: FinanceItem[];
    charges: FinanceItem[];
    rewards: Reward[];
    purchaseHistory: Purchase[];
    categories: string[];
    userStats: UserStats;
    settings: Settings;
}

export interface PurchaseResult {
    success: boolean;
    message?: string;
    purchase?: Purchase;
}

export class StorageManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage(): void {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (!existingData) {
            this.createInitialData();
        }
    }

    createInitialData(): void {
        const initialData: AppData = {
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
            }
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }

    getData(): AppData {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) as AppData : this.getDefaultData();
    }

    private getDefaultData(): AppData {
        this.createInitialData();
        return JSON.parse(localStorage.getItem(STORAGE_KEY)!) as AppData;
    }

    saveData(data: AppData): void {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // Task Management
    addTask(task: Partial<Task>): Task {
        const data = this.getData();
        const newTask: Task = {
            ...task,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            completed: false,
            title: task.title || '',
            priority: task.priority || 'medium',
            points: task.points || 10,
            repeatType: task.repeatType || 'none',
        } as Task;
        data.tasks.push(newTask);
        this.saveData(data);
        return newTask;
    }

    updateTask(taskId: string, updates: Partial<Task>): Task | undefined {
        const data = this.getData();
        const task = data.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
            this.saveData(data);
        }
        return task;
    }

    deleteTask(taskId: string): void {
        const data = this.getData();
        data.tasks = data.tasks.filter(t => t.id !== taskId);
        this.saveData(data);
    }

    getTasks(): Task[] {
        const data = this.getData();
        return data.tasks || [];
    }

    // Project Management
    addProject(project: Partial<Project>): Project {
        const data = this.getData();
        const newProject: Project = {
            ...project,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            name: project.name || '',
        } as Project;
        data.projects.push(newProject);
        this.saveData(data);
        return newProject;
    }

    updateProject(projectId: string, updates: Partial<Project>): Project | undefined {
        const data = this.getData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            Object.assign(project, updates);
            this.saveData(data);
        }
        return project;
    }

    deleteProject(projectId: string): void {
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

    getProjects(): Project[] {
        const data = this.getData();
        return data.projects || [];
    }

    // Habit Management
    addHabit(habit: Partial<Habit>): Habit {
        const data = this.getData();
        const newHabit: Habit = {
            ...habit,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            streak: 0,
            lastCompletedDate: null,
            targetGoal: habit.targetGoal || 1,
            name: habit.name || '',
            icon: habit.icon || '⭐',
            points: habit.points || 10,
        } as Habit;
        data.habits.push(newHabit);
        this.saveData(data);
        return newHabit;
    }

    updateHabit(habitId: string, updates: Partial<Habit>): Habit | undefined {
        const data = this.getData();
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            Object.assign(habit, updates);
            if (!habit.targetGoal) habit.targetGoal = 1;
            this.saveData(data);
        }
        return habit;
    }

    deleteHabit(habitId: string): void {
        const data = this.getData();
        data.habits = data.habits.filter(h => h.id !== habitId);
        this.saveData(data);
    }

    getHabits(): Habit[] {
        const data = this.getData();
        return data.habits || [];
    }

    logHabitCompletion(habitId: string, date: Date = new Date()): void {
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

    isHabitCompletedToday(habitId: string): boolean {
        const data = this.getData();
        const todayStr = this.formatDate(new Date());
        return data.dailyHabitLogs.some(log => log.habitId === habitId && log.date === todayStr);
    }

    countHabitCompletionsToday(habitId: string): number {
        const data = this.getData();
        const todayStr = this.formatDate(new Date());
        return data.dailyHabitLogs.filter(log => log.habitId === habitId && log.date === todayStr).length;
    }

    countHabitCompletionsForDate(habitId: string, dateStr: string): number {
        const data = this.getData();
        return data.dailyHabitLogs.filter(log => log.habitId === habitId && log.date === dateStr).length;
    }

    // Finance Management
    addExpense(expense: Partial<FinanceItem>): FinanceItem {
        const data = this.getData();
        const newExpense: FinanceItem = {
            ...expense,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            description: expense.description || '',
            amount: expense.amount || 0,
        } as FinanceItem;
        data.expenses.push(newExpense);
        this.saveData(data);
        return newExpense;
    }

    updateExpense(expenseId: string, updates: Partial<FinanceItem>): FinanceItem | undefined {
        const data = this.getData();
        const expense = data.expenses.find(e => e.id === expenseId);
        if (expense) {
            Object.assign(expense, updates);
            this.saveData(data);
        }
        return expense;
    }

    deleteExpense(expenseId: string): void {
        const data = this.getData();
        data.expenses = data.expenses.filter(e => e.id !== expenseId);
        this.saveData(data);
    }

    getExpenses(): FinanceItem[] {
        const data = this.getData();
        return data.expenses || [];
    }

    addRevenue(revenue: Partial<FinanceItem>): FinanceItem {
        const data = this.getData();
        const newRevenue: FinanceItem = {
            ...revenue,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            description: revenue.description || '',
            amount: revenue.amount || 0,
        } as FinanceItem;
        data.revenue.push(newRevenue);
        this.saveData(data);
        return newRevenue;
    }

    updateRevenue(revenueId: string, updates: Partial<FinanceItem>): FinanceItem | undefined {
        const data = this.getData();
        const item = data.revenue.find(r => r.id === revenueId);
        if (item) {
            Object.assign(item, updates);
            this.saveData(data);
        }
        return item;
    }

    deleteRevenue(revenueId: string): void {
        const data = this.getData();
        data.revenue = data.revenue.filter(r => r.id !== revenueId);
        this.saveData(data);
    }

    getRevenue(): FinanceItem[] {
        const data = this.getData();
        return data.revenue || [];
    }

    // Other Charges Management
    addCharge(charge: Partial<FinanceItem>): FinanceItem {
        const data = this.getData();
        if (!data.charges) {
            data.charges = [];
        }
        const newCharge: FinanceItem = {
            ...charge,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            description: charge.description || '',
            amount: charge.amount || 0,
        } as FinanceItem;
        data.charges.push(newCharge);
        this.saveData(data);
        return newCharge;
    }

    updateCharge(chargeId: string, updates: Partial<FinanceItem>): FinanceItem | undefined {
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

    deleteCharge(chargeId: string): void {
        const data = this.getData();
        if (!data.charges) {
            data.charges = [];
        }
        data.charges = data.charges.filter(c => c.id !== chargeId);
        this.saveData(data);
    }

    getCharges(): FinanceItem[] {
        const data = this.getData();
        return data.charges || [];
    }

    // Rewards Shop Management
    addReward(reward: Partial<Reward>): Reward {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        const newReward: Reward = {
            ...reward,
            id: this.generateId(),
            createdDate: new Date().toISOString(),
            purchased: false,
            repeatable: typeof reward.repeatable === 'undefined' ? true : reward.repeatable,
            name: reward.name || '',
            cost: reward.cost || 0,
        } as Reward;
        data.rewards.push(newReward);
        this.saveData(data);
        return newReward;
    }

    updateReward(rewardId: string, updates: Partial<Reward>): Reward | undefined {
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

    deleteReward(rewardId: string): void {
        const data = this.getData();
        if (!data.rewards) {
            data.rewards = [];
        }
        data.rewards = data.rewards.filter(r => r.id !== rewardId);
        this.saveData(data);
    }

    getRewards(): Reward[] {
        const data = this.getData();
        return data.rewards || [];
    }

    purchaseReward(rewardId: string): PurchaseResult {
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
        const purchase: Purchase = {
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

    getPurchaseHistory(): Purchase[] {
        const data = this.getData();
        return data.purchaseHistory || [];
    }

    // Points Management
    addPoints(amount: number, source: string): void {
        const data = this.getData();
        data.userStats.totalPoints += amount;
        if (data.userStats.pointsBreakdown[source] !== undefined) {
            data.userStats.pointsBreakdown[source] += amount;
        }
        // Level is now calculated based on completed tasks, not points
        this.updateLevel();
        this.saveData(data);
    }

    updateLevel(): void {
        const data = this.getData();
        const settings = this.getSettings();
        const completedTasksCount = data.tasks.filter(t => t.completed).length;
        data.userStats.level = Math.floor(completedTasksCount / settings.tasksPerLevel) + 1;
        this.saveData(data);
    }

    updateDailyStreak(increment: boolean = true): void {
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

    getUserStats(): UserStats {
        const data = this.getData();
        return data.userStats;
    }

    // Utility Methods
    generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    exportData(): string {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString: string): boolean {
        try {
            const data = JSON.parse(jsonString) as Partial<AppData>;
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

    clearAllData(): boolean {
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
    getCategories(): string[] {
        const data = this.getData();
        // Migrate old per-type structure to a single shared array
        if (data.categories && !Array.isArray(data.categories)) {
            const catObj = data.categories as unknown as Record<string, string[]>;
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

    addCategory(categoryName: string): boolean {
        const data = this.getData();
        if (!Array.isArray(data.categories)) data.categories = [];

        const trimmedName = categoryName.trim();
        if (trimmedName && !data.categories.includes(trimmedName)) {
            data.categories.push(trimmedName);
            this.saveData(data);
            return true;
        }
        return false;
    }

    updateCategory(oldName: string, newName: string): boolean {
        const data = this.getData();
        if (!Array.isArray(data.categories)) return false;

        const trimmedNew = newName.trim();
        if (!trimmedNew || data.categories.includes(trimmedNew)) return false;

        const idx = data.categories.indexOf(oldName);
        if (idx === -1) return false;

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

    deleteCategory(categoryName: string): boolean {
        const data = this.getData();
        if (!Array.isArray(data.categories)) return false;

        const idx = data.categories.indexOf(categoryName);
        if (idx === -1) return false;

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
    getSettings(): Settings {
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

    updateSettings(settings: Partial<Settings>): void {
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
