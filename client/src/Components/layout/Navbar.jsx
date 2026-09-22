import { useEffect, useState } from "react";
import { FaBars, FaMicrophone } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import { API_URL } from "../../api";

function Navbar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // DELETE CONFIRMATION
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ======================================================
  // LOAD PROFILE
  // ======================================================

  useEffect(() => {
    const loadProfile = () => {
      try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
          const user = JSON.parse(storedUser);

          setUserName(user.name || user.username || "");

          setProfileImage(user.profileImage || null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();

    window.addEventListener("profileUpdated", loadProfile);

    return () => {
      window.removeEventListener("profileUpdated", loadProfile);
    };
  }, []);

  // ======================================================
  // DISPATCH APP UPDATE EVENTS
  // ======================================================

  const refreshAppData = (command) => {
  if (
    command === "add" ||
    command === "update" ||
    command === "delete"
  ) {
    window.dispatchEvent(
      new CustomEvent("transactionUpdated"),
    );
  }

  if (
    command === "add_category" ||
    command === "update_category" ||
    command === "delete_category"
  ) {
    window.dispatchEvent(
      new CustomEvent("categoryUpdated"),
    );
  }

  if (
    command === "add_budget" ||
    command === "update_budget" ||
    command === "delete_budget"
  ) {
    window.dispatchEvent(
      new CustomEvent("budgetUpdated"),
    );
  }
};

  // ======================================================
  // CONFIRM DELETE TRANSACTION
  // ======================================================

  const confirmDeleteTransaction = async () => {
    if (!deleteConfirmation) return;

    /*
      Backend response structure:

      data.transaction.transaction

      OR

      data.transaction
    */

    const transaction =
      deleteConfirmation?.transaction?.transaction ||
      deleteConfirmation?.transaction;

    const transactionId = transaction?._id;

    if (!transactionId) {
      console.error("Transaction ID not found:", deleteConfirmation);

      alert("Transaction ID not found.");
      return;
    }

    try {
      setIsDeleting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        return;
      }

      console.log("🗑️ Deleting transaction:", transactionId);

      const response = await axios.delete(
        `${API_URL}/api/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("🗑️ Delete response:", response.data);

      // Close confirmation modal
      setDeleteConfirmation(null);

      // Refresh all transaction related components
      refreshAppData("delete");

      alert(response.data.message || "Transaction deleted successfully.");
    } catch (error) {
      console.error("❌ Delete transaction error:", error);

      alert(
        error.response?.data?.message || "Transaction could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ======================================================
  // START / STOP MICROPHONE
  // ======================================================

  const startVoiceInput = async () => {
    // ----------------------------------------------------
    // STOP RECORDING
    // ----------------------------------------------------

    if (isListening && mediaRecorder) {
      mediaRecorder.stop();
      return;
    }

    try {
      // --------------------------------------------------
      // MICROPHONE ACCESS
      // --------------------------------------------------

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // --------------------------------------------------
      // CREATE RECORDER
      // --------------------------------------------------

      const recorder = new MediaRecorder(stream);

      const audioChunks = [];

      // --------------------------------------------------
      // COLLECT AUDIO
      // --------------------------------------------------

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // --------------------------------------------------
      // START
      // --------------------------------------------------

      recorder.onstart = () => {
        setIsListening(true);

        console.log("🎤 Listening...");
      };

      // --------------------------------------------------
      // STOP
      // --------------------------------------------------

      recorder.onstop = async () => {
        setIsListening(false);

        // Stop microphone tracks
        stream.getTracks().forEach((track) => track.stop());

        // Clear recorder state
        setMediaRecorder(null);

        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        console.log("🎤 Audio captured:", audioBlob);

        // ------------------------------------------------
        // TOKEN
        // ------------------------------------------------

        const token = localStorage.getItem("token");

        if (!token) {
          alert("Please login again.");
          return;
        }

        // ------------------------------------------------
        // FORM DATA
        // ------------------------------------------------

        const formData = new FormData();

        formData.append("audio", audioBlob, "voice-command.webm");

        // ------------------------------------------------
        // SEND TO BACKEND
        // ------------------------------------------------

        try {
          const { data } = await axios.post(
            `${API_URL}/api/voice-command`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          console.log("🎤 Backend response:", data);

          // =================================================
          // DELETE CONFIRMATION
          // =================================================

          if (
            data.command?.action === "delete" &&
            data.confirmationRequired === true
          ) {
            console.log("⚠️ Delete confirmation required:", data);

            setDeleteConfirmation(data);

            return;
          }

          // =================================================
          // NORMAL COMMANDS
          // =================================================

          if (data.command?.action) {
            refreshAppData(data.command.action);
          }

          // =================================================
          // SUCCESS MESSAGE
          // =================================================

          alert(data.message || `Command processed: ${data.text || ""}`);
        } catch (error) {
          console.error("❌ Audio upload error:", error);

          alert(
            error.response?.data?.message ||
              "Voice command failed. Please try again.",
          );
        }
      };

      // --------------------------------------------------
      // RECORDER ERROR
      // --------------------------------------------------

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);

        setIsListening(false);
        setMediaRecorder(null);

        stream.getTracks().forEach((track) => track.stop());

        alert("Voice input failed. Please try again.");
      };

      setMediaRecorder(recorder);

      recorder.start();
    } catch (error) {
      console.error("Microphone error:", error);

      setIsListening(false);
      setMediaRecorder(null);

      if (error.name === "NotAllowedError") {
        alert("Please allow microphone access.");
      } else if (error.name === "NotFoundError") {
        alert("No microphone was found.");
      } else {
        alert("Microphone could not be started.");
      }
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <>
      <header className="navbar">
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

        <div className="navbar-right">
          {/* SEARCH */}

          <div className="search-box">
            <FiSearch className="search-icon" />

            <input type="text" placeholder="Search..." />
          </div>

          {/* VOICE */}

          <button
            className={`voice-nav-btn ${isListening ? "listening" : ""}`}
            onClick={startVoiceInput}
            aria-label="Voice command"
            title={isListening ? "Stop listening" : "Voice command"}
          >
            <FaMicrophone />
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

      {/* ==================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      {deleteConfirmation && (
        <div className="voice-confirm-overlay">
          <div className="voice-confirm-modal">
            <h3>Delete Transaction?</h3>

            <p>Are you sure you want to delete this transaction?</p>

            {(() => {
              const transaction =
                deleteConfirmation?.transaction?.transaction ||
                deleteConfirmation?.transaction;

              if (!transaction) {
                return null;
              }

              return (
                <div className="delete-transaction-info">
                  <strong>{transaction.category}</strong>

                  <span>
                    ₹{Number(transaction.amount).toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })()}

            <div className="voice-confirm-buttons">
              <button
                className="voice-cancel-btn"
                onClick={() => setDeleteConfirmation(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                className="voice-delete-btn"
                onClick={confirmDeleteTransaction}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
