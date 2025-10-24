"use client";
import { firestoreDb } from "@/config/firebase";
import { useAppSelector } from "@/redux/hook";
import { RootState } from "@/redux/store";
import { Button } from "@mui/material";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import style from "./style.module.css";
import { notificationType } from "@/interfaces/notification/notification";

const Like = ({ postId, likes, postCreatorId }: { postId: string, likes: string[], postCreatorId: string }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const [isLike, setLike] = useState<boolean>(likes.includes(loggedInUser.uid));
    const [likeCount, setLikeCount] = useState<number>(likes.length);
    const [likeUids, setLikeUids] = useState<string[]>(likes || []);

    const handleLikeChange = async () => {
        const isPresent = likeUids.includes(loggedInUser.uid);
        let newLikes: string[] = [];
        try {
            const docRef = doc(firestoreDb, "posts", postId);
            if (isPresent) {
                newLikes = likeUids.filter((uid) => uid != loggedInUser.uid);
            }
            else {
                newLikes.push(loggedInUser.uid);
                if (loggedInUser.id !== postCreatorId) {
                    await addDoc(collection(firestoreDb, "notification"), {
                        senderId: loggedInUser.id,
                        receiverId: postCreatorId,
                        postId: postId,
                        notificationText: `${loggedInUser.displayName} like your post`,
                        type: notificationType.LIKE,
                        senderUid: loggedInUser.uid,
                    });
                }
            }
            await updateDoc(docRef, { likes: newLikes });
            setLike(!isLike);
        }
        catch (error) {
            console.log("Error in liking post: ", error);
            enqueueSnackbar("Error in changing like state");
        }
        finally {
            setLikeCount(newLikes.length);
            setLikeUids(newLikes);
        }
    }

    return (
        <Button onClick={handleLikeChange} className={`${style.button}`}>
            {isLike ? <FavoriteIcon /> : <FavoriteBorderIcon />}({likeCount})
        </Button>
    )
}

export default Like;