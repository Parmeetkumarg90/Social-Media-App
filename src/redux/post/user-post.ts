import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { postDbGetInterface } from "@/interfaces/post/user";

const initialState: postDbGetInterface[] = [];

const postSlice = createSlice({
    name: "currentUserPost",
    initialState,
    reducers: {
        addUserPosts: (state, action: PayloadAction<postDbGetInterface>) => {
            const isPresent = state.find((each) => each.postId === action.payload.postId);
            if (!isPresent) {
                state.push(action.payload);
                return state;
            }
        },
        removeUserPost: (state, action: PayloadAction<string>) => {
            state = state.filter((each) => each.postId != action.payload);
            return state;
        },
        removeAllPosts: (state) => state = initialState,
    }
});

export default postSlice.reducer;
export const { addUserPosts, removeUserPost, removeAllPosts } = postSlice.actions;