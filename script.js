// =================================================================
// 改良・機能追加版 ToDoリスト
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. DOM要素の取得 ---
  const taskInput = document.getElementById("taskInput");
  const addTaskButton = document.getElementById("addTaskButton");
  const taskList = document.getElementById("taskList");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const confirmSwitch = document.getElementById("confirmSwitch"); // (変更) 要素取得を追加

  // --- 2. アプリケーションの状態管理 ---
  let todos = JSON.parse(localStorage.getItem("todos")) || [];
  let currentFilter = "all"; // 'all', 'active', 'completed'
  let shouldConfirmDeletion = false; // 初期値はfalse

  // --- 3. Cookie操作ヘルパー関数 --- (追加)
  /**
   * Cookieを設定する
   * @param {string} name - Cookie名
   * @param {string} value - Cookieの値
   * @param {number} days - 有効期限（日数）
   */
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie =
      name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  }

  /**
   * Cookieを取得する
   * @param {string} name - Cookie名
   * @returns {string | null} Cookieの値、存在しない場合はnull
   */
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

  /**
   * タスクをリストに描画する
   */
  function renderTasks() {
    taskList.innerHTML = ""; // 描画前にリストをクリア

    // フィルタリング処理
    const filteredTodos = todos.filter((todo) => {
      if (currentFilter === "active") return !todo.completed;
      if (currentFilter === "completed") return todo.completed;
      return true; // "all" の場合は全て表示
    });

    filteredTodos.forEach((todo) => {
      const li = document.createElement("li");
      li.dataset.id = todo.id;
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
    saveTasksToLocalStorage();
  }

  /**
   * タスクをローカルストレージに保存する
   */
  function saveTasksToLocalStorage() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  /**
   * 新しいタスクを追加する
   */
  function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") {
      alert("タスクを入力してください。");
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
    };

    todos.push(newTask);
    taskInput.value = "";
    taskInput.focus(); // (改良) 入力フィールドにフォーカスを戻す
    renderTasks();
  }

  /**
   * タスクの完了状態を切り替える
   * @param {number} id - タスクのID
   */
  function toggleTaskComplete(id) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    renderTasks();
  }

  /**
   * タスクを削除する
   * (改良) 確認ロジックを統合し、簡素化
   * @param {number} id - タスクのID
   */
  function deleteTask(id) {
    // 確認が有効、かつユーザーがキャンセルした場合は処理を中断
    if (
      shouldConfirmDeletion &&
      !window.confirm("このタスクを削除しますか？")
    ) {
      return;
    }
    // 確認が不要、またはユーザーがOKした場合
    todos = todos.filter((todo) => todo.id !== id);
    renderTasks();
  }

  /**
   * クリップボードにテキストをコピーする
   * @param {string} text - コピーするテキスト
   */
  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      alert("コピーしました！");
    } catch (err) {
      console.error("テキストのコピーに失敗しました:", err);
      alert("コピーに失敗しました。");
    }
  }

  /**
   * Cookieから「削除時確認」の設定を読み込み、適用する
   */
  function loadSettings() {
    // (追加) Cookieから設定を読み込む
    const confirmationSetting = getCookie("shouldConfirmDeletion");
    // Cookieの値が 'true' の場合のみ確認を有効にする
    shouldConfirmDeletion = confirmationSetting === "true";
    confirmSwitch.checked = shouldConfirmDeletion;
  }

  // --- 5. イベントリスナーの設定 ---
  function initializeEventListeners() {
    addTaskButton.addEventListener("click", addTask);

    taskInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        addTask();
      }
    });

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.dataset.filter;
        renderTasks();
      });
    });

    // (改良) 「削除時確認」スイッチのイベントリスナー
    confirmSwitch.addEventListener("change", function () {
      shouldConfirmDeletion = this.checked;
      // (変更) Cookieに設定を保存
      setCookie("shouldConfirmDeletion", this.checked, 365);
      console.log(
        `削除時の確認が ${this.checked ? "有効" : "無効"} になりました。`
      );
    });
  }

  // --- 6. アプリケーションの初期化 ---
  function initializeApp() {
    loadSettings(); // (追加) まず設定を読み込む
    initializeEventListeners();
    renderTasks(); // 最後にタスクを描画
  }

  initializeApp();
});
