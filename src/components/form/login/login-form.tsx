"use client";
import { useEffect } from 'react';
import Card from '@mui/material/Card';
import style from './style.module.css';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { authorizedInterface, logInUserInterface, typeStatus } from '@/interfaces/user/user';
import { enqueueSnackbar } from 'notistack';
import { logInUserSchema } from '@/schema/user/user';
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { RootState } from '@/redux/store';
import { addCredentials } from '@/redux/user/currentUser';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from 'next/link';
import Typography from '@mui/material/Typography';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth';
import { auth, provider } from '@/config/firebase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from "js-cookie";
import { ref, get, set, push } from "firebase/database";
import { firestoreDb } from "../../../config/firebase";
import { addDoc, collection, where, query, getDocs, getCountFromServer, updateDoc, doc } from 'firebase/firestore';

const dummyName = (nameSize = 5) => {
    const character = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
    let dummyString = "";
    const totalCharacter = character.length;
    for (let index = 0; index < nameSize; index++) {
        dummyString += character.charAt(Math.floor(Math.random() * totalCharacter) + 0);
    }
    return dummyString;
}

function LoginForm() {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const { handleSubmit, reset, control } = useForm({
        resolver: zodResolver(logInUserSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const isUserValid = (user: logInUserInterface) => {
        const isValid = logInUserSchema.safeParse(user);
        if (isValid.success) {
            return { success: true };
        }
        return { success: false };
    }

    const onSubmit: SubmitHandler<logInUserInterface> = async (data) => {
        data.email = data.email.trim();
        data.password = data.password.trim();
        const isValidCredentials = isUserValid(data);
        if (isValidCredentials.success) {
            const isStored = await handleManualLogin(data);
            if (isStored.success) {
                const token = await getToken();
                if (!token) {
                    enqueueSnackbar("Invalid Credentials");
                    return;
                }

                reset();
                const userDetail: authorizedInterface = {
                    email: isStored.result.user.email!,
                    token: token,
                    photoURL: isStored.result.user.photoURL,
                    phoneNumber: isStored.result.user.phoneNumber,
                    displayName: isStored.result.user.displayName,
                    uid: isStored.result.user.uid,
                    totalPosts: isStored.result.user.totalPosts ?? 0,
                    followers: isStored.result.user.followers,
                    following: isStored.result.user.following,
                    id: isStored.result.user.id,
                    isOnline: true,
                    type: isStored.result.user.type ?? "public",
                };
                fetchUserDetailIfLoggedIn(userDetail).then((result) => {
                    enqueueSnackbar("Login Success");
                    router.push('/dashboard');
                });
            }
            else {
                enqueueSnackbar("Error occured during creating of account");
            }
        }
        else {
            enqueueSnackbar("Credentials you have entered are incorrect");
        }
    };

    const handleManualLogin = async (data: logInUserInterface) => {
        return signInWithEmailAndPassword(auth, data.email, data.password).then((value) => {
            // console.log(value);
            return { success: true, result: value };
        }).catch((error) => {
            // console.log(error);
            enqueueSnackbar(error);
            return { success: false, result: error };
        });
    }

    const handleGoogleLogin = () => {
        signInWithPopup(auth, provider)
            .then(async (result) => {
                console.log(result)
                const token = await getToken();
                if (!token) {
                    enqueueSnackbar("Invalid Credentials");
                    return;
                }

                const userDetail: authorizedInterface = {
                    email: result.user.email!,
                    token: token,
                    photoURL: result.user.photoURL!,
                    phoneNumber: result.user.phoneNumber!,
                    displayName: result.user.displayName! ?? dummyName(),
                    isSignWithGoogle: true,
                    uid: result.user.uid,
                    totalPosts: 0,
                    followers: [],
                    following: [],
                    id: "",
                    isOnline: true,
                    type: typeStatus.PUBLIC,
                };

                const additionalInfo = getAdditionalUserInfo(result);
                dispatch(addCredentials(userDetail));
                if (additionalInfo?.isNewUser) {
                    const result = await addDoc(collection(firestoreDb, "users"), userDetail);
                    userDetail.id = result.id;
                    await updateDoc(doc(firestoreDb, "users", result.id), { ...userDetail });
                    Cookies.set("credentials", JSON.stringify(userDetail), {
                        path: "/",
                        expires: 7,
                        sameSite: "Lax",
                        secure: process.env.NODE_ENV === "production",
                    });
                    enqueueSnackbar("Login Success");
                    router.push('/dashboard');
                }
                else {
                    fetchUserDetailIfLoggedIn(userDetail).then((result) => {
                        enqueueSnackbar("Login Success");
                        router.push('/dashboard');
                    });
                }
            })
            .catch((error) => {
                console.log(error);
                enqueueSnackbar(error.message);
            })
    }

    const fetchUserDetailIfLoggedIn = async (userDetail: authorizedInterface) => {
        try {
            const docRef = query(collection(firestoreDb, "users"), where("uid", "==", userDetail.uid));
            const docSnapshot = await getDocs(docRef);
            if (docSnapshot.docs.length) {
                const userDoc = docSnapshot.docs[0].data();
                userDetail = { ...userDetail, ...userDoc, id: docSnapshot.docs[0].id, isOnline: true };
                // console.log(userDetail,userDoc)
                await updateDoc(doc(firestoreDb, "users", docSnapshot.docs[0].id), { ...userDetail });
                userDetail.photoURL = userDetail.photoURL ?? "/blank-profile-picture.svg";
                // console.log(userDetail,userDoc)
                dispatch(addCredentials(userDetail));
                Cookies.set("credentials", JSON.stringify(userDetail), {
                    path: "/",
                    expires: 7,
                    sameSite: "Lax",
                    secure: process.env.NODE_ENV === "production",
                });
            }
        }
        catch (error) {
            console.log("Error in fetching user details: ", error);
        }
    }

    const getToken = async () => {
        if (auth.currentUser) {
            try {
                const idToken = await auth.currentUser.getIdToken(true);
                return idToken;
            } catch (error) {
                console.error("Error getting token:", error);
            }
        } else {
            console.warn("No user is currently signed in.");
        }
        return null;
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card className={`${style.card} ${style.grid}`}>
                <div className={`${style.text_left}`}>
                    <p className={`${style.blurText}`}>
                        Please Enter your details
                    </p>
                    <Typography>
                        Welcome Back
                    </Typography>
                </div>
                <Controller
                    control={control}
                    name="email"
                    render={({ field, fieldState: { error } }) => {
                        return (<TextField
                            {...field}
                            helperText={error?.message || ""}
                            className={`${style.input} ${style.pY5}`}
                            id={`filled-basic-email`}
                            label="Email Address"
                            variant="outlined"
                            error={!!error}
                        />);
                    }}
                />
                <Controller
                    control={control}
                    name="password"
                    render={({ field, fieldState: { error } }) => {
                        return (<TextField
                            {...field}
                            helperText={error?.message || ""}
                            className={`${style.input} ${style.pY5}`}
                            id={`filled-basic-password`}
                            label="Password"
                            variant="outlined"
                            type="password"
                            error={!!error}
                        />);
                    }}
                />
                <Button type="submit" className={`${style.button} ${style.color_w_background_b}`}>Login</Button>
                <Button onClick={handleGoogleLogin} className={`${style.button}`}>
                    <Image src="/google-favicon.svg" height={30} width={30} alt="google-favicon" className={`${style.mR}`} />
                    Login with Google
                </Button>
                <span className={`${style.blurText}`}>
                    {"Don't have a account?"} <Link href="/register" className={`${style.blueColor} ${style.underline}`}>Sign up</Link>
                </span>
            </Card>
        </form>
    );
}

export default LoginForm;