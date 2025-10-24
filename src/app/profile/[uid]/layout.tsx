"use client";
import style from "./style.module.css";
import Card from "@mui/material/Card";
import LeftPanel from '@/components/dashboard/left/left-panel';
import MainPanel from '@/components/dashboard/main/main-panel';
import RightPanel from '@/components/dashboard/right/right-panel';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { enqueueSnackbar } from "notistack";
import { CircularProgress } from "@mui/material";
import Navbar from "@/components/dashboard/nav-bar/navbar";

const Dashboard = ({ children, params }: Readonly<{ children: React.ReactNode, params: { uid: string } }>) => {
    const [isLoading, setLoading] = useState<boolean>(true);
    const [userUid, setUserUid] = useState<string>("");

    const getUserUid = async () => {
        try {
            const { uid } = await params;
            setUserUid(uid);
        }
        catch (e) {
            console.log("Error in loading profile: ", e);
            enqueueSnackbar("Error in profile loading");
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getUserUid();
    }, []);

    return (
        <Card className={`${style.main_grid} ${style.card}`}>
            <Navbar />
            {isLoading ? <CircularProgress size={"3rem"} /> : <Card className={`${style.card} ${style.grid}`}>
                <LeftPanel userUid={userUid} />
                {children}
                <RightPanel />
            </Card>}
        </Card>
    );
}

export default Dashboard;