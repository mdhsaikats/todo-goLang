// Notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');
    const taskText = taskInput.value.trim();

    if (taskText !== '') {
        try {
            // Send POST request to backend
            const response = await fetch('http://localhost:8080/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ task: taskText, completed: false })
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const data = await response.json();
            
            // Create and add task to pending list
            const listItem = createTaskElement(data);
            document.getElementById('taskList').appendChild(listItem);
            
            taskInput.value = '';
            taskInput.focus();
            
            showNotification('Task added successfully!', 'success');
        } catch (error) {
            console.error('Error adding task:', error);
            showNotification('Failed to add task. Please try again.', 'error');
        }
    }
}

async function fetchTasks() {
    const taskList = document.getElementById('taskList');
    const completedTaskList = document.getElementById('completedTaskList');
    
    try {
        const response = await fetch('http://localhost:8080/api/tasks');
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }

        const tasks = await response.json();
        
        // Clear existing tasks
        taskList.innerHTML = '';
        completedTaskList.innerHTML = '';
        
        // Add each task to the appropriate list
        tasks.forEach(task => {
            const listItem = createTaskElement(task);
            
            if (task.completed) {
                completedTaskList.appendChild(listItem);
            } else {
                taskList.appendChild(listItem);
            }
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showNotification('Failed to load tasks. Please refresh the page.', 'error');
    }
}

function createTaskElement(task) {
    const listItem = document.createElement('li');
    listItem.dataset.id = task.id;

    const taskSpan = document.createElement('span');
    taskSpan.textContent = task.task;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = function(e) {
        e.stopPropagation();
        deleteTask(task.id, listItem);
    };

    taskSpan.onclick = function() {
        toggleTaskCompletion(task.id, listItem, task.completed);
    };

    listItem.appendChild(taskSpan);
    listItem.appendChild(deleteBtn);
    
    return listItem;
}

async function deleteTask(taskId, listItem) {
    try {
        const response = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            listItem.remove();
            showNotification('Task deleted successfully!', 'success');
        } else {
            throw new Error('Failed to delete task');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task. Please try again.', 'error');
    }
}

async function toggleTaskCompletion(taskId, listItem, currentStatus) {
    try {
        const newStatus = !currentStatus;
        
        const response = await fetch(`http://localhost:8080/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update task');
        }

        // Move task to appropriate list
        const taskList = document.getElementById('taskList');
        const completedTaskList = document.getElementById('completedTaskList');
        
        listItem.remove();
        
        if (newStatus) {
            completedTaskList.appendChild(listItem);
            showNotification('Task marked as completed!', 'success');
        } else {
            taskList.appendChild(listItem);
            showNotification('Task moved to pending!', 'success');
        }
        
        // Update the onclick handler with new status
        const taskSpan = listItem.querySelector('span');
        taskSpan.onclick = function() {
            toggleTaskCompletion(taskId, listItem, newStatus);
        };
        
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Failed to update task. Please try again.', 'error');
    }
}

document.getElementById('addTaskButton').addEventListener('click', addTask);

document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Load tasks when page loads
window.addEventListener('DOMContentLoaded', fetchTasks);