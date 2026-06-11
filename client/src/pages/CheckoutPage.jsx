import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api";
import { clearCart, selectCartItems } from "../app/cartSlice";
import { formatBdt } from "../utils/formatCurrency";

const defaultShipping = {
  firstName: "",
  address: "",
  country: "",
  city: "",
  phone: "",
  email: "",
  orderNotes: ""
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+0-9()\-.\s]{7,20}$/;
const DHAKA_SHIPPING_BDT = 60;
const OUTSIDE_DHAKA_SHIPPING_BDT = 100;
const VAT_RATE = 0; //  VAT is currently 0%, but this can be updated when needed  

const isDhakaCity = (city) => String(city || "").trim().toLowerCase() === "dhaka";

const CheckoutPage = () => {
  const items = useSelector(selectCartItems);
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shipping, setShipping] = useState(defaultShipping);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CashOnDelivery");
  const storageKey = useMemo(() => `checkoutShipping:${userInfo?._id || "guest"}`, [userInfo?._id]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "failed") {
      setError("Payment failed. Please try again or choose Cash on Delivery.");
    } else if (payment === "cancelled") {
      setError("Payment cancelled. You can try again or choose Cash on Delivery.");
    }
  }, [searchParams]);

  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = useMemo(() => {
    const sub = items.reduce((sum, line) => sum + line.price * line.qty, 0);
    const ship = items.length ? (isDhakaCity(shipping.city) ? DHAKA_SHIPPING_BDT : OUTSIDE_DHAKA_SHIPPING_BDT) : 0;
    const tax = 0;
    return {
      itemsPrice: sub,
      shippingPrice: ship,
      taxPrice: tax,
      totalPrice: sub + ship + tax
    };
  }, [items, shipping.city]);

  const countryOptions = useMemo(() => locations, [locations]);
  const districtOptions = useMemo(
    () => countryOptions.find((country) => country.name === shipping.country)?.districts || [],
    [countryOptions, shipping.country]
  );
  const hideCountryField = countryOptions.length === 1;

  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      setShipping((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore corrupted local storage payload
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(shipping));
  }, [shipping, storageKey]);

  useEffect(() => {
    const loadLocations = async () => {
      setLoadingLocations(true);
      setLocationError("");
      try {
        const { data } = await api.get("/shipping/locations");
        const countries = Array.isArray(data) ? data : [];
        setLocations(countries);
      } catch (err) {
        setLocationError(err.response?.data?.message || "Could not load shipping locations.");
      } finally {
        setLoadingLocations(false);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    if (!countryOptions.length) return;
    const selectedCountry = countryOptions.find((country) => country.name === shipping.country);
    const nextCountry = selectedCountry || countryOptions[0];
    const districtList = nextCountry?.districts || [];
    const nextCity = districtList.some((district) => district.name === shipping.city) ? shipping.city : "";

    if (shipping.country !== nextCountry.name || shipping.city !== nextCity) {
      setShipping((prev) => ({
        ...prev,
        country: nextCountry.name,
        city: nextCity
      }));
    }
  }, [countryOptions, shipping.country, shipping.city]);

  const onShippingChange = (field) => (e) => {
    setShipping((s) => ({ ...s, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const onCountryChange = (e) => {
    const country = e.target.value;
    setShipping((prev) => ({ ...prev, country, city: "" }));
    setFieldErrors((prev) => ({ ...prev, country: "", city: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!shipping.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!shipping.address.trim()) nextErrors.address = "Street address is required.";
    if (!shipping.country.trim()) nextErrors.country = "Country is required.";
    if (!shipping.city.trim()) nextErrors.city = "District / City is required.";
    if (!shipping.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (shipping.phone && !PHONE_REGEX.test(shipping.phone)) nextErrors.phone = "Enter a valid phone number.";
    if (shipping.email && !EMAIL_REGEX.test(shipping.email)) nextErrors.email = "Enter a valid email address.";
    if (shipping.city && !districtOptions.find((district) => district.name === shipping.city)) {
      nextErrors.city = "Please select an available district/city.";
    }
    return nextErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (loadingLocations) {
      setError("Shipping locations are loading. Please try again.");
      return;
    }
    if (locationError) {
      setError(locationError);
      return;
    }
    if (!countryOptions.length) {
      setError("Shipping is currently unavailable. Please contact support.");
      return;
    }

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((line) => ({
        product: line.productId,
        variantId: line.variantId || undefined,
        colorName: line.colorName || undefined,
        name: line.name,
        qty: line.qty,
        image: line.image,
        price: line.price
      }));

      const { data: createdOrder } = await api.post("/orders", {
        orderItems,
        shippingAddress: {
          firstName: shipping.firstName.trim(),
          address: shipping.address.trim(),
          country: shipping.country.trim(),
          city: shipping.city.trim(),
          phone: shipping.phone.trim(),
          email: shipping.email.trim(),
          orderNotes: shipping.orderNotes.trim()
        },
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
      });

      if (paymentMethod === "SSLCommerz") {
        const { data: payment } = await api.post(`/orders/${createdOrder._id}/pay/sslcommerz`);
        if (!payment?.redirectUrl) {
          throw new Error("Could not get payment redirect URL.");
        }
        window.location.assign(payment.redirectUrl);
        return;
      }

      dispatch(clearCart());
      localStorage.removeItem(storageKey);
      navigate("/checkout/thank-you", { state: { order: createdOrder } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="stack-md checkout-page">
        <div className="section-head">
          <h1>Checkout</h1>
          <p className="subtext">Add something to your cart before checking out.</p>
        </div>
        <Link className="btn btn-primary" to="/cart">
          View cart
        </Link>
      </section>
    );
  }

  return (
    <section className="stack-lg checkout-page">
      <div className="section-head">
        <h1>Checkout</h1>
        <p className="subtext">Choose a payment method, then place your order.</p>
      </div>

      {error && <p className="error">{error}</p>}
      {locationError && <p className="error">{locationError}</p>}
      {!loadingLocations && !locationError && countryOptions.length === 0 ? (
        <p className="error">No shipping locations are available right now.</p>
      ) : null}

      <form onSubmit={onSubmit} className="checkout-layout">
        <div className="checkout-form card stack-md form">
          <div className="checkout-block-head">
            <h2>Billing & shipping details</h2>
            <p>Complete your delivery info and we will confirm your order instantly.</p>
          </div>
          <label>
            First name
            <input
              value={shipping.firstName}
              onChange={onShippingChange("firstName")}
              required
              autoComplete="given-name"
              aria-invalid={Boolean(fieldErrors.firstName)}
            />
            {fieldErrors.firstName ? <span className="field-error">{fieldErrors.firstName}</span> : null}
          </label>
          <label>
            Street address
            <input
              value={shipping.address}
              onChange={onShippingChange("address")}
              required
              autoComplete="street-address"
              aria-invalid={Boolean(fieldErrors.address)}
            />
            {fieldErrors.address ? <span className="field-error">{fieldErrors.address}</span> : null}
          </label>

          <div className="checkout-two-col checkout-selects">
            {!hideCountryField ? (
              <label>
                Country
                <select
                  value={shipping.country}
                  onChange={onCountryChange}
                  required
                  disabled={loadingLocations || countryOptions.length === 0}
                  aria-invalid={Boolean(fieldErrors.country)}
                >
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.country ? <span className="field-error">{fieldErrors.country}</span> : null}
              </label>
            ) : (
              <div className="checkout-country-fixed">
                <span className="checkout-country-label">Country</span>
                <strong>{countryOptions[0]?.name || "—"}</strong>
              </div>
            )}

            <label>
              District / City
              <select
                value={shipping.city}
                onChange={onShippingChange("city")}
                required
                disabled={loadingLocations || !shipping.country || districtOptions.length === 0}
                aria-invalid={Boolean(fieldErrors.city)}
              >
                <option value="">{shipping.country ? "Select district/city" : "Select country first"}</option>
                {districtOptions.map((district) => (
                  <option key={district.id} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              {fieldErrors.city ? <span className="field-error">{fieldErrors.city}</span> : null}
            </label>
          </div>

          <div className="checkout-two-col">
            <label>
              Phone number
              <input
                value={shipping.phone}
                onChange={onShippingChange("phone")}
                required
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
              />
              {fieldErrors.phone ? <span className="field-error">{fieldErrors.phone}</span> : null}
            </label>
          <label>
            Email address (optional)
              <input
                value={shipping.email}
                onChange={onShippingChange("email")}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
            </label>
          </div>

          <label>
            Order notes (optional)
            <textarea
              value={shipping.orderNotes}
              onChange={onShippingChange("orderNotes")}
              rows={4}
              placeholder="Any delivery instructions or notes for our team"
            />
          </label>
          <Link className="btn btn-secondary" to="/cart">
            Back to cart
          </Link>
        </div>

        <aside className="checkout-summary card">
          <h2>Summary</h2>
          <ul className="checkout-summary-lines">
            {items.map((line) => (
              <li key={`${line.productId}:${line.variantId || ""}`}>
                <span>
                  {line.name}
                  {line.colorName ? ` (${line.colorName})` : ""} × {line.qty}
                </span>
                <span>{formatBdt(line.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="cart-summary-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatBdt(itemsPrice)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{formatBdt(shippingPrice)}</dd>
            </div>
            <div className="cart-summary-total">
              <dt>Total</dt>
              <dd>{formatBdt(totalPrice)}</dd>
            </div>
          </dl>
          <fieldset className="stack-sm checkout-payment-methods checkout-payment-side">
            <legend>Payment method</legend>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="CashOnDelivery"
                checked={paymentMethod === "CashOnDelivery"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Cash on Delivery
            </label>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="SSLCommerz"
                checked={paymentMethod === "SSLCommerz"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              SSLCommerz (Online Payment)
            </label>
          </fieldset>
          <button
            type="submit"
            className="btn btn-primary checkout-place-order"
            disabled={submitting || loadingLocations || Boolean(locationError) || countryOptions.length === 0}
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
          <p className="subtext">
            Payment: {paymentMethod === "SSLCommerz" ? "SSLCommerz (Online Payment)" : "Cash on Delivery"}
          </p>
        </aside>
      </form>
    </section>
  );
};

export default CheckoutPage;
