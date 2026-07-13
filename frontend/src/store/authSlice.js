import { createSlice } from "@reduxjs/toolkit";

const savedToken = localStorage.getItem("tma_token");
const savedUser = localStorage.getItem("tma_user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null
  },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.access_token;
      state.user = action.payload.user;
      localStorage.setItem("tma_token", action.payload.access_token);
      localStorage.setItem("tma_user", JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem("tma_token");
      localStorage.removeItem("tma_user");
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
