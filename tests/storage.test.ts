import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '../src/storage';
import type { Task, Habit, FinanceItem, Reward } from '../src/storage';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock confirm/alert since they're used in clearAllData
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('alert', vi.fn());

describe('StorageManager', () => {
    let storage: StorageManager;

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        storage = new StorageManager();
    });

    // ========================
    // Initialization
    // ========================
    describe('initialization', () => {
        it('should create initial data if none exists', () => {
            const data = storage.getData();
            expect(data).toBeDefined();
            expect(data.version).toBe('1.0.0');
            expect(data.tasks).toEqual([]);
            expect(data.projects).toEqual([]);
            expect(data.habits).toEqual([]);
            expect(data.categories).toContain('Work');
            expect(data.userStats.totalPoints).toBe(0);
            expect(data.userStats.level).toBe(1);
        });

        it('should not overwrite existing data', () => {
            storage.addTask({ title: 'Test Task' });
            const storage2 = new StorageManager();
            expect(storage2.getTasks().length).toBe(1);
        });
    });

    // ========================
    // Task Management
    // ========================
    describe('task management', () => {
        it('should add a task', () => {
            const task = storage.addTask({ title: 'Buy groceries', priority: 'high', points: 15 });
            expect(task.id).toBeDefined();
            expect(task.title).toBe('Buy groceries');
            expect(task.priority).toBe('high');
            expect(task.points).toBe(15);
            expect(task.completed).toBe(false);
            expect(task.createdDate).toBeDefined();
        });

        it('should get all tasks', () => {
            storage.addTask({ title: 'Task 1' });
            storage.addTask({ title: 'Task 2' });
            const tasks = storage.getTasks();
            expect(tasks.length).toBe(2);
        });

        it('should update a task', () => {
            const task = storage.addTask({ title: 'Old title' });
            const updated = storage.updateTask(task.id, { title: 'New title' });
            expect(updated?.title).toBe('New title');
        });

        it('should return undefined when updating non-existent task', () => {
            const result = storage.updateTask('nonexistent', { title: 'Test' });
            expect(result).toBeUndefined();
        });

        it('should delete a task', () => {
            const task = storage.addTask({ title: 'To delete' });
            storage.deleteTask(task.id);
            expect(storage.getTasks().length).toBe(0);
        });

        it('should set default values for task fields', () => {
            const task = storage.addTask({ title: 'Minimal' });
            expect(task.priority).toBe('medium');
            expect(task.points).toBe(10);
            expect(task.repeatType).toBe('none');
        });
    });

    // ========================
    // Project Management
    // ========================
    describe('project management', () => {
        it('should add a project', () => {
            const project = storage.addProject({ name: 'Website Redesign', color: 'blue' });
            expect(project.id).toBeDefined();
            expect(project.name).toBe('Website Redesign');
            expect(project.color).toBe('blue');
        });

        it('should get all projects', () => {
            storage.addProject({ name: 'Project 1' });
            storage.addProject({ name: 'Project 2' });
            expect(storage.getProjects().length).toBe(2);
        });

        it('should update a project', () => {
            const project = storage.addProject({ name: 'Old Name' });
            const updated = storage.updateProject(project.id, { name: 'New Name' });
            expect(updated?.name).toBe('New Name');
        });

        it('should delete a project and unlink tasks', () => {
            const project = storage.addProject({ name: 'To Delete' });
            storage.addTask({ title: 'Linked Task', projectId: project.id });
            storage.deleteProject(project.id);
            expect(storage.getProjects().length).toBe(0);
            const tasks = storage.getTasks();
            expect(tasks[0].projectId).toBeNull();
        });
    });

    // ========================
    // Habit Management
    // ========================
    describe('habit management', () => {
        it('should add a habit', () => {
            const habit = storage.addHabit({ name: 'Exercise', icon: '💪', points: 20 });
            expect(habit.id).toBeDefined();
            expect(habit.name).toBe('Exercise');
            expect(habit.streak).toBe(0);
            expect(habit.targetGoal).toBe(1);
        });

        it('should get all habits', () => {
            storage.addHabit({ name: 'Read' });
            storage.addHabit({ name: 'Meditate' });
            expect(storage.getHabits().length).toBe(2);
        });

        it('should update a habit', () => {
            const habit = storage.addHabit({ name: 'Read' });
            storage.updateHabit(habit.id, { name: 'Read Books', targetGoal: 3 });
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.name).toBe('Read Books');
            expect(updated?.targetGoal).toBe(3);
        });

        it('should delete a habit', () => {
            const habit = storage.addHabit({ name: 'To Delete' });
            storage.deleteHabit(habit.id);
            expect(storage.getHabits().length).toBe(0);
        });

        it('should log habit completion and set streak to 1 when targetGoal met', () => {
            const habit = storage.addHabit({ name: 'Exercise' });
            storage.logHabitCompletion(habit.id, new Date());
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.streak).toBe(1);
        });

        it('should not increment streak when targetGoal is not yet met', () => {
            const habit = storage.addHabit({ name: 'Drink Water', targetGoal: 10 });
            storage.logHabitCompletion(habit.id, new Date());
            storage.logHabitCompletion(habit.id, new Date());
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.streak).toBe(0);
        });

        it('should set streak to 1 when targetGoal is fully met', () => {
            const habit = storage.addHabit({ name: 'Drink Water', targetGoal: 3 });
            storage.logHabitCompletion(habit.id, new Date());
            storage.logHabitCompletion(habit.id, new Date());
            storage.logHabitCompletion(habit.id, new Date());
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.streak).toBe(1);
        });

        it('should count consecutive fully-completed days as streak', () => {
            const habit = storage.addHabit({ name: 'Exercise' });
            const day1 = new Date(2025, 0, 13);
            const day2 = new Date(2025, 0, 14);
            const day3 = new Date(2025, 0, 15);
            storage.logHabitCompletion(habit.id, day1);
            storage.logHabitCompletion(habit.id, day2);
            storage.logHabitCompletion(habit.id, day3);
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.streak).toBe(3);
        });

        it('should reset streak count when there is a gap between completed days', () => {
            const habit = storage.addHabit({ name: 'Exercise' });
            const day1 = new Date(2025, 0, 13);
            const day3 = new Date(2025, 0, 15);
            storage.logHabitCompletion(habit.id, day1);
            storage.logHabitCompletion(habit.id, day3);
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.streak).toBe(1);
        });

        it('should extend streak when retroactively completing a missed day', () => {
            const habit = storage.addHabit({ name: 'Exercise' });
            const day1 = new Date(2025, 0, 13);
            const day2 = new Date(2025, 0, 14);
            const day3 = new Date(2025, 0, 15);
            storage.logHabitCompletion(habit.id, day1);
            storage.logHabitCompletion(habit.id, day3);
            // Streak is 1 (gap at day2)
            storage.logHabitCompletion(habit.id, day2);
            // Now day1, day2, day3 are all complete → streak = 3
            const updated = storage.getHabits().find(h => h.id === habit.id);
            expect(updated?.streak).toBe(3);
        });

        it('should count habit completions for today', () => {
            const habit = storage.addHabit({ name: 'Push-ups', targetGoal: 3 });
            storage.logHabitCompletion(habit.id, new Date());
            storage.logHabitCompletion(habit.id, new Date());
            expect(storage.countHabitCompletionsToday(habit.id)).toBe(2);
        });

        it('should check if habit is completed today', () => {
            const habit = storage.addHabit({ name: 'Meditate' });
            expect(storage.isHabitCompletedToday(habit.id)).toBe(false);
            storage.logHabitCompletion(habit.id, new Date());
            expect(storage.isHabitCompletedToday(habit.id)).toBe(true);
        });

        it('should count habit completions for a specific date', () => {
            const habit = storage.addHabit({ name: 'Exercise' });
            const date = new Date(2025, 0, 15);
            storage.logHabitCompletion(habit.id, date);
            storage.logHabitCompletion(habit.id, date);
            expect(storage.countHabitCompletionsForDate(habit.id, '2025-01-15')).toBe(2);
            expect(storage.countHabitCompletionsForDate(habit.id, '2025-01-16')).toBe(0);
        });

        it('should calculate streak correctly using calculateHabitStreak', () => {
            const habit = storage.addHabit({ name: 'Drink Water', targetGoal: 2 });
            const day1 = new Date(2025, 0, 13);
            const day2 = new Date(2025, 0, 14);
            storage.logHabitCompletion(habit.id, day1);
            storage.logHabitCompletion(habit.id, day1);
            storage.logHabitCompletion(habit.id, day2);
            storage.logHabitCompletion(habit.id, day2);
            const data = storage.getData();
            const streak = storage.calculateHabitStreak(habit.id, habit.targetGoal, data.dailyHabitLogs);
            expect(streak).toBe(2);
        });
    });

    // ========================
    // Finance Management
    // ========================
    describe('expense management', () => {
        it('should add an expense', () => {
            const expense = storage.addExpense({ description: 'Coffee', amount: 4.50, date: '2025-01-15' });
            expect(expense.id).toBeDefined();
            expect(expense.description).toBe('Coffee');
            expect(expense.amount).toBe(4.50);
        });

        it('should get all expenses', () => {
            storage.addExpense({ description: 'Coffee', amount: 4.50 });
            storage.addExpense({ description: 'Lunch', amount: 12.00 });
            expect(storage.getExpenses().length).toBe(2);
        });

        it('should update an expense', () => {
            const expense = storage.addExpense({ description: 'Cofee', amount: 4.50 });
            storage.updateExpense(expense.id, { description: 'Coffee' });
            const updated = storage.getExpenses().find(e => e.id === expense.id);
            expect(updated?.description).toBe('Coffee');
        });

        it('should delete an expense', () => {
            const expense = storage.addExpense({ description: 'To Delete', amount: 10 });
            storage.deleteExpense(expense.id);
            expect(storage.getExpenses().length).toBe(0);
        });
    });

    describe('revenue management', () => {
        it('should add revenue', () => {
            const rev = storage.addRevenue({ description: 'Salary', amount: 5000 });
            expect(rev.id).toBeDefined();
            expect(rev.amount).toBe(5000);
        });

        it('should update revenue', () => {
            const rev = storage.addRevenue({ description: 'Salary', amount: 5000 });
            storage.updateRevenue(rev.id, { amount: 5500 });
            const updated = storage.getRevenue().find(r => r.id === rev.id);
            expect(updated?.amount).toBe(5500);
        });

        it('should delete revenue', () => {
            const rev = storage.addRevenue({ description: 'Salary', amount: 5000 });
            storage.deleteRevenue(rev.id);
            expect(storage.getRevenue().length).toBe(0);
        });
    });

    describe('charge management', () => {
        it('should add a charge', () => {
            const charge = storage.addCharge({ description: 'Rent', amount: 1200 });
            expect(charge.id).toBeDefined();
            expect(charge.description).toBe('Rent');
        });

        it('should update a charge', () => {
            const charge = storage.addCharge({ description: 'Rent', amount: 1200 });
            storage.updateCharge(charge.id, { amount: 1300 });
            const updated = storage.getCharges().find(c => c.id === charge.id);
            expect(updated?.amount).toBe(1300);
        });

        it('should delete a charge', () => {
            const charge = storage.addCharge({ description: 'Rent', amount: 1200 });
            storage.deleteCharge(charge.id);
            expect(storage.getCharges().length).toBe(0);
        });
    });

    // ========================
    // Rewards Shop
    // ========================
    describe('rewards shop', () => {
        it('should add a reward', () => {
            const reward = storage.addReward({ name: 'Movie Night', cost: 100 });
            expect(reward.id).toBeDefined();
            expect(reward.name).toBe('Movie Night');
            expect(reward.repeatable).toBe(true);
            expect(reward.purchased).toBe(false);
        });

        it('should update a reward', () => {
            const reward = storage.addReward({ name: 'Movie', cost: 100 });
            storage.updateReward(reward.id, { name: 'Movie Night', cost: 150 });
            const updated = storage.getRewards().find(r => r.id === reward.id);
            expect(updated?.name).toBe('Movie Night');
            expect(updated?.cost).toBe(150);
        });

        it('should delete a reward', () => {
            const reward = storage.addReward({ name: 'Movie Night', cost: 100 });
            storage.deleteReward(reward.id);
            expect(storage.getRewards().length).toBe(0);
        });

        it('should purchase a reward and deduct points', () => {
            storage.addPoints(200, 'tasks');
            const reward = storage.addReward({ name: 'Movie Night', cost: 100 });
            const result = storage.purchaseReward(reward.id);
            expect(result.success).toBe(true);
            expect(storage.getUserStats().totalPoints).toBe(100);
            expect(storage.getPurchaseHistory().length).toBe(1);
        });

        it('should fail to purchase with insufficient points', () => {
            const reward = storage.addReward({ name: 'Expensive', cost: 9999 });
            const result = storage.purchaseReward(reward.id);
            expect(result.success).toBe(false);
            expect(result.message).toBe('Not enough points');
        });

        it('should prevent re-purchasing one-time rewards', () => {
            storage.addPoints(500, 'tasks');
            const reward = storage.addReward({ name: 'One-time', cost: 100, repeatable: false });
            storage.purchaseReward(reward.id);
            const result = storage.purchaseReward(reward.id);
            expect(result.success).toBe(false);
            expect(result.message).toBe('This reward can only be purchased once.');
        });

        it('should allow re-purchasing repeatable rewards', () => {
            storage.addPoints(500, 'tasks');
            const reward = storage.addReward({ name: 'Repeatable', cost: 100, repeatable: true });
            storage.purchaseReward(reward.id);
            const result = storage.purchaseReward(reward.id);
            expect(result.success).toBe(true);
        });

        it('should fail for non-existent reward', () => {
            const result = storage.purchaseReward('nonexistent');
            expect(result.success).toBe(false);
            expect(result.message).toBe('Reward not found');
        });
    });

    // ========================
    // Points & Leveling
    // ========================
    describe('points and leveling', () => {
        it('should add points', () => {
            storage.addPoints(50, 'tasks');
            expect(storage.getUserStats().totalPoints).toBe(50);
            expect(storage.getUserStats().pointsBreakdown.tasks).toBe(50);
        });

        it('should calculate level based on completed tasks', () => {
            // Default: 30 tasks per level
            for (let i = 0; i < 31; i++) {
                const task = storage.addTask({ title: `Task ${i}` });
                storage.updateTask(task.id, { completed: true });
            }
            storage.updateLevel();
            const data = storage.getData();
            expect(data.userStats.level).toBe(2); // 31 / 30 = 1.03, floor + 1 = 2
        });

        it('should update daily streak', () => {
            storage.updateDailyStreak(true);
            expect(storage.getUserStats().dailyStreak).toBe(1);
        });
    });

    // ========================
    // Categories
    // ========================
    describe('category management', () => {
        it('should get default categories', () => {
            const categories = storage.getCategories();
            expect(categories).toContain('Work');
            expect(categories).toContain('Personal');
        });

        it('should add a new category', () => {
            const result = storage.addCategory('Custom');
            expect(result).toBe(true);
            expect(storage.getCategories()).toContain('Custom');
        });

        it('should not add duplicate categories', () => {
            const result = storage.addCategory('Work');
            expect(result).toBe(false);
        });

        it('should not add empty categories', () => {
            const result = storage.addCategory('  ');
            expect(result).toBe(false);
        });

        it('should update a category and propagate to items', () => {
            storage.addTask({ title: 'Test', category: 'Work' });
            storage.addHabit({ name: 'Test', category: 'Work' });
            const result = storage.updateCategory('Work', 'Career');
            expect(result).toBe(true);
            expect(storage.getCategories()).toContain('Career');
            expect(storage.getCategories()).not.toContain('Work');
            expect(storage.getTasks()[0].category).toBe('Career');
            expect(storage.getHabits()[0].category).toBe('Career');
        });

        it('should not update to an existing category name', () => {
            const result = storage.updateCategory('Work', 'Personal');
            expect(result).toBe(false);
        });

        it('should delete a category and clear from items', () => {
            storage.addTask({ title: 'Test', category: 'Work' });
            const result = storage.deleteCategory('Work');
            expect(result).toBe(true);
            expect(storage.getCategories()).not.toContain('Work');
            expect(storage.getTasks()[0].category).toBeNull();
        });
    });

    // ========================
    // Settings
    // ========================
    describe('settings management', () => {
        it('should return default settings', () => {
            const settings = storage.getSettings();
            expect(settings.tasksPerLevel).toBe(30);
        });

        it('should update settings', () => {
            storage.updateSettings({ tasksPerLevel: 50 });
            expect(storage.getSettings().tasksPerLevel).toBe(50);
        });
    });

    // ========================
    // Data Export/Import
    // ========================
    describe('data export and import', () => {
        it('should export data as JSON string', () => {
            storage.addTask({ title: 'Test' });
            const exported = storage.exportData();
            const parsed = JSON.parse(exported);
            expect(parsed.tasks.length).toBe(1);
        });

        it('should import valid data', () => {
            const data = {
                version: '1.0.0',
                tasks: [{ id: '1', title: 'Imported', completed: false }],
                projects: [],
            };
            const result = storage.importData(JSON.stringify(data));
            expect(result).toBe(true);
        });

        it('should reject invalid JSON', () => {
            const result = storage.importData('not json');
            expect(result).toBe(false);
        });

        it('should reject data without required fields', () => {
            const result = storage.importData(JSON.stringify({ foo: 'bar' }));
            expect(result).toBe(false);
        });
    });

    // ========================
    // Utility Methods
    // ========================
    describe('utility methods', () => {
        it('should generate unique IDs', () => {
            const id1 = storage.generateId();
            const id2 = storage.generateId();
            expect(id1).not.toBe(id2);
        });

        it('should format date correctly', () => {
            const date = new Date(2025, 0, 5); // January 5, 2025
            expect(storage.formatDate(date)).toBe('2025-01-05');
        });

        it('should format date with padding', () => {
            const date = new Date(2025, 8, 9); // September 9, 2025
            expect(storage.formatDate(date)).toBe('2025-09-09');
        });
    });

    // ========================
    // Wish List
    // ========================
    describe('wish list management', () => {
        it('should add a wish item', () => {
            const item = storage.addWishItem({ title: 'New Laptop', url: 'https://example.com', price: 999.99 });
            expect(item.id).toBeDefined();
            expect(item.title).toBe('New Laptop');
            expect(item.url).toBe('https://example.com');
            expect(item.price).toBe(999.99);
            expect(item.order).toBe(0);
            expect(item.createdDate).toBeDefined();
        });

        it('should add a wish item with only title', () => {
            const item = storage.addWishItem({ title: 'Guitar' });
            expect(item.title).toBe('Guitar');
            expect(item.url).toBeUndefined();
            expect(item.price).toBeUndefined();
        });

        it('should get all wish items sorted by order', () => {
            storage.addWishItem({ title: 'Item A' });
            storage.addWishItem({ title: 'Item B' });
            storage.addWishItem({ title: 'Item C' });
            const items = storage.getWishItems();
            expect(items.length).toBe(3);
            expect(items[0].order).toBeLessThanOrEqual(items[1].order);
            expect(items[1].order).toBeLessThanOrEqual(items[2].order);
        });

        it('should update a wish item', () => {
            const item = storage.addWishItem({ title: 'Old Title', price: 50 });
            const updated = storage.updateWishItem(item.id, { title: 'New Title', price: 75 });
            expect(updated?.title).toBe('New Title');
            expect(updated?.price).toBe(75);
        });

        it('should return undefined when updating non-existent wish item', () => {
            const result = storage.updateWishItem('nonexistent', { title: 'Test' });
            expect(result).toBeUndefined();
        });

        it('should delete a wish item and re-index order', () => {
            storage.addWishItem({ title: 'Item A' });
            const itemB = storage.addWishItem({ title: 'Item B' });
            storage.addWishItem({ title: 'Item C' });
            storage.deleteWishItem(itemB.id);
            const items = storage.getWishItems();
            expect(items.length).toBe(2);
            expect(items[0].order).toBe(0);
            expect(items[1].order).toBe(1);
        });

        it('should reorder wish items', () => {
            const a = storage.addWishItem({ title: 'Item A' });
            const b = storage.addWishItem({ title: 'Item B' });
            const c = storage.addWishItem({ title: 'Item C' });
            storage.reorderWishItems([c.id, a.id, b.id]);
            const items = storage.getWishItems();
            expect(items[0].title).toBe('Item C');
            expect(items[1].title).toBe('Item A');
            expect(items[2].title).toBe('Item B');
        });
    });

    // ========================
    // Clear All Data
    // ========================
    describe('clearAllData', () => {
        it('should clear all data and reinitialize', () => {
            storage.addTask({ title: 'To be cleared' });
            expect(storage.getTasks().length).toBe(1);
            storage.clearAllData();
            expect(storage.getTasks().length).toBe(0);
        });
    });
});
