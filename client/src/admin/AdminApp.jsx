import { Admin, Resource } from "react-admin";
import { createTheme } from "@mui/material/styles";
import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";
import { AdminLayoutRa } from "./AdminLayoutRa";
import { AdminDashboardRa } from "./AdminDashboardRa";
import { CategoryList, CategoryEdit, CategoryCreate } from "./resources/categories";
import { ProductList, ProductEdit, ProductCreate } from "./resources/products";
import {
  ShippingCountryList,
  ShippingCountryEdit,
  ShippingCountryCreate
} from "./resources/shippingCountries";
import {
  ShippingDistrictList,
  ShippingDistrictEdit,
  ShippingDistrictCreate
} from "./resources/shippingDistricts";
import { OrderList, OrderEdit } from "./resources/orders";
import { UserList, UserShow } from "./resources/users";
import { ReturnRequestList, ReturnRequestEdit } from "./resources/returns";

const adminTheme = createTheme({
  palette: {
    primary: { main: "#2563eb", light: "#dbeafe", dark: "#1e40af" },
    secondary: { main: "#64748b" },
    success: { main: "#0d9488" },
    warning: { main: "#d97706" },
    divider: "rgba(15, 23, 42, 0.08)",
    text: { primary: "#0f172a", secondary: "#64748b" },
    mode: "light",
    background: { default: "#eef2f7", paper: "#ffffff" }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Outfit", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden"
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          boxSizing: "border-box"
        }
      }
    },
    RaSimpleForm: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: "100%",
          paddingBottom: theme.spacing(1),
          "& > .MuiStack-root": {
            width: "100%",
            gap: theme.spacing(2.5)
          }
        })
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(15, 23, 42, 0.08)",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
          "&:hover": { backgroundColor: "rgba(37, 99, 235, 0.045)" }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        },
        rounded: {
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.04)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        text: { textTransform: "none", fontWeight: 600 },
        contained: { textTransform: "none", fontWeight: 600, boxShadow: "none" },
        outlined: { textTransform: "none", fontWeight: 600 }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 }
      }
    }
  }
});

const AdminApp = () => (
  <Admin
    basename="/admin"
    title="ToyKart Admin"
    theme={adminTheme}
    layout={AdminLayoutRa}
    dashboard={AdminDashboardRa}
    dataProvider={dataProvider}
    authProvider={authProvider}
  >
    <Resource
      name="orders"
      list={OrderList}
      edit={OrderEdit}
      recordRepresentation={(record) => `#${record?.orderNumber || record?.id || ""}`}
      options={{ label: "Orders" }}
    />
    <Resource
      name="users"
      list={UserList}
      show={UserShow}
      recordRepresentation="email"
      options={{ label: "Customers" }}
    />
    <Resource
      name="returns"
      list={ReturnRequestList}
      edit={ReturnRequestEdit}
      recordRepresentation={(record) => `Return ${String(record?.id || "").slice(-6).toUpperCase()}`}
      options={{ label: "Returns" }}
    />
    <Resource
      name="categories"
      list={CategoryList}
      edit={CategoryEdit}
      create={CategoryCreate}
      recordRepresentation="name"
      options={{ label: "Categories" }}
    />
    <Resource
      name="products"
      list={ProductList}
      edit={ProductEdit}
      create={ProductCreate}
      recordRepresentation="name"
      options={{ label: "Products" }}
    />
    <Resource
      name="shipping-countries"
      list={ShippingCountryList}
      edit={ShippingCountryEdit}
      create={ShippingCountryCreate}
      recordRepresentation="name"
      options={{ label: "Shipping Countries" }}
    />
    <Resource
      name="shipping-districts"
      list={ShippingDistrictList}
      edit={ShippingDistrictEdit}
      create={ShippingDistrictCreate}
      recordRepresentation="name"
      options={{ label: "Shipping Districts" }}
    />
  </Admin>
);

export default AdminApp;
