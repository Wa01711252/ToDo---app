// =================================================================
// ToDoリスト & サイト共通スクリプト (localStorage版)
// =================================================================
(function () {
  "use strict";

  // --- グローバルな状態管理変数 ---
  let todos = [];
  let currentFilter = "all";
  let shouldConfirmDeletion = false;
  let isPrependMode = true;

  // --- 設定の読み込みと適用 (localStorageから) ---
  function loadAndApplySettings() {
    const settings = JSON.parse(localStorage.getItem("todoAppSettings")) || {};

    // 状態変数に値を設定 (値がなければデフォルト値)
    shouldConfirmDeletion = settings.shouldConfirmDeletion === true; // デフォルトはfalse
    isPrependMode = settings.isPrependMode !== false; // デフォルトはtrue

    // DOMに値を反映
    const confirmSwitch = document.getElementById("confirmSwitch");
    if (confirmSwitch) {
      confirmSwitch.checked = shouldConfirmDeletion;
    }
    const addPositionSwitch = document.getElementById("addPositionSwitch");
    if (addPositionSwitch) {
      addPositionSwitch.checked = isPrependMode;
    }
  }

  // --- 設定の保存 (localStorageへ) ---
  function saveSettings() {
    const confirmSwitch = document.getElementById("confirmSwitch");
    const addPositionSwitch = document.getElementById("addPositionSwitch");

    // スイッチが存在する場合のみ、その値を取得
    const settings = {
      shouldConfirmDeletion: confirmSwitch
        ? confirmSwitch.checked
        : shouldConfirmDeletion,
      isPrependMode: addPositionSwitch
        ? addPositionSwitch.checked
        : isPrependMode,
    };

    localStorage.setItem("todoAppSettings", JSON.stringify(settings));
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

        // --- 変更・追加ここから ---
        // 並び替え用のハンドルを追加
        const handle = document.createElement("span");
        handle.classList.add("drag-handle");
        handle.innerHTML = "☰"; // 三本線のアイコン
        li.appendChild(handle);
        // --- 変更・追加ここまで ---

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

        // ハンドルを先頭に追加したので、liへの追加順を調整
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
    // 設定スイッチ (変更があったらlocalStorageに保存)
    const confirmSwitch = document.getElementById("confirmSwitch");
    if (confirmSwitch) {
      confirmSwitch.addEventListener("change", saveSettings);
    }
    const addPositionSwitch = document.getElementById("addPositionSwitch");
    if (addPositionSwitch) {
      addPositionSwitch.addEventListener("change", saveSettings);
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

    // --- 並び替え機能のイベントリスナー ---
    const taskList = document.getElementById("taskList");
    if (taskList) {
      let draggingElm = null;

      // データの並び順を更新して保存する共通関数
      const updateOrderAndSave = () => {
        if (draggingElm) {
          draggingElm.classList.remove("dragging");
        }
        const newOrderedIds = [
          ...taskList.querySelectorAll("li:not(.empty-message)"),
        ].map((li) => Number(li.dataset.id));
        todos.sort(
          (a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id)
        );
        saveTasksToLocalStorage();
        draggingElm = null;
      };

      // 1. PC向け: ドラッグ＆ドロップAPI
      taskList.addEventListener("dragstart", (e) => {
        // --- 変更 --- ハンドル以外からのドラッグは無視するように変更（任意）
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
          updateOrderAndSave(); // 共通関数を呼び出す
        }
      });

      // --- 変更・追加ここから ---
      // 2. スマホ向け: タッチイベント
      taskList.addEventListener(
        "touchstart",
        (e) => {
          // ハンドルをタッチした場合のみドラッグ開始
          if (e.target.classList.contains("drag-handle")) {
            e.preventDefault(); // スクロールを防止
            draggingElm = e.target.closest("li");
            draggingElm.classList.add("dragging");
          }
        },
        { passive: false }
      ); // preventDefaultを有効にするためpassive: falseを指定

      taskList.addEventListener(
        "touchmove",
        (e) => {
          if (!draggingElm) return;
          e.preventDefault(); // スクロールを防止

          const touch = e.touches[0];
          // 指の位置にある要素を取得
          const target = document
            .elementFromPoint(touch.clientX, touch.clientY)
            ?.closest("li");

          if (
            !target ||
            target === draggingElm ||
            target.classList.contains("empty-message")
          )
            return;

          const rect = target.getBoundingClientRect();
          // 指が要素の半分より下にあるかどうかで挿入位置を判断
          const isAfter = touch.clientY - rect.top > rect.height / 2;
          target.parentNode.insertBefore(
            draggingElm,
            isAfter ? target.nextSibling : target
          );
        },
        { passive: false }
      ); // preventDefaultを有効にするためpassive: falseを指定

      taskList.addEventListener("touchend", () => {
        if (draggingElm) {
          updateOrderAndSave(); // 共通関数を呼び出す
        }
      });
      // --- 変更・追加ここまで ---
    }
  }

  // --- メインの初期化処理 ---
  document.addEventListener("DOMContentLoaded", () => {
    // 1. ToDoリストのデータを読み込む
    todos = JSON.parse(localStorage.getItem("todos")) || [];

    // 2. 設定を読み込み、DOMに反映する
    loadAndApplySettings();

    // 3. イベントリスナーを設定する
    setupEventListeners();

    // 4. ToDoリストを初期描画する
    renderTasks();
  });
})();
