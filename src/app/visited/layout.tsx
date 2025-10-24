"use client";
import style from "./style.module.css";
import Card from "@mui/material/Card";
import LeftPanel from '@/components/dashboard/left/left-panel';
import RightPanel from '@/components/dashboard/right/right-panel';
import Navbar from "@/components/dashboard/nav-bar/navbar";

const Dashboard = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    return (
        <Card className={`${style.main_grid} ${style.card}`}>
            <Navbar />
            <Card className={`${style.card} ${style.grid}`}>
                <LeftPanel />
                {children}
                <RightPanel />
            </Card>
        </Card>
    );
}

export default Dashboard;