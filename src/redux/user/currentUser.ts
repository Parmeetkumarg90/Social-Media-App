import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { authorizedInterface, typeStatus } from "@/interfaces/user/user";

const initialState: authorizedInterface = {
    email: "",
    token: "",
    photoURL: "/blank-profile-picture.svg",
    displayName: "",
    phoneNumber: "",
    uid: "",
    totalPosts: 0,
    followers: [],
    following: [],
    type: typeStatus.PUBLIC,
    id: "",
    isOnline: false,
};
const logInUserSlice = createSlice({
    name: "currentUser",
    initialState,
    reducers: {
        addCredentials: (state, action: PayloadAction<authorizedInterface>) => {
            return { ...state, ...action.payload };
        },
        addPostsCount: (state, action: PayloadAction<{ totalPosts: number }>) => {
            state = { ...state, totalPosts: action.payload.totalPosts };
            return state;
        },
        addFollowing: (state, action: PayloadAction<string>) => {
            state.following.push(action.payload);
            return state;
        },
        removeFollowing: (state, action: PayloadAction<string>) => {
            state.following = state.following.filter((each) => each != action.payload);
            return state;
        },
        logout: (state) => state = initialState,
    }
});

export default logInUserSlice.reducer;
export const { addCredentials, logout, addPostsCount, addFollowing, removeFollowing } = logInUserSlice.actions;