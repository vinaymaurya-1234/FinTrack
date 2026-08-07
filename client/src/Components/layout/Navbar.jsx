import { FaBell } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="page-title">Dashboard</h2>
      </div>

      <div className="navbar-right">
        <div className="search-box">
          <FiSearch />
          <input type="text" placeholder="Search..." />
        </div>

        <button className="notification-btn">
          <FaBell />
        </button>

        <div className="profile-box">
          <div className="profile-avatar">V</div>

          <div className="profile-info">
            <h4>Vinay</h4>
            <p>User</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
