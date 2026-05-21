import { Navigate, useSearchParams } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const email = params.get("email");
  if (email) {
    return <Navigate to={`/forgot-password?email=${encodeURIComponent(email)}`} replace />;
  }
  return <ForgotPasswordPage />;
};

export default ResetPasswordPage;
