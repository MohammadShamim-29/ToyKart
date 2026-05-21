import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import { setCredentials } from "../app/store";

/** Compact admin login (storefront uses pages/auth/LoginPage). */
const LoginPage = ({ mode = "customer" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isAdminMode = mode === "admin";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isAdminMode ? "/auth/admin/login" : "/auth/login";
      const { data } = await api.post(endpoint, { email, password });
      dispatch(setCredentials(data));
      toast.success("Signed in");
      if (isAdminMode || data?.isAdmin) navigate("/admin");
      else {
        const raw = searchParams.get("redirect");
        const path = raw && raw.startsWith("/") ? decodeURIComponent(raw) : "/";
        navigate(path);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className="auth-wrap card">
      <p className="eyebrow">{isAdminMode ? "Admin Portal" : "Welcome Back"}</p>
      <h1>{isAdminMode ? "Admin login" : "Login"}</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary">
          Sign in
        </button>
      </form>
      {isAdminMode ? (
        <p className="subtext">
          <Link to="/login">Customer login</Link>
        </p>
      ) : (
        <p className="subtext">
          <Link to="/register">Create account</Link>
        </p>
      )}
    </section>
  );
};

export default LoginPage;
