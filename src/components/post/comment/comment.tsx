"use client";
import { commentDbInterface } from "@/interfaces/post/user";
import { useAppSelector } from "@/redux/hook";
import { RootState } from "@/redux/store";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import CommentAddForm from "@/components/form/comment-form/comment-form";
import Popover from "@mui/material/Popover";
import style from "./style.module.css";
import { CircularProgress } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { collection, where, query, getDocs, orderBy } from "firebase/firestore";
import { firestoreDb } from "@/config/firebase";
import CommentView from "./comment-view";

const Comment = ({ postId, postCreatorId }: { postId: string, postCreatorId: string }) => {
    const [allComment, setAllComment] = useState<commentDbInterface[]>([]);
    const [commentAddPopUpAnchorEl, setcommentAddPopUpAnchorEl] = useState<HTMLElement | null>(null);
    const [isLoading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getComments();
    }, []);

    const getComments = async () => {
        try {
            let comments: commentDbInterface[] = [];
            const commentQuery = query(collection(firestoreDb, "comments"), where("postId", "==", postId));

            const documentSnapshot = await getDocs(commentQuery);

            documentSnapshot.docs.forEach((elem, index) => {
                const obj = elem.data();
                const comment: commentDbInterface = {
                    postId,
                    displayName: obj.displayName,
                    photoURL: obj.photoURL,
                    authorUID: obj.uid,
                    parentId: obj.parentId,
                    time: obj.time,
                    text: obj.text,
                    thisCommentId: elem.id
                };
                comments.push(comment);
            });
            comments.sort((a, b) => Number(b.time) - Number(a.time));

            comments = comments.map((elem) => {
                const now = new Date().getTime();
                const postTime = elem.time;
                const diffMs = now - Number(postTime);

                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                let timeAgo = '';
                if (diffHours < 1) {
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    timeAgo = diffMinutes + " minutes ago";
                } else if (diffHours < 24) {
                    timeAgo = diffHours + " hours ago";
                } else {
                    timeAgo = diffDays + " days ago";
                }
                elem = { ...elem, time: timeAgo };
                return elem;
            });

            setAllComment(buildCommentTree(comments));
        }
        catch (e) {
            console.log("Error in fetching comments: ", e);
            enqueueSnackbar("Error in fetching comments");
        }
        finally {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                setLoading(false);
            }, 500);
            handleClosecommentAddPopUpAnchorEl();
        }
    }

    const buildCommentTree = (comments: commentDbInterface[]) => {
        const map = {} as Record<string, any>;
        const roots: commentDbInterface[] = [];
        comments.forEach((each) => {
            if (each.thisCommentId) {
                map[each.thisCommentId] = { ...each, replies: [] };
            }
        });

        comments.forEach((each) => {
            if (each.parentId) {
                map[each.parentId]?.replies.push(map[each.thisCommentId!]);
            }
            else {
                roots.push(map[each.thisCommentId!]);
            }
        });

        return roots;
    }

    const handleClosecommentAddPopUpAnchorEl = () => {
        setcommentAddPopUpAnchorEl(null);
    }

    const handleAddComment = (event: React.MouseEvent<HTMLButtonElement>) => {
        setcommentAddPopUpAnchorEl(event.currentTarget);
    }

    return (
        <div className={`${style.card}`}>
            {
                isLoading ? <CircularProgress size={"3rem"} title="Loading Comments" /> :
                    <>
                        <Button onClick={handleAddComment}>Add Comment</Button>
                        <Popover
                            open={Boolean(commentAddPopUpAnchorEl)}
                            onClose={handleClosecommentAddPopUpAnchorEl}
                            anchorEl={commentAddPopUpAnchorEl}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left"
                            }}
                        >
                            <CommentAddForm parentId={null} postId={postId} onCommentSubmit={getComments} postCreatorId={postCreatorId} />
                        </Popover>
                        {allComment.length ?
                            <CommentView comments={allComment} postId={postId} onCommentSubmit={getComments} postCreatorId={postCreatorId} />
                            : "No comments"
                        }
                    </>
            }
        </div>
    );
}

export default Comment;