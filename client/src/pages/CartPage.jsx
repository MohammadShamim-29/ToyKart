import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import { removeLine, selectCartItems, setLineQty } from "../app/cartSlice";
import { formatBdt } from "../utils/formatCurrency";

const CartPage = () => {
  const items = useSelector(selectCartItems);
  const dispatch = useDispatch();

  const itemsPrice = items.reduce((sum, line) => sum + line.price * line.qty, 0);
  const shippingPrice = items.length ? 60 : 0;
  const taxPrice = 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  if (items.length === 0) {
    return (
      <section className="stack-md cart-page">
        <div className="section-head">
          <h1>Your cart</h1>
          <p className="subtext">Your cart is empty — discover something fun in the catalog.</p>
        </div>
        <Link className="btn btn-primary" to="/#catalog">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="stack-lg cart-page">
      <div className="section-head">
        <h1>Your cart</h1>
        <p className="subtext">{items.length} line item{items.length === 1 ? "" : "s"}</p>
      </div>

      <div className="cart-layout">
        <ul className="cart-lines card">
          {items.map((line) => {
            const max =
              Number.isFinite(line.countInStock) && line.countInStock > 0 ? line.countInStock : undefined;
            return (
              <li className="cart-line" key={line.productId}>
                <Link to={`/product/${line.productId}`} className="cart-line-media">
                  <img src={line.image} alt={line.name} />
                </Link>
                <div className="cart-line-body">
                  <Link to={`/product/${line.productId}`} className="cart-line-name">
                    {line.name}
                  </Link>
                  <p className="cart-line-unit">{formatBdt(line.price)} each</p>
                  {max != null && (
                    <p className="subtext cart-line-stock">Up to {max} in stock</p>
                  )}
                </div>
                <div className="cart-line-qty">
                  <label>
                    <span className="visually-hidden">Quantity</span>
                    <input
                      type="number"
                      min={1}
                      max={max ?? undefined}
                      value={line.qty}
                      onChange={(e) =>
                        dispatch(
                          setLineQty({ productId: line.productId, qty: Number(e.target.value) || 1 })
                        )
                      }
                    />
                  </label>
                </div>
                <p className="cart-line-sub">{formatBdt(line.price * line.qty)}</p>
                <button
                  type="button"
                  className="btn btn-ghost cart-line-remove"
                  aria-label={`Remove ${line.name}`}
                  onClick={() => dispatch(removeLine(line.productId))}
                >
                  <Trash2 size={18} />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="cart-summary card">
          <h2>Order summary</h2>
          <dl className="cart-summary-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatBdt(itemsPrice)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{shippingPrice ? formatBdt(shippingPrice) : formatBdt(0)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatBdt(taxPrice)}</dd>
            </div>
            <div className="cart-summary-total">
              <dt>Estimated total</dt>
              <dd>{formatBdt(totalPrice)}</dd>
            </div>
          </dl>
          <p className="subtext">Flat shipping (Dhaka metro estimate). Final total confirmed at checkout.</p>
          <Link className="btn btn-primary cart-checkout-cta" to="/checkout">
            Proceed to checkout
          </Link>
          <Link className="btn btn-secondary cart-continue" to="/#catalog">
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
};

export default CartPage;
