"use client";
import Image from "next/image"
import style from "./style.module.css";
import Card from "@mui/material/Card";
import UserList from "@/components/list/user-list-chat/userList";
import Navbar from "@/components/dashboard/nav-bar/navbar";

const ChatLayout = ({ children, params }: Readonly<{
    children: React.ReactNode,
    params: {
        id: string
    }
}>) => {
    return (
        <Card className={`${style.main_grid}`}>
            <Navbar />
            <Card className={`${style.grid}`}>
                <UserList params={params} />
                {children}
            </Card>
        </Card>
    )
}

export default ChatLayout