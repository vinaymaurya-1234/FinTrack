import "./Login.css";
import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login-page">
      <div className="login-left">
        <h1 className="logo">FinTrack</h1>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Welcome Back</h2>

          <p className="login-subtitle">Login to your account</p>

          <form className="login-form">
            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                className="input-field"
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
