import { FaBell, FaBars } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import "./Navbar.css";

function Navbar({ isOpen, setIsOpen }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
          <FaBars />
        </button>
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
