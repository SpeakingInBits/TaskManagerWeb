// ========================
// Storage Management with Versioning
// ========================

const STORAGE_VERSION = '1.0.0';
const STORAGE_KEY = 'taskManagerData';
const DATA_SCHEMA_VERSION = 3;

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

export interface WishItem {
    id: string;
    title: string;
    url?: string;
    price?: number;
    order: number;
    createdDate: string;
    completed?: boolean;
    listId?: string | null;
}

export interface WishList {
    id: string;
    name: string;
    order: number;
    createdDate: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    createdDate: string;
    updatedDate?: string;
}

export interface ShoppingItem {
    id: string;
    name: string;
    quantity?: string;
    completed: boolean;
    createdDate: string;
}

export interface UserStats {
    level: number;
    dailyStreak: number;
    lastActivityDate: string | null;
}

interface LegacyUserStats extends UserStats {
    totalPoints?: number;
    pointsBreakdown?: Record<string, number>;
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
    categories: string[];
    userStats: UserStats;
    settings: Settings;
    wishList: WishItem[];
    wishLists: WishList[];
    notes: Note[];
    shoppingList: ShoppingItem[];
}

export interface ValidationResult {
    isValid: boolean;
    hasPartialData: boolean;
    issues: string[];
    parsed: Partial<AppData> | null;
}

export class StorageManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage(): void {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (!existingData) {
            this.createInitialData();
        } else {
            try {
                const data = JSON.parse(existingData) as Partial<AppData>;
                if (!data.schemaVersion || data.schemaVersion < DATA_SCHEMA_VERSION) {
                    this.migrateToLatest();
                }
            } catch (e) {
                console.error('Failed to read or migrate existing data:', e);
                this.createInitialData();
            }
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
            categories: ['Work', 'Personal', 'Home', 'Shopping', 'Health', 'Fitness', 'Learning', 'Productivity', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Income'],
            userStats: {
                level: 1,
                dailyStreak: 0,
                lastActivityDate: null
            },
            settings: {
                tasksPerLevel: 30
            },
            wishList: [],
            wishLists: [],
            notes: [],
            shoppingList: []
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

        // Update habit streak based on fully-completed consecutive days
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            habit.lastCompletedDate = dateStr;
            habit.streak = this.calculateHabitStreak(habitId, habit.targetGoal, data.dailyHabitLogs);
        }

        this.saveData(data);
    }

    calculateHabitStreak(habitId: string, targetGoal: number, logs: HabitLog[]): number {
        // Count completions per date for this habit
        const habitLogs = logs.filter(l => l.habitId === habitId);
        const countsByDate: Record<string, number> = {};
        for (const log of habitLogs) {
            countsByDate[log.date] = (countsByDate[log.date] || 0) + 1;
        }

        // Get dates where fully completed (>= targetGoal), sorted most recent first
        const completedDates = Object.keys(countsByDate)
            .filter(date => countsByDate[date] >= targetGoal)
            .sort()
            .reverse();

        if (completedDates.length === 0) return 0;

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
            } else {
                break;
            }
        }

        return streak;
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

    // Wish List Management
    addWishItem(item: Partial<WishItem>): WishItem {
        const data = this.getData();
        if (!data.wishList) data.wishList = [];
        const newItem: WishItem = {
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

    updateWishItem(itemId: string, updates: Partial<WishItem>): WishItem | undefined {
        const data = this.getData();
        if (!data.wishList) data.wishList = [];
        const item = data.wishList.find(w => w.id === itemId);
        if (item) {
            Object.assign(item, updates);
            this.saveData(data);
        }
        return item;
    }

    deleteWishItem(itemId: string): void {
        const data = this.getData();
        if (!data.wishList) data.wishList = [];
        data.wishList = data.wishList.filter(w => w.id !== itemId);
        // Re-index order values
        data.wishList.forEach((w, idx) => { w.order = idx; });
        this.saveData(data);
    }

    getWishItems(): WishItem[] {
        const data = this.getData();
        if (!data.wishList) return [];
        return data.wishList.slice().sort((a, b) => a.order - b.order);
    }

    reorderWishItems(orderedIds: string[]): void {
        const data = this.getData();
        if (!data.wishList) return;
        orderedIds.forEach((id, idx) => {
            const item = data.wishList.find(w => w.id === id);
            if (item) item.order = idx;
        });
        this.saveData(data);
    }

    // Named Wish Lists Management
    getWishLists(): WishList[] {
        const data = this.getData();
        if (!data.wishLists) return [];
        return data.wishLists.slice().sort((a, b) => a.order - b.order);
    }

    addWishList(list: Partial<WishList>): WishList {
        const data = this.getData();
        if (!data.wishLists) data.wishLists = [];
        const newList: WishList = {
            id: this.generateId(),
            name: list.name || '',
            order: data.wishLists.length,
            createdDate: new Date().toISOString(),
        };
        data.wishLists.push(newList);
        this.saveData(data);
        return newList;
    }

    updateWishList(listId: string, updates: Partial<WishList>): WishList | undefined {
        const data = this.getData();
        if (!data.wishLists) data.wishLists = [];
        const list = data.wishLists.find(l => l.id === listId);
        if (list) {
            Object.assign(list, updates);
            this.saveData(data);
        }
        return list;
    }

    deleteWishList(listId: string): void {
        const data = this.getData();
        if (!data.wishLists) data.wishLists = [];
        data.wishLists = data.wishLists.filter(l => l.id !== listId);
        // Re-index order values
        data.wishLists.forEach((l, idx) => { l.order = idx; });
        // Move items in the deleted list to uncategorized
        if (data.wishList) {
            data.wishList = data.wishList.map(item =>
                item.listId === listId ? { ...item, listId: null } : item
            );
        }
        this.saveData(data);
    }

    reorderWishLists(orderedIds: string[]): void {
        const data = this.getData();
        if (!data.wishLists) return;
        orderedIds.forEach((id, idx) => {
            const list = data.wishLists.find(l => l.id === id);
            if (list) list.order = idx;
        });
        this.saveData(data);
    }

    // Note Management
    addNote(note: Partial<Note>): Note {
        const data = this.getData();
        if (!data.notes) data.notes = [];
        const newNote: Note = {
            id: this.generateId(),
            title: note.title || '',
            content: note.content || '',
            createdDate: new Date().toISOString(),
        };
        data.notes.push(newNote);
        this.saveData(data);
        return newNote;
    }

    updateNote(noteId: string, updates: Partial<Note>): Note | undefined {
        const data = this.getData();
        if (!data.notes) data.notes = [];
        const note = data.notes.find(n => n.id === noteId);
        if (note) {
            Object.assign(note, updates);
            note.updatedDate = new Date().toISOString();
            this.saveData(data);
        }
        return note;
    }

    deleteNote(noteId: string): void {
        const data = this.getData();
        if (!data.notes) data.notes = [];
        data.notes = data.notes.filter(n => n.id !== noteId);
        this.saveData(data);
    }

    getNotes(): Note[] {
        const data = this.getData();
        if (!data.notes) return [];
        return data.notes.slice().sort((a, b) =>
            new Date(b.updatedDate ?? b.createdDate).getTime() - new Date(a.updatedDate ?? a.createdDate).getTime()
        );
    }

    // Shopping List Management
    addShoppingItem(item: Partial<ShoppingItem>): ShoppingItem {
        const data = this.getData();
        if (!data.shoppingList) data.shoppingList = [];
        const newItem: ShoppingItem = {
            id: this.generateId(),
            name: item.name || '',
            quantity: item.quantity,
            completed: false,
            createdDate: new Date().toISOString(),
        };
        data.shoppingList.push(newItem);
        this.saveData(data);
        return newItem;
    }

    updateShoppingItem(itemId: string, updates: Partial<ShoppingItem>): ShoppingItem | undefined {
        const data = this.getData();
        if (!data.shoppingList) data.shoppingList = [];
        const item = data.shoppingList.find(s => s.id === itemId);
        if (item) {
            Object.assign(item, updates);
            this.saveData(data);
        }
        return item;
    }

    deleteShoppingItem(itemId: string): void {
        const data = this.getData();
        if (!data.shoppingList) data.shoppingList = [];
        data.shoppingList = data.shoppingList.filter(s => s.id !== itemId);
        this.saveData(data);
    }

    getShoppingItems(): ShoppingItem[] {
        const data = this.getData();
        if (!data.shoppingList) return [];
        return data.shoppingList.slice().sort((a, b) =>
            new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        );
    }

    clearCompletedShoppingItems(): void {
        const data = this.getData();
        if (!data.shoppingList) return;
        data.shoppingList = data.shoppingList.filter(s => !s.completed);
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

    validateImportData(jsonString: string): ValidationResult {
        try {
            const data = JSON.parse(jsonString) as Partial<AppData>;
            const issues: string[] = [];

            if (!data.version) issues.push('Missing version field');
            if (data.tasks === undefined) issues.push('Missing tasks field');
            else if (!Array.isArray(data.tasks)) issues.push('Tasks is not an array');
            if (data.projects === undefined) issues.push('Missing projects field');
            else if (!Array.isArray(data.projects)) issues.push('Projects is not an array');

            const isValid = issues.length === 0;
            const hasPartialData = !isValid && typeof data === 'object' && data !== null &&
                (data.tasks !== undefined || data.projects !== undefined || data.version !== undefined ||
                 data.habits !== undefined || data.userStats !== undefined || data.settings !== undefined);

            return { isValid, hasPartialData, issues, parsed: data };
        } catch (e) {
            return { isValid: false, hasPartialData: false, issues: ['Invalid JSON format'], parsed: null };
        }
    }

    private buildMigratedData(data: Partial<AppData>): AppData {
        const now = new Date().toISOString();

        // Handle category migration (old per-type structure → flat array)
        let categories: string[];
        if (data.categories && !Array.isArray(data.categories)) {
            const catObj = data.categories as unknown as Record<string, string[]>;
            categories = [...new Set([
                ...(catObj['tasks'] || []),
                ...(catObj['habits'] || []),
                ...(catObj['finance'] || [])
            ])];
        } else if (Array.isArray(data.categories) && data.categories.length > 0) {
            categories = data.categories;
        } else {
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
            categories,
            userStats: {
                level: (data.userStats as LegacyUserStats)?.level ?? 1,
                dailyStreak: (data.userStats as LegacyUserStats)?.dailyStreak ?? 0,
                lastActivityDate: (data.userStats as LegacyUserStats)?.lastActivityDate ?? null,
            },
            settings: data.settings || { tasksPerLevel: 30 },
            wishList: Array.isArray(data.wishList) ? data.wishList : [],
            wishLists: Array.isArray(data.wishLists) ? data.wishLists : [],
            notes: Array.isArray(data.notes) ? data.notes : [],
            shoppingList: Array.isArray(data.shoppingList) ? data.shoppingList : [],
        };
    }

    migrateAndImport(data: Partial<AppData>): boolean {
        try {
            const migrated = this.buildMigratedData(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return true;
        } catch (e) {
            console.error('Migration error:', e);
            return false;
        }
    }

    migrateToLatest(): boolean {
        try {
            const data = this.getData();
            const migrated = this.buildMigratedData(data);
            this.saveData(migrated);
            return true;
        } catch (e) {
            console.error('Migration error:', e);
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

export function getDaysUntilDueText(dueDate: string): string {
    const todayStr = storage.formatDate(new Date());
    const todayMs = new Date(todayStr + 'T00:00:00').getTime();
    const dueMs = new Date(dueDate + 'T00:00:00').getTime();
    const days = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
}
