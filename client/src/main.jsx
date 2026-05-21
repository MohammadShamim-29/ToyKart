import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "./styles/tokens.css";
import App from "./App";
import { store } from "./app/store";
import { hydrateFromStorage } from "./app/cartSlice";
import { CART_KEY } from "./utils/cartStorage";
import "./index.css";
import "./styles.css";
import { Toaster } from "react-hot-toast";

window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) {
    store.dispatch(hydrateFromStorage());
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: "16px", fontFamily: "var(--font-body)" }
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
