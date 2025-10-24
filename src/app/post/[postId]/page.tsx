"use client";
import MainPanel from '@/components/dashboard/main/main-panel';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { enqueueSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const Dashboard = ({ params }: { params: Promise<{ postId: string }> }) => {
    const [isLoading, setLoading] = useState<boolean>(true);
    const [postId, setPostId] = useState<string>("");

    const getPostId = async () => {
        try {
            const { postId } = await params;
            setPostId(postId);
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
        getPostId();
    }, []);

    return (
        isLoading ? <CircularProgress size={"3rem"} /> : <MainPanel postId={postId} />
    );
}

export default Dashboard;