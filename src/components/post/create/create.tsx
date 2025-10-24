"use client";
import { RootState } from '@/redux/store';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import Cookies from 'js-cookie';
import Card from '@mui/material/Card';
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
import style from "./style.module.css";
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postCreateDbSchema, postCreateSchema } from '@/schema/post/post';
import Image from 'next/image';
import { postCreateDbInterface, postCreateInterface, postDbGetInterface } from '@/interfaces/post/user';
import Button from "@mui/material/Button";
import ToolTip from "@mui/material/Tooltip";
import AddBoxIcon from '@mui/icons-material/AddBox';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiPicker from "emoji-picker-react";
import Popover from '@mui/material/Popover';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { cloudinaryUpload } from '@/config/cloudinary';
import CircularProgress from "@mui/material/CircularProgress";
import { firestoreDb } from '@/config/firebase';
import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { addUserPosts } from '@/redux/post/user-post';
import { addCredentials } from '@/redux/user/currentUser';
import { authorizedInterface, typeStatus } from '@/interfaces/user/user';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const Create = ({ onPostCreated }: { onPostCreated: (data: postDbGetInterface) => void }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isSubmitAllowed, setSubmitAllowed] = useState<boolean>(true);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);
    const [imagePreviewAnchorEl, setImagePreviewAnchorEl] = useState<HTMLElement | null>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { handleSubmit, reset, control, getValues, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(postCreateSchema),
        defaultValues: {
            text: "",
            images: [],
            type: typeStatus.PUBLIC,
            userId: loggedInUser.id
        }
    });

    useEffect(() => {
        if (!selectedFile) {
            return;
        }
        const newURL = URL.createObjectURL(selectedFile);
        setPreviewURL(newURL);

        return () => URL.revokeObjectURL(newURL);
    }, [selectedFile]);

    const onSubmit: SubmitHandler<postCreateInterface> = async (data) => {
        try {
            setSubmitAllowed(false);
            data.images.forEach((image) => {
                if (image.size > MAX_FILE_SIZE_BYTES) {
                    enqueueSnackbar(image.name + " is greater than 10mb.");
                    setSubmitAllowed(true);
                    return;
                }
            });
            const response: any = await Promise.allSettled(data.images.map((image) => cloudinaryUpload(image)));
            const imageURLs: string[] = response.map((image: any) => image.value);

            const dbPostObject: postCreateDbInterface = {
                text: data.text,
                imageURLs,
                likes: [],
                email: loggedInUser.email,
                uid: loggedInUser.uid,
                time: Date.now(),
                displayName: loggedInUser.displayName,
                photoURL: loggedInUser.photoURL,
                type: data.type,
                isDeleted: false,
                userId: loggedInUser.id,
                profileStatus: loggedInUser.type
            };

            const isPostCreationValid = postCreateDbSchema.safeParse(dbPostObject);
            // console.log(isPostCreationValid, dbPostObject);
            if (isPostCreationValid.success) {
                try {
                    addDoc(collection(firestoreDb, "posts"), isPostCreationValid.data).then(async (result) => {
                        const currentUserPost: postDbGetInterface = {
                            ...dbPostObject,
                            postId: result.id,
                            isDeleted: false,
                            profileStatus: loggedInUser.type
                        }
                        onPostCreated(currentUserPost);
                        dispatch(addUserPosts(currentUserPost));
                        enqueueSnackbar("Post Created Successfully");

                        const docQuery = query(collection(firestoreDb, "users"), where("uid", "==", loggedInUser.uid));
                        const snapshot = await getDocs(docQuery);
                        const userDoc = snapshot.docs[0];
                        const userData = userDoc.data();

                        const userDetail: authorizedInterface = {
                            email: userData.email,
                            token: userData.token,
                            photoURL: userData.photoURL,
                            phoneNumber: userData.phoneNumber,
                            displayName: userData.displayName,
                            uid: userData.uid,
                            totalPosts: userData.totalPosts + 1,
                            followers: userData.followers,
                            following: userData.following,
                            isOnline: userData.isOnline,
                            id: userData.id,
                            type: userData.type,
                        };

                        await updateDoc(userDoc.ref, { ...userDetail });
                        dispatch(addCredentials(userDetail));
                    }).catch((error) => {
                        console.log("Error in post creation: ", error);
                        enqueueSnackbar("Error in post creation: ", error);
                    });
                }
                catch (e) {
                    enqueueSnackbar("Error in post creation due to internal error");
                }
            }
            else {
                enqueueSnackbar("Error in post creation due to missing/invalid details");
            }
        }
        catch (error) {
            console.log("Error in creating post: ", error);
            enqueueSnackbar("Error in post creation");
        }
        finally {
            reset();
            setSubmitAllowed(true);
        }
    }

    const handleFileSelect = () => {
        uploadInputRef.current?.click();
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            const filesArray = Array.from(e.target.files);
            setValue("images", filesArray, { shouldValidate: true });
        }
    }

    const handleEmojiSelect = (event: React.MouseEvent<HTMLButtonElement>) => {
        setEmojiAnchorEl(event.currentTarget);
    }

    const handleImagePreviewPopup = (event: React.MouseEvent<HTMLParagraphElement>, image: File) => {
        setImagePreviewAnchorEl(event.currentTarget);
        setSelectedFile(image);
    }

    const handleEmojiSelected = (emojiObject: any) => {
        const currentText = getValues("text");
        setValue("text", currentText + emojiObject.emoji);
        handleCloseEmojiPicker();
    }

    const handleCloseEmojiPicker = () => {
        setEmojiAnchorEl(null);
    }

    const handleCloseImagePreviewPopUp = () => {
        setImagePreviewAnchorEl(null);
        setSelectedFile(null);
    }

    return (
        <Card className={`${style.card} ${style.mT3}`}>
            <form className={`${style.form} ${style.grid}`} onSubmit={handleSubmit(onSubmit)}>
                <div className={`${style.rounded_logo} ${style.placeInRow}`}>
                    <Image src={loggedInUser.photoURL ?? "/blank-profile-picture.svg"} width={50} height={50} alt={loggedInUser.photoURL ?? "/blank-profile-picture.svg"} className={`${style.rounded_logo}`} />
                    <p>{loggedInUser.displayName ?? "Username"}</p>
                    <Controller
                        control={control}
                        name="text"
                        render={({ field, fieldState: { error } }) => {
                            return (<TextField
                                {...field}
                                multiline
                                helperText={error?.message || ""}
                                className={`${style.input}`}
                                id={`filled-basic-email`}
                                label="Tell me about your friends and thoughts...."
                                variant="outlined"
                                error={!!error}
                            />);
                        }}
                    />
                    <Controller
                        control={control}
                        name="type"
                        render={({ field, fieldState: { error } }) => {
                            return (<Select
                                labelId="filled-basic-type"
                                id="filled-basic-type"
                                className={`${style.select}`}
                                {...field}
                                label="Post Type"
                                error={!!error}
                                onChange={(e) => {
                                    setValue("type", e.target.value);
                                }}
                            >
                                <MenuItem value={typeStatus.PRIVATE}>Private</MenuItem>
                                <MenuItem value={typeStatus.PUBLIC}>Public</MenuItem>
                            </Select>);
                        }}
                    />
                </div>
                <div className={`${style.flex_evenly}`}>
                    <ToolTip title="Upload Images">
                        <Button onClick={handleFileSelect} className={`${style.button}`}>
                            <input
                                type='file'
                                multiple
                                accept='image/*'
                                className={style.hidden}
                                ref={uploadInputRef}
                                onChange={handleFileChange}
                            />
                            <AddBoxIcon />
                        </Button>
                    </ToolTip>
                    <ToolTip title="Emoji">
                        <Button onClick={handleEmojiSelect} className={`${style.button}`}>
                            <EmojiEmotionsIcon />
                        </Button>
                    </ToolTip>
                    <Popover
                        open={Boolean(emojiAnchorEl)}
                        anchorEl={emojiAnchorEl}
                        onClose={handleCloseEmojiPicker}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left"
                        }}
                    >
                        <EmojiPicker onEmojiClick={handleEmojiSelected} />
                    </Popover>
                    <ToolTip title="Post">
                        <Button type='submit' className={`${!isSubmitAllowed && style.disabledButton}`} disabled={!isSubmitAllowed}>
                            Post
                        </Button>
                    </ToolTip>
                </div>
                <p className={`${style.redText}`}>
                    {errors.images && errors.images.message}
                </p>
                {!isSubmitAllowed && <CircularProgress size="3rem" />}
                Files:
                <span className={`${style.imageList}`}>
                    {getValues("images").length > 0 &&
                        getValues("images").map((image) => {
                            return (<p key={image.name} className={`${style.linkModal}`} onClick={(e: React.MouseEvent<HTMLParagraphElement>) => { handleImagePreviewPopup(e, image); }}>
                                {image.name}
                            </p>);
                        })
                    }
                    <Popover
                        open={Boolean(imagePreviewAnchorEl)}
                        anchorEl={imagePreviewAnchorEl}
                        onClose={handleCloseImagePreviewPopUp}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "center"
                        }}
                    >
                        {previewURL && <Image src={previewURL} alt={previewURL} width={600} height={400} />}
                    </Popover>
                </span>
            </form>
        </Card>
    )
}

export default Create;