import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { formatBdt } from "../utils/formatCurrency";
import { clearCart } from "../app/cartSlice";
import { generateReceipt } from "../utils/generateReceipt";
import { FileDown } from "lucide-react";

const STORAGE_KEY = "checkout:lastOrder";

const CheckoutThankYouPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const orderFromState = location.state?.order;
  const paymentStatus = searchParams.get("payment");

  useEffect(() => {
    if (orderFromState?._id) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orderFromState));
    }
  }, [orderFromState]);

  useEffect(() => {
    if (paymentStatus === "success") {
      dispatch(clearCart());
    }
  }, [dispatch, paymentStatus]);

  const order = useMemo(() => {
    if (orderFromState?._id) return orderFromState;
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      return parsed?._id ? parsed : null;
    } catch {
      return null;
    }
  }, [orderFromState]);

  return (
    <section className="stack-lg thank-you-page">
      <div className="card thank-you-card stack-md">
        <p className="thank-you-badge">Order received</p>
        <h1>Thank you. Your order has been placed.</h1>
        <p className="subtext">
          {paymentStatus === "success"
            ? "Your online payment was received successfully."
            : "We will contact you if any confirmation is needed."}
        </p>

        {order ? (
          <dl className="thank-you-meta">
            <div>
              <dt>Order number</dt>
              <dd>#{String(order._id).slice(-8).toUpperCase()}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatBdt(order.totalPrice || 0)}</dd>
            </div>
            <div>
              <dt>Shipping to</dt>
              <dd>
                {order.shippingAddress?.city}, {order.shippingAddress?.country}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="subtext">Order details are not available in this session, but your order request was submitted.</p>
        )}

        <div className="thank-you-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {order && (
            <button type="button" className="btn btn-primary" onClick={() => generateReceipt(order)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
              <FileDown size={18} /> Download Receipt (PDF)
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
            <Link to="/orders" className="btn btn-secondary">
              View orders
            </Link>
            <Link to="/" className="btn btn-secondary">
              Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutThankYouPage;
