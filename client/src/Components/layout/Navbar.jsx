import { useEffect, useState } from "react";
import { FaBell, FaBars } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("Vinay");

  useEffect(() => {
    const loadProfile = () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);

          setUserName(user.name || user.username || "Vinay");
          setProfileImage(user.profileImage || null);
        }
      } catch (error) {
        console.log("Error loading profile:", error);
      }
    };

    loadProfile();

    window.addEventListener("profileUpdated", loadProfile);

    return () => {
      window.removeEventListener("profileUpdated", loadProfile);
    };
  }, []);

  return (
    <header className="navbar">
      {/* LEFT */}
      <div className="navbar-left">
        <button
          className="menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <FaBars />
        </button>

        <h2 className="page-title">Dashboard</h2>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">
        {/* SEARCH */}
        <div className="search-box">
          <FiSearch className="search-icon" />

          <input type="text" placeholder="Search..." />
        </div>

        {/* NOTIFICATION */}
        <button className="notification-btn" aria-label="Notifications">
          <FaBell />
          <span className="notification-dot"></span>
        </button>

        {/* PROFILE */}
        <button
          className="profile-box profile-button"
          onClick={() => navigate("/profile")}
          aria-label="Open profile"
        >
          <div className="navbar-profile-avatar">
            {profileImage ? (
              <img src={profileImage} alt="Profile" />
            ) : (
              <span>{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="profile-info">
            <h4>{userName}</h4>
            <p>User</p>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Navbar;
