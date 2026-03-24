import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: "",
  id: "",
  token: "",
//   isLoggedIn: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
   
    setUser: (state, action) => {
        console.log("state",state);
      Object.assign(state, action.payload);
    },
    logout: (state) => {
        console.log("state",state);
        state.id = "";
        state.name = "";
        state.email = "";
        state.token = "";
    //   state.isLoggedIn = false;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
