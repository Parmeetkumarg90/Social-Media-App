"use client";
import { persister, RootState } from '@/redux/store';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import Cookies from 'js-cookie';
import style from './style.module.css';
import Card from "@mui/material/Card";
import Image from 'next/image';
import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import Popover from '@mui/material/Popover';
import ProfileEditForm from '@/components/form/edit-form/profile-edit-form';
import { addFollowing, logout, removeFollowing } from '@/redux/user/currentUser';
import { authorizedInterface, typeStatus } from '@/interfaces/user/user';
import { CircularProgress, Typography } from '@mui/material';
import { addDoc, and, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { firestoreDb } from '@/config/firebase';
import { removeAllPosts } from '@/redux/post/user-post';
import FollowerFollowing from '@/components/list/followers-following/follower-following';
import { follow_following_Interface, follow_following_view_Interface, follower_following_action_type, follower_following_type } from '@/interfaces/follower-following-list';
import Alert from "@mui/material/Alert";
import CheckIcon from "@mui/icons-material/Check";
import { notificationType } from '@/interfaces/notification/notification';

const LeftPanel = ({ userUid }: { userUid?: string }) => {
    const [isButtonVisible, setButtonVisible] = useState<boolean>(true);
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const [userDetail, setUserDetail] = useState<authorizedInterface | null>(null);
    const [isFollowing, setFollowing] = useState<follower_following_action_type | null>(null);
    const [isLoading, setLoading] = useState<boolean>(true);
    const [isModalLoading, setModalLoading] = useState<boolean>(false);
    const [profileList, setProfileList] = useState<follow_following_view_Interface>({
        list: [],
        type: follower_following_type.FOLLOWING,
        currentUserUid: "",
    });
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [profileEditPopUp, setProfileEditPopUp] = useState<HTMLElement | null>(null);

    const findAction = () => {
        if (!userDetail?.uid || loggedInUser.uid === userDetail?.uid) {
            return null;
        }
        if (loggedInUser.following.includes(userDetail?.uid)) {
            return follower_following_action_type.UNFOLLOW;
        }
        if (loggedInUser.followers.includes(userDetail?.uid)) {
            return follower_following_action_type.FOLLOW_BACK;
        }
        return follower_following_action_type.FOLLOW;
    };

    useEffect(() => {
        setUserDetail(null);
        setFollowing(null);

        if (userUid && userUid?.trim() !== "" && userUid != loggedInUser.uid) {
            getUserData();
        }
        else {
            setUserDetail(loggedInUser);
            setLoading(false);
        }
    }, [userUid, loggedInUser]);

    useEffect(() => {
        if (userDetail) {
            setFollowing(findAction());
        }
    }, [loggedInUser.following, loggedInUser.followers, userDetail]);

    const getUserData = async () => {
        try {
            setLoading(true);
            const docQuery = query(collection(firestoreDb, "users"), where("uid", "==", userUid));
            const snapshot = await getDocs(docQuery);
            if (snapshot.docs.length) {
                const userData = snapshot.docs[0].data();
                // console.log(userData);
                const userDetails: authorizedInterface = {
                    email: userData.email!,
                    token: userData.token,
                    photoURL: userData.photoURL!,
                    phoneNumber: userData.phoneNumber!,
                    displayName: userData.displayName!,
                    uid: userData.uid,
                    totalPosts: userData.totalPosts,
                    followers: userData.followers,
                    following: userData.following,
                    id: snapshot.docs[0].id,
                    isOnline: userData.isOnline,
                    type: userData.type
                };
                setUserDetail(userDetails);
            }
            
        }
        catch (e) {
            console.log("Error in profile detail fetching: ", e);
            enqueueSnackbar("Error in profile detail fetching");
            router.push("/dashboard");
        }
        finally {
            setLoading(false);
        }
    }

    const handleEditButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setProfileEditPopUp(event.currentTarget);
    }

    const handleCloseEdit = () => {
        setProfileEditPopUp(null);
    }

    const redirectToUrl = (url: string) => {
        router.push(url);
    }

    const handleLogout = async () => {
        await updateDoc(doc(firestoreDb, "users", loggedInUser.id), { isOnline: false });
        redirectToUrl("/");
        Cookies.remove("credentials");
        dispatch(removeAllPosts());
        dispatch(logout());
        enqueueSnackbar("Logout Successfully");
    }

    const handleFollowButtonClick = async (clickedUid: string, task: follower_following_action_type | null, modalType: follower_following_type) => {
        if (!clickedUid || clickedUid === loggedInUser.uid || !task) {
            enqueueSnackbar("Invalid Profile or operation");
            return;
        }
        try {
            let receiverId = profileList.list.find((each) => each.uid === clickedUid)?.id;
            if (clickedUid == userDetail?.uid && userDetail.type === typeStatus.PRIVATE) {
                receiverId = userDetail.id;
            }
            if (receiverId && userDetail?.type === typeStatus.PRIVATE && !userDetail.followers.includes(loggedInUser.uid)) {
                const docRef = await getDocs(query(collection(firestoreDb, "notification"), and(
                    where("senderId", "==", loggedInUser.id),
                    where("receiverId", "==", receiverId),
                    where("senderUid", "==", loggedInUser.uid),
                    where("postId", "==", null),
                    where("notificationText", "==", `${loggedInUser.displayName} requested to follow you.`),
                    where("type", "==", notificationType.REQUEST_TO_FOLLOW),
                )));
                const isNotificationAlredyPresent = docRef.docs.length > 0;

                if (!isNotificationAlredyPresent) {
                    addDoc(collection(firestoreDb, "notification"), {
                        senderId: loggedInUser.id,
                        receiverId: receiverId,
                        senderUid: loggedInUser.uid,
                        postId: null,
                        notificationText: `${loggedInUser.displayName} requested to follow you.`,
                        type: notificationType.REQUEST_TO_FOLLOW,
                    });
                    enqueueSnackbar("Request has been sent to profile user.");
                }
                else {
                    enqueueSnackbar("Request has been already sent");
                }
                setButtonVisible(false);
                return;
            }
            const logInUserUid = loggedInUser.uid;
            const followingQuery = query(collection(firestoreDb, "users"), where("uid", "==", logInUserUid));
            const followingSnapshot = await getDocs(followingQuery);
            const followingDocRef = followingSnapshot.docs[0];
            const followingData = followingDocRef.data();
            if (task !== follower_following_action_type.UNFOLLOW) {
                if (!followingData.following.includes(clickedUid)) {
                    followingData.following.push(clickedUid);
                }
                dispatch(addFollowing(clickedUid));
            } else {
                followingData.following = followingData.following.filter((uid: string) => uid !== clickedUid);
                dispatch(removeFollowing(clickedUid));
            }
            await updateDoc(followingDocRef.ref, { ...followingData });

            const followerQuery = query(collection(firestoreDb, "users"), where("uid", "==", clickedUid));
            const followerSnapshot = await getDocs(followerQuery);
            const followerDocRef = followerSnapshot.docs[0];
            const followerData = followerDocRef.data();
            if (task !== follower_following_action_type.UNFOLLOW) {
                if (!followerData.followers.includes(logInUserUid)) {
                    followerData.followers.push(logInUserUid);
                }
            } else {
                followerData.followers = followerData.followers.filter((uid: string) => uid !== logInUserUid);
            }
            await updateDoc(followerDocRef.ref, { ...followerData });
            if (userDetail && userDetail.uid === clickedUid && modalType === follower_following_type.FOLLOWING) {
                setProfileList({ list: followingData.followers, type: follower_following_type.FOLLOWING, currentUserUid: "" });
                setUserDetail({
                    ...userDetail,
                    followers: followerData.followers,
                });
            }
        } catch (e) {
            console.log("Error in follow/unfollow operation: ", e);
            enqueueSnackbar(`Error in follow/unfollow operation`);
        }
    };

    const handleModalClose = () => {
        setAnchorEl(null);
    }

    const fetchProfileDetail = async (uid: string) => {
        const docQuery = query(collection(firestoreDb, "users"), where("uid", "==", uid));
        const snapshot = await getDocs(docQuery);
        const docRef = snapshot.docs;
        if (docRef.length) {
            const data = docRef[0].data();
            return ({
                uid: data.uid,
                photoURL: data.photoURL,
                displayName: data.displayName,
                email: data.email,
                id: docRef[0].id,
                type: data.type
            });
        }
        return null;
    }

    const handleModalOpen = async (e: React.MouseEvent<HTMLParagraphElement>, type: follower_following_type) => {
        if (!userDetail) {
            return;
        }
        setModalLoading(true);
        setAnchorEl(e.currentTarget);
        try {
            const uidList: string[] = type === follower_following_type.FOLLOWER ? userDetail.followers :
                type === follower_following_type.FOLLOWING ? userDetail.following : [];
            const promises = uidList.map(async (uid) => {
                return await fetchProfileDetail(uid);
            })
            const result = await Promise.all(promises);
            const list: follow_following_Interface[] = result.filter((each) => each !== null);
            const finalList: follow_following_view_Interface = {
                list,
                type,
                currentUserUid: userDetail.uid
            };
            setProfileList(finalList);
        }
        catch (e) {
            console.log("Error in fetching profiles: ", e);
            enqueueSnackbar("Error in fetching profiles");
        }
        finally {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                setModalLoading(false);
            }, 800);
        }
    }

    return (
        userDetail &&
        <Card className={`${style.card} ${style.grid} ${style.textWrap}`}>
            {isLoading ? < CircularProgress size={"3rem"} title='Loading Profile' /> :
                <Card className={`${style.card} ${style.grid} ${style.textWrap} ${style.topElement} ${style.textCenter}`}>
                    <div className={`${style.section1}`}>
                        <span className={`${style.relative} ${style.w_30}`}>
                            <Image src={userDetail.photoURL ?? "/blank-profile-picture.svg"} fill alt={userDetail.photoURL ?? "/blank-profile-picture.svg"} className={`${style.rounded_logo}`} />
                        </span>
                        <div>
                            <p>Total Posts: {userDetail.totalPosts}</p>
                        </div>
                    </div>
                    <div>
                        <p>{userDetail.displayName ?? "Username"}</p>
                        <p>{userDetail.email ?? "email"}</p>
                    </div>
                    {((loggedInUser.uid === userDetail.uid) || (userUid === undefined)) ?
                        <>
                            < Button className={`${style.button}`} onClick={handleEditButtonClick}>Edit Profile</Button>
                            <Popover
                                open={Boolean(profileEditPopUp)}
                                onClose={handleCloseEdit}
                                className={`${style.popover}`}
                            >
                                <ProfileEditForm onClose={handleCloseEdit} />
                            </Popover>
                        </> :
                        (loggedInUser.uid !== userDetail.uid) && isButtonVisible &&
                        <Button className={`${style.button}`}
                            onClick={() => { handleFollowButtonClick(userDetail.uid, isFollowing, follower_following_type.FOLLOWING); }}
                        >
                            {isFollowing?.toUpperCase()}
                        </Button>
                    }
                    {!isButtonVisible && <Alert icon={<CheckIcon fontSize="inherit" />} severity="success" className={`${style.alert}`}>Request sent</Alert>}
                </Card>
            }
            <Card className={`${style.card} ${style.textWrap} ${style.bottomElem} ${style.textCenter}`}>
                <Popover open={!!anchorEl} onClose={handleModalClose}>
                    <FollowerFollowing data={profileList} loading={isModalLoading} handleFollowButtonClick={handleFollowButtonClick} />
                </Popover>
                <Card>
                    <p className={`${style.mY2}`} onClick={(e) => { handleModalOpen(e, follower_following_type.FOLLOWER); }}>
                        Followers: <span className={`${style.linkModal}`}>{userDetail.followers.length}</span>
                    </p>
                    <p className={`${style.mY2}`} onClick={(e) => { handleModalOpen(e, follower_following_type.FOLLOWING); }}>
                        Following: <span className={`${style.linkModal}`}>{userDetail.following.length}</span>
                    </p>
                </Card>
                <Card className={`${style.placeInColumn}`}>
                    <Button className={`${style.button}`} onClick={() => { redirectToUrl("/dashboard"); }}>Feed</Button>
                    <Button className={`${style.button}`} onClick={() => { redirectToUrl(`/profile/${loggedInUser.uid}`); }}>My Posts</Button>
                    <Button className={`${style.button}`} onClick={() => { redirectToUrl(`/visited`); }}>Visited Posts</Button>
                    <Button className={`${style.button}`} onClick={handleLogout}>Logout</Button>
                </Card>
            </Card>
        </Card >
    );
}

export default LeftPanel;