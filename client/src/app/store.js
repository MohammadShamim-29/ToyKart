import { configureStore, createSlice } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice.js";
import { writeCartItems } from "../utils/cartStorage.js";

const readUserInfo = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialUser = readUserInfo();

const authSlice = createSlice({
  name: "auth",
  initialState: { userInfo: initialUser },
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem("userInfo");
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartReducer
  }
});

store.subscribe(() => {
  writeCartItems(store.getState().cart.items);
});
