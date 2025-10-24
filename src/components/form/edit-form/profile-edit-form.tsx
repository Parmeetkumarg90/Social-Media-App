"use client";
import { updateUserSchema } from '@/schema/user/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { authorizedInterface, logInUserInterface, typeStatus, updateUserInterface } from '@/interfaces/user/user';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import style from "./style.module.css";
import { ChangeEvent, useEffect, useState } from 'react';
import Typography from "@mui/material/Typography";
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { RootState } from '@/redux/store';
import { enqueueSnackbar } from 'notistack';
import { cloudinaryUpload } from '@/config/cloudinary';
import { addCredentials } from '@/redux/user/currentUser';
import { collection, where, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestoreDb } from '@/config/firebase';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ProfileEditForm = ({ onClose }: { onClose: () => void }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const [isSameValues, setSameValues] = useState<boolean>(false);
    const dispatch = useAppDispatch();

    const { control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            displayName: loggedInUser.displayName || "",
            phoneNumber: loggedInUser.phoneNumber || "",
            photoURL: null,
            type: loggedInUser.type
        }
    });

    const watchedValues = watch();

    useEffect(() => {
        if (
            watchedValues.displayName !== loggedInUser.displayName ||
            watchedValues.phoneNumber !== loggedInUser.phoneNumber ||
            watchedValues.type !== loggedInUser.type
        ) {
            setSameValues(false);
        }
        else {
            setSameValues(true);
        }
    }, [watchedValues, loggedInUser, isSameValues]);


    const onSubmit: SubmitHandler<updateUserInterface> = async (data) => {
        if (isSameValues) {
            return;
        }

        if (data.photoURL && data.photoURL.size > MAX_FILE_SIZE_BYTES) {
            enqueueSnackbar(data.photoURL.name + " is greater than 10mb.");
            return;
        }
        try {
            let url = null;
            if (data.photoURL) {
                try {
                    url = await cloudinaryUpload(data.photoURL);
                    if (!url) {
                        enqueueSnackbar("Failed to update image");
                        return;
                    }
                }
                catch (e) {
                    console.log("Error in image updation: ", e);
                    enqueueSnackbar("Profile Image Updation failed");
                    return;
                }
            }

            const dbQuery = query(collection(firestoreDb, "users"), where("uid", "==", loggedInUser.uid));
            const docSnapShot = await getDocs(dbQuery);
            if (docSnapShot.docs.length) {
                const userDBData = docSnapShot.docs[0].data();

                const userDbObj: authorizedInterface = {
                    ...loggedInUser,
                    ...userDBData,
                    displayName: data.displayName || loggedInUser.displayName,
                    phoneNumber: data.phoneNumber || loggedInUser.phoneNumber,
                    photoURL: url || loggedInUser.photoURL,
                    type: data.type
                };

                await updateDoc(doc(firestoreDb, "users", docSnapShot.docs[0].id), {
                    displayName: data.displayName || loggedInUser.displayName,
                    phoneNumber: data.phoneNumber || loggedInUser.phoneNumber,
                    photoURL: url || loggedInUser.photoURL,
                    type: data.type
                });

                if (userDBData.totalPosts > 0) {
                    const dbPostQuery = query(collection(firestoreDb, "posts"), where("uid", "==", loggedInUser.uid));
                    const docPostSnapShot = await getDocs(dbPostQuery);
                    docPostSnapShot.docs.forEach(async (each) => {
                        const postData = each.data();
                        await updateDoc(doc(firestoreDb, "posts", each.id), {
                            ...postData,
                            profileStatus: data.type,
                        });
                    });
                }

                dispatch(addCredentials(userDbObj));
                enqueueSnackbar("Profile Updated Successfully");
            }
            else {
                enqueueSnackbar("Error in updating profile, Please Login again");
            }
        }
        catch (e) {
            console.log("Error in profile updation: ", e);
            enqueueSnackbar("Error in profile updation");
        }
        finally {
            onClose();
        }
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setValue("photoURL", e.target.files[0]);
        }
    }

    return (
        <Card>
            <form onSubmit={handleSubmit(onSubmit)} className={`${style.grid}`}>
                <Typography>Welcome, Update Profile</Typography>
                <Controller
                    control={control}
                    name="displayName"
                    render={({ field, fieldState: { error } }) => {
                        return (<TextField
                            {...field}
                            helperText={error?.message || ""}
                            className={`${style.input} ${style.pY5}`}
                            id={`filled-basic-displayName`}
                            label="Display Name"
                            variant="outlined"
                            error={!!error}
                        />);
                    }}
                />
                <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field, fieldState: { error } }) => {
                        return (<TextField
                            {...field}
                            helperText={error?.message || ""}
                            className={`${style.input} ${style.pY5} ${style.no_spinners}`}
                            id={`filled-basic-phoneNumber`}
                            label="Phone Number"
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
                            label="Account Type"
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
                <Controller
                    control={control}
                    name="photoURL"
                    render={({ field, fieldState: { error } }) => {
                        return (
                            <>
                                <input type='file' accept='image/*' name='photoURL' onChange={handleFileChange} />
                                <p className={`${style.redText}`}>
                                    {errors.photoURL && (errors.photoURL.message === "Invalid input" ? "P" : errors.photoURL.message)}
                                </p>
                            </>
                        );
                    }}
                />
                <span>
                    <p className={`${style.redText}`}>
                        {isSameValues ? "Please update your data" : ""}
                    </p>
                    <Button type='submit' className={`${style.button} ${isSameValues && style.disabledButton}`} disabled={isSameValues}>Update Profile</Button>
                </span>
            </form>
        </Card>
    )
}

export default ProfileEditForm;