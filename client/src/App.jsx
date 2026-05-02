import { lazy, Suspense } from "react";
import { LinearProgress } from "@mui/material";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import NewArrivalsPage from "./pages/NewArrivalsPage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrdersPage from "./pages/OrdersPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutThankYouPage from "./pages/CheckoutThankYouPage";
import StorefrontLayout from "./layouts/StorefrontLayout";
import AdminRoute from "./admin/AdminRoute";

const AdminApp = lazy(() => import("./admin/AdminApp"));

const ProtectedRoute = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const location = useLocation();
  if (!userInfo) {
    const to = `/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`;
    return <Navigate to={to} replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          <div className="admin-auth-shell">
            <div className="container page-shell">
              <LoginPage mode="admin" />
            </div>
          </div>
        }
      />

      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Suspense fallback={<LinearProgress />}>
              <AdminApp />
            </Suspense>
          </AdminRoute>
        }
      />

      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage mode="customer" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/thank-you"
          element={
            <ProtectedRoute>
              <CheckoutThankYouPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default App;
