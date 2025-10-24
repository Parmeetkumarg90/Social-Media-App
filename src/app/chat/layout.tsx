"use client";
import Image from "next/image"
import style from "./style.module.css";
import Card from "@mui/material/Card";
import UserList from "@/components/list/user-list-chat/userList";
import Navbar from "@/components/dashboard/nav-bar/navbar";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";

const ChatLayout = ({ children, params }: Readonly<{
    children: React.ReactNode,
    params: Promise<{ id: string }>
}>) => {
    const [id, setId] = useState<{ id: string } | null>(null);

    useEffect(() => {
        getId();
    }, []);

    const getId = async () => {
        try {
            const param = await params;
            if (param.id) {
                setId(param);
            }
            else {
                redirect("/");
            }
        }
        catch (e) {
            console.log("Invalid id: ", e);
            redirect("/");
        }
    }

    return (
        <Card className={`${style.main_grid}`}>
            <Navbar />
            <Card className={`${style.grid}`}>
                {id &&
                    <>
                        <UserList params={id} />
                        {children}
                    </>
                }
            </Card>
        </Card>
    )
}

export default ChatLayout