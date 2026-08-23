import "./Profile.css";
import { useState } from "react";

function Profile() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState("Vinay Maurya");
  const [email, setEmail] = useState("vinay@gmail.com");
  const [previewImage, setPreviewImage] = useState("");
  const handleRemovePhoto = () => {
    setPreviewImage("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
  };

  const handleSave = () => {
    setShowEditModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account?",
    );

    if (!confirmDelete) return;

    // Backend delete functionality will be connected here
    alert("Account deletion will be connected soon.");
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div>
          <h2>Profile</h2>
          <p>Manage your personal information.</p>
        </div>
      </div>

      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {previewImage ? (
              <img src={previewImage} alt="Profile" />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
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

        {/* Personal Information */}
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

        {/* Logout */}
        <div className="profile-section logout-section">
          <div>
            <h3>Logout</h3>
            <p>Sign out from your FinTrack account.</p>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Danger Zone */}
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
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

            <div className="modal-avatar">
              <div className="avatar-wrapper">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}

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

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>

              <button className="save-profile-btn" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
