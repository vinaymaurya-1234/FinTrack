import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./MainLayout.css";

function MainLayout() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <div className="main-content">
        <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
