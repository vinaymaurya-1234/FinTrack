import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../../api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        sessionStorage.setItem(
          "toastMessage",
          data.message || "Registration failed",
        );

        window.dispatchEvent(new Event("toastUpdated"));

        return;
      }

      sessionStorage.setItem("toastMessage", "Registration successful");

      navigate("/login");
    } catch (error) {
      console.error(error);

      sessionStorage.setItem("toastMessage", "Something went wrong");

      window.dispatchEvent(new Event("toastUpdated"));
    }
  };

  return (
    <div className="Register-page">
      <div className="Register-left">
        <h1 className="logo">FinTrack</h1>
      </div>

      <div className="Register-right">
        <div className="Register-card">
          <h2 className="Register-title">Create Account</h2>

          <p className="Register-subtitle">Register to your account</p>

          <form className="Register-form" onSubmit={handleRegister}>
            {/* Name */}
            <div className="form-group">
              <label>Name</label>

              <input
                type="text"
                placeholder="Enter your name"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="Register-btn">
              Register
            </button>
          </form>

          <p className="Login-text">
            Already have an account?{" "}
            <Link to="/login" className="Login-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
