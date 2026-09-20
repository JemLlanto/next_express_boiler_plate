import { configureStore } from "@reduxjs/toolkit";
import passwordReducer from "./slice/passwordToggleSlice";
import userReducer from "./slice/userDataSlice";
import itemReducer from "./slice/itemData.slice";
import isLoadingReducer from "./slice/isLoading.slice";

export const store = configureStore({
  reducer: {
    password: passwordReducer,
    userData: userReducer,
    itemData: itemReducer,
    loading: isLoadingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
