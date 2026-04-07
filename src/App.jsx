import { useEffect, useState } from "react";
import "./App.css";

/*
  ==============================
  BẢNG KHÁI NIỆM REACT (ĐẦY ĐỦ)
  ==============================

  Component = khối UI (giống hàm)
  JSX = cách viết giao diện
  Props = dữ liệu truyền từ cha → con
  State = dữ liệu bên trong component (có thể thay đổi)
  Lifecycle = vòng đời component (useEffect)
  localStorage là bộ nhớ dữ liệu nhỏ của trình duyệt.
  
  ===============================
  [1] JSX (JavaScript XML)
  - Định nghĩa:
    JSX là cú pháp cho phép viết giao diện trông giống HTML bên trong JavaScript.
    JSX không chạy trực tiếp trên trình duyệt, nó được biên dịch về React.createElement.
  - Khi dùng:
    Dùng trong phần return của component để mô tả UI theo trạng thái hiện tại.
  - Vai trò trong dự án này:
    Toàn bộ phần return của TodoForm, TodoFilters, TodoItem, TodoList, App.

  [2] Component (Thành phần)
  - Định nghĩa:
    Component là một khối UI độc lập, có thể tái sử dụng, nhận input và trả về JSX.
  - Khi dùng:
    Dùng để tách giao diện lớn thành phần nhỏ, dễ đọc, dễ test, dễ bảo trì.
  - Vai trò trong dự án này:
    App (cha), TodoForm, TodoFilters, TodoItem, TodoList (con).

  [3] Props (Thuộc tính truyền xuống)
  - Định nghĩa:
    Props là dữ liệu/hàm mà component cha truyền cho component con.
    Props chỉ đọc ở component con (không sửa trực tiếp).
  - Khi dùng:
    Khi con cần hiển thị dữ liệu từ cha hoặc gọi ngược lên cha để xử lý sự kiện.
  - Vai trò trong dự án này:
    App truyền value, error, onChange, onSubmit... xuống các component con.

  [4] State (Trạng thái) // dữ liệu thay đổi theo tương tác người dùng hoặc theo thời gian thì thường là state.
  - Định nghĩa:
    State là dữ liệu nội bộ có thể thay đổi theo thời gian/thao tác người dùng.
    Khi state đổi, React tự render lại phần UI liên quan.
  - Khi dùng:
    Khi dữ liệu cần "sống" theo tương tác: input, danh sách todo, filter, edit mode.
  - Vai trò trong dự án này:
    text, error, filter, todos ở App; isEditing, draft ở TodoItem.

  [5] Lifecycle với useEffect (Vòng đời + side effects)
  - Định nghĩa:
    useEffect dùng để chạy tác vụ phụ (side effect) sau khi render:
    lưu dữ liệu, gọi API, cập nhật title, lắng nghe sự kiện, cleanup...
  - Khi dùng:
    Khi cần đồng bộ React với hệ thống bên ngoài (localStorage, document, network...).
  - Vai trò trong dự án này:
    1) Mỗi lần todos đổi -> lưu localStorage.
    2) Mỗi lần activeCount đổi -> cập nhật document.title.

  Cách đọc comment trong file:
  - [1] = JSX, [2] = Component, [3] = Props, [4] = State, [5] = Lifecycle/useEffect.
*/
// Hằng số cấu hình ban đầu 
const STORAGE_KEY = "todo_react_foundation";

const INITIAL_TODOS = [
  { id: 1, text: "Hoc JSX va conditional rendering", done: false },
  { id: 2, text: "Tach component + truyen props", done: true },
  { id: 3, text: "Luyen state va useEffect", done: false },
];

const FILTERS = [
  { id: "all", label: "Tat ca" },
  { id: "active", label: "Chua xong" },
  { id: "done", label: "Da xong" },
];

// [2][Component] + [3][Props]
// Hàm TodoForm: hiển thị ô nhập công việc và nút thêm.
// Chức năng:
// - Đọc dữ liệu hiện tại qua prop `value`.
// - Gọi `onChange` khi người dùng gõ.
// - Gọi `onSubmit` khi bấm "Thêm" hoặc nhấn Enter.
function TodoForm({ value, error, onChange, onSubmit }) {
  // [1][JSX] Phần UI của form.
  return (
    <form className="todo-form" onSubmit={onSubmit}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhap cong viec can lam..."
      />
      <button type="submit">Them</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

// [2][Component] + [3][Props]
// Hàm TodoFilters: hiển thị bộ lọc và đổi bộ lọc đang chọn.
// Chức năng:
// - Render các nút lọc (Tất cả / Chưa xong / Đã xong).
// - Hiển thị số lượng tương ứng của từng nhóm.
// - Gọi `onChange` để cập nhật filter ở App.
function TodoFilters({ filter, counts, onChange }) {
  // [1][JSX] Phần UI của bộ lọc.
  return (
    <div className="todo-filters">
      {FILTERS.map((item) => {
        const count =
          item.id === "all"
            ? counts.all
            : item.id === "active"
              ? counts.active
              : counts.done;

        return (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            {item.label} <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// [2][Component] + [3][Props] + [4][State]
// Hàm TodoItem: quản lý một dòng công việc (tick hoàn thành, sửa, xóa).
// Chức năng:
// - Hiển thị 1 công việc.
// - Chuyển sang chế độ sửa trực tiếp (inline edit).
// - Gọi hàm từ cha để lưu nội dung mới / xóa / đổi trạng thái done.
function TodoItem({ todo, onToggle, onDelete, onSave }) {
  // [4][State] State cục bộ để quản lý chế độ sửa và nội dung tạm.
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);

  // Hàm startEdit: bắt đầu sửa công việc hiện tại.
  const startEdit = () => {
    setDraft(todo.text);
    setIsEditing(true);
  };

  // Hàm cancelEdit: hủy sửa, khôi phục nội dung cũ.
  const cancelEdit = () => {
    setDraft(todo.text);
    setIsEditing(false);
  };

  // Hàm confirmEdit: lưu nội dung sửa nếu hợp lệ.
  const confirmEdit = () => {
    const nextText = draft.trim();
    if (!nextText) return;
    onSave(todo.id, nextText);
    setIsEditing(false);
  };

  // [1][JSX] UI cho từng item.
  return (
    <li className="todo-item">
      <div className="left">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />

        {isEditing ? (
          <input
            className="edit-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") confirmEdit();
              if (event.key === "Escape") cancelEdit();
            }}
            autoFocus
          />
        ) : (
          <span className={todo.done ? "done" : ""}>{todo.text}</span>
        )}
      </div>

      <div className="actions">
        {isEditing ? (
          <>
            <button type="button" className="subtle" onClick={confirmEdit}>
              Luu
            </button>
            <button type="button" className="subtle" onClick={cancelEdit}>
              Huy
            </button>
          </>
        ) : (
          <>
            <button type="button" className="subtle" onClick={startEdit}>
              Sua
            </button>
            <button type="button" className="danger" onClick={() => onDelete(todo.id)}>
              Xoa
            </button>
          </>
        )}
      </div>
    </li>
  );
}

// [2][Component] + [3][Props]
// Hàm TodoList: render danh sách công việc sau khi lọc.
// Chức năng:
// - Hiển thị thông báo rỗng nếu không có dữ liệu.
// - Render nhiều TodoItem khi có dữ liệu.
function TodoList({ items, filter, onToggle, onDelete, onSave }) {
  // [1][JSX] Trạng thái rỗng (empty state).
  if (items.length === 0) {
    return (
      <p className="empty">
        Khong co cong viec nao trong bo loc "{FILTERS.find((f) => f.id === filter)?.label}".
      </p>
    );
  }

  // [1][JSX] Danh sách item.
  return (
    <ul className="todo-list">
      {items.map((item) => (
        <TodoItem
          key={item.id}
          todo={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onSave={onSave}
        />
      ))}
    </ul>
  );
}

// [2][Component]
// Hàm App: component gốc, giữ toàn bộ state và logic chính của Todo app.
function App() {
  // [4][State] Trạng thái tổng của ứng dụng.
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  // [4][State] Khởi tạo todos từ localStorage (nếu có), nếu không dùng dữ liệu mẫu.
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return INITIAL_TODOS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_TODOS;
    } catch {
      return INITIAL_TODOS;
    }
  });

  const doneCount = todos.filter((item) => item.done).length;
  const activeCount = todos.length - doneCount;
  const counts = { all: todos.length, active: activeCount, done: doneCount };

  // [5][Lifecycle/useEffect] Mỗi lần todos thay đổi -> lưu xuống localStorage.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // [5][Lifecycle/useEffect] Mỗi lần activeCount thay đổi -> cập nhật tiêu đề tab.
  useEffect(() => {
    document.title = `Todo: con ${activeCount} viec`;
  }, [activeCount]);

  // Hàm filteredTodos: lọc danh sách theo bộ lọc hiện tại.
  const filteredTodos = todos.filter((item) => {
    if (filter === "active") return !item.done;
    if (filter === "done") return item.done;
    return true;
  });

  // Hàm addTodo: thêm công việc mới từ ô input.
  // - Chặn submit rỗng.
  // - Tạo todo mới.
  // - Reset input + lỗi.
  const addTodo = (event) => {
    event.preventDefault();
    const nextText = text.trim();
    if (!nextText) {
      setError("Ban chua nhap noi dung.");
      return;
    }

    setTodos((current) => [
      { id: Date.now(), text: nextText, done: false },
      ...current,
    ]);
    setText("");
    setError("");
  };

  // Hàm toggleTodo: đổi trạng thái done/chưa done cho một item.
  const toggleTodo = (todoId) => {
    setTodos((current) =>
      current.map((item) =>
        item.id === todoId ? { ...item, done: !item.done } : item,
      ),
    );
  };

  // Hàm saveTodo: lưu nội dung sau khi sửa.
  const saveTodo = (todoId, nextText) => {
    setTodos((current) =>
      current.map((item) =>
        item.id === todoId ? { ...item, text: nextText } : item,
      ),
    );
  };

  // Hàm deleteTodo: xóa một item theo id.
  const deleteTodo = (todoId) => {
    setTodos((current) => current.filter((item) => item.id !== todoId));
  };

  // Hàm clearCompleted: xóa toàn bộ item đã hoàn thành.
  const clearCompleted = () => {
    setTodos((current) => current.filter((item) => !item.done));
  };

  // Hàm toggleAll: đánh dấu tất cả hoàn thành hoặc bỏ đánh dấu tất cả.
  const toggleAll = () => {
    const shouldMarkDone = todos.some((item) => !item.done);
    setTodos((current) =>
      current.map((item) => ({ ...item, done: shouldMarkDone })),
    );
  };

  // [1][JSX] Ghép các component con thành giao diện hoàn chỉnh.
  // [3][Props] Truyền state + hàm xử lý xuống component con.
  return (
    <main className="app">
      <header className="header">
        <h1>Todo App</h1>
        <p>Mini project: JSX, Component, Props, State, Lifecycle</p>
      </header>

      <TodoForm value={text} error={error} onChange={setText} onSubmit={addTodo} />
      <TodoFilters filter={filter} counts={counts} onChange={setFilter} />

      <div className="summary">
        <div>
          <strong>{counts.all}</strong>
          <span>Tong</span>
        </div>
        <div>
          <strong>{counts.active}</strong>
          <span>Chua xong</span>
        </div>
        <div>
          <strong>{counts.done}</strong>
          <span>Da xong</span>
        </div>
      </div>

      <div className="toolbar">
        <button type="button" className="subtle" onClick={toggleAll} disabled={todos.length === 0}>
          {activeCount === 0 ? "Bo chon tat ca" : "Danh dau xong tat ca"}
        </button>
        <button type="button" className="danger" onClick={clearCompleted} disabled={doneCount === 0}>
          Xoa tat ca viec da xong
        </button>
      </div>

      <TodoList
        items={filteredTodos}
        filter={filter}
        onToggle={toggleTodo}
        onDelete={deleteTodo}
        onSave={saveTodo}
      />
    </main>
  );
}

export default App;
