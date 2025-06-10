// =================================================================
// ToDoリスト & サイト共通スクリプト
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------------------------------------
  // ToDoアプリのロジック
  // -----------------------------------------------------------------

  // --- 1. DOM要素の取得 ---
  const taskInput = document.getElementById("taskInput");
  const addTaskButton = document.getElementById("addTaskButton");
  const taskList = document.getElementById("taskList");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const confirmSwitch = document.getElementById("confirmSwitch");
  const addPositionSwitch = document.getElementById("addPositionSwitch");

  // --- 2. アプリケーションの状態管理 ---
  let todos = JSON.parse(localStorage.getItem("todos")) || [];
  let currentFilter = "all";
  let shouldConfirmDeletion = false;
  let isPrependMode = true;

  // --- 3. Cookie操作ヘルパー関数 ---
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie =
      name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // --- 4. 主要な関数 ---
  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";
    const filteredTodos = todos.filter((todo) => {
      if (currentFilter === "active") return !todo.completed;
      if (currentFilter === "completed") return todo.completed;
      return true;
    });
    if (filteredTodos.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.classList.add("empty-message");
      emptyMessage.textContent = "タスクはありません。";
      taskList.appendChild(emptyMessage);
    } else {
      filteredTodos.forEach((todo) => {
        const li = document.createElement("li");
        li.dataset.id = todo.id;
        li.setAttribute("draggable", "true");
        li.classList.toggle("completed", todo.completed);
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;
        checkbox.addEventListener("change", () => toggleTaskComplete(todo.id));
        const taskText = document.createElement("span");
        taskText.classList.add("task-text");
        taskText.textContent = todo.text;
        taskText.addEventListener("click", () => toggleTaskComplete(todo.id));
        const copyButton = document.createElement("button");
        copyButton.classList.add("copy-btn");
        copyButton.textContent = "コピー";
        copyButton.addEventListener("click", (event) => {
          event.stopPropagation();
          copyTextToClipboard(todo.text);
        });
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn");
        deleteButton.textContent = "削除";
        deleteButton.addEventListener("click", () => deleteTask(todo.id));
        li.appendChild(checkbox);
        li.appendChild(taskText);
        li.appendChild(copyButton);
        li.appendChild(deleteButton);
        taskList.appendChild(li);
      });
    }
    saveTasksToLocalStorage();
  }

  function saveTasksToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  function addTask() {
    if (!taskInput) return;
    const taskText = taskInput.value.trim();
    if (taskText === "") {
      alert("タスクを入力してください。");
      return;
    }
    const newTask = { id: Date.now(), text: taskText, completed: false };
    if (isPrependMode) {
      todos.unshift(newTask);
    } else {
      todos.push(newTask);
    }
    taskInput.value = "";
    taskInput.focus();
    renderTasks();
  }

  function toggleTaskComplete(id) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    renderTasks();
  }

  function deleteTask(id) {
    if (
      shouldConfirmDeletion &&
      !window.confirm("このタスクを削除しますか？")
    ) {
      return;
    }
    todos = todos.filter((todo) => todo.id !== id);
    renderTasks();
  }

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("コピーしました！");
    } catch (err) {
      console.error("テキストのコピーに失敗しました:", err);
      alert("コピーに失敗しました。");
    }
  }

  function loadSettings() {
    // 削除時確認の設定
    const confirmationSetting = getCookie("shouldConfirmDeletion");
    shouldConfirmDeletion = confirmationSetting === "true";
    if (confirmSwitch) {
      confirmSwitch.checked = shouldConfirmDeletion;
    }
    // タスク追加位置の設定
    const addPositionSetting = getCookie("isPrependMode");
    isPrependMode = addPositionSetting !== "false";
    if (addPositionSwitch) {
      addPositionSwitch.checked = isPrependMode;
    }
  }

  // --- 5. イベントリスナーの設定 ---
  function initializeTodoEventListeners() {
    if (taskInput) {
      taskInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") addTask();
      });
    }
    if (addTaskButton) {
      addTaskButton.addEventListener("click", addTask);
    }
    if (filterButtons.length > 0) {
      filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
          filterButtons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
          currentFilter = button.dataset.filter;
          renderTasks();
        });
      });
    }
    if (confirmSwitch) {
      confirmSwitch.addEventListener("change", function () {
        shouldConfirmDeletion = this.checked;
        setCookie("shouldConfirmDeletion", this.checked, 365);
      });
    }
    if (addPositionSwitch) {
      addPositionSwitch.addEventListener("change", function () {
        isPrependMode = this.checked;
        setCookie("isPrependMode", this.checked, 365);
      });
    }
    if (taskList) {
      let draggingElm = null;
      taskList.addEventListener("dragstart", (e) => {
        if (e.target.nodeName === "LI") {
          draggingElm = e.target;
          e.target.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        }
      });
      taskList.addEventListener("dragover", (e) => {
        e.preventDefault();
        const target = e.target.closest("li");
        if (
          !target ||
          target === draggingElm ||
          target.classList.contains("empty-message")
        ) {
          return;
        }
        e.dataTransfer.dropEffect = "move";
        const rect = target.getBoundingClientRect();
        const isAfter = e.clientY - rect.top > rect.height / 2;
        if (isAfter) {
          target.parentNode.insertBefore(draggingElm, target.nextSibling);
        } else {
          target.parentNode.insertBefore(draggingElm, target);
        }
      });
      taskList.addEventListener("dragend", () => {
        if (draggingElm) {
          draggingElm.classList.remove("dragging");
          const newOrderedIds = [
            ...taskList.querySelectorAll("li:not(.empty-message)"),
          ].map((li) => Number(li.dataset.id));
          todos.sort(
            (a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id)
          );
          saveTasksToLocalStorage();
          draggingElm = null;
        }
      });
    }
  }

  // --- 6. アプリケーションの初期化 ---
  function initializeTodoApp() {
    loadSettings();
    initializeTodoEventListeners();
    renderTasks();
  }

  // ToDoアプリを初期化
  initializeTodoApp();

  // -----------------------------------------------------------------
  // ハンバーガーメニューのロジック
  // -----------------------------------------------------------------

  const hamburger = document.querySelector(".fa-bars");
  const closeMenu = document.querySelector(".fa-xmark");
  const body = document.body;

  if (hamburger && closeMenu) {
    hamburger.addEventListener("click", () => {
      body.classList.add("nav-open");
    });

    closeMenu.addEventListener("click", () => {
      body.classList.remove("nav-open");
    });
  }
});
