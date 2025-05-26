const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const deadlineInput = document.getElementById('deadline-input');
const list = document.getElementById('task-list');
const clearBtn = document.getElementById('clear-tasks');
const filterButtons = document.querySelectorAll('.filters button');
const themeToggle = document.getElementById('theme-toggle');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks(filter = 'all') {
  list.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.completed;
    if (filter === 'incomplete') return !task.completed;
  });

  if (filter === 'all') {
    filteredTasks.sort((a, b) => a.completed - b.completed);
  }

  filteredTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.setAttribute('draggable', 'true');
    li.dataset.index = index;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.title = task.completed ? 'Mark as incomplete' : 'Mark as complete';
    checkbox.addEventListener('change', () => {
      const realIndex = tasks.findIndex(t => t === task);
      tasks[realIndex].completed = checkbox.checked;
      saveTasks();
      renderTasks(document.querySelector('.filters .active').dataset.filter);
    });

    const span = document.createElement('span');
    span.textContent = task.text;
    span.classList.add('task-text');
    if (task.completed) span.classList.add('completed');

    const deadlineSpan = document.createElement('small');
    deadlineSpan.style.display = 'block';
    deadlineSpan.style.marginTop = '4px';
    deadlineSpan.style.fontSize = '0.8em';
    deadlineSpan.style.color = '#888';

    const now = new Date();
    const deadline = new Date(task.deadline);
    const isMissed = !task.completed && deadline < now;
    if (task.deadline) {
      deadlineSpan.textContent = `Deadline: ${task.deadline}` + (isMissed ? ' ⚠️ (Deadline missed!)' : '');
      if (isMissed) {
        deadlineSpan.style.color = '#e53935';
        deadlineSpan.style.fontWeight = 'bold';
      }
    }

    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.className = 'icon-btn edit';
    editBtn.title = 'Edit task';
    editBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Edit Task',
        input: 'text',
        inputValue: task.text,
        inputLabel: 'Update your task name:',
        showCancelButton: true,
        confirmButtonText: 'Save',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value.trim()) return 'Task name cannot be empty!';
        }
      }).then((result) => {
        if (result.isConfirmed && result.value.trim() !== '') {
          const realIndex = tasks.findIndex(t => t === task);
          tasks[realIndex].text = result.value.trim();
          saveTasks();
          renderTasks(document.querySelector('.filters .active').dataset.filter);
          Swal.fire('Updated!', 'Task updated successfully.', 'success');
        }
      });
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.className = 'icon-btn delete';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => {
      Swal.fire({
        title: 'Delete this task?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#e53935',
      }).then((result) => {
        if (result.isConfirmed) {
          const realIndex = tasks.findIndex(t => t === task);
          tasks.splice(realIndex, 1);
          saveTasks();
          renderTasks(document.querySelector('.filters .active').dataset.filter);
          Swal.fire('Deleted!', 'Task deleted successfully.', 'success');
        }
      });
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deadlineSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  enableDragAndDrop();
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const text = input.value.trim();
  const deadline = deadlineInput.value;
  if (!text || !deadline) return;

  const selectedDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    Swal.fire('Invalid Date', 'You cannot set a past deadline!', 'error');
    return;
  }

  tasks.push({ text, deadline, completed: false });
  saveTasks();
  renderTasks(document.querySelector('.filters .active').dataset.filter);
  input.value = '';
  deadlineInput.value = '';
  input.focus();
});

clearBtn.addEventListener('click', () => {
  if (tasks.length === 0) {
    Swal.fire('No tasks to clear!', '', 'info');
    return;
  }
  Swal.fire({
    title: 'Are you sure you want to delete all tasks?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, clear all!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#e53935',
  }).then((result) => {
    if (result.isConfirmed) {
      tasks = [];
      saveTasks();
      renderTasks();
      Swal.fire('Cleared!', 'All tasks deleted.', 'success');
    }
  });
});

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.filters .active').classList.remove('active');
    button.classList.add('active');
    renderTasks(button.dataset.filter);
  });
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    themeToggle.textContent = '🌙';
  }
  if (!document.querySelector('.filters .active')) {
    filterButtons[0].classList.add('active');
  }
  renderTasks(document.querySelector('.filters .active').dataset.filter);
});

// Drag and drop functionality
function enableDragAndDrop() {
  const items = list.querySelectorAll('.task-item');

  let draggedItem = null;

  items.forEach((item, index) => {
    item.addEventListener('dragstart', () => {
      draggedItem = item;
      item.classList.add('dragging');
    });

    item.addEventListener('dragend', () => {
      draggedItem = null;
      item.classList.remove('dragging');
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingOver = e.currentTarget;
      draggingOver.classList.add('drag-over');
    });

    item.addEventListener('dragleave', (e) => {
      e.currentTarget.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const dropTarget = e.currentTarget;
      dropTarget.classList.remove('drag-over');

      if (draggedItem !== dropTarget) {
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const dropIndex = parseInt(dropTarget.dataset.index);

        const movedTask = tasks.splice(draggedIndex, 1)[0];
        tasks.splice(dropIndex, 0, movedTask);

        saveTasks();
        renderTasks(document.querySelector('.filters .active').dataset.filter);
      }
    });
  });
}

// Toggle button
const toggleBtn = document.getElementById('toggle-btn');
const todoContent = document.getElementById('todo-content');

toggleBtn.textContent = '+';

toggleBtn.addEventListener('click', () => {
  const isCollapsed = todoContent.classList.toggle('collapsed');
  if (isCollapsed) {
    toggleBtn.classList.add('hamburger');
    toggleBtn.innerHTML = '<span></span><span></span><span></span>';
  } else {
    toggleBtn.classList.remove('hamburger');
    toggleBtn.textContent = '+';
  }
});
