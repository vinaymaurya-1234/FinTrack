import { useEffect, useState } from "react";
import { FaBars, FaMicrophone } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import { API_URL } from "../../api";
import { expenseCategories, incomeCategories } from "../../utils/categories";

function Navbar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("Vinay");
  const [isListening, setIsListening] = useState(false);

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

  // -----------------------------
  // GET TODAY'S DATE
  // -----------------------------
  const getTodayString = () => {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // -----------------------------
  // FIND CATEGORY
  // -----------------------------
  const findCategory = (categories, names) => {
    return (
      categories.find((category) =>
        names.some((name) => category.toLowerCase() === name.toLowerCase()),
      ) || ""
    );
  };

  // -----------------------------
  // DETECT CATEGORY
  // -----------------------------
  const detectCategory = (text, type) => {
    const categories =
      type === "Expense" ? expenseCategories : incomeCategories;

    // Exact category name
    const exactCategory = categories.find((category) =>
      text.includes(category.toLowerCase()),
    );

    if (exactCategory) {
      return exactCategory;
    }

    // Food
    if (
      text.includes("food") ||
      text.includes("restaurant") ||
      text.includes("swiggy") ||
      text.includes("zomato") ||
      text.includes("lunch") ||
      text.includes("dinner") ||
      text.includes("breakfast") ||
      text.includes("pizza") ||
      text.includes("khana")
    ) {
      return findCategory(categories, ["Food", "Dining"]);
    }

    // Travel / Transport
    if (
      text.includes("petrol") ||
      text.includes("diesel") ||
      text.includes("fuel") ||
      text.includes("uber") ||
      text.includes("ola") ||
      text.includes("cab") ||
      text.includes("taxi") ||
      text.includes("travel") ||
      text.includes("bus") ||
      text.includes("metro") ||
      text.includes("transport")
    ) {
      return findCategory(categories, [
        "Travel",
        "Transport",
        "Transportation",
      ]);
    }

    // Shopping
    if (
      text.includes("shopping") ||
      text.includes("amazon") ||
      text.includes("flipkart") ||
      text.includes("clothes") ||
      text.includes("shirt") ||
      text.includes("shoes")
    ) {
      return findCategory(categories, ["Shopping"]);
    }

    // Medical
    if (
      text.includes("doctor") ||
      text.includes("medicine") ||
      text.includes("hospital") ||
      text.includes("medical") ||
      text.includes("health")
    ) {
      return findCategory(categories, ["Medical", "Health", "Healthcare"]);
    }

    // Rent
    if (text.includes("rent") || text.includes("house rent")) {
      return findCategory(categories, ["Rent", "Housing"]);
    }

    // Bills
    if (
      text.includes("electricity") ||
      text.includes("electric bill") ||
      text.includes("water bill") ||
      text.includes("utility") ||
      text.includes("utilities") ||
      text.includes("bill")
    ) {
      return findCategory(categories, ["Bills", "Utilities"]);
    }

    // Salary
    if (
      text.includes("salary") ||
      text.includes("paycheck") ||
      text.includes("wages")
    ) {
      return findCategory(categories, ["Salary"]);
    }

    return "";
  };

  // -----------------------------
  // PROCESS VOICE COMMAND
  // -----------------------------
  const processVoiceCommand = async (text) => {
    const lowerText = text.toLowerCase();

    // Detect Income / Expense
    let type = "Expense";

    if (
      lowerText.includes("income") ||
      lowerText.includes("salary") ||
      lowerText.includes("received") ||
      lowerText.includes("earning") ||
      lowerText.includes("earned") ||
      lowerText.includes("kamai") ||
      lowerText.includes("mila")
    ) {
      type = "Income";
    }

    // Detect amount
    const amountMatch = text.match(
      /(?:₹|rs\.?|rupees?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i,
    );

    if (!amountMatch) {
      alert("Amount nahi mila. Please amount ke saath dobara bolo.");
      return;
    }

    const amount = Number(amountMatch[1].replace(/,/g, ""));

    if (!amount || amount <= 0) {
      alert("Please speak a valid amount.");
      return;
    }

    // Detect category
    const category = detectCategory(lowerText, type);

    if (!category) {
      alert(
        "Category samajh nahi aayi. Please food, travel, shopping etc. clearly bolo.",
      );
      return;
    }

    // Current date
    const date = getTodayString();

    const transaction = {
      category,
      type,
      amount,
      date,
    };

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        return;
      }

      await axios.post(`${API_URL}/api/transactions`, transaction, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Tell Dashboard that a new transaction was added
      window.dispatchEvent(new CustomEvent("transactionUpdated"));

      alert(
        `${type} added successfully!\n₹${amount.toLocaleString(
          "en-IN",
        )} • ${category}`,
      );
    } catch (error) {
      console.error("Voice transaction error:", error);

      const message =
        error.response?.data?.message || "Failed to add transaction.";

      alert(message);
    }
  };

  // -----------------------------
  // START MICROPHONE
  // -----------------------------
  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
      return;
    }

    if (isListening) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      console.log("Voice command:", text);

      processVoiceCommand(text);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        alert("Kuch suna nahi. Please dobara try karo.");
      } else {
        alert("Voice input failed. Please try again.");
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

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

        {/* VOICE */}
        <button
          className={`voice-nav-btn ${isListening ? "listening" : ""}`}
          onClick={startVoiceInput}
          aria-label="Add transaction with voice"
          title={isListening ? "Listening..." : "Add transaction with voice"}
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
  );
}

export default Navbar;
