import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/700.css";
import App from "./App";
import { store } from "./app/store";
import { hydrateFromStorage } from "./app/cartSlice";
import { CART_KEY } from "./utils/cartStorage";
import "./styles.css";

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
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
