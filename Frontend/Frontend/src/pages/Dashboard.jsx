
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getBoards,
  createBoard,
  deleteBoard,
} from "../api/board";

import { logoutUser } from "../api/auth";

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [search, setSearch] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  // =====================================================
  // FAVORITES
  // =====================================================

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("favoriteBoards");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // =====================================================
  // RECENT BOARDS
  // =====================================================

  const [recentBoards, setRecentBoards] = useState(() => {
    try {
      const saved = localStorage.getItem("recentBoards");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // =====================================================
  // LOAD BOARDS
  // =====================================================

  const loadBoards = async () => {
    try {
      setLoading(true);

      const response = await getBoards();

      console.log("Boards response:", response.data);

      if (response.data.success) {
        setBoards(response.data.boards || []);
      } else {
        setBoards([]);
      }
    } catch (error) {
      console.error("Failed to load boards:", error);

      if (error.response) {
        console.error("Server response:", error.response.data);
      }

      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  // =====================================================
  // SAVE FAVORITES
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "favoriteBoards",
      JSON.stringify(favorites)
    );
  }, [favorites]);

  // =====================================================
  // SAVE RECENT BOARDS
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "recentBoards",
      JSON.stringify(recentBoards)
    );
  }, [recentBoards]);

  // =====================================================
  // CREATE BOARD
  // =====================================================

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    const title = boardTitle.trim();

    if (!title) {
      alert("Please enter a board name");
      return;
    }

    try {
      setCreating(true);

      const response = await createBoard({
        title: title,
        ispublic: false,
      });

      console.log("Create board response:", response.data);

      if (response.data.success) {
        setBoardTitle("");
        setShowModal(false);

        await loadBoards();
      }
    } catch (error) {
      console.error("Failed to create board:", error);

      if (error.response) {
        console.error(
          "Server error:",
          error.response.data
        );

        alert(
          error.response.data.message ||
            "Failed to create board"
        );
      } else {
        alert("Unable to connect to server");
      }
    } finally {
      setCreating(false);
    }
  };

  // =====================================================
  // DELETE BOARD
  // =====================================================

  const handleDeleteBoard = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this board?"
    );

    if (!confirmed) return;

    try {
      await deleteBoard(id);

      setBoards((prev) =>
        prev.filter((board) => board._id !== id)
      );

      setFavorites((prev) =>
        prev.filter((boardId) => boardId !== id)
      );

      setRecentBoards((prev) =>
        prev.filter((boardId) => boardId !== id)
      );
    } catch (error) {
      console.error(
        "Failed to delete board:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete board"
      );
    }
  };

  // =====================================================
  // OPEN BOARD
  // =====================================================

  const handleOpenBoard = (id) => {
    const filtered = recentBoards.filter(
      (boardId) => boardId !== id
    );

    const updatedRecent = [
      id,
      ...filtered,
    ].slice(0, 5);

    setRecentBoards(updatedRecent);

    navigate(`/board/${id}`);
  };

  // =====================================================
  // TOGGLE FAVORITE
  // =====================================================

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter(
          (boardId) => boardId !== id
        );
      }

      return [...prev, id];
    });
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logoutUser();

      // Clear local dashboard preferences
      // (these are not authentication tokens)
      localStorage.removeItem("recentBoards");

      navigate("/", { replace: true });

    } catch (error) {
      console.error("Logout failed:", error);

      alert(
        error.response?.data?.message ||
          "Unable to logout. Please try again."
      );

    } finally {
      setLoggingOut(false);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredBoards = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return boards;
    }

    return boards.filter((board) =>
      board.title
        ?.toLowerCase()
        .includes(query)
    );
  }, [boards, search]);

  // =====================================================
  // RECENT BOARDS
  // =====================================================

  const recentBoardList = useMemo(() => {
    return recentBoards
      .map((id) =>
        boards.find(
          (board) => board._id === id
        )
      )
      .filter(Boolean);
  }, [recentBoards, boards]);

  // =====================================================
  // FAVORITE BOARDS
  // =====================================================

  const favoriteBoardList = useMemo(() => {
    return boards.filter((board) =>
      favorites.includes(board._id)
    );
  }, [boards, favorites]);

  // =====================================================
  // DISPLAYED BOARDS
  // =====================================================

  const displayedBoards = useMemo(() => {
    if (activeMenu === "Recent") {
      return recentBoardList;
    }

    if (activeMenu === "Favorites") {
      return favoriteBoardList;
    }

    return filteredBoards;
  }, [
    activeMenu,
    recentBoardList,
    favoriteBoardList,
    filteredBoards,
  ]);

  // =====================================================
  // SIDEBAR ITEMS
  // =====================================================

  const menuItems = [
    {
      name: "Dashboard",
      icon: "▣",
    },
    {
      name: "My Boards",
      icon: "□",
    },
    {
      name: "Recent",
      icon: "◷",
    },
    {
      name: "Favorites",
      icon: "★",
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* TOP NAVBAR */}

      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-200 bg-white">

        <div className="flex h-full items-center justify-between px-6">

          {/* LOGO */}

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
              W
            </div>

            <div>
              <div className="text-lg font-bold text-slate-900">
                Whiteboard
              </div>

              <div className="text-xs text-slate-400">
                Collaborative workspace
              </div>
            </div>

          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-5">

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <span className="text-lg">+</span>
              New Board
            </button>

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                U
              </div>

              <div className="hidden sm:block">

                <p className="text-sm font-semibold text-slate-900">
                  User
                </p>

                <p className="text-xs text-slate-500">
                  Developer
                </p>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* SIDEBAR */}

      <aside className="fixed bottom-0 left-0 top-16 hidden w-56 border-r border-slate-200 bg-white md:block">

        <div className="flex h-full flex-col">

          <div className="px-4 py-6">

            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            <nav className="space-y-1">

              {menuItems.map((item) => (

                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);

                    if (item.name === "Dashboard") {
                      setSearch("");
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    activeMenu === item.name
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >

                  <span className="flex w-6 justify-center">
                    {item.icon}
                  </span>

                  {item.name}

                  {item.name === "My Boards" && (
                    <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {boards.length}
                    </span>
                  )}

                  {item.name === "Favorites" &&
                    favorites.length > 0 && (
                      <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
                        {favorites.length}
                      </span>
                    )}

                </button>

              ))}

            </nav>

          </div>

          <div className="mx-4 border-t border-slate-100" />

          {/* BOTTOM MENU */}

          <div className="mt-auto px-4 py-6">

            <button
              onClick={() => setActiveMenu("Settings")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <span className="flex w-6 justify-center">
                ⚙
              </span>
              Settings
            </button>

            {/* LOGOUT BUTTON */}

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex w-6 justify-center">
                ↪
              </span>

              {loggingOut ? "Logging out..." : "Logout"}
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="pt-16 md:ml-56">

        <div className="mx-auto max-w-6xl px-6 py-10">

          {/* HEADER */}

          <div className="mb-8">

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">

              {activeMenu === "Dashboard" &&
                "Welcome back 👋"}

              {activeMenu === "My Boards" &&
                "My Boards"}

              {activeMenu === "Recent" &&
                "Recent Boards"}

              {activeMenu === "Favorites" &&
                "Favorite Boards"}

              {activeMenu === "Settings" &&
                "Settings"}

            </h1>

            <p className="mt-2 text-slate-500">

              {activeMenu === "Dashboard" &&
                "Create, manage and collaborate on your whiteboards."}

              {activeMenu === "My Boards" &&
                "Manage all your whiteboards."}

              {activeMenu === "Recent" &&
                "Quickly access the boards you opened recently."}

              {activeMenu === "Favorites" &&
                "Your favorite whiteboards."}

              {activeMenu === "Settings" &&
                "Manage your workspace settings."}

            </p>

          </div>

          {/* DASHBOARD STATISTICS */}

          {activeMenu === "Dashboard" && (

            <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {/* TOTAL BOARDS */}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      Total Boards
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {boards.length}
                    </p>

                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    ▣
                  </div>

                </div>

              </div>

              {/* ACTIVE PROJECTS */}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      Active Projects
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {boards.length}
                    </p>

                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    ✎
                  </div>

                </div>

              </div>

              {/* FAVORITES */}

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-500">
                      Favorites
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {favorites.length}
                    </p>

                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
                    ★
                  </div>

                </div>

              </div>

            </div>

          )}

          {/* SEARCH + CREATE */}

          {activeMenu !== "Settings" && (

            <div className="mb-6 flex gap-3">

              <div className="relative flex-1">

                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search boards..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

              </div>

              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                + Create Board
              </button>

            </div>

          )}

          {/* BOARDS SECTION */}

          {activeMenu !== "Settings" && (

            <>

              <div className="mb-5">

                <h2 className="text-xl font-bold text-slate-900">
                  {activeMenu === "Recent"
                    ? "Recently Opened"
                    : activeMenu === "Favorites"
                    ? "Favorites"
                    : "My Boards"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {displayedBoards.length} board
                  {displayedBoards.length !== 1 ? "s" : ""}
                </p>

              </div>

              {/* LOADING */}

              {loading && (

                <div className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white">

                  <p className="text-sm text-slate-500">
                    Loading boards...
                  </p>

                </div>

              )}

              {/* EMPTY STATE */}

              {!loading && displayedBoards.length === 0 && (

                <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">

                    {activeMenu === "Favorites"
                      ? "★"
                      : activeMenu === "Recent"
                      ? "◷"
                      : "▣"}

                  </div>

                  <h3 className="mt-4 font-semibold text-slate-900">

                    {search
                      ? "No boards found"
                      : activeMenu === "Favorites"
                      ? "No favorite boards"
                      : activeMenu === "Recent"
                      ? "No recent boards"
                      : "No boards yet"}

                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {search
                      ? "Try another search."
                      : "Create a board to get started."}
                  </p>

                  {!search && activeMenu === "Dashboard" && (

                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Create Board
                    </button>

                  )}

                </div>

              )}

              {/* BOARD CARDS */}

              {!loading && displayedBoards.length > 0 && (

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                  {displayedBoards.map((board) => {

                    const isFavorite = favorites.includes(
                      board._id
                    );

                    return (

                      <div
                        key={board._id}
                        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >

                        {/* PREVIEW */}

                        <div className="relative h-40 overflow-hidden border-b border-slate-200 bg-slate-50">

                          <div
                            className="absolute inset-0 opacity-50"
                            style={{
                              backgroundImage:
                                "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
                              backgroundSize: "20px 20px",
                            }}
                          />

                          {/* CIRCLE */}

                          <div className="absolute left-10 top-10 h-14 w-14 rounded-full border-4 border-indigo-500" />

                          {/* LINE */}

                          <div className="absolute left-24 top-24 h-1 w-28 rotate-[-25deg] rounded bg-slate-800" />

                          {/* RECTANGLE */}

                          <div className="absolute right-10 top-8 h-12 w-16 rounded border-4 border-emerald-500" />

                        </div>

                        {/* CARD CONTENT */}

                        <div className="p-5">

                          <div className="flex items-start justify-between gap-2">

                            <h3 className="truncate font-semibold text-slate-900">
                              {board.title}
                            </h3>

                            <button
                              onClick={() =>
                                toggleFavorite(board._id)
                              }
                              className={`text-xl transition ${
                                isFavorite
                                  ? "text-amber-400"
                                  : "text-slate-300 hover:text-amber-400"
                              }`}
                            >
                              ★
                            </button>

                          </div>

                          <p className="mt-2 text-xs text-slate-400">
                            Whiteboard project
                          </p>

                          <button
                            onClick={() =>
                              handleOpenBoard(board._id)
                            }
                            className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
                          >
                            Open Board →
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteBoard(board._id)
                            }
                            className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            Delete Board
                          </button>

                        </div>

                      </div>

                    );

                  })}

                </div>

              )}

            </>

          )}

          {/* SETTINGS */}

          {activeMenu === "Settings" && (

            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

              <h2 className="text-lg font-bold text-slate-900">
                Settings
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Settings will be implemented later.
              </p>

            </div>

          )}

        </div>

      </main>

      {/* CREATE BOARD MODAL */}

      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-5"
          onClick={() => setShowModal(false)}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="mb-6 flex items-start justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Create New Board
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Give your whiteboard a name.
                </p>

              </div>

              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xl text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreateBoard}>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Board Name
              </label>

              <input
                type="text"
                value={boardTitle}
                onChange={(e) =>
                  setBoardTitle(e.target.value)
                }
                placeholder="e.g. Project Planning"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {creating
                    ? "Creating..."
                    : "Create Board"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;
