"use client";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import style from "./style.module.css";
import Typography from "@mui/material/Typography";
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { RootState } from '@/redux/store';
import { enqueueSnackbar } from 'notistack';
import { collection, addDoc } from 'firebase/firestore';
import { firestoreDb } from '@/config/firebase';
import { commentDbSchema } from '@/schema/post/post';
import { commentDbInterface } from '@/interfaces/post/user';
import { useState } from 'react';
import { Card, CircularProgress } from '@mui/material';
import { notificationType } from '@/interfaces/notification/notification';


const CommentAddForm = ({ parentId, postId, onCommentSubmit, postCreatorId }:
    { parentId: string | null, postId: string, onCommentSubmit: () => void, postCreatorId: string }
) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const dispatch = useAppDispatch();
    const [isCommenting, setCommenting] = useState<boolean>(false);
    const { control, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm({
        resolver: zodResolver(commentDbSchema),
        defaultValues: {
            //static
            postId,
            displayName: loggedInUser.displayName,
            photoURL: loggedInUser.photoURL,
            authorUID: loggedInUser.uid,
            //dynamic
            parentId: parentId,
            time: Date.now(),
            text: ""
        }
    });

    const onSubmit: SubmitHandler<commentDbInterface> = async (data) => {
        try {
            setCommenting(true);
            const dbRef = collection(firestoreDb, "comments");
            await addDoc(dbRef, data);
            if (loggedInUser.id !== postCreatorId) {
                await addDoc(collection(firestoreDb, "notification"), {
                    senderId: loggedInUser.id,
                    receiverId: postCreatorId,
                    postId: postId,
                    notificationText: `${loggedInUser.displayName} commented on your post`,
                    type: notificationType.COMMENT,
                    senderUid: loggedInUser.uid,
                });
            }
            enqueueSnackbar("Comment created Successfully");
            onCommentSubmit();
        }
        catch (e) {
            console.log("Error in adding comment: ", e);
            enqueueSnackbar("Error in creating comment");
        }
        finally {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                setCommenting(false);
            }, 800);
            reset();
        }
    }

    return (
        <Card>
            <form onSubmit={handleSubmit(onSubmit)} className={`${style.grid} ${style.pX5} ${style.pY5}`}>
                <Typography>{parentId ? "Add your reply" : "Add Comment"}</Typography>
                <Controller
                    control={control}
                    name="text"
                    render={({ field, fieldState: { error } }) => {
                        return (<TextField
                            className={`${style.input} `}
                            {...field}
                            helperText={error?.message || ""}
                            id={`filled-basic-text`}
                            label="Text"
                            variant="outlined"
                            error={!!error}
                        />);
                    }}
                />
                {isCommenting && <CircularProgress size={"3rem"} />}
                <Button type='submit' className={`${style.button}`} disabled={isCommenting}>Submit</Button>
            </form>
        </Card>
    )
}

export default CommentAddForm;