import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { setCredentials } from "../app/store";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (normalizedName.length < 2 || normalizedName.length > 60) {
      setError("Name must be between 2 and 60 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please provide a valid email address.");
      return;
    }

    if (!/^\+?[0-9\s()-]{7,20}$/.test(normalizedPhone)) {
      setError("Please provide a valid phone number.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be 8 to 72 characters.");
      return;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Password must include uppercase, lowercase, number, and special character.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      const { data } = await api.post("/auth/register", {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        password
      });
      dispatch(setCredentials(data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <section className="auth-wrap card">
      <p className="eyebrow">Join ToyKart</p>
      <h1>Create account</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={onSubmit} className="form">
        <label>
          Full name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label>
          Phone
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Create account
        </button>
      </form>

      <p className="subtext">
        Already have one? <Link to="/login">Sign in</Link>
      </p>
    </section>
  );
};

export default RegisterPage;
