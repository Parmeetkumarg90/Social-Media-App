"use client";
import Image from "next/image"
import style from "./style.module.css";
import Card from "@mui/material/Card";
import UserList from "@/components/list/user-list-chat/userList";
import Navbar from "@/components/dashboard/nav-bar/navbar";
import { useAppSelector } from "@/redux/hook";
import { RootState } from "@/redux/store";

const ChatLayout = ({ children }: Readonly<{ children: React.ReactNode, }>) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);

    return (
        <Card className={`${style.main_grid}`}>
            <Navbar />
            <Card className={`${style.grid}`}>
                <UserList params={{ id: loggedInUser.id }} />
                {children}
            </Card>
        </Card>
    )
}

export default ChatLayout