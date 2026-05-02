import { store, logout as logoutAction } from "../app/store";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo") || "null");
  } catch {
    return null;
  }
};

export const authProvider = {
  login: () => Promise.resolve(),

  logout: () => {
    store.dispatch(logoutAction());
    return Promise.resolve();
  },

  checkAuth: () => {
    const u = readUser();
    if (!u) {
      return Promise.reject({ redirectTo: "/admin/login" });
    }
    if (!u.isAdmin) {
      return Promise.reject({ redirectTo: "/" });
    }
    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error?.status ?? error?.response?.status;
    if (status === 401 || status === 403) {
      store.dispatch(logoutAction());
      return Promise.reject({ message: error?.message, logoutUser: true });
    }
    return Promise.resolve();
  },

  getIdentity: () => {
    const u = readUser() || {};
    return Promise.resolve({
      id: u._id ?? u.id ?? "",
      fullName: u.name || u.email || "Admin",
      avatar: undefined
    });
  },

  getPermissions: () => Promise.resolve("admin")
};
