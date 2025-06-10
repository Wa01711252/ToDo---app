// =================================================================
// ToDoリスト & サイト共通スクリプト (最終修正版)
// =================================================================
(function () {
  "use strict";

  // --- グローバルな状態管理変数 ---
  let todos = [];
  let currentFilter = "all";
  let shouldConfirmDeletion = false;
  let isPrependMode = true; // デフォルトは先頭追加(true)

  // --- Cookie操作ヘルパー関数 ---
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

  // --- 設定の読み込みと状態変数への反映 ---
  function loadSettings() {
    // 削除確認の設定
    shouldConfirmDeletion = getCookie("shouldConfirmDeletion") === "true";

    // 追加位置の設定 (Cookieが'false'の時だけfalse、それ以外はデフォルトのtrue)
    isPrependMode = getCookie("isPrependMode") !== "false";
  }

  // --- 状態変数に基づいてDOMの表示を更新 ---
  function applySettingsToDOM() {
    const confirmSwitch = document.getElementById("confirmSwitch");
    if (confirmSwitch) {
      confirmSwitch.checked = shouldConfirmDeletion;
    }

    const addPositionSwitch = document.getElementById("addPositionSwitch");
    if (addPositionSwitch) {
      addPositionSwitch.checked = isPrependMode;
    }
  }

  // --- ToDoリスト関連の関数 ---
  function renderTasks() {
    const taskList = document.getElementById("taskList");
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
  }

  function saveTasksToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  function addTask() {
    const taskInput = document.getElementById("taskInput");
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
    saveTasksToLocalStorage();
  }

  function toggleTaskComplete(id) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    renderTasks();
    saveTasksToLocalStorage();
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
    saveTasksToLocalStorage();
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

  // --- イベントリスナーをセットアップする関数 ---
  function setupEventListeners() {
    // 設定スイッチ
    const confirmSwitch = document.getElementById("confirmSwitch");
    if (confirmSwitch) {
      confirmSwitch.addEventListener("change", function () {
        shouldConfirmDeletion = this.checked;
        setCookie("shouldConfirmDeletion", this.checked, 365);
      });
    }
    const addPositionSwitch = document.getElementById("addPositionSwitch");
    if (addPositionSwitch) {
      addPositionSwitch.addEventListener("change", function () {
        isPrependMode = this.checked;
        setCookie("isPrependMode", this.checked, 365);
      });
    }

    // ハンバーガーメニュー
    const hamburger = document.querySelector(".fa-bars");
    const closeMenu = document.querySelector(".fa-xmark");
    if (hamburger && closeMenu) {
      const body = document.body;
      hamburger.addEventListener("click", () => body.classList.add("nav-open"));
      closeMenu.addEventListener("click", () =>
        body.classList.remove("nav-open")
      );
    }

    // ToDoリスト関連のリスナー
    const taskInput = document.getElementById("taskInput");
    if (taskInput) {
      taskInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") addTask();
      });
    }
    const addTaskButton = document.getElementById("addTaskButton");
    if (addTaskButton) {
      addTaskButton.addEventListener("click", addTask);
    }
    const filterButtons = document.querySelectorAll(".filter-btn");
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
    const taskList = document.getElementById("taskList");
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
        )
          return;
        e.dataTransfer.dropEffect = "move";
        const rect = target.getBoundingClientRect();
        const isAfter = e.clientY - rect.top > rect.height / 2;
        target.parentNode.insertBefore(
          draggingElm,
          isAfter ? target.nextSibling : target
        );
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

  // --- メインの初期化処理 ---
  document.addEventListener("DOMContentLoaded", () => {
    // 1. ローカルストレージからToDoデータを読み込む
    todos = JSON.parse(localStorage.getItem("todos")) || [];

    // 2. Cookieから設定値を読み込み、内部の状態変数を更新する
    loadSettings();

    // 3. 内部の状態変数に基づいて、画面のスイッチなどの表示を更新する
    applySettingsToDOM();

    // 4. すべてのイベントリスナーを設定する
    setupEventListeners();

    // 5. ToDoリストを初期描画する
    renderTasks();
  });
})();
