import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import { setCredentials } from "../../app/store";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const safeRedirect = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    const path = decodeURIComponent(raw);
    if (!(path.startsWith("/") && !path.startsWith("//"))) return null;
    if (path.startsWith("/admin")) return null;
    return path;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, remember });
      if (data?.isAdmin) {
        dispatch(setCredentials(data));
        toast.success("Welcome back, admin!");
        navigate("/admin");
        return;
      }
      dispatch(setCredentials(data));
      toast.success(`Welcome back, ${data.name}!`);
      navigate(safeRedirect(searchParams.get("redirect")) || "/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <section className="auth-wrap card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="subtext" style={{ marginTop: "0.5rem" }}>
          Access your orders, wishlist, and checkout.
        </p>

        <form onSubmit={onSubmit} className="form" style={{ marginTop: "1.25rem" }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <div className="password-toggle-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
              </button>
            </div>
          </label>

          <div className="auth-form-row">
            <label className="auth-remember">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="subtext-link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="subtext" style={{ marginTop: "1rem" }}>
          New to ToyKart? <Link to="/register">Create account</Link>
        </p>
      </section>
    </div>
  );
};

export default LoginPage;
