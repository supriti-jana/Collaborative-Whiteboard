import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Whiteboard from "../pages/Whiteboard.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
function Approute() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

       
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/board/:id"
          element={
            <ProtectedRoute>
              <Whiteboard />
            </ProtectedRoute>
          }
        />
      </Routes>

     
    </BrowserRouter>
  );
}

export default Approute;