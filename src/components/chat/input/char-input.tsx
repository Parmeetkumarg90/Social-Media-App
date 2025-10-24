"use client";
import { userInterface } from '@/interfaces/user/user';
import style from "./style.module.css";
import Image from 'next/image';
import { Card } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { chatInputSchema } from '@/schema/chat/chat';
import { commentDbInterface } from '@/interfaces/post/user';
import { chatInputInterface, chatStatusInterface } from '@/interfaces/chat/chat';
import TextField from "@mui/material/TextField";
import { useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { addDoc, and, collection, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { firestoreDb } from '@/config/firebase';
import { useAppSelector } from '@/redux/hook';
import { RootState } from '@/redux/store';
import { notificationType } from '@/interfaces/notification/notification';

const ChatInput = ({ receiverDetail, senderId }: { receiverDetail: userInterface, senderId: string }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const [isTyping, setTyping] = useState<boolean>(false);
    const [isSubmitDisabled, setSubmitDisabled] = useState<boolean>(false);

    const typingStatusObj: chatStatusInterface = {
        senderId,
        receiverId: receiverDetail.id,
        isSenderTyping: false,
        isReceiverTyping: false
    }

    const { control, formState: { errors }, handleSubmit, reset } = useForm({
        resolver: zodResolver(chatInputSchema),
        defaultValues: {
            senderId,
            receiverId: receiverDetail.id,
            text: "",
            time: 0,
        }
    });

    const onSubmit: SubmitHandler<chatInputInterface> = async (data) => {
        if (isSubmitDisabled) {
            enqueueSnackbar("Try to send this previous message");
            return;
        }
        try {
            setSubmitDisabled(true);
            data.time = Date.now();
            const docRef = collection(firestoreDb, "chats");
            addDoc(docRef, data).then((result) => {
                addDoc(collection(firestoreDb, "notification"), {
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    postId: null,
                    notificationText: `${loggedInUser.displayName} sent you a message: ${data.text}`,
                    type: notificationType.CHAT,
                    senderUid: loggedInUser.uid,
                });
                reset();
            }).catch((error) => {
                enqueueSnackbar("Error in sending message", error);
            });
        }
        catch (e) {
            console.log("Error in sending message: ", e);
            enqueueSnackbar("Error in sending message");
        }
        finally {
            setSubmitDisabled(false);
            handleStopTyping();
        }
    }

    const handleStopTyping = async () => {
        try {
            console.log("stop")
            typingStatusObj.isSenderTyping = false;
            const docQuery = query(collection(firestoreDb, "typingStatus"), where("senderId", "==", senderId));
            const docSnapshot = await getDocs(docQuery);
            if (docSnapshot.empty) {
                await addDoc(collection(firestoreDb, "typingStatus"), typingStatusObj);
            }
            else {
                await updateDoc(doc(firestoreDb, "typingStatus", docSnapshot.docs[0].id), { ...typingStatusObj });
            }
            setTyping(false);
        }
        catch (e) {
            console.log("Error in stop typing: ", e);
        }
    }

    const handleStartTyping = async () => {
        try {
            console.log("start")
            typingStatusObj.isSenderTyping = true;
            const docQuery = query(collection(firestoreDb, "typingStatus"), where("senderId", "==", senderId));
            const docSnapshot = await getDocs(docQuery);
            if (docSnapshot.empty) {
                await addDoc(collection(firestoreDb, "typingStatus"), typingStatusObj);
            }
            else {
                await updateDoc(doc(firestoreDb, "typingStatus", docSnapshot.docs[0].id), { ...typingStatusObj });
            }
            setTyping(true);
        }
        catch (e) {
            console.log("Error in start typing: ", e);
        }
    };

    const debounce = (delay = 3000) => {
        if (!isTyping) {
            handleStartTyping();
        }
        let timer;
        return () => {
            clearTimeout(timer!);
            timer = setTimeout(() => {
                handleStopTyping();
            }, delay);
        }
    }

    const handleKeyDown = () => {
        debounce()();
    }

    const router = useRouter();
    return (
        <Card>
            <form className={`${style.card} ${style.grid} ${style.border}`} onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    control={control}
                    name="text"
                    render={({ field, fieldState: { error } }) => (<TextField
                        {...field}
                        multiline
                        className={`${style.input}`}
                        helperText={error?.message ?? ""}
                        id={`filled-basic-text`}
                        label="Enter your message here"
                        variant="outlined"
                        error={!!error}
                        onKeyUp={handleKeyDown}
                    />)
                    }
                />
                <KeyboardArrowRightIcon fontSize='large' className={`${style.pointer}`} onClick={handleSubmit(onSubmit)} />
            </form>
        </Card>
    )
}

export default ChatInput;