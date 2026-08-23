import "./Profile.css";
import { useEffect, useState } from "react";
import axios from "axios";

function Profile() {
  const [showEditModal, setShowEditModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [previewImage, setPreviewImage] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // GET USER PROFILE
  // =========================

  useEffect(() => {
    const getProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          config,
        );

        const user = response.data;

        setName(user.name || "");
        setEmail(user.email || "");
        setPreviewImage(user.profileImage || "");
      } catch (error) {
        console.error("Error fetching profile:", error);

        // Token invalid/expired
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      getProfile();
    } else {
      window.location.href = "/login";
    }
  }, []);

  // =========================
  // IMAGE CHANGE
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Optional validation
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    // Limit image size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // =========================
  // REMOVE PHOTO
  // =========================

  const handleRemovePhoto = () => {
    setPreviewImage("");
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await axios.put(
        "http://localhost:5000/api/auth/profile",
        {
          name,
          email,
          profileImage: previewImage,
        },
        config,
      );

      const updatedUser = response.data.user;

      // Update UI
      setName(updatedUser.name);
      setEmail(updatedUser.email);
      setPreviewImage(updatedUser.profileImage || "");

      // Update localStorage user also
      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...existingUser,
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          profileImage: updatedUser.profileImage || "",
        }),
      );

      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating profile:", error);

      alert(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // =========================
  // DELETE ACCOUNT
  // =========================

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account?",
    );

    if (!confirmDelete) return;

    // Backend delete functionality
    // will be connected later.
    alert("Account deletion will be connected soon.");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* =========================
          HEADER
      ========================= */}

      <div className="profile-header">
        <div>
          <h2>Profile</h2>
          <p>Manage your personal information.</p>
        </div>
      </div>

      <div className="profile-container">
        {/* =========================
            PROFILE CARD
        ========================= */}

        <div className="profile-card">
          <div className="profile-avatar">
            {previewImage ? (
              <img src={previewImage} alt="Profile" />
            ) : (
              <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
            )}
          </div>

          <div className="profile-main-info">
            <h2>{name}</h2>
            <p>{email}</p>
          </div>

          <button
            className="edit-profile-btn"
            onClick={() => setShowEditModal(true)}
          >
            Edit Profile
          </button>
        </div>

        {/* =========================
            PERSONAL INFORMATION
        ========================= */}

        <div className="profile-section">
          <div className="section-heading">
            <h3>Personal Information</h3>
            <p>Your basic profile information.</p>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span>Full Name</span>
              <strong>{name}</strong>
            </div>

            <div className="profile-info-item">
              <span>Email Address</span>
              <strong>{email}</strong>
            </div>
          </div>
        </div>

        {/* =========================
            LOGOUT
        ========================= */}

        <div className="profile-section logout-section">
          <div>
            <h3>Logout</h3>
            <p>Sign out from your FinTrack account.</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* =========================
            DANGER ZONE
        ========================= */}

        <div className="profile-section danger-section">
          <div>
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data.</p>
          </div>

          <button className="delete-account-btn" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      </div>

      {/* =========================
          EDIT PROFILE MODAL
      ========================= */}

      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            {/* Modal Header */}

            <div className="modal-header">
              <div>
                <h2>Edit Profile</h2>
                <p>Update your profile information.</p>
              </div>

              <button
                className="close-modal-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            {/* =========================
                PROFILE PHOTO
            ========================= */}

            <div className="modal-avatar">
              <div className="avatar-wrapper">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" />
                ) : (
                  <span>{name ? name.charAt(0).toUpperCase() : "U"}</span>
                )}

                {/* Camera button */}

                <button
                  type="button"
                  className="avatar-camera-btn"
                  onClick={() =>
                    document.getElementById("profile-photo-input").click()
                  }
                >
                  📷
                </button>

                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </div>

              <div className="photo-label">Profile Photo</div>

              {previewImage && (
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={handleRemovePhoto}
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* =========================
                FORM
            ========================= */}

            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* =========================
                ACTIONS
            ========================= */}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="save-profile-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
