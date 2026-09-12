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

  // Send voice command to backend
  const processVoiceCommand = async (text) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        return;
      }

      const { data } = await axios.post(
        `${API_URL}/api/voice-command`,
        { command: text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      window.dispatchEvent(new CustomEvent("transactionUpdated"));
      window.dispatchEvent(new CustomEvent("categoryUpdated"));

      alert(data.message || "Voice command completed.");
    } catch (error) {
      console.error("Voice command error:", error);

      alert(
        error.response?.data?.message ||
          "Voice command failed. Please try again.",
      );
    }
  };

  // Start / Stop microphone
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

          console.log("🎤 Backend response:", data);

          alert(data.message || "Audio sent successfully.");
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

        stream.getTracks().forEach((track) => track.stop());

        alert("Voice input failed. Please try again.");
      };

      setMediaRecorder(recorder);

      recorder.start();
    } catch (error) {
      console.error("Microphone error:", error);

      setIsListening(false);

      if (error.name === "NotAllowedError") {
        alert("Please allow microphone access.");
      } else if (error.name === "NotFoundError") {
        alert("No microphone was found.");
      } else {
        alert("Microphone could not be started.");
      }
    }
  };

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
  