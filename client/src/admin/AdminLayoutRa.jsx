import { AppBar, Layout } from "react-admin";
import { AdminMenu } from "./AdminMenu";

const ToyKartAppBar = (props) => (
  <AppBar
    {...props}
    color="inherit"
    elevation={0}
    sx={{
      bgcolor: "background.paper",
      color: "text.primary",
      borderBottom: 1,
      borderColor: "divider"
    }}
  />
);

export const AdminLayoutRa = (props) => (
  <Layout {...props} menu={AdminMenu} appBar={ToyKartAppBar} />
);
