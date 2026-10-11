
/* =========================================
   1. SELECT HTML ELEMENTS
========================================= */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskNote = document.getElementById("taskNote");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const allCount = document.getElementById("allCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");

const totalTasks = document.getElementById("totalTasks");
const totalCompleted = document.getElementById("totalCompleted");
const totalPending = document.getElementById("totalPending");
const progressPercentage = document.getElementById("progressPercentage");
const progressBar = document.getElementById("progressBar");

const currentDate = document.getElementById("currentDate");
const currentYear = document.getElementById("currentYear");

const visibleTaskCount = document.getElementById("visibleTaskCount");
const taskListTitle = document.getElementById("taskListTitle");
const taskSubtitle = document.getElementById("taskSubtitle");
const clearCompletedButton = document.getElementById(
    "clearCompletedButton"
);


/* =========================================
   2. APP DATA
========================================= */

// Load previously saved tasks from localStorage.
let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("taskflowTasks")
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean"
        ).map(task => ({
            id: task.id,
            title: task.title,
            note: typeof task.note === "string" ? task.note : "",
            completed: task.completed
        }));
    }
} catch (error) {
    console.error("Unable to load saved tasks:", error);
}

// Currently selected task filter.
let currentFilter = "all";


/* =========================================
   3. DISPLAY CURRENT DATE
========================================= */

function updateDate() {
    const today = new Date();

    currentDate.textContent = today.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

    currentYear.textContent = today.getFullYear();
}

updateDate();


/* =========================================
   4. SAVE TASKS
========================================= */

function saveTasks() {
    try {
        localStorage.setItem(
            "taskflowTasks",
            JSON.stringify(tasks)
        );
    } catch (error) {
        console.error("Unable to save tasks:", error);

        alert(
            "Your tasks could not be saved. " +
            "Check your browser storage settings."
        );
    }
}


/* =========================================
   5. ADD A NEW TASK
========================================= */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskInput.value.trim();
    const note = taskNote.value.trim();

    if (title === "") {
        taskInput.focus();
        return;
    }

    const newTask = {
        id: createTaskId(),
        title: title,
        note: note,
        completed: false
    };

    tasks.unshift(newTask);

    saveTasks();

    // Show the new task immediately.
    currentFilter = "all";
    updateActiveFilters();
    renderTasks();
    updateStatistics();

    // Clear the form.
    taskForm.reset();
    taskInput.focus();
});

function createTaskId() {
    if (typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}


/* =========================================
   6. RENDER TASKS
========================================= */

function renderTasks() {
    // Remove existing task elements but keep the empty state.
    taskList.querySelectorAll(".task-item").forEach(item => {
        item.remove();
    });

    let filteredTasks = tasks;

    if (currentFilter === "pending") {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = tasks.filter(task => task.completed);
    }

    // Update the empty state.
    emptyState.hidden = filteredTasks.length > 0;

    if (filteredTasks.length === 0) {
        const emptyHeading = emptyState.querySelector("h3");
        const emptyMessage = emptyState.querySelector("p");

        if (tasks.length === 0) {
            emptyHeading.textContent = "No tasks yet";
            emptyMessage.textContent =
                "Add your first task above and start making progress.";
        } else if (currentFilter === "pending") {
            emptyHeading.textContent = "No pending tasks";
            emptyMessage.textContent =
                "Great! You have no unfinished tasks in this list.";
        } else if (currentFilter === "completed") {
            emptyHeading.textContent = "No completed tasks";
            emptyMessage.textContent =
                "Complete a task and it will appear here.";
        } else {
            emptyHeading.textContent = "No tasks found";
            emptyMessage.textContent =
                "Add a task to get started.";
        }
    }

    // Create a separate HTML element for each task.
    filteredTasks.forEach(task => {
        const taskElement = document.createElement("article");

        taskElement.className = "task-item";

        if (task.completed) {
            taskElement.classList.add("completed");
        }

        // Completion checkbox.
        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            "Mark " + task.title + " as completed"
        );

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });

        // Task details.
        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = task.title;

        details.appendChild(title);

        if (task.note) {
            const note = document.createElement("p");

            note.className = "task-note";
            note.textContent = task.note;

            details.appendChild(note);
        }

        // Pending/completed status.
        const status = document.createElement("span");

        status.className = "task-status " +
            (task.completed ? "completed" : "pending");

        status.textContent = task.completed
            ? "Completed"
            : "Pending";

        details.appendChild(status);

        // Task action buttons.
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className =
            "task-action-button delete-button";
        deleteButton.textContent = "✕";
        deleteButton.setAttribute(
            "aria-label",
            "Delete " + task.title
        );
        deleteButton.title = "Delete task";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        actions.appendChild(deleteButton);

        taskElement.appendChild(checkbox);
        taskElement.appendChild(details);
        taskElement.appendChild(actions);

        taskList.appendChild(taskElement);
    });

    visibleTaskCount.textContent =
        filteredTasks.length +
        (filteredTasks.length === 1 ? " task" : " tasks");

    updateSectionHeading();
}


/* =========================================
   7. MARK TASK COMPLETE OR PENDING
========================================= */

function toggleTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    saveTasks();
    renderTasks();
    updateStatistics();
}


/* =========================================
   8. DELETE A TASK
========================================= */

function deleteTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) {
        return;
    }

    const shouldDelete = confirm(
        'Are you sure you want to delete "' +
        task.title +
        '"?'
    );

    if (!shouldDelete) {
        return;
    }

    tasks = tasks.filter(item => item.id !== taskId);

    saveTasks();
    renderTasks();
    updateStatistics();
}


/* =========================================
   9. FILTER TASKS
========================================= */

function setFilter(filter) {
    currentFilter = filter;

    updateActiveFilters();
    renderTasks();
}

function updateActiveFilters() {
    document.querySelectorAll("[data-filter]").forEach(button => {
        const isActive =
            button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);

        if (button.classList.contains("nav-item")) {
            if (isActive) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        }
    });
}

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", function () {
        setFilter(this.dataset.filter);
    });
});


/* =========================================
   10. CLEAR COMPLETED TASKS
========================================= */

clearCompletedButton.addEventListener("click", function () {
    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const shouldClear = confirm(
        "Delete all " + completedTasks.length +
        " completed task(s)?"
    );

    if (!shouldClear) {
        return;
    }

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
    updateStatistics();
});


/* =========================================
   11. UPDATE STATISTICS
========================================= */

function updateStatistics() {
    const total = tasks.length;

    const completed = tasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    // Update sidebar counters.
    allCount.textContent = total;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;

    // Update statistics cards.
    totalTasks.textContent = total;
    totalCompleted.textContent = completed;
    totalPending.textContent = pending;

    progressPercentage.textContent = percentage + "%";
    progressBar.style.width = percentage + "%";

    // Accessibility information for the progress bar.
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute(
        "aria-valuenow",
        percentage
    );
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
}


/* =========================================
   12. UPDATE TASK SECTION HEADING
========================================= */

function updateSectionHeading() {
    const headings = {
        all: {
            title: "All Tasks",
            subtitle: "Manage your daily activities."
        },
        pending: {
            title: "Pending Tasks",
            subtitle: "Focus on what still needs to be done."
        },
        completed: {
            title: "Completed Tasks",
            subtitle: "Review the tasks you have finished."
        }
    };

    taskListTitle.textContent = headings[currentFilter].title;
    taskSubtitle.textContent = headings[currentFilter].subtitle;
}


/* =========================================
   13. INITIALIZE THE APP
========================================= */

updateActiveFilters();
renderTasks();
updateStatistics();
