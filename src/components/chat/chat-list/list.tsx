"use client";
import { firestoreDb } from '@/config/firebase';
import { chatInputInterface, chatStatusInterface } from '@/interfaces/chat/chat';
import { userInterface } from '@/interfaces/user/user';
import Card from '@mui/material/Card';
import ListItem from "@mui/material/ListItem"
import { and, collection, doc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import style from "./style.module.css";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import Image from 'next/image';
import { useAppSelector } from '@/redux/hook';
import { RootState } from '@/redux/store';

const ChatList = ({ receiverDetail, senderId, loading, isTyping, allMessage }: { receiverDetail: userInterface, senderId: string, loading?: boolean, isTyping?: boolean, allMessage: chatInputInterface[] }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);

    return (
        <Card className={`${style.card} ${style.flex} ${style.flexCol}`}>
            {
                loading ? "Loading" :
                    <>
                        {
                            allMessage.length ? allMessage.map((message) => (
                                <span key={message.time + Math.random()}
                                    className={`${style.flex} ${style.flexRow} ${message.senderId === senderId ? style.flexRight : ""}`}
                                >
                                    <ListItemAvatar>
                                        <Avatar>
                                            <Image src={(senderId === message.senderId ? loggedInUser.photoURL : receiverDetail.photoURL) ?? "/blank-profile-picture.svg"} fill alt={receiverDetail.photoURL ?? "blank-profile-picture.svg"} className={`${style.rounded_logo} ${style.relative}`} />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={message.text} secondary={new Date(message.time).toLocaleString()} className={`${style.flexRow}  ${message.senderId === senderId ? style.textRight : ""} ${style.mX2}`} />
                                </span>
                            ))
                                : "No messages yet..."
                        }
                    </>
            }
            {isTyping &&
                <span className={`${style.flex} ${style.flexRow}`}
                >
                    <ListItemAvatar>
                        <Avatar>
                            <Image src={(receiverDetail.photoURL) ?? "/blank-profile-picture.svg"} fill alt={receiverDetail.photoURL ?? "blank-profile-picture.svg"} className={`${style.rounded_logo} ${style.relative}`} />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={`${receiverDetail.displayName ?? receiverDetail.email ?? "User"} is typing`} secondary={new Date(Date.now()).toLocaleString()} className={`${style.flexRow} ${style.mX2}`} />
                </span>
            }
        </Card>
    )
}

export default ChatList;