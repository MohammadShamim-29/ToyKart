import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "verifying" : "pending");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token || !email) return;
    const run = async () => {
      try {
        await api.get("/auth/verify-email", { params: { email, token } });
        setStatus("verified");
        toast.success("Email verified!");
      } catch (err) {
        setStatus("error");
        toast.error(err.response?.data?.message || "Verification failed");
      }
    };
    run();
  }, [token, email]);

  const resend = async () => {
    if (!email) return toast.error("Email missing — register or sign in again.");
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("Verification email sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <section className="auth-wrap card" style={{ textAlign: "center" }}>
        {status === "verifying" && (
          <>
            <p className="eyebrow">Please wait</p>
            <h1>Verifying email</h1>
            <p className="notice" style={{ marginTop: "1rem" }}>
              Confirming your account…
            </p>
          </>
        )}

        {status === "verified" && (
          <>
            <p className="eyebrow">Success</p>
            <h1>Email verified</h1>
            <p className="subtext" style={{ marginTop: "0.75rem" }}>
              Welcome to ToyKart. You are ready to shop.
            </p>
            <Link to="/" className="btn btn-primary" style={{ display: "inline-flex", marginTop: "1.25rem" }}>
              Start shopping
            </Link>
          </>
        )}

        {(status === "pending" || status === "error") && (
          <>
            <p className="eyebrow">Almost there</p>
            <h1>Verify your email</h1>
            <p className="subtext" style={{ marginTop: "0.75rem" }}>
              We sent a link to <strong>{email || "your inbox"}</strong>. Check spam if you do not see it.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: "1.25rem" }}
              onClick={resend}
              disabled={resending}
            >
              {resending ? "Sending…" : "Resend email"}
            </button>
            <p className="subtext" style={{ marginTop: "1rem" }}>
              <Link to="/login">Back to login</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default VerifyEmailPage;
