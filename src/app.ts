// ========================
// Main Application Logic
// ========================

import { StorageManager, storage, STORAGE_VERSION, Task, Habit, FinanceItem, WishItem, Note, getDaysUntilDueText } from './storage.js';

const FILTER_SETTINGS_KEY = 'taskManagerFilterSettings';

interface Activity {
    type: string;
    message: string;
    date: string;
    icon: string;
}

interface FilteredFinanceItem extends FinanceItem {
    monthlyAmount?: number;
}

class TaskManager {
    currentEditingTaskId: string | null = null;
    currentEditingProjectId: string | null = null;
    currentEditingHabitId: string | null = null;
    currentEditingFinanceId: string | null = null;
    currentEditingFinanceType: string | null = null;
    currentEditingRewardId: string | null = null;
    currentEditingWishItemId: string | null = null;
    currentEditingNoteId: string | null = null;
    dragSrcWishId: string | null = null;
    selectedDate: Date = new Date();
    tasksExpanded: boolean = false;
    hideCompleted: boolean = false;
    emojis: string[] = [
        // Activity
        '💪', '🏃', '🚴', '🏊', '🧘', '💃', '🕺', '⛹️',
        // Food & Health
        '🥗', '🍎', '🥕', '💊', '🏥', '🧄', '🥤', '☕',
        // Work & Productivity
        '📚', '✍️', '💼', '🎯', '📊', '💻', '📱', '⌨️',
        // Learning & Mind
        '🧠', '📖', '🎓', '💡', '🔬', '🎨', '🎵', '🎭',
        // Nature & Outdoors
        '🌿', '🌳', '🌞', '🌙', '🌊', '⛰️', '🏞️', '🦋',
        // Sleep & Rest
        '😴', '🛏️', '😌', '🕯️', '🌙', '💤', '🧖', '🛀',
        // Social & Fun
        '👨‍👩‍👧‍👦', '🤝', '🎉', '😊', '❤️', '🤗', '😂', '👏',
        // Sports & Games
        '⚽', '🏀', '🎾', '🏐', '🎯', '♟️', '🎲', '🃏',
        // Habits & Goals
        '⭐', '🎯', '🏆', '🥇', '🔥', '💎', '✨', '🌟',
        // More Emojis
        '🚀', '🌈', '🎁', '📅', '⏰', '💰', '🎪', '🎢'
    ];

    constructor() {
        this.init();
    }

    init(): void {
        this.setupEventListeners();
        this.initializeFinanceDateFilter();
        this.updateDateNavigator();
        this.loadFilterSettings();
        this.render();
        this.processRecurringTasks();
    }

    // ========================
    // Event Listeners Setup
    // ========================
    setupEventListeners(): void {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab((e.target as HTMLElement).dataset.tab!));
        });

        // Tasks section
        document.getElementById('addTaskBtn')!.addEventListener('click', () => this.openTaskModal());
        document.getElementById('toggleTaskViewBtn')!.addEventListener('click', () => this.toggleTaskView());
        document.getElementById('taskForm')!.addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('cancelTaskBtn')!.addEventListener('click', () => this.closeTaskModal());
        document.getElementById('deleteTaskBtn')!.addEventListener('click', () => this.deleteTask());
        document.getElementById('taskRepeatType')!.addEventListener('change', (e) => this.updateRepeatTypeUI((e.target as HTMLSelectElement).value));
        document.getElementById('taskCategory')!.addEventListener('change', (e) => this.handleCategoryChange('task', (e.target as HTMLSelectElement).value));
        document.getElementById('taskCategorySave')!.addEventListener('click', () => this.handleAddCategory('task'));
        document.getElementById('taskCategoryCancel')!.addEventListener('click', () => this.cancelAddCategory('task'));
        document.getElementById('categoryFilter')!.addEventListener('change', () => { this.filterTasks(); this.saveFilterSettings(); });
        document.getElementById('statusFilter')!.addEventListener('change', () => { this.filterTasks(); this.saveFilterSettings(); });
        document.getElementById('groupBySelect')!.addEventListener('change', () => { this.filterTasks(); this.saveFilterSettings(); });
        document.getElementById('searchTasks')!.addEventListener('input', () => this.filterTasks());
        document.getElementById('hideCompletedBtn')!.addEventListener('click', () => this.toggleHideCompleted());
        document.getElementById('resetFiltersBtn')!.addEventListener('click', () => this.resetFilters());

        // Projects section
        document.getElementById('addProjectBtn')!.addEventListener('click', () => this.openProjectModal());
        document.getElementById('projectForm')!.addEventListener('submit', (e) => this.saveProject(e));
        document.getElementById('cancelProjectBtn')!.addEventListener('click', () => this.closeProjectModal());
        document.getElementById('deleteProjectBtn')!.addEventListener('click', () => this.deleteProject());
        document.getElementById('closeProjectDetailBtn')!.addEventListener('click', () => this.closeProjectDetailModal());
        document.getElementById('editProjectFromDetailBtn')!.addEventListener('click', () => this.editProjectFromDetail());

        // Habits section
        document.getElementById('addHabitBtn')!.addEventListener('click', () => this.openHabitModal());
        document.getElementById('habitForm')!.addEventListener('submit', (e) => this.saveHabit(e));
        document.getElementById('cancelHabitBtn')!.addEventListener('click', () => this.closeHabitModal());
        document.getElementById('deleteHabitBtn')!.addEventListener('click', () => this.deleteHabit());
        document.getElementById('habitEmojiBtn')!.addEventListener('click', () => this.openEmojiPicker());
        document.getElementById('closeEmojiBtn')!.addEventListener('click', () => this.closeEmojiPicker());
        document.getElementById('habitCategory')!.addEventListener('change', (e) => this.handleCategoryChange('habit', (e.target as HTMLSelectElement).value));
        document.getElementById('habitCategorySave')!.addEventListener('click', () => this.handleAddCategory('habit'));
        document.getElementById('habitCategoryCancel')!.addEventListener('click', () => this.cancelAddCategory('habit'));

        // Finances section
        document.getElementById('addExpenseBtn')!.addEventListener('click', () => this.openFinanceModal('expense'));
        document.getElementById('addRevenueBtn')!.addEventListener('click', () => this.openFinanceModal('revenue'));
        document.getElementById('addChargeBtn')!.addEventListener('click', () => this.openFinanceModal('charge'));
        document.getElementById('financeForm')!.addEventListener('submit', (e) => this.saveFinance(e));
        document.getElementById('cancelFinanceBtn')!.addEventListener('click', () => this.closeFinanceModal());
        document.getElementById('deleteFinanceBtn')!.addEventListener('click', () => this.deleteFinance());
        document.getElementById('financeCategory')!.addEventListener('change', (e) => this.handleCategoryChange('finance', (e.target as HTMLSelectElement).value));
        document.getElementById('financeCategorySave')!.addEventListener('click', () => this.handleAddCategory('finance'));
        document.getElementById('financeCategoryCancel')!.addEventListener('click', () => this.cancelAddCategory('finance'));

        document.querySelectorAll('.finance-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFinanceTab((e.target as HTMLElement).dataset.financeTab!));
        });

        // Finance filters
        document.getElementById('filterFinancesBtn')!.addEventListener('click', () => this.renderFinances());
        document.getElementById('resetFinanceFilterBtn')!.addEventListener('click', () => this.resetFinanceFilter());

        // Shop section
        document.getElementById('addRewardBtn')!.addEventListener('click', () => this.openRewardModal());
        document.getElementById('rewardForm')!.addEventListener('submit', (e) => this.saveReward(e));
        document.getElementById('cancelRewardBtn')!.addEventListener('click', () => this.closeRewardModal());
        document.getElementById('deleteRewardBtn')!.addEventListener('click', () => this.deleteReward());

        // Wish List section
        document.getElementById('addWishItemBtn')!.addEventListener('click', () => this.openWishItemModal());
        document.getElementById('wishItemForm')!.addEventListener('submit', (e) => this.saveWishItem(e));
        document.getElementById('cancelWishItemBtn')!.addEventListener('click', () => this.closeWishItemModal());
        document.getElementById('deleteWishItemBtn')!.addEventListener('click', () => this.deleteWishItem());

        // Notes section
        document.getElementById('addNoteBtn')!.addEventListener('click', () => this.openNoteModal());
        document.getElementById('noteForm')!.addEventListener('submit', (e) => this.saveNote(e));
        document.getElementById('cancelNoteBtn')!.addEventListener('click', () => this.closeNoteModal());
        document.getElementById('deleteNoteBtn')!.addEventListener('click', () => this.deleteNote());

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                (e.target as HTMLElement).closest('.modal')!.classList.remove('active');
            });
        });

        // Settings
        document.getElementById('saveTasksPerLevel')!.addEventListener('click', () => this.saveTasksPerLevel());
        document.getElementById('exportBtn')!.addEventListener('click', () => this.exportData());
        document.getElementById('importBtn')!.addEventListener('click', () => document.getElementById('importFile')!.click());
        document.getElementById('importFile')!.addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearDataBtn')!.addEventListener('click', () => {
            if (storage.clearAllData()) {
                location.reload();
            }
        });

        // Modal backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Hamburger menu toggle
        document.getElementById('hamburgerMenu')!.addEventListener('click', () => {
            const navTabs = document.getElementById('navTabs')!;
            const hamburger = document.getElementById('hamburgerMenu')!;
            navTabs.classList.toggle('show');
            hamburger.classList.toggle('active');
        });

        // Close mobile menu when a tab is clicked
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    const navTabs = document.getElementById('navTabs')!;
                    const hamburger = document.getElementById('hamburgerMenu')!;
                    navTabs.classList.remove('show');
                    hamburger.classList.remove('active');
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const navTabs = document.getElementById('navTabs')!;
                const hamburger = document.getElementById('hamburgerMenu')!;
                if (!navTabs.contains(e.target as Node) && !hamburger.contains(e.target as Node)) {
                    navTabs.classList.remove('show');
                    hamburger.classList.remove('active');
                }
            }
        });

        // Dashboard overview click navigation
        document.getElementById('todayTasksItem')!.addEventListener('click', () => this.switchTab('tasks'));
        document.getElementById('overdueTasksItem')!.addEventListener('click', () => {
            (document.getElementById('statusFilter') as HTMLSelectElement).value = 'overdue';
            this.saveFilterSettings();
            this.switchTab('tasks');
        });

        // Date navigator
        document.getElementById('prevDayBtn')!.addEventListener('click', () => this.navigateDate(-1));
        document.getElementById('nextDayBtn')!.addEventListener('click', () => this.navigateDate(1));
        document.getElementById('goTodayBtn')!.addEventListener('click', () => {
            this.selectedDate = new Date();
            this.updateDateNavigator();
            const activeTabName = (document.querySelector('.nav-tab.active') as HTMLElement | null)?.dataset.tab;
            if (activeTabName) {
                this.switchTab(activeTabName);
            } else {
                this.renderDashboard();
            }
        });
    }

    // ========================
    // Tab Navigation
    // ========================
    switchTab(tabName: string): void {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`)!.classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`)!.classList.add('active');

        // Re-render based on tab
        if (tabName === 'dashboard') {
            this.renderDashboard();
        } else if (tabName === 'tasks') {
            this.renderTasks();
        } else if (tabName === 'projects') {
            this.renderProjects();
        } else if (tabName === 'habits') {
            this.renderHabits();
        } else if (tabName === 'finances') {
            this.renderFinances();
        } else if (tabName === 'shop') {
            this.renderShop();
        } else if (tabName === 'wishlist') {
            this.renderWishList();
        } else if (tabName === 'notes') {
            this.renderNotes();
        } else if (tabName === 'settings') {
            this.renderSettings();
        }
    }

    switchFinanceTab(tabName: string): void {
        document.querySelectorAll('.finance-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.finance-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(`${tabName}-content`)!.classList.add('active');
        document.querySelector(`[data-finance-tab="${tabName}"]`)!.classList.add('active');
    }

    // ========================
    // Dashboard Rendering
    // ========================
    renderDashboard(): void {
        const today = this.getSelectedDateStr();
        const tasks = storage.getTasks();
        const habits = storage.getHabits();
        const userStats = storage.getUserStats();

        // Update header stats
        document.getElementById('totalPoints')!.textContent = String(userStats.totalPoints);
        document.getElementById('userLevel')!.textContent = String(userStats.level);
        document.getElementById('dailyStreak')!.textContent = String(userStats.dailyStreak);

        // Update level progress
        const settings = storage.getSettings();
        const completedTasksCount = tasks.filter(t => t.completed).length;
        const tasksInCurrentLevel = completedTasksCount % settings.tasksPerLevel;
        const tasksNeeded = settings.tasksPerLevel;
        document.getElementById('levelProgress')!.textContent = `${tasksInCurrentLevel}/${tasksNeeded} tasks`;

        // Selected day's overview
        const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
        const overdueTasks = tasks.filter(t => !t.completed && !!t.dueDate && t.dueDate < today);
        const completedToday = tasks.filter(t => t.completedDate === today);
        const todayDay = this.selectedDate.getDay();

        // Find incomplete habits for selected day
        const incompleteHabits = habits.filter(habit => {
            const isValidDay = !habit.daysOfWeek || habit.daysOfWeek.includes(todayDay);
            if (!isValidDay) return false;
            const todaysCompletions = storage.countHabitCompletionsForDate(habit.id, today);
            const targetGoal = habit.targetGoal || 1;
            return todaysCompletions < targetGoal;
        });

        document.getElementById('todayTasksCount')!.textContent = String(todayTasks.length);
        document.getElementById('overdueTasksCount')!.textContent = String(overdueTasks.length);
        document.getElementById('completedTodayCount')!.textContent = String(completedToday.length);
        document.getElementById('incompleteHabitsCount')!.textContent = String(incompleteHabits.length);

        // Render incomplete habits list
        const incompleteHabitsList = document.getElementById('incompleteHabitsList')!;
        if (incompleteHabits.length === 0) {
            incompleteHabitsList.innerHTML = '<p class="empty-state" style="margin: 0.5rem 0;">All habits completed for today! 🎉</p>';
        } else {
            incompleteHabitsList.innerHTML = incompleteHabits.map(habit => {
                const todaysCompletions = storage.countHabitCompletionsForDate(habit.id, today);
                const targetGoal = habit.targetGoal || 1;
                const percentage = Math.min(100, Math.round((todaysCompletions / targetGoal) * 100));
                return `
                    <div class="habit-item" style="padding: 0.5rem; border-left: 3px solid #4CAF50; margin-bottom: 0.5rem; background: #f9f9f9; cursor: pointer;" data-habit-id="${habit.id}">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-size: 1.2rem; margin-right: 0.5rem;">${habit.icon}</span>
                                <span style="font-weight: 500;">${habit.name}</span>
                            </div>
                            <span style="font-size: 0.85rem; color: #666;">${todaysCompletions}/${targetGoal} (${percentage}%)</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers to navigate to habits
            document.querySelectorAll('.habit-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.switchTab('habits');
                });
            });
        }

        // Recent activity
        this.renderRecentActivity();

        // Active projects
        this.renderProjectsSummary();
    }

    renderRecentActivity(): void {
        const data = storage.getData();
        const activities: Activity[] = [];

        // Collect activities from tasks
        data.tasks.filter(t => t.completedDate).forEach(t => {
            activities.push({
                type: 'task',
                message: `Completed task: ${t.title}`,
                date: t.completedDate!,
                icon: '✓'
            });
        });

        // Collect activities from habits
        if (data.dailyHabitLogs) {
            data.dailyHabitLogs.slice(-10).forEach(log => {
                const habit = data.habits.find(h => h.id === log.habitId);
                if (habit) {
                    activities.push({
                        type: 'habit',
                        message: `Completed habit: ${habit.name}`,
                        date: log.date,
                        icon: '⭐'
                    });
                }
            });
        }

        // Sort by date
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const activityList = document.getElementById('recentActivity')!;
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="empty-state">No activity yet. Start completing tasks!</p>';
        } else {
            activityList.innerHTML = activities.slice(0, 5).map(activity => `
                <div class="activity-item">
                    <div><span>${activity.icon}</span> ${activity.message}</div>
                    <div class="time">${activity.date}</div>
                </div>
            `).join('');
        }
    }

    renderProjectsSummary(): void {
        const projects = storage.getProjects();
        const tasks = storage.getTasks();
        const container = document.getElementById('projectsSummary')!;

        if (projects.length === 0) {
            container.innerHTML = '<p class="empty-state">No active projects. Create one to organize your tasks!</p>';
            return;
        }

        container.innerHTML = projects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.completed);
            const percentage = projectTasks.length === 0 ? 0 : Math.round((completedTasks.length / projectTasks.length) * 100);

            return `
                <div class="project-progress">
                    <div class="name">${project.name}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="progress-text">${completedTasks.length}/${projectTasks.length} tasks (${percentage}%)</div>
                </div>
            `;
        }).join('');
    }

    // ========================
    // Tasks Management
    toggleHideCompleted(): void {
        this.hideCompleted = !this.hideCompleted;
        this.updateHideCompletedBtn();
        this.filterTasks();
        this.saveFilterSettings();
    }

    updateHideCompletedBtn(): void {
        const btn = document.getElementById('hideCompletedBtn')!;
        btn.textContent = this.hideCompleted ? '👁 Show Completed' : '👁 Hide Completed';
        btn.classList.toggle('active', this.hideCompleted);
    }

    saveFilterSettings(): void {
        const categoryFilter = (document.getElementById('categoryFilter') as HTMLSelectElement).value;
        const statusFilter = (document.getElementById('statusFilter') as HTMLSelectElement).value;
        const groupBy = (document.getElementById('groupBySelect') as HTMLSelectElement).value;
        const settings = { categoryFilter, statusFilter, groupBy, hideCompleted: this.hideCompleted };
        localStorage.setItem(FILTER_SETTINGS_KEY, JSON.stringify(settings));
    }

    loadFilterSettings(): void {
        const raw = localStorage.getItem(FILTER_SETTINGS_KEY);
        if (!raw) return;
        try {
            const settings = JSON.parse(raw);
            const categoryFilter = document.getElementById('categoryFilter') as HTMLSelectElement;
            const statusFilter = document.getElementById('statusFilter') as HTMLSelectElement;
            const groupBySelect = document.getElementById('groupBySelect') as HTMLSelectElement;
            if (settings.categoryFilter !== undefined) categoryFilter.value = settings.categoryFilter;
            if (settings.statusFilter !== undefined) statusFilter.value = settings.statusFilter;
            if (settings.groupBy !== undefined) groupBySelect.value = settings.groupBy;
            if (settings.hideCompleted) {
                this.hideCompleted = true;
                this.updateHideCompletedBtn();
            }
        } catch {
            localStorage.removeItem(FILTER_SETTINGS_KEY);
        }
    }

    resetFilters(): void {
        (document.getElementById('categoryFilter') as HTMLSelectElement).value = '';
        (document.getElementById('statusFilter') as HTMLSelectElement).value = '';
        (document.getElementById('groupBySelect') as HTMLSelectElement).value = '';
        (document.getElementById('searchTasks') as HTMLInputElement).value = '';
        this.hideCompleted = false;
        this.updateHideCompletedBtn();
        localStorage.removeItem(FILTER_SETTINGS_KEY);
        this.filterTasks();
    }

    // ========================
    toggleTaskView(): void {
        this.tasksExpanded = !this.tasksExpanded;
        const btn = document.getElementById('toggleTaskViewBtn')!;
        btn.textContent = this.tasksExpanded ? '⊟ Collapse Details' : '⊞ Expand Details';
        document.getElementById('taskList')!.classList.toggle('expanded', this.tasksExpanded);
    }

    renderTasks(): void {
        this.updateCategoryFilter();
        this.filterTasks();
    }

    filterTasks(): void {
        const tasks = storage.getTasks();
        const categoryFilter = (document.getElementById('categoryFilter') as HTMLSelectElement).value;
        const statusFilter = (document.getElementById('statusFilter') as HTMLSelectElement).value;
        const searchTerm = (document.getElementById('searchTasks') as HTMLInputElement).value.toLowerCase();
        const groupBy = (document.getElementById('groupBySelect') as HTMLSelectElement).value;
        const today = this.getSelectedDateStr();
        const filtersActive = statusFilter || searchTerm;

        let filtered = tasks.filter(task => {
            // Hide completed filter
            if (this.hideCompleted && task.completed) return false;

            // Category filter
            if (categoryFilter && task.category !== categoryFilter) return false;

            // Status filter
            if (statusFilter) {
                if (statusFilter === 'completed' && !task.completed) return false;
                if (statusFilter === 'pending' && task.completed) return false;
                if (statusFilter === 'overdue' && (!task.dueDate || task.completed || task.dueDate >= today)) return false;
            }

            // Search filter
            if (searchTerm && !task.title.toLowerCase().includes(searchTerm) && !task.description?.toLowerCase().includes(searchTerm)) return false;

            return true;
        });

        const taskList = document.getElementById('taskList')!;
        if (filtered.length === 0) {
            taskList.innerHTML = '<p class="empty-state">No tasks found.</p>';
            return;
        }

        let html = '';

        if (groupBy === 'priority') {
            const priorityLabels: Record<string, string> = { high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority' };
            const grouped: Record<string, typeof filtered> = { high: [], medium: [], low: [], ungrouped: [] };
            filtered.forEach(task => {
                if (task.priority && grouped[task.priority]) {
                    grouped[task.priority].push(task);
                } else {
                    grouped['ungrouped'].push(task);
                }
            });
            (['high', 'medium', 'low'] as const).forEach(p => {
                if (grouped[p].length > 0) {
                    html += `<h3 class="task-section-header">${priorityLabels[p]}</h3>`;
                    html += grouped[p].map(task => this.renderTaskItem(task)).join('');
                }
            });
            if (grouped['ungrouped'].length > 0) {
                html += `<h3 class="task-section-header">Ungrouped</h3>`;
                html += grouped['ungrouped'].map(task => this.renderTaskItem(task)).join('');
            }
        } else if (groupBy === 'category') {
            const withCategory = filtered.filter(task => task.category);
            const withoutCategory = filtered.filter(task => !task.category);
            const categories = [...new Set(withCategory.map(task => task.category as string))].sort();
            categories.forEach(cat => {
                const group = withCategory.filter(task => task.category === cat);
                if (group.length > 0) {
                    html += `<h3 class="task-section-header">${cat}</h3>`;
                    html += group.map(task => this.renderTaskItem(task)).join('');
                }
            });
            if (withoutCategory.length > 0) {
                html += `<h3 class="task-section-header">Ungrouped</h3>`;
                html += withoutCategory.map(task => this.renderTaskItem(task)).join('');
            }
        } else if (filtersActive) {
            html = filtered.map(task => this.renderTaskItem(task)).join('');
        } else {
            const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

            const overdue = filtered.filter(task =>
                !task.completed && task.dueDate && task.dueDate < today
            );

            const dueToday = filtered.filter(task =>
                task.dueDate && task.dueDate === today
            );

            const upcoming = filtered
                .filter(task =>
                    !task.completed &&
                    task.dueDate &&
                    task.dueDate > today &&
                    task.repeatType !== 'daily'
                )
                .sort((a, b) => {
                    if (a.dueDate! < b.dueDate!) return -1;
                    if (a.dueDate! > b.dueDate!) return 1;
                    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
                });

            const noDueDate = filtered.filter(task => !task.dueDate);

            if (overdue.length > 0) {
                html += `<h3 class="task-section-header">Overdue</h3>`;
                html += overdue.map(task => this.renderTaskItem(task)).join('');
            }

            if (dueToday.length > 0) {
                html += `<h3 class="task-section-header">Due Today</h3>`;
                html += dueToday.map(task => this.renderTaskItem(task)).join('');
            }

            if (upcoming.length > 0) {
                html += `<h3 class="task-section-header">Upcoming Tasks</h3>`;
                html += upcoming.map(task => this.renderTaskItem(task)).join('');
            }

            if (noDueDate.length > 0) {
                html += `<h3 class="task-section-header">No Due Date</h3>`;
                html += noDueDate.map(task => this.renderTaskItem(task)).join('');
            }

            if (!html) {
                html = '<p class="empty-state">No tasks found.</p>';
            }
        }

        taskList.innerHTML = html;

        // Add event listeners to task items
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = (e.target as HTMLInputElement).dataset.taskId!;
                this.toggleTask(taskId);
            });
        });

        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).classList.contains('task-checkbox')) {
                    this.openTaskModal((item as HTMLElement).dataset.taskId!);
                }
            });
        });
    }

    renderTaskItem(task: Task): string {
        const today = storage.formatDate(new Date());
        let status = 'pending';
        if (task.completed) {
            status = 'completed';
        } else if (task.dueDate && task.dueDate < today) {
            status = 'overdue';
        }

        const dueBadge = task.dueDate && !task.completed
            ? `<span class="task-due-badge">${getDaysUntilDueText(task.dueDate)}</span>`
            : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-meta">
                        ${task.category ? `<span class="task-meta-item">📂 ${task.category}</span>` : ''}
                        ${task.dueDate ? `<span class="task-meta-item">📅 ${task.dueDate}</span>` : ''}
                        <span class="task-meta-item"><span class="task-priority ${task.priority}"></span>${task.priority}</span>
                        ${task.repeatType !== 'none' ? `<span class="task-meta-item">🔁 ${task.repeatType}</span>` : ''}
                        ${task.points ? `<span class="task-meta-item">⭐ ${task.points} pts</span>` : ''}
                    </div>
                </div>
                <div class="task-status ${status}">${status}</div>
                ${dueBadge}
            </div>
        `;
    }

    updateCategoryFilter(): void {
        const tasks = storage.getTasks();
        const categories = [...new Set(tasks.map(t => t.category).filter((c): c is string => !!c))];
        const select = document.getElementById('categoryFilter') as HTMLSelectElement;
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        select.value = currentValue;
    }

    openTaskModal(taskId: string | null = null): void {
        this.currentEditingTaskId = taskId;
        const modal = document.getElementById('taskModal')!;
        const form = document.getElementById('taskForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteTaskBtn') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';

        // Update project dropdown
        this.updateProjectSelect();

        // Clear all task day checkboxes
        document.querySelectorAll<HTMLInputElement>('input[name="taskDay"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        if (taskId) {
            const task = storage.getTasks().find(t => t.id === taskId);
            if (task) {
                (document.getElementById('taskTitle') as HTMLInputElement).value = task.title;
                (document.getElementById('taskDescription') as HTMLTextAreaElement).value = task.description || '';
                (document.getElementById('taskDueDate') as HTMLInputElement).value = task.dueDate || '';
                (document.getElementById('taskCategory') as HTMLSelectElement).value = task.category || '';
                (document.getElementById('taskPriority') as HTMLSelectElement).value = task.priority || 'medium';
                (document.getElementById('taskPoints') as HTMLInputElement).value = String(task.points || 10);
                (document.getElementById('taskRepeatType') as HTMLSelectElement).value = task.repeatType || 'none';
                (document.getElementById('taskProject') as HTMLSelectElement).value = task.projectId || '';
                (document.getElementById('taskRepeatUnit') as HTMLInputElement).value = String(task.repeatUnit || 1);

                if (task.repeatType === 'custom') {
                    (document.getElementById('customRepeatDays') as HTMLInputElement).value = String(task.customRepeatDays || '');
                }
                if (task.repeatType === 'movable') {
                    (document.getElementById('movableRepeatDays') as HTMLInputElement).value = String(task.movableRepeatDays || '');
                }

                // Load daysOfWeek if available
                if (task.daysOfWeek && Array.isArray(task.daysOfWeek)) {
                    task.daysOfWeek.forEach(day => {
                        const checkbox = document.querySelector<HTMLInputElement>(`input[name="taskDay"][value="${day}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                }

                deleteBtn.style.display = 'block';

                this.updateRepeatTypeUI(task.repeatType);
            }
        } else {
            (document.getElementById('taskRepeatUnit') as HTMLInputElement).value = '1';
        }

        // Load categories
        this.loadCategoryDropdown('task');

        modal.classList.add('active');
    }

    closeTaskModal(): void {
        document.getElementById('taskModal')!.classList.remove('active');
        this.currentEditingTaskId = null;

        // If project detail modal is open, refresh it
        if (document.getElementById('projectDetailModal')!.classList.contains('active')) {
            this.openProjectDetailModal(this.currentEditingProjectId!);
        }
    }

    updateRepeatTypeUI(repeatType: string): void {
        const customGroup = document.getElementById('customRepeatGroup') as HTMLElement;
        const movableGroup = document.getElementById('movableRepeatGroup') as HTMLElement;
        const repeatUnitGroup = document.getElementById('repeatUnitGroup') as HTMLElement;
        const taskDaysGroup = document.getElementById('taskDaysGroup') as HTMLElement;
        const repeatUnitLabel = document.getElementById('repeatUnitLabel') as HTMLElement;

        customGroup.style.display = repeatType === 'custom' ? 'block' : 'none';
        movableGroup.style.display = repeatType === 'movable' ? 'block' : 'none';

        // Show repeat unit for daily, weekly, monthly, yearly
        if (['daily', 'weekly', 'monthly', 'yearly'].includes(repeatType)) {
            repeatUnitGroup.style.display = 'block';
            const labels: Record<string, string> = {
                daily: 'day(s)',
                weekly: 'week(s)',
                monthly: 'month(s)',
                yearly: 'year(s)'
            };
            repeatUnitLabel.textContent = labels[repeatType] || 'unit(s)';
        } else {
            repeatUnitGroup.style.display = 'none';
        }

        // Show days selector for weekly and daily
        taskDaysGroup.style.display = (['weekly', 'daily'].includes(repeatType)) ? 'block' : 'none';
    }

    updateProjectSelect(): void {
        const projects = storage.getProjects();
        const select = document.getElementById('taskProject') as HTMLSelectElement;
        select.innerHTML = '<option value="">None</option>' +
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    saveTask(e: Event): void {
        e.preventDefault();

        // Get selected days for weekly/daily tasks
        const selectedDays = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="taskDay"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        const task: Partial<Task> = {
            title: (document.getElementById('taskTitle') as HTMLInputElement).value,
            description: (document.getElementById('taskDescription') as HTMLTextAreaElement).value,
            dueDate: (document.getElementById('taskDueDate') as HTMLInputElement).value,
            category: (document.getElementById('taskCategory') as HTMLSelectElement).value,
            priority: (document.getElementById('taskPriority') as HTMLSelectElement).value as Task['priority'],
            points: parseInt((document.getElementById('taskPoints') as HTMLInputElement).value),
            repeatType: (document.getElementById('taskRepeatType') as HTMLSelectElement).value as Task['repeatType'],
            projectId: (document.getElementById('taskProject') as HTMLSelectElement).value || null
        };

        // Add repeatUnit for daily, weekly, monthly, yearly tasks
        if (['daily', 'weekly', 'monthly', 'yearly'].includes(task.repeatType!)) {
            task.repeatUnit = parseInt((document.getElementById('taskRepeatUnit') as HTMLInputElement).value) || 1;
            if (selectedDays.length > 0) {
                task.daysOfWeek = selectedDays;
            }
        }

        if (task.repeatType === 'custom') {
            task.customRepeatDays = parseInt((document.getElementById('customRepeatDays') as HTMLInputElement).value);
        }
        if (task.repeatType === 'movable') {
            task.movableRepeatDays = parseInt((document.getElementById('movableRepeatDays') as HTMLInputElement).value);
        }

        if (this.currentEditingTaskId) {
            storage.updateTask(this.currentEditingTaskId, task);
        } else {
            storage.addTask(task);
        }

        this.closeTaskModal();
        this.renderTasks();
        this.renderProjects();
    }

    deleteTask(): void {
        if (this.currentEditingTaskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                storage.deleteTask(this.currentEditingTaskId);
                this.closeTaskModal();
                this.renderTasks();
                this.renderProjects();
            }
        }
    }

    toggleTask(taskId: string): void {
        const task = storage.getTasks().find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedDate = this.getSelectedDateStr();
                storage.addPoints(task.points, 'tasks');
                storage.updateDailyStreak(true);
                // If repeatable, immediately create next task with recalculated due date
                if (task.repeatType !== 'none') {
                    this.createNextRecurringTask(task);
                }
            } else {
                // If uncompleting, also recalculate level
                task.completedDate = null;
            }
            storage.updateTask(taskId, task);
            storage.updateLevel();
            this.renderTasks();
            this.renderDashboard();
            this.renderProjects();
        }
    }

    nextOccurrenceOfDays(fromDate: Date, days: number[]): Date {
        const next = new Date(fromDate);
        for (let i = 1; i <= 7; i++) {
            next.setDate(next.getDate() + 1);
            if (days.includes(next.getDay())) {
                return next;
            }
        }
        return next;
    }

    createNextRecurringTask(completedTask: Task): void {
        const [year, month, day] = completedTask.completedDate!.split('-').map(Number);
        const completionDate = new Date(year, month - 1, day);
        const nextDueDate = new Date(completionDate);
        const hasDaysOfWeek = completedTask.daysOfWeek && completedTask.daysOfWeek.length > 0;

        switch (completedTask.repeatType) {
            case 'daily':
                if (hasDaysOfWeek) {
                    const next = this.nextOccurrenceOfDays(completionDate, completedTask.daysOfWeek!);
                    nextDueDate.setTime(next.getTime());
                } else {
                    nextDueDate.setDate(nextDueDate.getDate() + (completedTask.repeatUnit || 1));
                }
                break;
            case 'weekly':
                if (hasDaysOfWeek) {
                    const next = this.nextOccurrenceOfDays(completionDate, completedTask.daysOfWeek!);
                    next.setDate(next.getDate() + 7 * ((completedTask.repeatUnit || 1) - 1));
                    nextDueDate.setTime(next.getTime());
                } else {
                    nextDueDate.setDate(nextDueDate.getDate() + 7 * (completedTask.repeatUnit || 1));
                }
                break;
            case 'monthly':
                nextDueDate.setMonth(nextDueDate.getMonth() + (completedTask.repeatUnit || 1));
                break;
            case 'yearly':
                nextDueDate.setFullYear(nextDueDate.getFullYear() + (completedTask.repeatUnit || 1));
                break;
            case 'custom':
                nextDueDate.setDate(nextDueDate.getDate() + (completedTask.customRepeatDays || 1));
                break;
            case 'movable':
                nextDueDate.setDate(nextDueDate.getDate() + (completedTask.movableRepeatDays || 1));
                break;
            default:
                return;
        }

        const newTask: Partial<Task> = {
            title: completedTask.title,
            description: completedTask.description,
            category: completedTask.category,
            priority: completedTask.priority,
            points: completedTask.points,
            projectId: completedTask.projectId,
            repeatType: completedTask.repeatType,
            repeatUnit: completedTask.repeatUnit,
            customRepeatDays: completedTask.customRepeatDays,
            movableRepeatDays: completedTask.movableRepeatDays,
            daysOfWeek: completedTask.daysOfWeek,
            dueDate: storage.formatDate(nextDueDate)
        };

        storage.addTask(newTask);
    }

    // ========================
    // Projects Management
    // ========================
    renderProjects(): void {
        const projects = storage.getProjects();
        const container = document.getElementById('projectsList')!;

        if (projects.length === 0) {
            container.innerHTML = '<p class="empty-state">No projects yet. Create one to organize your tasks!</p>';
            return;
        }

        container.innerHTML = projects.map(project => this.renderProjectCard(project)).join('');

        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openProjectDetailModal((card as HTMLElement).dataset.projectId!);
            });
        });
    }

    renderProjectCard(project: { id: string; name: string; description?: string; color?: string }): string {
        const tasks = storage.getTasks().filter(t => t.projectId === project.id);
        const completed = tasks.filter(t => t.completed).length;
        const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

        return `
            <div class="project-card ${project.color || 'blue'}" data-project-id="${project.id}">
                <div class="project-title">${project.name}</div>
                ${project.description ? `<div class="project-description">${project.description}</div>` : ''}
                <div class="project-stats">
                    <div class="project-stat">
                        <span class="project-stat-label">Tasks</span>
                        <span class="project-stat-value">${tasks.length}</span>
                    </div>
                    <div class="project-stat">
                        <span class="project-stat-label">Completed</span>
                        <span class="project-stat-value">${completed}</span>
                    </div>
                    <div class="project-stat">
                        <span class="project-stat-label">Progress</span>
                        <span class="project-stat-value">${percentage}%</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    openProjectModal(projectId: string | null = null): void {
        this.currentEditingProjectId = projectId;
        const modal = document.getElementById('projectModal')!;
        const form = document.getElementById('projectForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteProjectBtn') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';

        if (projectId) {
            const project = storage.getProjects().find(p => p.id === projectId);
            if (project) {
                (document.getElementById('projectName') as HTMLInputElement).value = project.name;
                (document.getElementById('projectDescription') as HTMLTextAreaElement).value = project.description || '';
                (document.getElementById('projectColor') as HTMLSelectElement).value = project.color || 'blue';
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeProjectModal(): void {
        document.getElementById('projectModal')!.classList.remove('active');
        this.currentEditingProjectId = null;
    }

    saveProject(e: Event): void {
        e.preventDefault();

        const project = {
            name: (document.getElementById('projectName') as HTMLInputElement).value,
            description: (document.getElementById('projectDescription') as HTMLTextAreaElement).value,
            color: (document.getElementById('projectColor') as HTMLSelectElement).value
        };

        if (this.currentEditingProjectId) {
            storage.updateProject(this.currentEditingProjectId, project);
        } else {
            storage.addProject(project);
        }

        this.closeProjectModal();
        this.renderProjects();
        this.updateProjectSelect();
    }

    deleteProject(): void {
        if (this.currentEditingProjectId) {
            if (confirm('Are you sure you want to delete this project? This will not delete the tasks in it.')) {
                storage.deleteProject(this.currentEditingProjectId);
                this.closeProjectModal();
                this.renderProjects();
            }
        }
    }

    openProjectDetailModal(projectId: string): void {
        const project = storage.getProjects().find(p => p.id === projectId);
        if (!project) return;

        this.currentEditingProjectId = projectId;
        const modal = document.getElementById('projectDetailModal')!;

        document.getElementById('projectDetailTitle')!.textContent = project.name;
        document.getElementById('projectDetailDescription')!.textContent = project.description || 'No description';

        const tasks = storage.getTasks().filter(t => t.projectId === projectId);
        const completed = tasks.filter(t => t.completed).length;
        const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

        document.getElementById('projectDetailTotalTasks')!.textContent = String(tasks.length);
        document.getElementById('projectDetailCompletedTasks')!.textContent = String(completed);
        document.getElementById('projectDetailProgress')!.textContent = percentage + '%';

        this.renderProjectDetailTasks(tasks);

        modal.classList.add('active');
    }

    closeProjectDetailModal(): void {
        document.getElementById('projectDetailModal')!.classList.remove('active');
        this.currentEditingProjectId = null;
    }

    editProjectFromDetail(): void {
        const projectId = this.currentEditingProjectId;
        this.closeProjectDetailModal();
        this.openProjectModal(projectId);
    }

    renderProjectDetailTasks(tasks: Task[]): void {
        const container = document.getElementById('projectDetailTaskList')!;

        if (tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks in this project yet.</p>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
                        ${task.priority ? `<span class="priority-${task.priority}">⚡ ${task.priority}</span>` : ''}
                        ${task.category ? `<span>📂 ${task.category}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('#projectDetailTaskList .task-item').forEach(item => {
            const checkbox = item.querySelector('.task-checkbox')!;
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask((item as HTMLElement).dataset.taskId!);
                this.openProjectDetailModal(this.currentEditingProjectId!);
            });

            item.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).classList.contains('task-checkbox')) {
                    this.closeProjectDetailModal();
                    this.switchTab('tasks');
                    this.openTaskModal((item as HTMLElement).dataset.taskId!);
                }
            });
        });
    }

    // ========================
    // Habits Management
    // ========================
    renderHabits(): void {
        const habits = storage.getHabits();
        const container = document.getElementById('habitsList')!;

        if (habits.length === 0) {
            container.innerHTML = '<p class="empty-state">No habits yet. Create daily habits to build streaks!</p>';
            return;
        }

        container.innerHTML = habits.map(habit => this.renderHabitCard(habit)).join('');

        document.querySelectorAll('.habit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).classList.contains('habit-checkbox')) {
                    this.openHabitModal((card as HTMLElement).dataset.habitId!);
                }
            });
        });

        document.querySelectorAll('.habit-checkbox').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = (e.target as HTMLElement).dataset.habitId!;
                this.completeHabit(habitId);
            });
        });
    }

    renderHabitCard(habit: Habit): string {
        const selectedDayOfWeek = this.selectedDate.getDay();
        const isValidDay = !habit.daysOfWeek || habit.daysOfWeek.includes(selectedDayOfWeek);
        const selectedDateStr = this.getSelectedDateStr();
        const isPastDay = !this.isSelectedDateToday();

        const todaysCompletions = storage.countHabitCompletionsForDate(habit.id, selectedDateStr);
        const targetGoal = habit.targetGoal || 1;
        const percentage = Math.min(100, Math.round((todaysCompletions / targetGoal) * 100));
        const isComplete = todaysCompletions >= targetGoal;

        const btnLabel = !isValidDay
            ? '✗ Not Scheduled'
            : isComplete
                ? (isPastDay ? '✓ Logged' : '✓ Done for Today')
                : (isPastDay ? '+ Log Past Day' : '+ Complete');

        return `
            <div class="habit-card" data-habit-id="${habit.id}">
                <div class="habit-icon">${habit.icon}</div>
                <div class="habit-name">${habit.name}</div>
                ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                <div class="habit-stats">
                    <div class="habit-stat">
                        <span class="habit-stat-label">Streak</span>
                        <span class="habit-stat-value">${habit.streak || 0}</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-label">Points</span>
                        <span class="habit-stat-value">${habit.points}</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-label">Progress</span>
                        <span class="habit-stat-value">${todaysCompletions}/${targetGoal}</span>
                    </div>
                </div>
                <div style="margin-top: 0.5rem;">
                    <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                        <div style="background: ${isComplete ? '#4CAF50' : '#2196F3'}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                    </div>
                    <div style="text-align: center; font-size: 0.9rem; color: ${isComplete ? '#4CAF50' : '#666'}; margin-bottom: 0.5rem;">
                        ${isComplete ? '✓ Complete!' : `${percentage}% Complete`}
                    </div>
                </div>
                <button class="habit-checkbox ${!isValidDay || isComplete ? 'disabled' : ''}" data-habit-id="${habit.id}" ${!isValidDay || isComplete ? 'disabled' : ''}>
                    ${btnLabel}
                </button>
            </div>
        `;
    }

    openHabitModal(habitId: string | null = null): void {
        this.currentEditingHabitId = habitId;
        const modal = document.getElementById('habitModal')!;
        const form = document.getElementById('habitForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteHabitBtn') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';
        (document.getElementById('habitIcon') as HTMLInputElement).value = '⭐';
        document.getElementById('habitIconDisplay')!.textContent = '⭐';

        document.querySelectorAll<HTMLInputElement>('input[name="habitDay"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        if (habitId) {
            const habit = storage.getHabits().find(h => h.id === habitId);
            if (habit) {
                (document.getElementById('habitName') as HTMLInputElement).value = habit.name;
                (document.getElementById('habitDescription') as HTMLTextAreaElement).value = habit.description || '';
                (document.getElementById('habitIcon') as HTMLInputElement).value = habit.icon || '⭐';
                document.getElementById('habitIconDisplay')!.textContent = habit.icon || '⭐';
                (document.getElementById('habitCategory') as HTMLSelectElement).value = habit.category || '';
                (document.getElementById('habitPoints') as HTMLInputElement).value = String(habit.points || 5);
                (document.getElementById('habitTargetGoal') as HTMLInputElement).value = String(habit.targetGoal || 1);
                deleteBtn.style.display = 'block';

                if (habit.daysOfWeek && Array.isArray(habit.daysOfWeek)) {
                    habit.daysOfWeek.forEach(day => {
                        const checkbox = document.querySelector<HTMLInputElement>(`input[name="habitDay"][value="${day}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                } else {
                    document.querySelectorAll<HTMLInputElement>('input[name="habitDay"]').forEach(checkbox => {
                        checkbox.checked = true;
                    });
                }
            }
        } else {
            document.querySelectorAll<HTMLInputElement>('input[name="habitDay"]').forEach(checkbox => {
                checkbox.checked = true;
            });
        }

        this.loadCategoryDropdown('habit');
        modal.classList.add('active');
    }

    closeHabitModal(): void {
        document.getElementById('habitModal')!.classList.remove('active');
        this.currentEditingHabitId = null;
    }

    saveHabit(e: Event): void {
        e.preventDefault();

        const selectedDays = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="habitDay"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        const habit: Partial<Habit> = {
            name: (document.getElementById('habitName') as HTMLInputElement).value,
            description: (document.getElementById('habitDescription') as HTMLTextAreaElement).value,
            icon: (document.getElementById('habitIcon') as HTMLInputElement).value,
            category: (document.getElementById('habitCategory') as HTMLSelectElement).value || null,
            points: parseInt((document.getElementById('habitPoints') as HTMLInputElement).value),
            targetGoal: parseInt((document.getElementById('habitTargetGoal') as HTMLInputElement).value) || 1,
            daysOfWeek: selectedDays.length > 0 ? selectedDays : [0, 1, 2, 3, 4, 5, 6]
        };

        if (this.currentEditingHabitId) {
            storage.updateHabit(this.currentEditingHabitId, habit);
        } else {
            storage.addHabit(habit);
        }

        this.closeHabitModal();
        this.renderHabits();
    }

    deleteHabit(): void {
        if (this.currentEditingHabitId) {
            if (confirm('Are you sure you want to delete this habit?')) {
                storage.deleteHabit(this.currentEditingHabitId);
                this.closeHabitModal();
                this.renderHabits();
            }
        }
    }

    completeHabit(habitId: string): void {
        const habit = storage.getHabits().find(h => h.id === habitId);
        if (habit) {
            const selectedDayOfWeek = this.selectedDate.getDay();
            const isValidDay = !habit.daysOfWeek || habit.daysOfWeek.includes(selectedDayOfWeek);

            if (isValidDay) {
                storage.logHabitCompletion(habitId, this.selectedDate);
                storage.addPoints(habit.points, 'habits');
                storage.updateDailyStreak(true);
                this.renderHabits();
                this.renderDashboard();
            }
        }
    }

    openEmojiPicker(): void {
        const modal = document.getElementById('emojiModal')!;
        const emojiGrid = document.getElementById('emojiGrid')!;

        emojiGrid.innerHTML = this.emojis.map(emoji =>
            `<button type="button" class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
        ).join('');

        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectEmoji((e.target as HTMLElement).dataset.emoji!);
            });
        });

        modal.classList.add('active');
    }

    closeEmojiPicker(): void {
        document.getElementById('emojiModal')!.classList.remove('active');
    }

    selectEmoji(emoji: string): void {
        (document.getElementById('habitIcon') as HTMLInputElement).value = emoji;
        document.getElementById('habitIconDisplay')!.textContent = emoji;
        this.closeEmojiPicker();
    }

    // ========================
    // Category Management
    // ========================
    loadCategoryDropdown(type: string): void {
        const select = document.getElementById(`${type}Category`) as HTMLSelectElement;
        const categories = storage.getCategories();

        const currentValue = select.value;

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Select category...';

        const addNewOption = document.createElement('option');
        addNewOption.value = '__add_new__';
        addNewOption.textContent = '+ Add New Category';

        select.innerHTML = '';
        select.appendChild(emptyOption);

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });

        select.appendChild(addNewOption);
        select.value = currentValue;
    }

    handleCategoryChange(type: string, value: string): void {
        const inputDiv = document.getElementById(`${type}CategoryInput`) as HTMLElement;
        const textInput = document.getElementById(`${type}CategoryText`) as HTMLInputElement;

        if (value === '__add_new__') {
            inputDiv.style.display = 'block';
            textInput.value = '';
            textInput.focus();
        } else {
            inputDiv.style.display = 'none';
        }
    }

    handleAddCategory(type: string): void {
        const textInput = document.getElementById(`${type}CategoryText`) as HTMLInputElement;
        const categoryName = textInput.value.trim();

        if (categoryName) {
            if (storage.addCategory(categoryName)) {
                this.loadCategoryDropdown(type);
                const select = document.getElementById(`${type}Category`) as HTMLSelectElement;
                select.value = categoryName;
                (document.getElementById(`${type}CategoryInput`) as HTMLElement).style.display = 'none';
                textInput.value = '';
            } else {
                alert('This category already exists!');
            }
        } else {
            alert('Please enter a category name');
        }
    }

    cancelAddCategory(type: string): void {
        (document.getElementById(`${type}CategoryInput`) as HTMLElement).style.display = 'none';
        (document.getElementById(`${type}CategoryText`) as HTMLInputElement).value = '';
        (document.getElementById(`${type}Category`) as HTMLSelectElement).value = '';
    }

    // ========================
    // Settings Category Management
    // ========================
    renderCategoryManagement(): void {
        const list = document.getElementById('categoryList');
        if (!list) return;
        const categories = storage.getCategories();
        list.innerHTML = categories.length === 0
            ? '<li style="color: var(--text-light); font-size: 0.9rem; padding: 0.4rem 0;">No categories yet.</li>'
            : categories.map(cat => `
                <li class="category-list-item" data-name="${this.escapeHtml(cat)}">
                    <span class="category-name">${this.escapeHtml(cat)}</span>
                    <button class="btn btn-secondary btn-sm" onclick="app.startEditCategory('${this.escapeHtml(cat)}', this)">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteCategoryItem('${this.escapeHtml(cat)}')">Delete</button>
                </li>`).join('');
    }

    escapeHtml(str: string): string {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    startEditCategory(name: string, btn: HTMLElement): void {
        const li = btn.closest('li')!;
        const nameSpan = li.querySelector('.category-name') as HTMLElement;
        nameSpan.style.display = 'none';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'category-edit-input';
        input.value = name;
        li.insertBefore(input, nameSpan);
        btn.textContent = 'Save';
        (btn as any).onclick = () => this.saveEditCategory(name, input, btn);
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary btn-sm';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => this.renderCategoryManagement();
        btn.after(cancelBtn);
        input.focus();
    }

    saveEditCategory(oldName: string, input: HTMLInputElement, _btn: HTMLElement): void {
        const newName = input.value.trim();
        if (!newName) {
            alert('Please enter a category name.');
            return;
        }
        if (newName === oldName) {
            this.renderCategoryManagement();
            return;
        }
        if (!storage.updateCategory(oldName, newName)) {
            alert('A category with that name already exists.');
            return;
        }
        this.renderCategoryManagement();
    }

    deleteCategoryItem(name: string): void {
        if (!confirm(`Delete category "${name}"? All related items will have their category cleared.`)) return;
        storage.deleteCategory(name);
        this.renderCategoryManagement();
    }

    addCategoryFromSettings(): void {
        const input = document.getElementById('newCategoryText') as HTMLInputElement;
        const name = input.value.trim();
        if (!name) {
            alert('Please enter a category name.');
            return;
        }
        if (!storage.addCategory(name)) {
            alert('This category already exists.');
            return;
        }
        input.value = '';
        this.renderCategoryManagement();
    }

    // ========================
    // Finance Management
    // ========================
    initializeFinanceDateFilter(): void {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        (document.getElementById('financeStartDate') as HTMLInputElement).valueAsDate = firstDay;
        (document.getElementById('financeEndDate') as HTMLInputElement).valueAsDate = lastDay;
    }

    resetFinanceFilter(): void {
        this.initializeFinanceDateFilter();
        this.renderFinances();
    }

    getFinanceDateRange(): { startDate: string; endDate: string } {
        const startDate = (document.getElementById('financeStartDate') as HTMLInputElement).value;
        const endDate = (document.getElementById('financeEndDate') as HTMLInputElement).value;
        return { startDate, endDate };
    }

    filterFinanceItemsByDate(items: FinanceItem[]): FilteredFinanceItem[] {
        const { startDate, endDate } = this.getFinanceDateRange();

        if (!startDate && !endDate) {
            return items.map(item => ({ ...item, monthlyAmount: item.amount }));
        }

        return items.filter(item => {
            if (!item.date) return false;

            if (item.recurring === 'yearly' || item.recurring === 'monthly') {
                if (endDate && item.date > endDate) return false;
                return true;
            }

            if (startDate && item.date < startDate) return false;
            if (endDate && item.date > endDate) return false;

            return true;
        }).map(item => ({
            ...item,
            monthlyAmount: item.recurring === 'yearly' ? item.amount / 12 : item.amount
        }));
    }

    renderFinances(): void {
        this.updateFinanceSummary();
        this.renderExpenses();
        this.renderRevenue();
        this.renderCharges();
    }

    updateFinanceSummary(): void {
        const expenses = this.filterFinanceItemsByDate(storage.getExpenses());
        const revenue = this.filterFinanceItemsByDate(storage.getRevenue());
        const charges = this.filterFinanceItemsByDate(storage.getCharges());

        const totalExpenses = expenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);
        const totalCharges = charges.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);
        const totalRevenue = revenue.reduce((sum, r) => sum + (r.monthlyAmount || 0), 0);
        const net = totalRevenue - totalExpenses - totalCharges;

        document.getElementById('totalIncome')!.textContent = '$' + totalRevenue.toFixed(2);
        document.getElementById('totalExpenses')!.textContent = '$' + (totalExpenses + totalCharges).toFixed(2);
        document.getElementById('netBalance')!.textContent = '$' + net.toFixed(2);
    }

    renderExpenses(): void {
        const expenses = this.filterFinanceItemsByDate(storage.getExpenses());
        this.renderFinanceList(expenses, 'expensesList', 'expense');
    }

    renderRevenue(): void {
        const revenue = this.filterFinanceItemsByDate(storage.getRevenue());
        this.renderFinanceList(revenue, 'revenueList', 'revenue', true);
    }

    renderCharges(): void {
        const charges = this.filterFinanceItemsByDate(storage.getCharges());
        this.renderFinanceList(charges, 'chargesList', 'charge');
    }

    renderFinanceList(items: FilteredFinanceItem[], containerId: string, type: string, isIncome: boolean = false): void {
        const container = document.getElementById(containerId)!;

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-state">No items. Add one to get started!</p>';
            return;
        }

        container.innerHTML = items.map(item => {
            const displayAmount = (item.monthlyAmount !== undefined ? item.monthlyAmount : item.amount).toFixed(2);
            const monthlyLabel = item.recurring === 'yearly' ? '<span class="monthly-label"> /mo</span>' : '';
            return `
            <div class="finance-item" data-finance-id="${item.id}" data-finance-type="${type}">
                <div class="finance-item-left">
                    <div class="finance-item-desc">${item.description}</div>
                    <div class="finance-item-meta">
                        ${item.category ? `<span>📂 ${item.category}</span>` : ''}
                        <span>📅 ${item.date || 'N/A'}</span>
                        ${item.recurring ? `<span>🔁 ${item.recurring}</span>` : ''}
                    </div>
                </div>
                <div class="finance-item-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : '-'}$${displayAmount}${monthlyLabel}
                </div>
            </div>
        `;
        }).join('');

        document.querySelectorAll('.finance-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openFinanceModal((item as HTMLElement).dataset.financeType!, (item as HTMLElement).dataset.financeId!);
            });
        });
    }

    openFinanceModal(type: string, financeId: string | null = null): void {
        this.currentEditingFinanceType = type;
        this.currentEditingFinanceId = financeId;
        const modal = document.getElementById('financeModal')!;
        const form = document.getElementById('financeForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteFinanceBtn') as HTMLElement;
        const recurringGroup = document.getElementById('financeRecurringGroup') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';
        (document.getElementById('financeDate') as HTMLInputElement).valueAsDate = new Date();

        this.loadCategoryDropdown('finance');

        recurringGroup.style.display = ['expense', 'revenue'].includes(type) ? 'block' : 'none';

        const titles: Record<string, string> = { expense: 'Add Expense', revenue: 'Add Revenue', charge: 'Add Other Charge' };
        document.getElementById('financeModalTitle')!.textContent = financeId ? `Edit ${type}` : titles[type];

        if (financeId) {
            let item: FinanceItem | undefined;
            if (type === 'expense') item = storage.getExpenses().find(e => e.id === financeId);
            else if (type === 'revenue') item = storage.getRevenue().find(r => r.id === financeId);
            else if (type === 'charge') item = storage.getCharges().find(c => c.id === financeId);

            if (item) {
                (document.getElementById('financeDescription') as HTMLInputElement).value = item.description;
                (document.getElementById('financeAmount') as HTMLInputElement).value = String(item.amount);
                (document.getElementById('financeDate') as HTMLInputElement).value = item.date || '';
                (document.getElementById('financeCategory') as HTMLSelectElement).value = item.category || '';
                if (item.recurring) {
                    (document.getElementById('financeRecurring') as HTMLSelectElement).value = item.recurring;
                }
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeFinanceModal(): void {
        document.getElementById('financeModal')!.classList.remove('active');
        this.currentEditingFinanceId = null;
        this.currentEditingFinanceType = null;
    }

    saveFinance(e: Event): void {
        e.preventDefault();

        const financeItem: Partial<FinanceItem> = {
            description: (document.getElementById('financeDescription') as HTMLInputElement).value,
            amount: parseFloat((document.getElementById('financeAmount') as HTMLInputElement).value),
            date: (document.getElementById('financeDate') as HTMLInputElement).value,
            category: (document.getElementById('financeCategory') as HTMLSelectElement).value
        };

        if (['expense', 'revenue'].includes(this.currentEditingFinanceType!)) {
            financeItem.recurring = (document.getElementById('financeRecurring') as HTMLSelectElement).value as FinanceItem['recurring'];
        }

        if (this.currentEditingFinanceType === 'expense') {
            if (this.currentEditingFinanceId) {
                storage.updateExpense(this.currentEditingFinanceId, financeItem);
            } else {
                storage.addExpense(financeItem);
            }
        } else if (this.currentEditingFinanceType === 'revenue') {
            if (this.currentEditingFinanceId) {
                storage.updateRevenue(this.currentEditingFinanceId, financeItem);
            } else {
                storage.addRevenue(financeItem);
            }
        } else if (this.currentEditingFinanceType === 'charge') {
            if (this.currentEditingFinanceId) {
                storage.updateCharge(this.currentEditingFinanceId, financeItem);
            } else {
                storage.addCharge(financeItem);
            }
        }

        this.closeFinanceModal();
        this.renderFinances();
    }

    deleteFinance(): void {
        if (this.currentEditingFinanceId) {
            if (confirm('Are you sure you want to delete this item?')) {
                if (this.currentEditingFinanceType === 'expense') {
                    storage.deleteExpense(this.currentEditingFinanceId);
                } else if (this.currentEditingFinanceType === 'revenue') {
                    storage.deleteRevenue(this.currentEditingFinanceId);
                } else if (this.currentEditingFinanceType === 'charge') {
                    storage.deleteCharge(this.currentEditingFinanceId);
                }
                this.closeFinanceModal();
                this.renderFinances();
            }
        }
    }

    // ========================
    // Shop/Rewards Management
    // ========================
    renderShop(): void {
        const rewards = storage.getRewards();
        const userStats = storage.getUserStats();
        const container = document.getElementById('rewardsList')!;

        document.getElementById('shopPointsDisplay')!.textContent = String(userStats.totalPoints);

        if (rewards.length === 0) {
            container.innerHTML = '<p class="empty-state">No rewards yet. Add rewards to spend your points on!</p>';
            return;
        }

        container.innerHTML = rewards.map(reward => {
            let alreadyPurchased = false;
            if (reward.repeatable === false) {
                const purchaseHistory = storage.getData().purchaseHistory || [];
                alreadyPurchased = purchaseHistory.some(ph => ph.rewardId === reward.id);
            }
            const disabled = userStats.totalPoints < reward.cost || alreadyPurchased;
            let purchaseLabel = 'Purchase';
            if (userStats.totalPoints < reward.cost) purchaseLabel = 'Not Enough Points';
            if (alreadyPurchased) purchaseLabel = 'Purchased';

            return `
                <div class="project-card blue" style="cursor: pointer;" data-reward-id="${reward.id}">
                    <div class="project-title">${reward.name}</div>
                    ${reward.description ? `<div class="project-description">${reward.description}</div>` : ''}
                    <div class="project-stats">
                        <div class="project-stat">
                            <span class="project-stat-label">Cost</span>
                            <span class="project-stat-value">${reward.cost} pts</span>
                        </div>
                        <div class="project-stat">
                            <span class="project-stat-label">${reward.repeatable === false ? 'One-time' : 'Repeatable'}</span>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary purchase-btn" style="flex: 1;" ${disabled ? 'disabled' : ''}>
                            ${purchaseLabel}
                        </button>
                        <button class="btn btn-secondary edit-reward-btn">Edit</button>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.purchase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = (e.target as HTMLElement).closest('[data-reward-id]') as HTMLElement;
                this.purchaseReward(card.dataset.rewardId!);
            });
        });

        document.querySelectorAll('.edit-reward-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = (e.target as HTMLElement).closest('[data-reward-id]') as HTMLElement;
                this.openRewardModal(card.dataset.rewardId!);
            });
        });
    }

    openRewardModal(rewardId: string | null = null): void {
        this.currentEditingRewardId = rewardId;
        const modal = document.getElementById('rewardModal')!;
        const form = document.getElementById('rewardForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteRewardBtn') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';

        document.getElementById('rewardModalTitle')!.textContent = rewardId ? 'Edit Reward' : 'Add Reward';

        if (rewardId) {
            const reward = storage.getRewards().find(r => r.id === rewardId);
            if (reward) {
                (document.getElementById('rewardName') as HTMLInputElement).value = reward.name;
                (document.getElementById('rewardDescription') as HTMLTextAreaElement).value = reward.description || '';
                (document.getElementById('rewardCost') as HTMLInputElement).value = String(reward.cost);
                (document.getElementById('rewardRepeatable') as HTMLSelectElement).value = String(reward.repeatable === undefined ? true : reward.repeatable);
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeRewardModal(): void {
        document.getElementById('rewardModal')!.classList.remove('active');
        this.currentEditingRewardId = null;
    }

    saveReward(e: Event): void {
        e.preventDefault();

        const reward = {
            name: (document.getElementById('rewardName') as HTMLInputElement).value,
            description: (document.getElementById('rewardDescription') as HTMLTextAreaElement).value,
            cost: parseInt((document.getElementById('rewardCost') as HTMLInputElement).value),
            repeatable: (document.getElementById('rewardRepeatable') as HTMLSelectElement).value === 'true'
        };

        if (this.currentEditingRewardId) {
            storage.updateReward(this.currentEditingRewardId, reward);
        } else {
            storage.addReward(reward);
        }

        this.closeRewardModal();
        this.renderShop();
    }

    deleteReward(): void {
        if (this.currentEditingRewardId) {
            if (confirm('Are you sure you want to delete this reward?')) {
                storage.deleteReward(this.currentEditingRewardId);
                this.closeRewardModal();
                this.renderShop();
            }
        }
    }

    purchaseReward(rewardId: string): void {
        const reward = storage.getRewards().find(r => r.id === rewardId);
        if (!reward) return;

        if (confirm(`Purchase "${reward.name}" for ${reward.cost} points?`)) {
            const result = storage.purchaseReward(rewardId);

            if (result.success) {
                alert(`Congratulations! You've purchased: ${reward.name}!\n\nEnjoy your reward! 🎉`);
                this.renderShop();
                this.renderDashboard();
            } else {
                alert(result.message);
            }
        }
    }

    // ========================
    // Wish List
    // ========================
    renderWishList(): void {
        const items = storage.getWishItems();
        const container = document.getElementById('wishList')!;

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-state">No items in your wish list. Add one to get started!</p>';
            return;
        }

        container.innerHTML = items.map(item => this.renderWishItem(item)).join('');

        container.querySelectorAll<HTMLElement>('.wish-item').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                this.dragSrcWishId = el.dataset.wishId!;
                el.classList.add('dragging');
                e.dataTransfer!.effectAllowed = 'move';
            });
            el.addEventListener('dragend', () => {
                this.dragSrcWishId = null;
                el.classList.remove('dragging');
                container.querySelectorAll<HTMLElement>('.wish-item').forEach(i => i.classList.remove('drag-over'));
            });
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
                container.querySelectorAll<HTMLElement>('.wish-item').forEach(i => i.classList.remove('drag-over'));
                el.classList.add('drag-over');
            });
            el.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetId = el.dataset.wishId!;
                if (this.dragSrcWishId && this.dragSrcWishId !== targetId) {
                    const allItems = storage.getWishItems();
                    const srcIdx = allItems.findIndex(i => i.id === this.dragSrcWishId);
                    const tgtIdx = allItems.findIndex(i => i.id === targetId);
                    if (srcIdx !== -1 && tgtIdx !== -1) {
                        const reordered = [...allItems];
                        const [moved] = reordered.splice(srcIdx, 1);
                        reordered.splice(tgtIdx, 0, moved);
                        storage.reorderWishItems(reordered.map(i => i.id));
                        this.renderWishList();
                    }
                }
            });

            // Touch events for mobile drag and drop support
            let touchDragOverItem: HTMLElement | null = null;
            el.addEventListener('touchstart', () => {
                this.dragSrcWishId = el.dataset.wishId!;
                el.classList.add('dragging');
            }, { passive: false });
            el.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                // Temporarily hide the dragged element so elementFromPoint finds the element underneath
                el.style.visibility = 'hidden';
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                el.style.visibility = '';
                const targetItem = target?.closest<HTMLElement>('.wish-item') ?? null;
                if (targetItem !== touchDragOverItem) {
                    touchDragOverItem?.classList.remove('drag-over');
                    touchDragOverItem = targetItem !== el ? targetItem : null;
                    touchDragOverItem?.classList.add('drag-over');
                }
            }, { passive: false });
            el.addEventListener('touchend', (e) => {
                el.classList.remove('dragging');
                touchDragOverItem?.classList.remove('drag-over');
                const touch = e.changedTouches[0];
                el.style.visibility = 'hidden';
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                el.style.visibility = '';
                const targetItem = target?.closest<HTMLElement>('.wish-item');
                const targetId = targetItem?.dataset.wishId;
                touchDragOverItem = null;
                if (this.dragSrcWishId && targetId && this.dragSrcWishId !== targetId) {
                    const allItems = storage.getWishItems();
                    const srcIdx = allItems.findIndex(i => i.id === this.dragSrcWishId);
                    const tgtIdx = allItems.findIndex(i => i.id === targetId);
                    if (srcIdx !== -1 && tgtIdx !== -1) {
                        const reordered = [...allItems];
                        const [moved] = reordered.splice(srcIdx, 1);
                        reordered.splice(tgtIdx, 0, moved);
                        storage.reorderWishItems(reordered.map(i => i.id));
                        this.renderWishList();
                    }
                }
                this.dragSrcWishId = null;
            });

            el.querySelector('.wish-item-checkbox')!.addEventListener('change', (e) => {
                e.stopPropagation();
                const checkbox = e.target as HTMLInputElement;
                storage.updateWishItem(el.dataset.wishId!, { completed: checkbox.checked });
                el.classList.toggle('completed', checkbox.checked);
            });

            el.querySelector('.edit-wish-btn')!.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openWishItemModal(el.dataset.wishId!);
            });
        });
    }

    renderWishItem(item: WishItem): string {
        const priceStr = item.price !== undefined && item.price !== null
            ? `<span class="wish-item-price">$${Number(item.price).toFixed(2)}</span>`
            : '';
        const urlStr = item.url
            ? `<a class="wish-item-url" href="${item.url}" target="_blank" rel="noopener noreferrer">🔗 View Listing</a>`
            : '';
        const completedClass = item.completed ? ' completed' : '';
        const checkedAttr = item.completed ? ' checked' : '';
        return `
            <div class="wish-item${completedClass}" data-wish-id="${item.id}" draggable="true">
                <span class="wish-drag-handle" title="Drag to reorder">⠿</span>
                <input type="checkbox" class="wish-item-checkbox" title="Mark as received"${checkedAttr}>
                <div class="wish-item-content">
                    <div class="wish-item-title">${item.title}</div>
                    <div class="wish-item-meta">
                        ${priceStr}
                        ${urlStr}
                    </div>
                </div>
                <button class="btn btn-secondary edit-wish-btn">Edit</button>
            </div>
        `;
    }

    openWishItemModal(itemId: string | null = null): void {
        this.currentEditingWishItemId = itemId;
        const modal = document.getElementById('wishItemModal')!;
        const form = document.getElementById('wishItemForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteWishItemBtn') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';

        document.getElementById('wishItemModalTitle')!.textContent = itemId ? 'Edit Wish List Item' : 'Add Wish List Item';

        if (itemId) {
            const item = storage.getWishItems().find(w => w.id === itemId);
            if (item) {
                (document.getElementById('wishItemTitle') as HTMLInputElement).value = item.title;
                (document.getElementById('wishItemUrl') as HTMLInputElement).value = item.url || '';
                (document.getElementById('wishItemPrice') as HTMLInputElement).value =
                    item.price !== undefined && item.price !== null ? String(item.price) : '';
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeWishItemModal(): void {
        document.getElementById('wishItemModal')!.classList.remove('active');
        this.currentEditingWishItemId = null;
    }

    saveWishItem(e: Event): void {
        e.preventDefault();

        const title = (document.getElementById('wishItemTitle') as HTMLInputElement).value;
        const url = (document.getElementById('wishItemUrl') as HTMLInputElement).value.trim() || undefined;
        const priceVal = (document.getElementById('wishItemPrice') as HTMLInputElement).value;
        const price = priceVal !== '' ? parseFloat(priceVal) : undefined;

        const item = { title, url, price };

        if (this.currentEditingWishItemId) {
            storage.updateWishItem(this.currentEditingWishItemId, item);
        } else {
            storage.addWishItem(item);
        }

        this.closeWishItemModal();
        this.renderWishList();
    }

    deleteWishItem(): void {
        if (this.currentEditingWishItemId) {
            if (confirm('Are you sure you want to delete this wish list item?')) {
                storage.deleteWishItem(this.currentEditingWishItemId);
                this.closeWishItemModal();
                this.renderWishList();
            }
        }
    }

    // ========================
    // Notes
    // ========================
    renderNotes(): void {
        const notes = storage.getNotes();
        const container = document.getElementById('notesList')!;

        if (notes.length === 0) {
            container.innerHTML = '<p class="empty-state">No notes yet. Add one to get started!</p>';
            return;
        }

        container.innerHTML = notes.map(note => this.renderNoteItem(note)).join('');

        container.querySelectorAll<HTMLElement>('.note-item').forEach(el => {
            el.addEventListener('click', () => {
                this.openNoteModal(el.dataset.noteId!);
            });
        });
    }

    renderNoteItem(note: Note): string {
        const rawPreview = note.content.length > 120
            ? note.content.substring(0, 120) + '…'
            : note.content;
        const title = this.escapeHtml(note.title || 'Untitled');
        const preview = rawPreview ? this.escapeHtml(rawPreview) : '<em>No content</em>';
        const date = new Date(note.updatedDate ?? note.createdDate).toLocaleDateString();
        return `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-item-title">${title}</div>
                <div class="note-item-preview">${preview}</div>
                <div class="note-item-date">${date}</div>
            </div>
        `;
    }

    openNoteModal(noteId: string | null = null): void {
        this.currentEditingNoteId = noteId;
        const modal = document.getElementById('noteModal')!;
        const form = document.getElementById('noteForm') as HTMLFormElement;
        const deleteBtn = document.getElementById('deleteNoteBtn') as HTMLElement;

        form.reset();
        deleteBtn.style.display = 'none';

        document.getElementById('noteModalTitle')!.textContent = noteId ? 'Edit Note' : 'Add Note';

        if (noteId) {
            const note = storage.getNotes().find(n => n.id === noteId);
            if (note) {
                (document.getElementById('noteTitle') as HTMLInputElement).value = note.title;
                (document.getElementById('noteContent') as HTMLTextAreaElement).value = note.content;
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeNoteModal(): void {
        document.getElementById('noteModal')!.classList.remove('active');
        this.currentEditingNoteId = null;
    }

    saveNote(e: Event): void {
        e.preventDefault();

        const title = (document.getElementById('noteTitle') as HTMLInputElement).value.trim();
        const content = (document.getElementById('noteContent') as HTMLTextAreaElement).value.trim();

        if (this.currentEditingNoteId) {
            storage.updateNote(this.currentEditingNoteId, { title, content });
        } else {
            storage.addNote({ title, content });
        }

        this.closeNoteModal();
        this.renderNotes();
    }

    deleteNote(): void {
        if (this.currentEditingNoteId) {
            if (confirm('Are you sure you want to delete this note?')) {
                storage.deleteNote(this.currentEditingNoteId);
                this.closeNoteModal();
                this.renderNotes();
            }
        }
    }

    // ========================
    // Settings
    // ========================
    renderSettings(): void {
        this.loadSettings();
        this.updateSettingsStatus();
        this.renderCategoryManagement();
    }

    loadSettings(): void {
        const settings = storage.getSettings();
        const tasksPerLevelInput = document.getElementById('tasksPerLevel') as HTMLInputElement | null;
        if (tasksPerLevelInput) {
            tasksPerLevelInput.value = String(settings.tasksPerLevel || 30);
        }
    }

    updateSettingsStatus(): void {
        const settings = storage.getSettings();
        const tasks = storage.getTasks();
        const completedTasksCount = tasks.filter(t => t.completed).length;
        const userStats = storage.getUserStats();
        const tasksInCurrentLevel = completedTasksCount % settings.tasksPerLevel;
        const tasksToNext = settings.tasksPerLevel - tasksInCurrentLevel;

        const currentLevelEl = document.getElementById('settingsCurrentLevel');
        const totalCompletedEl = document.getElementById('settingsTotalCompleted');
        const tasksToNextEl = document.getElementById('settingsTasksToNext');

        if (currentLevelEl) currentLevelEl.textContent = String(userStats.level);
        if (totalCompletedEl) totalCompletedEl.textContent = String(completedTasksCount);
        if (tasksToNextEl) tasksToNextEl.textContent = String(tasksToNext);
    }

    saveTasksPerLevel(): void {
        const tasksPerLevel = parseInt((document.getElementById('tasksPerLevel') as HTMLInputElement).value);

        if (isNaN(tasksPerLevel) || tasksPerLevel < 1) {
            alert('Please enter a valid number (minimum 1)');
            return;
        }

        storage.updateSettings({ tasksPerLevel });
        alert('Settings saved! Level has been recalculated.');
        this.updateSettingsStatus();
        this.renderDashboard();
    }

    exportData(): void {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(e: Event): void {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (storage.importData(event.target!.result as string)) {
                    alert('Data imported successfully! Refreshing...');
                    location.reload();
                } else {
                    alert('Invalid file format. Please upload a valid Task Manager backup.');
                }
            } catch (error) {
                alert('Error importing file: ' + (error as Error).message);
            }
        };
        reader.readAsText(file);
    }

    // ========================
    // Recurring Tasks Processing
    // ========================
    processRecurringTasks(): void {
        // New recurring tasks are created immediately when a repeatable task is completed
        // via createNextRecurringTask(). The original completed task stays in history.
    }

    // ========================
    // General Rendering
    // ========================
    render(): void {
        document.getElementById('dataVersion')!.textContent = STORAGE_VERSION;
        const lastUpdated = storage.getData().lastUpdated;
        document.getElementById('lastUpdated')!.textContent = lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never';

        this.updateDateNavigator();
        this.renderDashboard();
    }

    // ========================
    // Date Navigation
    // ========================
    getSelectedDateStr(): string {
        return storage.formatDate(this.selectedDate);
    }

    isSelectedDateToday(): boolean {
        return this.getSelectedDateStr() === storage.formatDate(new Date());
    }

    navigateDate(delta: number): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() - 6);

        const newDate = new Date(this.selectedDate);
        newDate.setDate(newDate.getDate() + delta);
        newDate.setHours(0, 0, 0, 0);

        if (newDate >= minDate && newDate <= today) {
            this.selectedDate = newDate;
            this.updateDateNavigator();
            const activeTab = document.querySelector('.nav-tab.active') as HTMLElement | null;
            if (activeTab) {
                this.switchTab(activeTab.dataset.tab!);
            } else {
                this.renderDashboard();
            }
        }
    }

    formatDisplayDate(date: Date): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }

    updateDateNavigator(): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() - 6);

        const sel = new Date(this.selectedDate);
        sel.setHours(0, 0, 0, 0);

        const isToday = sel.getTime() === today.getTime();
        const isPastLimit = sel.getTime() <= minDate.getTime();

        const displayStr = isToday
            ? `Today — ${this.formatDisplayDate(this.selectedDate)}`
            : this.formatDisplayDate(this.selectedDate);

        document.getElementById('selectedDateDisplay')!.textContent = displayStr;
        (document.getElementById('prevDayBtn') as HTMLButtonElement).disabled = isPastLimit;
        (document.getElementById('nextDayBtn') as HTMLButtonElement).disabled = isToday;
        (document.getElementById('goTodayBtn') as HTMLElement).style.display = isToday ? 'none' : 'inline-block';
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    (window as any).app = new TaskManager();
});

export { TaskManager };
