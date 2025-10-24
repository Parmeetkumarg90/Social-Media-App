"use client";
import { addCredentials, logout } from '@/redux/user/currentUser';
import { RootState } from '@/redux/store';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import Cookies from 'js-cookie';
import { collection, DocumentData, getDocs, limit, query, QueryDocumentSnapshot, startAfter, where } from "firebase/firestore";
import { useEffect, useRef, useState } from 'react';
import { firestoreDb } from '@/config/firebase';
import { userInterface } from '@/interfaces/user/user';
import Card from "@mui/material/Card";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import Image from 'next/image';
import style from "./style.module.css";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { CircularProgress } from '@mui/material';


const UserList = ({ params }: { params: { id: string } }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isLoading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<userInterface[]>([]);
    const [activeChatUserId, setActiveChatUserId] = useState<string>("");
    const targetRef = useRef<HTMLSpanElement>(null);
    const [lastDocRef, setLastDocRef] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);

    useEffect(() => {
        getReceiverDetail();
        getAllUsers();
    }, []);

    useEffect(() => {
        if (targetRef.current) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && hasMore) {
                        getAllUsers();
                    }
                },
                {
                    root: null,
                    rootMargin: "0px",
                    threshold: 0
                }
            );

            observer.observe(targetRef.current);

            const rect = targetRef.current.getBoundingClientRect();
            if (rect.top <= window.innerHeight && rect.bottom >= 0 && hasMore) {
                getAllUsers();
            }

            return () => {
                if (targetRef.current) {
                    observer.unobserve(targetRef.current);
                }
            }
        }
    }, [lastDocRef, hasMore,targetRef]);

    const getReceiverDetail = async () => {
        try {
            const { id } = await params;
            setActiveChatUserId(id);
        }
        catch (e) {
            enqueueSnackbar("Error in finding profile id");
            router.push("/chat");
        }
    }

    const getAllUsers = async () => {
        try {
            let docRef = lastDocRef ? query(collection(firestoreDb, "users"), startAfter(lastDocRef), limit(10)) : query(collection(firestoreDb, "users"), limit(10));
            const userQuerySnapshot = await getDocs(docRef);
            const userList: userInterface[] = [];

            userQuerySnapshot.forEach(async (doc) => {
                const userData = doc.data();
                if (userData.uid !== loggedInUser.uid) {
                    const user: userInterface = {
                        email: userData.email,
                        photoURL: userData.photoURL,
                        displayName: userData.displayName,
                        uid: userData.uid,
                        id: doc.id,
                        isOnline: userData.isOnline
                    };
                    userList.push(user);
                }
                else {
                    dispatch(addCredentials({ ...loggedInUser, id: doc.id }));
                }
            });
            if (userQuerySnapshot.empty) {
                setHasMore(false);
                setLastDocRef(null);
            }
            else {
                setHasMore(true);
                setLastDocRef(userQuerySnapshot.docs[userQuerySnapshot.docs.length - 1]);
            }
            setUsers([...users, ...userList]);
        }
        catch (e) {
            console.log("Error in fetching posts: ", e);
        }
        finally {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                setLoading(false);
            }, 100);
        }
    }

    const onChatProfileClick = (id: string) => {
        setActiveChatUserId(id);
        router.push(`/chat/${id}`);
    }

    return (
        <Card className={`${style.card} ${style.grid}`}>
            <Typography className={`${style.textYelow} ${style.textCenter} ${style["fontSize1-2"]}`}>All Profiles</Typography>
            {isLoading ? <CircularProgress size={"3rem"} title='Loading Chats' />
                : <>
                    <List className={`${style.placeCenter}`}>
                        {users.map((user) =>
                            <span key={user.uid} ref={targetRef}>
                                <ListItem onClick={() => { onChatProfileClick(user.id); }} className={`${style.listLinkItem} ${activeChatUserId === user.id ? style["active-chat"] : ""}`}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <Image src={user.photoURL ?? "/blank-profile-picture.svg"} fill alt={user.photoURL ?? "/blank-profile-picture.svg"} />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={user.displayName ?? user.email ?? "User"} secondary={<span className={`${user.isOnline ? style.textGreen : style.textRed}`}>{user.isOnline ? "Online" : "Offline"}</span>} />
                                </ListItem>
                            </span>
                        )}
                    </List>
                </>
            }
        </Card>
    )
}

export default UserList;