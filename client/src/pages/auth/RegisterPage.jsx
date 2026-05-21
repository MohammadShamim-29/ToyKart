import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import PasswordStrength from "../../components/auth/PasswordStrength";
import { passwordRules } from "../../utils/passwordStrength";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    if (form.name.trim().length < 2) return toast.error("Enter your full name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Valid email required");
    if (!/^\+?[0-9\s()-]{7,20}$/.test(form.phone.trim())) return toast.error("Valid phone required");
    if (!passwordRules.every((r) => r.test(form.password))) return toast.error("Password does not meet requirements");
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (validate() !== true) return;

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password
      });
      toast.success(data.message || "Account created! You can sign in now.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <section className="auth-wrap card">
        <p className="eyebrow">Join ToyKart</p>
        <h1>Create account</h1>
        <p className="subtext" style={{ marginTop: "0.5rem" }}>
          One quick form — we will send an optional verification link to your email.
        </p>

        <form onSubmit={onSubmit} className="form" style={{ marginTop: "1.25rem" }}>
          <label>
            Full name
            <input type="text" value={form.name} onChange={set("name")} autoComplete="name" required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
          </label>
          <label>
            Phone
            <input type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" required />
          </label>
          <label>
            Password
            <div className="password-toggle-wrap">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                required
              />
              <button type="button" className="password-toggle-btn" onClick={() => setShowPass((s) => !s)}>
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <PasswordStrength password={form.password} />
          <label>
            Confirm password
            <div className="password-toggle-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                autoComplete="new-password"
                required
              />
              <button type="button" className="password-toggle-btn" onClick={() => setShowConfirm((s) => !s)}>
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="subtext" style={{ marginTop: "1rem", textAlign: "center" }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
};

export default RegisterPage;
