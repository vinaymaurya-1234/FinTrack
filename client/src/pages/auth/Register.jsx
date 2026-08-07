import "./Register.css";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="Register-page">
      <div className="Register-left">
        <h1 className="logo">FinTrack</h1>
      </div>

      <div className="Register-right">
        <div className="Register-card">
          <h2 className="Register-title">Welcome Back</h2>

          <p className="Register-subtitle">Register to your account</p>

          <form className="Register-form">
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

            <button type="submit" className="Register-btn">
              Register
            </button>
          </form>
          
          <p className="Login-text">
            Already have an account?{" "}
            <Link to="/Login" className="Login-link">
            Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
