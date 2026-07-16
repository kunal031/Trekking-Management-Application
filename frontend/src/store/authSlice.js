import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    user: null,
    isLoaded: false
  },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.access_token; // Keep for now in case logic needs truthiness, though unused for fetching
      state.user = action.payload.user;
      state.isLoaded = true;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isLoaded = true;
    },
    setLoaded(state) {
      state.isLoaded = true;
    }
  }
});

export const { setCredentials, logout, setLoaded } = authSlice.actions;
export default authSlice.reducer;
