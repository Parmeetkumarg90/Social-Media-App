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

const RightPanel = () => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isLoading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<userInterface[]>([]);
    const targetRef = useRef<HTMLSpanElement>(null);
    const [lastDocRef, setLastDocRef] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);

    useEffect(() => {
        getAllUsers();
    }, []);

    useEffect(() => {
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

        if (targetRef.current) {
            observer.observe(targetRef.current);
        }
        return () => {
            if (targetRef.current) {
                observer.unobserve(targetRef.current);
            }
        }
    }, [lastDocRef]);

    const getAllUsers = async () => {
        try {
            let docRef = lastDocRef ? query(collection(firestoreDb, "users"), startAfter(lastDocRef), limit(5)) : query(collection(firestoreDb, "users"), limit(5));
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

    return (
        <Card className={`${style.card} ${style.grid}`}>
            {isLoading ? <CircularProgress size={"3rem"} title='Loading Chats' />
                : <>
                    <Typography className={`${style.textYelow} ${style.textCenter} ${style["fontSize1-2"]}`}>Recent Chats</Typography>
                    <List className={`${style.placeCenter}`}>
                        {users.map((user) =>
                            <span key={user.uid} ref={targetRef}>
                                <ListItem onClick={() => { router.push(`/chat/${user.id}`); }} className={`${style.listLinkItem}`}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <Image src={user.photoURL ?? "/blank-profile-picture.svg"} fill alt={user.photoURL ?? "/blank-profile-picture.svg"} />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={user.displayName ?? user.email ?? "User"} secondary={<span className={`${user.isOnline ? style.textGreen : style.textRed}`}>{user.isOnline ? "Online" : "Offline"}</span>} />
                                </ListItem>
                            </span>
                        )}
                        <Button onClick={() => { router.push(`/chat`); }}>Browser All</Button>
                    </List>
                </>
            }
        </Card>
    );
}

export default RightPanel;