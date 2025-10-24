"use client";
import Image from "next/image"
import style from "./style.module.css";
import Card from "@mui/material/Card";
import UserList from "@/components/list/user-list-chat/userList";

const Chat = () => {
    return (
        <div className={` ${style.relative}`}>
            <Image src="/whatsapp-background.jpeg" fill alt="/whatsapp-background.jpeg" />
        </div>
    )
}

export default Chat;