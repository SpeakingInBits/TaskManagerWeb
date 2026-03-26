import { test, expect } from '@playwright/test';

test.describe('Task Manager App', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Clear localStorage to start fresh
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForSelector('.header');
    });

    // ========================
    // Page Load & Navigation
    // ========================
    test.describe('page load and navigation', () => {
        test('should load the app and display header', async ({ page }) => {
            await expect(page.locator('h1')).toContainText('Task Manager');
        });

        test('should show dashboard tab by default', async ({ page }) => {
            await expect(page.locator('#dashboard-tab')).toBeVisible();
        });

        test('should display header stats', async ({ page }) => {
            await expect(page.locator('#userLevel')).toHaveText('1');
            await expect(page.locator('#dailyStreak')).toHaveText('0');
        });

        test('should switch to tasks tab', async ({ page }) => {
            await page.click('[data-tab="tasks"]');
            await expect(page.locator('#tasks-tab')).toBeVisible();
            await expect(page.locator('#tasks-tab h2')).toHaveText('Tasks');
        });

        test('should switch to projects tab', async ({ page }) => {
            await page.click('[data-tab="projects"]');
            await expect(page.locator('#projects-tab')).toBeVisible();
        });

        test('should switch to habits tab', async ({ page }) => {
            await page.click('[data-tab="habits"]');
            await expect(page.locator('#habits-tab')).toBeVisible();
        });

        test('should switch to finances tab', async ({ page }) => {
            await page.click('[data-tab="finances"]');
            await expect(page.locator('#finances-tab')).toBeVisible();
        });

        test('should switch to settings tab', async ({ page }) => {
            await page.click('[data-tab="settings"]');
            await expect(page.locator('#settings-tab')).toBeVisible();
        });
    });

    // ========================
    // Task CRUD
    // ========================
    test.describe('task management', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-tab="tasks"]');
        });

        test('should show empty state initially', async ({ page }) => {
            await expect(page.locator('#taskList .empty-state')).toBeVisible();
        });

        test('should open and close task modal', async ({ page }) => {
            await page.click('#addTaskBtn');
            await expect(page.locator('#taskModal')).toHaveClass(/active/);
            await page.click('#cancelTaskBtn');
            await expect(page.locator('#taskModal')).not.toHaveClass(/active/);
        });

        test('should create a new task', async ({ page }) => {
            await page.click('#addTaskBtn');
            await page.fill('#taskTitle', 'Buy groceries');
            await page.fill('#taskDescription', 'Milk, eggs, bread');
            await page.click('#taskForm button[type="submit"]');

            await expect(page.locator('#taskModal')).not.toHaveClass(/active/);
            await expect(page.locator('.task-item')).toBeVisible();
            await expect(page.locator('.task-title')).toContainText('Buy groceries');
        });

        test('should complete a task via checkbox', async ({ page }) => {
            // Create task first
            await page.click('#addTaskBtn');
            await page.fill('#taskTitle', 'Test completion');
            await page.click('#taskForm button[type="submit"]');

            // Complete it
            await page.click('.task-checkbox');
            await expect(page.locator('.task-item')).toHaveClass(/completed/);
        });

        test('should delete a task', async ({ page }) => {
            // Create task
            await page.click('#addTaskBtn');
            await page.fill('#taskTitle', 'To be deleted');
            await page.click('#taskForm button[type="submit"]');

            // Open task for editing
            await page.click('.task-item .task-content');

            // Confirm deletion
            page.on('dialog', dialog => dialog.accept());
            await page.click('#deleteTaskBtn');

            await expect(page.locator('#taskList .empty-state')).toBeVisible();
        });

        test('should filter tasks by search', async ({ page }) => {
            // Create two tasks
            await page.click('#addTaskBtn');
            await page.fill('#taskTitle', 'Apples');
            await page.click('#taskForm button[type="submit"]');

            await page.click('#addTaskBtn');
            await page.fill('#taskTitle', 'Oranges');
            await page.click('#taskForm button[type="submit"]');

            // Search
            await page.fill('#searchTasks', 'Apples');
            await expect(page.locator('.task-title')).toHaveCount(1);
            await expect(page.locator('.task-title')).toContainText('Apples');
        });
    });

    // ========================
    // Project CRUD
    // ========================
    test.describe('project management', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-tab="projects"]');
        });

        test('should show empty state initially', async ({ page }) => {
            await expect(page.locator('#projectsList .empty-state')).toBeVisible();
        });

        test('should create a new project', async ({ page }) => {
            await page.click('#addProjectBtn');
            await page.fill('#projectName', 'Website Redesign');
            await page.fill('#projectDescription', 'Redo the company website');
            await page.fill('#projectColor', '#10b981');
            await page.click('#projectForm button[type="submit"]');

            await expect(page.locator('#projectModal')).not.toHaveClass(/active/);
            await expect(page.locator('.project-card')).toBeVisible();
            await expect(page.locator('.project-title')).toContainText('Website Redesign');
        });
    });

    // ========================
    // Habit CRUD
    // ========================
    test.describe('habit management', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-tab="habits"]');
        });

        test('should show empty state initially', async ({ page }) => {
            await expect(page.locator('#habitsList .empty-state')).toBeVisible();
        });

        test('should create a new habit', async ({ page }) => {
            await page.click('#addHabitBtn');
            await page.fill('#habitName', 'Exercise');
            await page.fill('#habitDescription', '30 min workout');
            await page.click('#habitForm button[type="submit"]');

            await expect(page.locator('#habitModal')).not.toHaveClass(/active/);
            await expect(page.locator('.habit-card')).toBeVisible();
            await expect(page.locator('.habit-name')).toContainText('Exercise');
        });

        test('should complete a habit', async ({ page }) => {
            // Create habit
            await page.click('#addHabitBtn');
            await page.fill('#habitName', 'Meditate');
            await page.click('#habitForm button[type="submit"]');

            // Complete it
            await page.click('.habit-checkbox');
            await expect(page.locator('.habit-checkbox')).toContainText('Done for Today');
        });
    });

    // ========================
    // Finance CRUD
    // ========================
    test.describe('finance management', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-tab="finances"]');
        });

        test('should show financial summary', async ({ page }) => {
            await expect(page.locator('#totalIncome')).toHaveText('$0.00');
            await expect(page.locator('#totalExpenses')).toHaveText('$0.00');
            await expect(page.locator('#netBalance')).toHaveText('$0.00');
        });

        test('should add an expense', async ({ page }) => {
            await page.click('#addExpenseBtn');
            await page.fill('#financeDescription', 'Coffee');
            await page.fill('#financeAmount', '4.50');
            await page.click('#financeForm button[type="submit"]');

            await expect(page.locator('#financeModal')).not.toHaveClass(/active/);
            await expect(page.locator('.finance-item')).toBeVisible();
        });

        test('should add revenue', async ({ page }) => {
            await page.click('#addRevenueBtn');
            await page.fill('#financeDescription', 'Salary');
            await page.fill('#financeAmount', '5000');
            await page.click('#financeForm button[type="submit"]');

            // Switch to revenue tab to see it
            await page.click('[data-finance-tab="revenue"]');
            await expect(page.locator('.finance-item')).toBeVisible();
        });

        test('should switch between finance tabs', async ({ page }) => {
            await page.click('[data-finance-tab="revenue"]');
            await expect(page.locator('#revenue-content')).toHaveClass(/active/);

            await page.click('[data-finance-tab="charts"]');
            await expect(page.locator('#charts-content')).toHaveClass(/active/);

            await page.click('[data-finance-tab="expenses"]');
            await expect(page.locator('#expenses-content')).toHaveClass(/active/);
        });
    });

    // ========================
    // Date Navigation
    // ========================
    test.describe('date navigation', () => {
        test('should show today by default', async ({ page }) => {
            await expect(page.locator('#selectedDateDisplay')).toContainText('Today');
        });

        test('should navigate to previous day', async ({ page }) => {
            await page.click('#prevDayBtn');
            await expect(page.locator('#selectedDateDisplay')).not.toContainText('Today');
            await expect(page.locator('#goTodayBtn')).toBeVisible();
        });

        test('should return to today via button', async ({ page }) => {
            await page.click('#prevDayBtn');
            await page.click('#goTodayBtn');
            await expect(page.locator('#selectedDateDisplay')).toContainText('Today');
        });

        test('should reload active tab data when returning to today', async ({ page }) => {
            // Switch to habits tab
            await page.click('[data-tab="habits"]');
            await expect(page.locator('#habits-tab')).toBeVisible();
            // Navigate to previous day
            await page.click('#prevDayBtn');
            await expect(page.locator('#selectedDateDisplay')).not.toContainText('Today');
            // Return to today via button
            await page.click('#goTodayBtn');
            // The habits tab should still be active and showing today's data
            await expect(page.locator('#selectedDateDisplay')).toContainText('Today');
            await expect(page.locator('#habits-tab')).toBeVisible();
        });
    });

    // ========================
    // Dashboard Overdue Tasks
    // ========================
    test.describe('dashboard overdue tasks', () => {
        test('should display overdue tasks count on dashboard', async ({ page }) => {
            await expect(page.locator('#overdueTasksCount')).toBeVisible();
            await expect(page.locator('#overdueTasksCount')).toHaveText('0');
        });

        test('should show overdue tasks count when there are overdue tasks', async ({ page }) => {
            // Add a task with a past due date via localStorage
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dueDateStr = yesterday.toISOString().split('T')[0];

            await page.evaluate((dueDate) => {
                const data = JSON.parse(localStorage.getItem('taskManagerData') || '{}');
                data.tasks = data.tasks || [];
                data.tasks.push({
                    id: 'overdue-test-1',
                    title: 'Overdue Task',
                    dueDate: dueDate,
                    repeatType: 'none',
                    completed: false,
                    createdDate: new Date().toISOString()
                });
                localStorage.setItem('taskManagerData', JSON.stringify(data));
            }, dueDateStr);

            await page.reload();
            await page.waitForSelector('.header');

            await expect(page.locator('#overdueTasksCount')).toHaveText('1');
        });

        test('should not count completed tasks as overdue', async ({ page }) => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dueDateStr = yesterday.toISOString().split('T')[0];

            await page.evaluate((dueDate) => {
                const data = JSON.parse(localStorage.getItem('taskManagerData') || '{}');
                data.tasks = data.tasks || [];
                data.tasks.push({
                    id: 'completed-overdue-1',
                    title: 'Completed Old Task',
                    dueDate: dueDate,
                    repeatType: 'none',
                    completed: true,
                    completedDate: dueDate,
                    createdDate: new Date().toISOString()
                });
                localStorage.setItem('taskManagerData', JSON.stringify(data));
            }, dueDateStr);

            await page.reload();
            await page.waitForSelector('.header');

            await expect(page.locator('#overdueTasksCount')).toHaveText('0');
        });

        test('clicking tasks due today count navigates to tasks tab', async ({ page }) => {
            await page.click('#todayTasksItem');
            await expect(page.locator('#tasks-tab')).toBeVisible();
        });

        test('clicking overdue tasks count navigates to tasks tab with overdue filter', async ({ page }) => {
            await page.click('#overdueTasksItem');
            await expect(page.locator('#tasks-tab')).toBeVisible();
            const filterValue = await page.locator('#statusFilter').inputValue();
            expect(filterValue).toBe('overdue');
        });
    });

    // ========================
    // Settings
    // ========================
    test.describe('settings', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-tab="settings"]');
        });

        test('should display settings page', async ({ page }) => {
            await expect(page.locator('#settings-tab h2')).toHaveText('Settings');
        });

        test('should show data version', async ({ page }) => {
            await expect(page.locator('#dataVersion')).toHaveText('1.0.0');
        });

        test('should update tasks per level', async ({ page }) => {
            page.on('dialog', dialog => dialog.accept());
            await page.fill('#tasksPerLevel', '50');
            await page.click('#saveTasksPerLevel');
            // Verify it persisted
            await page.click('[data-tab="dashboard"]');
            await page.click('[data-tab="settings"]');
            const value = await page.inputValue('#tasksPerLevel');
            expect(value).toBe('50');
        });
    });

    // ========================
    // Filter Settings Persistence
    // ========================
    test.describe('filter settings persistence', () => {
        test.beforeEach(async ({ page }) => {
            await page.click('[data-tab="tasks"]');
        });

        test('should show the Reset Filters button', async ({ page }) => {
            await expect(page.locator('#resetFiltersBtn')).toBeVisible();
        });

        test('should persist status filter across page reloads', async ({ page }) => {
            await page.selectOption('#statusFilter', 'completed');
            await page.reload();
            await page.waitForSelector('.header');
            await page.click('[data-tab="tasks"]');
            const value = await page.locator('#statusFilter').inputValue();
            expect(value).toBe('completed');
        });

        test('should persist hideCompleted state across page reloads', async ({ page }) => {
            await page.click('#hideCompletedBtn');
            await expect(page.locator('#hideCompletedBtn')).toContainText('Show Completed');
            await page.reload();
            await page.waitForSelector('.header');
            await page.click('[data-tab="tasks"]');
            await expect(page.locator('#hideCompletedBtn')).toContainText('Show Completed');
        });

        test('should reset all filters when Reset Filters is clicked', async ({ page }) => {
            await page.selectOption('#statusFilter', 'pending');
            await page.click('#hideCompletedBtn');

            await page.click('#resetFiltersBtn');

            const statusValue = await page.locator('#statusFilter').inputValue();
            expect(statusValue).toBe('');
            await expect(page.locator('#hideCompletedBtn')).toContainText('Hide Completed');
        });

        test('should not restore filters after reset and reload', async ({ page }) => {
            await page.selectOption('#statusFilter', 'pending');
            await page.click('#resetFiltersBtn');
            await page.reload();
            await page.waitForSelector('.header');
            await page.click('[data-tab="tasks"]');
            const value = await page.locator('#statusFilter').inputValue();
            expect(value).toBe('');
        });
    });
});
