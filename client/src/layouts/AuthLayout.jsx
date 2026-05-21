import { Link, Outlet } from "react-router-dom";

const AuthLayout = () => (
  <div id="auth-root" className="auth-theme relative min-h-screen">
    <Link to="/" className="auth-home-link">
      ← Back to shop
    </Link>
    <Outlet />
  </div>
);

export default AuthLayout;
