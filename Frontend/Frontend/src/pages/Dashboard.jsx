import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getBoards, createBoard } from "../api/board.js";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");

  const fetchBoards = async () => {
    try {
      const response = await getBoards();

      setBoards(response.data.boards);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async () => {
    if (!title.trim()) return;

    try {
      await createBoard({
        title,
      });

      setTitle("");

      fetchBoards();
    } catch (error) {
      console.log(error);
    }
  };

  const logout = () => {
    localStorage.clear();

    navigate("/");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Dashboard</h1>

      <h2>Welcome {user?.name}</h2>

      <button onClick={logout}>
        Logout
      </button>

      <hr />

      <h2>Create Board</h2>

      <input
        placeholder="Board Name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button onClick={handleCreateBoard}>
        Create
      </button>

      <hr />

      <h2>Your Boards</h2>

      {
        boards.map((board) => (

          <div
            key={board._id}
            style={{
              border: "1px solid gray",
              padding: "15px",
              marginBottom: "10px",
            }}
          >
            <h3>{board.title}</h3>

            <button
              onClick={() => navigate(`/board/${board._id}`)}
            >
              Open Board
            </button>

          </div>

        ))
      }

    </div>
  );
}

export default Dashboard;