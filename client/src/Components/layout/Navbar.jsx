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

  // ==========================================
  // LOAD PROFILE
  // ==========================================

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

  // ==========================================
  // DELETE TRANSACTION AFTER CONFIRMATION
  // ==========================================

  const confirmAndDeleteTransaction = async (transaction) => {
    if (!transaction?._id) {
      alert("Transaction information is missing.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again.");
      return;
    }

    const category = transaction.category || "Unknown";
    const amount = Number(transaction.amount || 0).toLocaleString("en-IN");
    const type = transaction.type || "Transaction";

    const confirmed = window.confirm(
      `Delete this transaction?\n\n` +
        `${category} - ₹${amount}\n` +
        `${type}\n\n` +
        `This action cannot be undone.`,
    );

    if (!confirmed) {
      alert("Delete cancelled.");
      return;
    }

    try {
      const { data } = await axios.delete(
        `${API_URL}/api/transactions/${transaction._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("🗑️ Transaction deleted:", data);

      // Refresh transaction-related UI
      window.dispatchEvent(new CustomEvent("transactionUpdated"));
      window.dispatchEvent(new CustomEvent("categoryUpdated"));

      alert(data.message || "Transaction deleted successfully.");
    } catch (error) {
      console.error("Delete transaction error:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete transaction. Please try again.",
      );
    }
  };

  // ==========================================
  // HANDLE VOICE BACKEND RESPONSE
  // ==========================================

  const handleVoiceResponse = async (data) => {
    console.log("🎤 Backend response:", data);

    // ------------------------------------------
    // DELETE CONFIRMATION
    // ------------------------------------------

    if (data.confirmationRequired) {
      const deleteResult = data.transaction;

      // ----------------------------------------
      // MULTIPLE MATCHES
      // ----------------------------------------

      if (deleteResult?.multipleMatches) {
        const transactions = deleteResult.transactions || [];

        let message = "Multiple matching transactions found.\n\n";

        transactions.forEach((transaction, index) => {
          const category = transaction.category || "Unknown";
          const amount = Number(transaction.amount || 0).toLocaleString(
            "en-IN",
          );

          message += `${index + 1}. ${category} - ₹${amount}`;

          if (transaction.type) {
            message += ` (${transaction.type})`;
          }

          message += "\n";
        });

        message +=
          "\nPlease make the voice command more specific.\n\n" +
          'Example: "Delete latest Travel 100 rupees"';

        alert(message);
        return;
      }

      // ----------------------------------------
      // SINGLE MATCH
      // ----------------------------------------

      let transaction = deleteResult;

      // Supports both possible backend formats:
      //
      // 1. transaction: actual transaction
      //
      // 2. transaction:
      //    {
      //      multipleMatches: false,
      //      transaction: actual transaction
      //    }

      if (
        transaction &&
        transaction.multipleMatches === false &&
        transaction.transaction
      ) {
        transaction = transaction.transaction;
      }

      if (!transaction?._id) {
        alert("Transaction could not be identified.");
        return;
      }

      await confirmAndDeleteTransaction(transaction);
      return;
    }

    // ------------------------------------------
    // NORMAL RESPONSE
    // ------------------------------------------

    window.dispatchEvent(new CustomEvent("transactionUpdated"));
    window.dispatchEvent(new CustomEvent("categoryUpdated"));

    alert(data.message || "Voice command completed.");
  };

  // ==========================================
  // START / STOP MICROPHONE
  // ==========================================

  const startVoiceInput = async () => {
    // Stop recording if already listening
    if (isListening && mediaRecorder) {
      mediaRecorder.stop();
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsListening(true);
        console.log("🎤 Listening...");
      };

      recorder.onstop = async () => {
        setIsListening(false);

        // Stop microphone completely
        stream.getTracks().forEach((track) => track.stop());

        // Reset recorder state
        setMediaRecorder(null);

        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        console.log("🎤 Audio captured:", audioBlob);

        const token = localStorage.getItem("token");

        if (!token) {
          alert("Please login again.");
          return;
        }

        const formData = new FormData();

        formData.append("audio", audioBlob, "voice-command.webm");

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

          await handleVoiceResponse(data);
        } catch (error) {
          console.error("Audio upload error:", error);

          alert(
            error.response?.data?.message ||
              "Audio upload failed. Please try again.",
          );
        }
      };

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

  // ==========================================
  // UI
  // ==========================================

  return (
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
        <div className="search-box">
          <FiSearch className="search-icon" />

          <input type="text" placeholder="Search..." />
        </div>

        <button
          className={`voice-nav-btn ${isListening ? "listening" : ""}`}
          onClick={startVoiceInput}
          aria-label="Voice command"
          title={isListening ? "Stop listening" : "Voice command"}
        >
          <FaMicrophone />
        </button>

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
  