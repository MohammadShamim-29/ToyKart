import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { setCredentials } from "../app/store";

const LoginPage = ({ mode = "customer" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isAdminMode = mode === "admin";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const safeRedirect = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    const path = decodeURIComponent(raw);
    if (!(path.startsWith("/") && !path.startsWith("//"))) return null;
    if (isAdminMode && !path.startsWith("/admin")) return null;
    return path;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isAdminMode ? "/auth/admin/login" : "/auth/login";
      const { data } = await api.post(endpoint, { email, password });

      if (!isAdminMode && data?.isAdmin) {
        dispatch(setCredentials(data));
        navigate("/admin");
        return;
      }

      dispatch(setCredentials(data));
      const next = safeRedirect(searchParams.get("redirect"));
      if (isAdminMode) {
        navigate(next || "/admin");
      } else {
        navigate(next || "/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="auth-wrap card">
      <p className="eyebrow">{isAdminMode ? "Admin Portal" : "Welcome Back"}</p>
      <h1>{isAdminMode ? "Admin login" : "Login"}</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={onSubmit} className="form">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>

        <button type="submit" className="btn btn-primary">
          Sign in
        </button>
      </form>

      {isAdminMode ? (
        <p className="subtext">
          Customer account? <Link to="/login">Go to user login</Link>
        </p>
      ) : (
        <p className="subtext">
          New user? <Link to="/register">Create an account</Link>
        </p>
      )}
    </section>
  );
};

export default LoginPage;
