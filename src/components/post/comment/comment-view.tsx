"use client";
import style from "./style.module.css";
import Card from "@mui/material/Card";
import Image from "next/image";
import CommentAddForm from "@/components/form/comment-form/comment-form";
import { commentDbInterface } from "@/interfaces/post/user";
import { useState } from "react";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";

const CommentView = ({ comments, postId, onCommentSubmit, postCreatorId }: { comments: commentDbInterface[], postId: string, onCommentSubmit: () => void, postCreatorId: string }) => {
    const [replyAddPopUpAnchorEl, setreplyAddPopUpAnchorEl] = useState<HTMLElement | null>(null);

    const handleClosereplyAddPopUpAnchorEl = () => {
        onCommentSubmit();
        setreplyAddPopUpAnchorEl(null);
    }

    const handleAddReply = (event: React.MouseEvent<HTMLButtonElement>) => {
        setreplyAddPopUpAnchorEl(event.currentTarget);
    }

    return (
        <>
            {
                comments.map((comment) =>
                    <Card className={`${style.card} ${style.pX5} ${style.pY5}`
                    } key={comment.thisCommentId} >
                        <div className={`${style.rounded_logo} ${style.placeInRow} ${style.card}`}>
                            {
                                <Image src={comment.photoURL ?? "/blank-profile-picture.svg"} width={50} height={50} alt={comment.photoURL ?? "blank-profile-picture.svg"} className={`${style.rounded_logo}`} />
                            }
                            <p>{comment.displayName ?? "Username"}</p>
                            <p>{comment.time}</p>
                        </div>
                        <div>{comment.text}</div>
                        <Button onClick={handleAddReply}>Reply</Button>
                        <Popover
                            open={Boolean(replyAddPopUpAnchorEl)}
                            anchorEl={replyAddPopUpAnchorEl}
                            onClose={handleClosereplyAddPopUpAnchorEl}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "left"
                            }}
                        >
                            <CommentAddForm parentId={comment.thisCommentId!} postId={postId} onCommentSubmit={handleClosereplyAddPopUpAnchorEl} postCreatorId={postCreatorId} />
                        </Popover>
                        {
                            comment?.replies && <CommentView comments={comment?.replies} postId={postId} onCommentSubmit={handleClosereplyAddPopUpAnchorEl} postCreatorId={postCreatorId} />
                        }
                    </Card >
                )
            }
        </>
    );
}

export default CommentView;