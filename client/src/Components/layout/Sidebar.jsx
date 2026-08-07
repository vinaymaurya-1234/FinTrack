import { NavLink } from "react-router-dom";
import { MdDashboard, MdOutlineAccountBalanceWallet } from "react-icons/md";
import { FaWallet, FaChartPie, FaUserCircle } from "react-icons/fa";
import { HiDocumentReport } from "react-icons/hi";
import { BsBullseye } from "react-icons/bs";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./Sidebar.css";

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-logo">
        <h2>FinTrack</h2>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className="menu-item">
          <MdDashboard />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/transactions" className="menu-item">
          <MdOutlineAccountBalanceWallet />
          <span>Transactions</span>
        </NavLink>

        <NavLink to="/budget" className="menu-item">
          <FaWallet />
          <span>Budget</span>
        </NavLink>

        <NavLink to="/goals" className="menu-item">
          <BsBullseye />
          <span>Goals</span>
        </NavLink>

        <NavLink to="/analytics" className="menu-item">
          <FaChartPie />
          <span>Analytics</span>
        </NavLink>

        <NavLink to="/reports" className="menu-item">
          <HiDocumentReport />
          <span>Reports</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="menu-item">
          <FaUserCircle />
          <span>Profile</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
