"use client";
import MainPanel from '@/components/dashboard/main/main-panel';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const Dashboard = ({ params }: { params: { uid: string } }) => {
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
        isLoading ? <CircularProgress size={"3rem"} /> : <MainPanel userUid={userUid} />
    );
}

export default Dashboard;