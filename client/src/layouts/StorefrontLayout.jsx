import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const StorefrontLayout = () => (
  <div className="app-shell storefront-shell">
    <Header />
    <main className="container page-shell storefront-main">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default StorefrontLayout;
