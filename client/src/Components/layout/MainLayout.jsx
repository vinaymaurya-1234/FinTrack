import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import "./MainLayout.css"

function MainLayout() {
  return (
    <div className="main-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />
        <Outlet/>   
      </div>
    </div>
  );
}

export default MainLayout;