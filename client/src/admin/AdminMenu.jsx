import { Menu, MenuItemLink } from "react-admin";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PublicIcon from "@mui/icons-material/Public";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import StorefrontIcon from "@mui/icons-material/Storefront";

export const AdminMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <MenuItemLink to="/admin/orders" primaryText="Orders" leftIcon={<ReceiptLongIcon />} />
    <MenuItemLink to="/admin/products" primaryText="Products" leftIcon={<Inventory2Icon />} />
    <MenuItemLink to="/admin/categories" primaryText="Categories" leftIcon={<CategoryIcon />} />
    <MenuItemLink to="/admin/users" primaryText="Customers" leftIcon={<PeopleAltIcon />} />
    <MenuItemLink to="/admin/returns" primaryText="Returns" leftIcon={<AssignmentReturnIcon />} />
    <MenuItemLink
      to="/admin/shipping-countries"
      primaryText="Shipping Countries"
      leftIcon={<PublicIcon />}
    />
    <MenuItemLink
      to="/admin/shipping-districts"
      primaryText="Shipping Districts"
      leftIcon={<LocationCityIcon />}
    />
    <MenuItemLink
      to="/"
      primaryText="View storefront"
      leftIcon={<StorefrontIcon />}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = "/";
      }}
    />
  </Menu>
);
