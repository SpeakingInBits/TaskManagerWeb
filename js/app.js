// ========================
// Main Application Logic
// ========================

class TaskManager {
    constructor() {
        this.currentEditingTaskId = null;
        this.currentEditingProjectId = null;
        this.currentEditingHabitId = null;
        this.currentEditingFinanceId = null;
        this.currentEditingFinanceType = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.processRecurringTasks();
    }

    // ========================
    // Event Listeners Setup
    // ========================
    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Tasks section
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.deleteTask());
        document.getElementById('taskRepeatType').addEventListener('change', (e) => this.updateRepeatTypeUI(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterTasks());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterTasks());
        document.getElementById('searchTasks').addEventListener('input', () => this.filterTasks());

        // Projects section
        document.getElementById('addProjectBtn').addEventListener('click', () => this.openProjectModal());
        document.getElementById('projectForm').addEventListener('submit', (e) => this.saveProject(e));
        document.getElementById('cancelProjectBtn').addEventListener('click', () => this.closeProjectModal());
        document.getElementById('deleteProjectBtn').addEventListener('click', () => this.deleteProject());

        // Habits section
        document.getElementById('addHabitBtn').addEventListener('click', () => this.openHabitModal());
        document.getElementById('habitForm').addEventListener('submit', (e) => this.saveHabit(e));
        document.getElementById('cancelHabitBtn').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('deleteHabitBtn').addEventListener('click', () => this.deleteHabit());

        // Finances section
        document.getElementById('addBillBtn').addEventListener('click', () => this.openFinanceModal('bill'));
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openFinanceModal('expense'));
        document.getElementById('addRevenueBtn').addEventListener('click', () => this.openFinanceModal('revenue'));
        document.getElementById('financeForm').addEventListener('submit', (e) => this.saveFinance(e));
        document.getElementById('cancelFinanceBtn').addEventListener('click', () => this.closeFinanceModal());
        document.getElementById('deleteFinanceBtn').addEventListener('click', () => this.deleteFinance());

        document.querySelectorAll('.finance-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFinanceTab(e.target.dataset.financeTab));
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Settings
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearDataBtn').addEventListener('click', () => {
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
    }

    // ========================
    // Tab Navigation
    // ========================
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

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
        }
    }

    switchFinanceTab(tabName) {
        document.querySelectorAll('.finance-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.finance-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(`${tabName}-content`).classList.add('active');
        document.querySelector(`[data-finance-tab="${tabName}"]`).classList.add('active');
    }

    // ========================
    // Dashboard Rendering
    // ========================
    renderDashboard() {
        const today = storage.formatDate(new Date());
        const tasks = storage.getTasks();
        const projects = storage.getProjects();
        const habits = storage.getHabits();
        const expenses = storage.getExpenses();
        const revenue = storage.getRevenue();
        const bills = storage.getBills();
        const userStats = storage.getUserStats();
        const logs = storage.getData().dailyHabitLogs || [];

        // Update header stats
        document.getElementById('totalPoints').textContent = userStats.totalPoints;
        document.getElementById('userLevel').textContent = userStats.level;
        document.getElementById('dailyStreak').textContent = userStats.dailyStreak;

        // Today's overview
        const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed);
        const completedToday = tasks.filter(t => t.completedDate === today);
        const habitsDone = logs.filter(log => log.date === today).length;
        const billsDue = bills.filter(b => b.date === today);

        document.getElementById('todayTasksCount').textContent = todayTasks.length;
        document.getElementById('completedTodayCount').textContent = completedToday.length;
        document.getElementById('habitsDoneCount').textContent = habitsDone;
        document.getElementById('billsDueCount').textContent = billsDue.length;

        // Points breakdown
        document.getElementById('tasksPoints').textContent = userStats.pointsBreakdown.tasks;
        document.getElementById('projectsPoints').textContent = userStats.pointsBreakdown.projects;
        document.getElementById('habitsPoints').textContent = userStats.pointsBreakdown.habits;
        document.getElementById('streakBonus').textContent = userStats.pointsBreakdown.streakBonus;

        // Recent activity
        this.renderRecentActivity();

        // Active projects
        this.renderProjectsSummary();
    }

    renderRecentActivity() {
        const data = storage.getData();
        const activities = [];

        // Collect activities from tasks
        data.tasks.filter(t => t.completedDate).forEach(t => {
            activities.push({
                type: 'task',
                message: `Completed task: ${t.title}`,
                date: t.completedDate,
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
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        const activityList = document.getElementById('recentActivity');
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

    renderProjectsSummary() {
        const projects = storage.getProjects();
        const tasks = storage.getTasks();
        const container = document.getElementById('projectsSummary');

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
    // ========================
    renderTasks() {
        this.updateCategoryFilter();
        this.filterTasks();
    }

    filterTasks() {
        const tasks = storage.getTasks();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('searchTasks').value.toLowerCase();
        const today = storage.formatDate(new Date());

        let filtered = tasks.filter(task => {
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

        const taskList = document.getElementById('taskList');
        if (filtered.length === 0) {
            taskList.innerHTML = '<p class="empty-state">No tasks found.</p>';
            return;
        }

        taskList.innerHTML = filtered.map(task => this.renderTaskItem(task)).join('');

        // Add event listeners to task items
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.dataset.taskId;
                this.toggleTask(taskId);
            });
        });

        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('task-checkbox')) {
                    this.openTaskModal(item.dataset.taskId);
                }
            });
        });
    }

    renderTaskItem(task) {
        const today = storage.formatDate(new Date());
        let status = 'pending';
        if (task.completed) {
            status = 'completed';
        } else if (task.dueDate && task.dueDate < today) {
            status = 'overdue';
        }

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
            </div>
        `;
    }

    updateCategoryFilter() {
        const tasks = storage.getTasks();
        const categories = [...new Set(tasks.map(t => t.category).filter(c => c))];
        const select = document.getElementById('categoryFilter');
        const currentValue = select.value;
        select.innerHTML = '<option value="">All Categories</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        select.value = currentValue;
    }

    openTaskModal(taskId = null) {
        this.currentEditingTaskId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const deleteBtn = document.getElementById('deleteTaskBtn');

        form.reset();
        deleteBtn.style.display = 'none';

        // Update project dropdown
        this.updateProjectSelect();

        if (taskId) {
            const task = storage.getTasks().find(t => t.id === taskId);
            if (task) {
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskDueDate').value = task.dueDate || '';
                document.getElementById('taskCategory').value = task.category || '';
                document.getElementById('taskPriority').value = task.priority || 'medium';
                document.getElementById('taskPoints').value = task.points || 10;
                document.getElementById('taskRepeatType').value = task.repeatType || 'none';
                document.getElementById('taskProject').value = task.projectId || '';

                if (task.repeatType === 'custom') {
                    document.getElementById('customRepeatDays').value = task.customRepeatDays || '';
                }
                if (task.repeatType === 'movable') {
                    document.getElementById('movableRepeatDays').value = task.movableRepeatDays || '';
                }

                deleteBtn.style.display = 'block';

                this.updateRepeatTypeUI(task.repeatType);
            }
        }

        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        this.currentEditingTaskId = null;
    }

    updateRepeatTypeUI(repeatType) {
        const customGroup = document.getElementById('customRepeatGroup');
        const movableGroup = document.getElementById('movableRepeatGroup');

        customGroup.style.display = repeatType === 'custom' ? 'block' : 'none';
        movableGroup.style.display = repeatType === 'movable' ? 'block' : 'none';
    }

    updateProjectSelect() {
        const projects = storage.getProjects();
        const select = document.getElementById('taskProject');
        select.innerHTML = '<option value="">None</option>' + 
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    saveTask(e) {
        e.preventDefault();

        const task = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            dueDate: document.getElementById('taskDueDate').value,
            category: document.getElementById('taskCategory').value,
            priority: document.getElementById('taskPriority').value,
            points: parseInt(document.getElementById('taskPoints').value),
            repeatType: document.getElementById('taskRepeatType').value,
            projectId: document.getElementById('taskProject').value || null
        };

        if (task.repeatType === 'custom') {
            task.customRepeatDays = parseInt(document.getElementById('customRepeatDays').value);
        }
        if (task.repeatType === 'movable') {
            task.movableRepeatDays = parseInt(document.getElementById('movableRepeatDays').value);
        }

        if (this.currentEditingTaskId) {
            storage.updateTask(this.currentEditingTaskId, task);
        } else {
            storage.addTask(task);
        }

        this.closeTaskModal();
        this.renderTasks();
    }

    deleteTask() {
        if (this.currentEditingTaskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                storage.deleteTask(this.currentEditingTaskId);
                this.closeTaskModal();
                this.renderTasks();
            }
        }
    }

    toggleTask(taskId) {
        const task = storage.getTasks().find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                task.completedDate = storage.formatDate(new Date());
                storage.addPoints(task.points, 'tasks');
                storage.updateDailyStreak(true);
            }
            storage.updateTask(taskId, task);
            this.renderTasks();
            this.renderDashboard();
        }
    }

    // ========================
    // Projects Management
    // ========================
    renderProjects() {
        const projects = storage.getProjects();
        const container = document.getElementById('projectsList');

        if (projects.length === 0) {
            container.innerHTML = '<p class="empty-state">No projects yet. Create one to organize your tasks!</p>';
            return;
        }

        container.innerHTML = projects.map(project => this.renderProjectCard(project)).join('');

        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('project-edit-btn')) {
                    this.openProjectModal(card.dataset.projectId);
                }
            });
        });
    }

    renderProjectCard(project) {
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

    openProjectModal(projectId = null) {
        this.currentEditingProjectId = projectId;
        const modal = document.getElementById('projectModal');
        const form = document.getElementById('projectForm');
        const deleteBtn = document.getElementById('deleteProjectBtn');

        form.reset();
        deleteBtn.style.display = 'none';

        if (projectId) {
            const project = storage.getProjects().find(p => p.id === projectId);
            if (project) {
                document.getElementById('projectName').value = project.name;
                document.getElementById('projectDescription').value = project.description || '';
                document.getElementById('projectColor').value = project.color || 'blue';
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeProjectModal() {
        document.getElementById('projectModal').classList.remove('active');
        this.currentEditingProjectId = null;
    }

    saveProject(e) {
        e.preventDefault();

        const project = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            color: document.getElementById('projectColor').value
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

    deleteProject() {
        if (this.currentEditingProjectId) {
            if (confirm('Are you sure you want to delete this project? This will not delete the tasks in it.')) {
                storage.deleteProject(this.currentEditingProjectId);
                this.closeProjectModal();
                this.renderProjects();
            }
        }
    }

    // ========================
    // Habits Management
    // ========================
    renderHabits() {
        const habits = storage.getHabits();
        const container = document.getElementById('habitsList');

        if (habits.length === 0) {
            container.innerHTML = '<p class="empty-state">No habits yet. Create daily habits to build streaks!</p>';
            return;
        }

        container.innerHTML = habits.map(habit => this.renderHabitCard(habit)).join('');

        document.querySelectorAll('.habit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('habit-checkbox')) {
                    this.openHabitModal(card.dataset.habitId);
                }
            });
        });

        document.querySelectorAll('.habit-checkbox').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = e.target.dataset.habitId;
                this.completeHabit(habitId);
            });
        });
    }

    renderHabitCard(habit) {
        const isCompletedToday = storage.isHabitCompletedToday(habit.id);

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
                </div>
                <button class="habit-checkbox ${isCompletedToday ? 'completed' : ''}" data-habit-id="${habit.id}">
                    ${isCompletedToday ? '✓ Done Today' : 'Mark as Done'}
                </button>
            </div>
        `;
    }

    openHabitModal(habitId = null) {
        this.currentEditingHabitId = habitId;
        const modal = document.getElementById('habitModal');
        const form = document.getElementById('habitForm');
        const deleteBtn = document.getElementById('deleteHabitBtn');

        form.reset();
        deleteBtn.style.display = 'none';
        document.getElementById('habitIcon').value = '⭐';

        if (habitId) {
            const habit = storage.getHabits().find(h => h.id === habitId);
            if (habit) {
                document.getElementById('habitName').value = habit.name;
                document.getElementById('habitDescription').value = habit.description || '';
                document.getElementById('habitIcon').value = habit.icon || '⭐';
                document.getElementById('habitPoints').value = habit.points || 5;
                document.getElementById('habitFrequency').value = habit.frequency || 'daily';
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeHabitModal() {
        document.getElementById('habitModal').classList.remove('active');
        this.currentEditingHabitId = null;
    }

    saveHabit(e) {
        e.preventDefault();

        const habit = {
            name: document.getElementById('habitName').value,
            description: document.getElementById('habitDescription').value,
            icon: document.getElementById('habitIcon').value,
            points: parseInt(document.getElementById('habitPoints').value),
            frequency: document.getElementById('habitFrequency').value
        };

        if (this.currentEditingHabitId) {
            storage.updateHabit(this.currentEditingHabitId, habit);
        } else {
            storage.addHabit(habit);
        }

        this.closeHabitModal();
        this.renderHabits();
    }

    deleteHabit() {
        if (this.currentEditingHabitId) {
            if (confirm('Are you sure you want to delete this habit?')) {
                storage.deleteHabit(this.currentEditingHabitId);
                this.closeHabitModal();
                this.renderHabits();
            }
        }
    }

    completeHabit(habitId) {
        const habit = storage.getHabits().find(h => h.id === habitId);
        if (habit && !storage.isHabitCompletedToday(habitId)) {
            storage.logHabitCompletion(habitId);
            storage.addPoints(habit.points, 'habits');
            storage.updateDailyStreak(true);
            this.renderHabits();
            this.renderDashboard();
        }
    }

    // ========================
    // Finances Management
    // ========================
    renderFinances() {
        this.updateFinanceSummary();
        this.renderBills();
        this.renderExpenses();
        this.renderRevenue();
    }

    updateFinanceSummary() {
        const expenses = storage.getExpenses();
        const revenue = storage.getRevenue();
        const bills = storage.getBills();

        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0) + 
                              bills.reduce((sum, b) => sum + (b.amount || 0), 0);
        const totalRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
        const net = totalRevenue - totalExpenses;

        document.getElementById('totalIncome').textContent = '$' + totalRevenue.toFixed(2);
        document.getElementById('totalExpenses').textContent = '$' + totalExpenses.toFixed(2);
        document.getElementById('netBalance').textContent = '$' + net.toFixed(2);
    }

    renderBills() {
        const bills = storage.getBills();
        this.renderFinanceList(bills, 'billsList', 'bill');
    }

    renderExpenses() {
        const expenses = storage.getExpenses();
        this.renderFinanceList(expenses, 'expensesList', 'expense');
    }

    renderRevenue() {
        const revenue = storage.getRevenue();
        this.renderFinanceList(revenue, 'revenueList', 'revenue', true);
    }

    renderFinanceList(items, containerId, type, isIncome = false) {
        const container = document.getElementById(containerId);

        if (items.length === 0) {
            container.innerHTML = '<p class="empty-state">No items. Add one to get started!</p>';
            return;
        }

        container.innerHTML = items.map(item => `
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
                    ${isIncome ? '+' : '-'}$${item.amount.toFixed(2)}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.finance-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.openFinanceModal(item.dataset.financeType, item.dataset.financeId);
            });
        });
    }

    openFinanceModal(type, financeId = null) {
        this.currentEditingFinanceType = type;
        this.currentEditingFinanceId = financeId;
        const modal = document.getElementById('financeModal');
        const form = document.getElementById('financeForm');
        const deleteBtn = document.getElementById('deleteFinanceBtn');
        const recurringGroup = document.getElementById('financeRecurringGroup');

        form.reset();
        deleteBtn.style.display = 'none';
        document.getElementById('financeDate').valueAsDate = new Date();

        // Show/hide recurring option for bills
        recurringGroup.style.display = type === 'bill' ? 'block' : 'none';

        // Set modal title
        const titles = { bill: 'Add Bill', expense: 'Add Expense', revenue: 'Add Revenue' };
        document.getElementById('financeModalTitle').textContent = financeId ? `Edit ${type}` : titles[type];

        if (financeId) {
            let item = null;
            if (type === 'bill') item = storage.getBills().find(b => b.id === financeId);
            else if (type === 'expense') item = storage.getExpenses().find(e => e.id === financeId);
            else if (type === 'revenue') item = storage.getRevenue().find(r => r.id === financeId);

            if (item) {
                document.getElementById('financeDescription').value = item.description;
                document.getElementById('financeAmount').value = item.amount;
                document.getElementById('financeDate').value = item.date || '';
                document.getElementById('financeCategory').value = item.category || '';
                if (type === 'bill' && item.recurring) {
                    document.getElementById('financeRecurring').value = item.recurring;
                }
                deleteBtn.style.display = 'block';
            }
        }

        modal.classList.add('active');
    }

    closeFinanceModal() {
        document.getElementById('financeModal').classList.remove('active');
        this.currentEditingFinanceId = null;
        this.currentEditingFinanceType = null;
    }

    saveFinance(e) {
        e.preventDefault();

        const financeItem = {
            description: document.getElementById('financeDescription').value,
            amount: parseFloat(document.getElementById('financeAmount').value),
            date: document.getElementById('financeDate').value,
            category: document.getElementById('financeCategory').value
        };

        if (this.currentEditingFinanceType === 'bill') {
            financeItem.recurring = document.getElementById('financeRecurring').value;

            if (this.currentEditingFinanceId) {
                storage.updateBill(this.currentEditingFinanceId, financeItem);
            } else {
                storage.addBill(financeItem);
            }
        } else if (this.currentEditingFinanceType === 'expense') {
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
        }

        this.closeFinanceModal();
        this.renderFinances();
    }

    deleteFinance() {
        if (this.currentEditingFinanceId) {
            if (confirm('Are you sure you want to delete this item?')) {
                if (this.currentEditingFinanceType === 'bill') {
                    storage.deleteBill(this.currentEditingFinanceId);
                } else if (this.currentEditingFinanceType === 'expense') {
                    storage.deleteExpense(this.currentEditingFinanceId);
                } else if (this.currentEditingFinanceType === 'revenue') {
                    storage.deleteRevenue(this.currentEditingFinanceId);
                }
                this.closeFinanceModal();
                this.renderFinances();
            }
        }
    }

    // ========================
    // Settings
    // ========================
    exportData() {
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

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (storage.importData(event.target.result)) {
                    alert('Data imported successfully! Refreshing...');
                    location.reload();
                } else {
                    alert('Invalid file format. Please upload a valid Task Manager backup.');
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // ========================
    // Recurring Tasks Processing
    // ========================
    processRecurringTasks() {
        const tasks = storage.getTasks();
        const today = storage.formatDate(new Date());

        tasks.forEach(task => {
            if (task.completed && task.repeatType !== 'none') {
                if (task.repeatType === 'movable' && task.completedDate === today) {
                    // Create new task from completion date
                    const nextDueDate = new Date();
                    nextDueDate.setDate(nextDueDate.getDate() + task.movableRepeatDays);
                    
                    const newTask = {
                        title: task.title,
                        description: task.description,
                        category: task.category,
                        priority: task.priority,
                        points: task.points,
                        projectId: task.projectId,
                        repeatType: task.repeatType,
                        movableRepeatDays: task.movableRepeatDays,
                        dueDate: storage.formatDate(nextDueDate)
                    };

                    storage.addTask(newTask);
                    // Reset original task
                    storage.updateTask(task.id, { completed: false, completedDate: null });
                } else if (task.repeatType !== 'movable') {
                    // Check if we should create a new instance
                    const lastCompletion = new Date(task.completedDate);
                    const daysSinceCompletion = Math.floor((new Date() - lastCompletion) / (1000 * 60 * 60 * 24));

                    let shouldReset = false;
                    switch (task.repeatType) {
                        case 'daily':
                            shouldReset = daysSinceCompletion >= 1;
                            break;
                        case 'weekly':
                            shouldReset = daysSinceCompletion >= 7;
                            break;
                        case 'monthly':
                            shouldReset = daysSinceCompletion >= 30;
                            break;
                        case 'yearly':
                            shouldReset = daysSinceCompletion >= 365;
                            break;
                        case 'custom':
                            shouldReset = daysSinceCompletion >= task.customRepeatDays;
                            break;
                    }

                    if (shouldReset) {
                        storage.updateTask(task.id, { completed: false, completedDate: null });
                    }
                }
            }
        });
    }

    // ========================
    // General Rendering
    // ========================
    render() {
        document.getElementById('dataVersion').textContent = STORAGE_VERSION;
        const lastUpdated = storage.getData().lastUpdated;
        document.getElementById('lastUpdated').textContent = lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never';
        
        this.renderDashboard();
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TaskManager();
});
