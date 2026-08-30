import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_URL } from "../../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        sessionStorage.setItem("toastMessage", data.message || "Login failed");

        window.dispatchEvent(new Event("toastUpdated"));
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      sessionStorage.setItem("toastMessage", "Login successful");

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      sessionStorage.setItem("toastMessage", "Something went wrong");

      window.dispatchEvent(new Event("toastUpdated"));
    }
  };

  return (
    <div className="login-page">
      {/* LEFT BRANDING */}
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-logo">
            <div className="brand-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span className="brand-name">FinTrack</span>
          </div>

          <div className="brand-line"></div>

          <p className="brand-tagline">Track. Manage. Grow.</p>
        </div>
      </div>

      {/* RIGHT LOGIN */}
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Welcome Back</h2>

          <p className="login-subtitle">Login to your account</p>

          <form className="login-form" onSubmit={handleLogin}>
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

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>

          <p className="register-text">
            Don't have an account?{" "}
            <Link to="/register" className="register-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
