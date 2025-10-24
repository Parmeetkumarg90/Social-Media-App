"use client";
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Link from "next/link";
import { useState, useEffect } from "react";
import { and, arrayUnion, collection, deleteDoc, doc, DocumentData, getDocs, onSnapshot, query, QuerySnapshot, updateDoc, where } from 'firebase/firestore';
import { firestoreDb } from '@/config/firebase';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { RootState } from '@/redux/store';
import { notificationInterface, notificationType } from '@/interfaces/notification/notification';
import Dialog from "@mui/material/Dialog";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CommentIcon from '@mui/icons-material/Comment';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt';
import DoneIcon from '@mui/icons-material/Done';
import ClearIcon from '@mui/icons-material/Clear';
import style from "./style.module.css";
import CircularProgress from "@mui/material/CircularProgress";
import { redirect } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import { addCredentials, addFollowing } from '@/redux/user/currentUser';

export default function PrimarySearchAppBar() {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [allNotification, setAllNotification] = useState<notificationInterface[]>([]);
    const [isLoading, setLoading] = useState<boolean>(false);
    const [anchorEL, setAnchorEL] = useState<HTMLElement | null>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const unSubscribeNotification = onSnapshot(query(collection(firestoreDb, "notification"), where("receiverId", "==", loggedInUser.id)), async (snapshot) => {
            try {
                setLoading(true);
                const notifications = processSnapshot(snapshot);
                setNotificationCount(notifications.length);
                setAllNotification(notifications);
            }
            catch (e) {
                console.log("Error in notification fetching: ", e);
            }
            finally {
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    setLoading(false);
                }, 800);
            }
        });

        return () => {
            unSubscribeNotification();
        }
    }, []);

    const processSnapshot = (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        const list: notificationInterface[] = [];
        snapshot.docs.forEach((each) => {
            const data = each.data();
            list.push({
                senderId: data.senderId,
                receiverId: data.receiverId,
                notificationText: data.notificationText,
                postId: data.postId,
                type: data.type,
                id: each.id,
                senderUid: data.senderUid,
            });
        });
        return uniqueList([...list, ...allNotification]);
    }

    const uniqueList = (list: notificationInterface[]) => {
        return list.filter((notification, index, self) => index === self.findIndex(each =>
            each.postId === notification.postId &&
            each.notificationText === notification.notificationText &&
            each.senderId === notification.senderId &&
            each.receiverId === notification.receiverId &&
            each.type === notification.type &&
            each.senderUid === notification.senderUid
        ));
    }

    const handleNotificationModal = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEL(e.currentTarget);
    }

    const handleDialogClose = () => {
        setAnchorEL(null);
    }

    const removeNotification = async (id: string) => {
        try {
            await deleteDoc(doc(firestoreDb, "notification", id));
            setAllNotification(allNotification.filter((each) => each.id != id));
        }
        catch (e) {
            console.log("Error in rejecting profile: ", e);
            enqueueSnackbar("Unable to reject this request this time");
        }
    }

    const handleAddToFollower = async (notification: notificationInterface) => {
        try {
            if (loggedInUser.followers.includes(notification.senderUid)) {
                enqueueSnackbar("Already in your follower list");
                return;
            }
            // add to my follower list
            const follwerList = [...loggedInUser.followers, notification.senderId];
            dispatch(addCredentials({ ...loggedInUser, followers: follwerList }));
            await updateDoc(doc(firestoreDb, "users", loggedInUser.id), {
                follwer: arrayUnion(notification.senderUid),
            });

            // add to his following list 
            await updateDoc(doc(firestoreDb, "users", notification.senderId), {
                following: arrayUnion(loggedInUser.uid),
            });

            enqueueSnackbar("User now follows you");
            removeNotification(notification.id!);
        }
        catch (e) {
            console.log("Error in adding follower: ", e);
            enqueueSnackbar("Error in adding user to following list");
        }
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Link href={"/"}>
                        <Typography variant="h6" noWrap component="div">Hive Connector</Typography>
                    </Link>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box>
                        <IconButton
                            size="large"
                            aria-label={`show ${notificationCount} new notifications`}
                            color="inherit"
                            onClick={handleNotificationModal}
                        >
                            <Badge badgeContent={notificationCount} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Dialog open={!!anchorEL} onClose={handleDialogClose} className={`${style.dialog}`} PaperProps={{
                sx: {
                    minWidth: "50%",
                    maxWidth: "fit-content",
                    padding: "1% 0"
                }
            }}>
                <Typography className={`${style.header} ${style.yellowText}`}>Notifications</Typography>
                {isLoading ? <CircularProgress size={"3rem"} /> :
                    <List className={`${style.list}`}>
                        {
                            allNotification.map((value) => (
                                <ListItem
                                    key={value.id}
                                    className={`${style.listItem}`}
                                    secondaryAction={
                                        <>
                                            <IconButton>
                                                {value.type === notificationType.COMMENT && <CommentIcon onClick={() => {
                                                    removeNotification(value.id!);
                                                    if (value.postId) {
                                                        redirect(`/post/${value.postId}`);
                                                    }
                                                    else {
                                                        enqueueSnackbar("Invalid Post to view");
                                                    }
                                                }} className={`${style.iconButton}`} />}
                                                {value.type === notificationType.LIKE && <ThumbUpAltIcon onClick={() => {
                                                    removeNotification(value.id!);
                                                    if (value.postId) {
                                                        redirect(`/post/${value.postId}`);
                                                    }
                                                    else {
                                                        enqueueSnackbar("Invalid Post to view");
                                                    }
                                                }} className={`${style.iconButton}`} />}
                                                {value.type === notificationType.CHAT &&
                                                    <MarkUnreadChatAltIcon onClick={() => {
                                                        removeNotification(value.id!);
                                                        redirect(`/chat/${value.senderId}`);
                                                    }}
                                                        className={`${style.iconButton}`}
                                                    />
                                                }
                                                {value.type === notificationType.REQUEST_TO_FOLLOW &&
                                                    <DoneIcon
                                                        onClick={() => { handleAddToFollower(value); }}
                                                        className={`${style.iconButton}`}
                                                    />
                                                }
                                            </IconButton>
                                            <IconButton>
                                                {value.type === notificationType.REQUEST_TO_FOLLOW &&
                                                    <ClearIcon
                                                        onClick={() => { removeNotification(value.id!); }}
                                                        className={`${style.iconButton}`}
                                                    />
                                                }
                                            </IconButton>
                                        </>
                                    }
                                >
                                    <ListItemText primary={`${value.notificationText}`} />
                                </ListItem>
                            ))
                        }
                    </List>
                }
            </Dialog>
        </Box>
    );
}