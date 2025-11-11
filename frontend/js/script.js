// ===== Notification System =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-6 right-6 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium transition-transform duration-300 translate-x-full opacity-0 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;

    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 50);

    // Animate out
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== Fetch Tasks =====
async function fetchTasks() {
    const taskList = document.getElementById('taskList');
    const completedTaskList = document.getElementById('completedTaskList');

    try {
        const response = await fetch('http://localhost:8080/api/tasks');
        if (!response.ok) throw new Error('Failed to fetch tasks');

        const tasks = await response.json();
        taskList.innerHTML = '';
        completedTaskList.innerHTML = '';

        tasks.forEach(task => {
            const item = createTaskElement(task);
            (task.completed ? completedTaskList : taskList).appendChild(item);
        });

        updateCounters(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showNotification('❌ Failed to load tasks. Please refresh.', 'error');
    }
}

// ===== Create Task Element =====
function createTaskElement(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.className =
        'flex justify-between items-center bg-gray-100 rounded-lg p-2 mb-2 border transition-all hover:shadow-md';

    const span = document.createElement('span');
    span.textContent = task.task;
    span.className = `cursor-pointer ${task.completed ? 'line-through text-gray-500' : 'text-black'}`;
    span.onclick = () => toggleTaskCompletion(task.id, li, task.completed);

    const btnContainer = document.createElement('div');
    btnContainer.className = 'flex gap-2';

    const delBtn = document.createElement('button');
    delBtn.className = 'hover:scale-110 transition-transform p-1';
    delBtn.title = 'Delete';
    
    // Create and add image instead of text
    const deleteIcon = document.createElement('img');
    deleteIcon.src = 'asset/delete.png'; // Update with your image path
    deleteIcon.alt = 'Delete';
    deleteIcon.className = 'w-5 h-5'; // Adjust size as needed
    
    delBtn.appendChild(deleteIcon);
    delBtn.onclick = e => {
        e.stopPropagation();
        deleteTask(task.id, li);
    };

    btnContainer.appendChild(delBtn);

    li.appendChild(span);
    li.appendChild(btnContainer);

    return li;
}

// ===== Add Task =====
async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();

    if (text === '') {
        showNotification('⚠️ Please enter a task!', 'error');
        input.focus();
        return;
    }

    try {
        const res = await fetch('http://localhost:8080/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: text, completed: false }),
        });

        if (!res.ok) throw new Error('Failed to add task');

        const data = await res.json();
        const item = createTaskElement(data);
        document.getElementById('taskList').appendChild(item);

        input.value = '';
        input.focus();
        showNotification('✅ Task added successfully!');
        fetchTasks(); // refresh counts
    } catch (err) {
        console.error('Error adding task:', err);
        showNotification('❌ Failed to add task. Try again.', 'error');
    }
}

// ===== Delete Task =====
async function deleteTask(id, li) {
    try {
        const res = await fetch(`http://localhost:8080/api/tasks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');

        li.classList.add('opacity-0', 'translate-x-10');
        setTimeout(() => li.remove(), 300);
        showNotification('🗑️ Task deleted!');
        fetchTasks();
    } catch (err) {
        console.error('Error deleting task:', err);
        showNotification('❌ Could not delete task.', 'error');
    }
}

// ===== Toggle Completion =====
async function toggleTaskCompletion(id, li, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const res = await fetch(`http://localhost:8080/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: newStatus }),
        });

        if (!res.ok) throw new Error('Update failed');

        // Animate movement
        li.classList.add('opacity-0', 'translate-x-5');
        setTimeout(() => {
            li.remove();
            const newList = newStatus
                ? document.getElementById('completedTaskList')
                : document.getElementById('taskList');
            newList.appendChild(createTaskElement({ id, task: li.textContent.trim(), completed: newStatus }));
        }, 200);

        showNotification(newStatus ? '✅ Task completed!' : '↩️ Task moved back!');
        fetchTasks();
    } catch (err) {
        console.error('Error updating task:', err);
        showNotification('❌ Failed to update task.', 'error');
    }
}

// ===== Counter Update =====
function updateCounters(tasks) {
    const all = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = all - completed;

    document.getElementById('allCount').textContent = all;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pendingCount').textContent = pending;
}

// ===== Event Listeners =====
document.getElementById('addTaskButton').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
});
window.addEventListener('DOMContentLoaded', fetchTasks);
