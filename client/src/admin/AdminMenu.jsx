import { Menu, MenuItemLink } from "react-admin";
import StorefrontIcon from "@mui/icons-material/Storefront";

export const AdminMenu = () => (
  <Menu>
    <Menu.DashboardItem />
    <Menu.ResourceItems />
    <MenuItemLink to="/" primaryText="View storefront" leftIcon={<StorefrontIcon />} />
  </Menu>
);
