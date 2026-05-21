import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import PasswordStrength from "../../components/auth/PasswordStrength";
import { passwordRules } from "../../utils/passwordStrength";

const ForgotPasswordPage = () => {
  const [phase, setPhase] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOtpVerified(false);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      toast.success(data.message || "Code sent — check inbox and spam.");
      if (data.devOtp) {
        toast(`Dev OTP: ${data.devOtp}`, { duration: 120000, icon: "🔑" });
      }
      setCountdown(data.expiresIn || 600);
      setPhase("otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-reset-otp", { email, otp });
      if (!data.verified) {
        toast.error("Invalid code");
        return;
      }
      toast.success(data.message);
      setOtpVerified(true);
      setPhase("reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const resetPass = async (e) => {
    e.preventDefault();
    if (!passwordRules.every((r) => r.test(password))) {
      return toast.error("Password does not meet requirements");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { email, password });
      toast.success(data.message);
      setPhase("done");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <section className="auth-wrap card">
        <p className="eyebrow">Account</p>
        <h1>Reset password</h1>
        <p className="subtext" style={{ marginTop: "0.5rem" }}>
          We will email you a 6-digit verification code.
        </p>

        {phase === "email" && (
          <form onSubmit={sendOtp} className="form" style={{ marginTop: "1.25rem" }}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {phase === "otp" && (
          <form onSubmit={verifyOtp} className="form" style={{ marginTop: "1.25rem" }}>
            {countdown > 0 ? (
              <p className="notice">
                Code expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
              </p>
            ) : (
              <p className="error">Code expired — request a new one.</p>
            )}
            <label>
              6-digit code
              <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading || countdown <= 0}>
              {loading ? "Checking…" : "Verify code"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: "0.5rem" }}
              onClick={() => setPhase("email")}
            >
              Use a different email
            </button>
          </form>
        )}

        {phase === "reset" && (
          <form onSubmit={resetPass} className="form" style={{ marginTop: "1.25rem" }}>
            {otpVerified && <p className="success">Code verified. Set your new password.</p>}
            <label>
              New password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            <PasswordStrength password={password} />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        {phase === "done" && (
          <div style={{ marginTop: "1.25rem" }}>
            <p className="success">Password updated. You can sign in now.</p>
            <Link to="/login" className="btn btn-primary" style={{ display: "inline-flex", marginTop: "1rem" }}>
              Back to login
            </Link>
          </div>
        )}

        <p className="subtext" style={{ marginTop: "1rem" }}>
          <Link to="/login">← Back to sign in</Link>
        </p>
      </section>
    </div>
  );
};

export default ForgotPasswordPage;
