import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { logInUserInterface } from "@/interfaces/user/user";

const initialState: logInUserInterface[] = [];

const usersSlice = createSlice({
    name: "users",
    initialState,
    reducers: {
        addNewUser: (state, action: PayloadAction<logInUserInterface>) => {
            if (!action.payload.isSignWithGoogle) {
                state.push(action.payload);
            }
            else {
                const newState = [action.payload, ...state];
                state = newState.filter((each, index, self) => index === self.findIndex(elem => each.email === elem.email));
                return state;
            }
        },
    }
});

export default usersSlice.reducer;
export const { addNewUser } = usersSlice.actions;