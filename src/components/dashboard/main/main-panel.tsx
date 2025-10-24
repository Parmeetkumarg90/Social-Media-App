"use client";
import { RootState } from '@/redux/store';
import { useAppDispatch, useAppSelector } from '@/redux/hook';
import { redirect, useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import Cookies from 'js-cookie';
import Create from '../../post//create/create';
import style from "./style.module.css";
import Card from "@mui/material/Card";
import PostItem from '@/components/post/post-view/post-view';
import { useCallback, useEffect, useRef, useState } from 'react';
import { commentDbInterface, postDbGetInterface } from '@/interfaces/post/user';
import { collection, getDocs, where, query, limit, startAfter, QueryDocumentSnapshot, DocumentData, doc, and, or, getDoc, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';
import { firestoreDb } from '@/config/firebase';
import CircularProgress from '@mui/material/CircularProgress';
import { addPostsCount } from '@/redux/user/currentUser';
import { addUserPosts, removeUserPost } from '@/redux/post/user-post';
import { authorizedInterface, typeStatus } from '@/interfaces/user/user';
import { postCreateDbSchema } from '@/schema/post/post';

const MainPanel = ({ userUid, isVisitedPage, postId }: { userUid?: string, isVisitedPage?: boolean, postId?: string }) => {
    const loggedInUser = useAppSelector((state: RootState) => state.currentUser);
    const [currentProfileDetail, setcurrentProfileDetail] = useState<authorizedInterface | null>(null);
    const dispatch = useAppDispatch();
    const [isLoading, setLoading] = useState<boolean>(true);
    const [posts, setPosts] = useState<postDbGetInterface[]>([]);
    const targetRef = useRef<HTMLSpanElement>(null);
    const [lastDocRef, setLastDocRef] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
    const [likedLastDocRef, setLikedLastDocRef] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
    const [commentLastDocRef, setCommentLastDocRef] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [likedHasMore, setLikedHasMore] = useState<boolean>(true);
    const [commentHasMore, setCommentHasMore] = useState<boolean>(true);

    useEffect(() => {
        if (postId) {
            getPost(postId);
        }
        else if (isVisitedPage) {
            getVisitedPosts();
        }
        else {
            initialFetch();
        }
    }, []);

    useEffect(() => {
        if (isVisitedPage) {
            getVisitedPosts();
        }
        else {
            getAllPosts();
        }
    }, [currentProfileDetail]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && (hasMore || likedHasMore || commentHasMore)) {
                    if (isVisitedPage) {
                        getVisitedPosts();
                    }
                    else {
                        getAllPosts();
                    }
                }
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 1,
            }
        );
        if (targetRef.current) {
            observer.observe(targetRef.current);
        }
        return () => {
            if (targetRef.current) {
                observer.unobserve(targetRef.current);
            }
        };
    }, [lastDocRef, targetRef, likedLastDocRef, commentLastDocRef]);

    const initialFetch = async () => {
        if (userUid && userUid.trim() != loggedInUser.uid) {
            const docQuery = query(collection(firestoreDb, "users"), where("uid", "==", userUid));
            const profileSnapshot = await getDocs(docQuery);
            const profileDocRef = profileSnapshot.docs[0];
            if (profileDocRef.exists()) {
                const profileData = profileDocRef.data();
                setcurrentProfileDetail({
                    email: profileData.email!,
                    token: profileData.token,
                    photoURL: profileData.photoURL!,
                    phoneNumber: profileData.phoneNumber!,
                    displayName: profileData.displayName!,
                    uid: profileData.uid,
                    totalPosts: profileData.totalPosts,
                    followers: profileData.followers,
                    following: profileData.following,
                    id: profileData.id,
                    isOnline: profileData.isOnline,
                    type: profileData.type
                });
            }
        }
    }

    const getPost = async (postId: string) => {
        const docSnapshot = await getDoc(doc(firestoreDb, "posts", postId));
        if (docSnapshot.exists()) {
            const postData = docSnapshot.data();

            const post: postDbGetInterface = {
                postId: docSnapshot.id,
                email: postData?.email,
                text: postData?.text,
                imageURLs: postData?.imageURLs,
                likes: postData?.likes,
                uid: postData?.uid,
                time: postData?.time,
                displayName: postData?.displayName,
                photoURL: postData?.photoURL ?? "/blank-profile-picture.svg",
                type: postData?.type,
                isDeleted: postData?.isDeleted,
                status: "Commented",
                profileStatus: postData?.profileStatus,
                userId: postData.userId
            };
            if (post.uid !== loggedInUser.uid && post.profileStatus === typeStatus.PRIVATE) {
                post.status = "Profile privated";
            }
            else if (post.uid !== loggedInUser.uid && post.type === typeStatus.PRIVATE) {
                post.status = "Post privated";
            }
            else if (post.isDeleted) {
                post.status = "Deleted";
            }
            setPosts([post]);
        }
        else {
            enqueueSnackbar("Invalid post");
            redirect("/");
        }
    }

    const getVisitedPosts = async () => {
        try {
            const [likePosts, commentPosts] = await Promise.all([getLikedPosts(), getCommentedPost()]);
            const uniqueList: postDbGetInterface[] = getUniqueList([...likePosts, ...commentPosts]);

            setPosts(uniqueList.map(each => {
                if (each.uid !== loggedInUser.uid && each.profileStatus === typeStatus.PRIVATE) {
                    each.status = "Profile privated";
                }
                else if (each.uid !== loggedInUser.uid && each.type === typeStatus.PRIVATE) {
                    each.status = "Post privated";
                }
                else if (each.isDeleted) {
                    each.status = "Deleted";
                }
                return each;
            }));
        }
        catch (e) {
            console.log("Error in fetching posts: ", e);
        }
        finally {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                setLoading(false);
            }, 100);
        }
    }

    const getUniqueList = (list: postDbGetInterface[]) => {
        return list.filter((each, index, self) => index === self.findIndex(val => val.postId === each.postId && val.uid === each.uid));
    }

    const getCommentedPost = async () => {
        try {
            const commentDocRef = !commentLastDocRef ?
                query(collection(firestoreDb, "comments"), where("authorUID", "==", loggedInUser.uid), limit(5)) :
                query(collection(firestoreDb, "comments"), where("authorUID", "==", loggedInUser.uid), startAfter(commentLastDocRef), limit(5));

            if (!commentDocRef) {
                setCommentHasMore(false);
                setCommentLastDocRef(null);
                return [];
            }
            const commentQuerySnapshot = await getDocs(commentDocRef);
            const comments: commentDbInterface[] = processCommentQueryData(commentQuerySnapshot);
            const newPosts = await Promise.all(
                comments.map(async (eachComment) => {
                    const docQuery = doc(firestoreDb, "posts", eachComment.postId);
                    const docRef = await getDoc(docQuery);
                    if (docRef.exists()) {
                        return processPostDocData(docRef);
                    }
                    return null;
                })
            );
            const finalList = newPosts.filter((each) => each !== null);
            if (commentQuerySnapshot.empty) {
                setCommentHasMore(false);
                setCommentLastDocRef(null);
            }
            else {
                setCommentHasMore(true);
                setCommentLastDocRef(commentQuerySnapshot.docs[commentQuerySnapshot.docs.length - 1]);
            }
            return finalList;
        }
        catch (e) {
            console.log("Error in fetching commented posts: ", e);
            return [];
        }
    }

    const getLikedPosts = async () => {
        try {
            const likeDocRef = !likedLastDocRef ?
                query(collection(firestoreDb, "posts"), where("likes", "array-contains", loggedInUser.uid), limit(5)) :
                query(collection(firestoreDb, "posts"), where("likes", "array-contains", loggedInUser.uid), startAfter(likedLastDocRef), limit(5));

            if (!likeDocRef) {
                setLikedHasMore(false);
                setLikedLastDocRef(null);
                return [];
            }
            const postQuerySnapshot = await getDocs(likeDocRef);
            if (postQuerySnapshot.empty) {
                setLikedHasMore(false);
                setLikedLastDocRef(null);
            }
            else {
                setLikedHasMore(true);
                setLikedLastDocRef(postQuerySnapshot.docs[postQuerySnapshot.docs.length - 1]);
            }
            console.log(postQuerySnapshot.docs.length)
            return processPostQueryData(postQuerySnapshot);
        }
        catch (e) {
            console.log("Error in fetching liked posts: ", e);
            return [];
        }
    }

    const getAllPosts = async () => {
        try {
            let docRef;
            // my posts/profile
            if (userUid === loggedInUser.uid) {
                docRef = !lastDocRef ?
                    query(collection(firestoreDb, "posts"), and(where("isDeleted", "==", false), where("uid", "==", loggedInUser.uid)), limit(5)) :
                    query(collection(firestoreDb, "posts"),
                        and(where("isDeleted", "==", false), where("uid", "==", loggedInUser.uid)),
                        startAfter(lastDocRef), limit(5)
                    );
            }
            // another user profile
            else if (currentProfileDetail && currentProfileDetail.uid != loggedInUser.uid) {
                if (currentProfileDetail.type === typeStatus.PUBLIC) {
                    docRef = !lastDocRef ?
                        query(collection(firestoreDb, "posts"), and(where("uid", "==", currentProfileDetail.uid), where("type", "==", typeStatus.PUBLIC), where("isDeleted", "==", false)), limit(5)) :
                        query(collection(firestoreDb, "posts"), and(where("uid", "==", currentProfileDetail.uid), where("type", "==", typeStatus.PUBLIC), where("isDeleted", "==", false)), startAfter(lastDocRef), limit(5));
                }
                else {
                    if (currentProfileDetail.followers.includes(loggedInUser.uid)) {
                        docRef = !lastDocRef ?
                            query(collection(firestoreDb, "posts"), where("uid", "==", currentProfileDetail.uid), limit(5)) :
                            query(collection(firestoreDb, "posts"), where("uid", "==", currentProfileDetail.uid), startAfter(lastDocRef), limit(5));
                    }
                    else {
                        docRef = null;
                    }
                }
            }
            // homepage
            else {
                if (loggedInUser.following.length) {
                    docRef = !lastDocRef ?
                        query(collection(firestoreDb, "posts"), and(
                            or(
                                where("uid", "in", [...loggedInUser.following]),
                                where("type", "==", typeStatus.PUBLIC),
                                where("uid", "==", loggedInUser.uid),
                            ),
                            where("isDeleted", "==", false)
                        ), limit(5)) :
                        query(collection(firestoreDb, "posts"), and(
                            or(
                                where("uid", "in", [...loggedInUser.following]),
                                where("type", "==", typeStatus.PUBLIC),
                                where("uid", "==", loggedInUser.uid),
                            ),
                            where("isDeleted", "==", false)
                        ), startAfter(lastDocRef), limit(5));
                }
                else {
                    docRef = !lastDocRef ?
                        query(collection(firestoreDb, "posts"), and(
                            or(
                                where("type", "==", typeStatus.PUBLIC),
                                where("uid", "==", loggedInUser.uid),
                            ),
                            where("isDeleted", "==", false)
                        ), limit(5)) :
                        query(collection(firestoreDb, "posts"), and(
                            or(
                                where("type", "==", typeStatus.PUBLIC),
                                where("uid", "==", loggedInUser.uid),
                            ),
                            where("isDeleted", "==", false)
                        ), startAfter(lastDocRef), limit(5));
                }
            }
            if (!docRef) {
                setHasMore(false);
                setLastDocRef(null);
                return;
            }
            const postQuerySnapshot = await getDocs(docRef);
            const processedPosts = [...posts, ...processPostQueryData(postQuerySnapshot)].sort((a, b) => a.likes.length - b.likes.length);
            const statusAddedPosts = processedPosts.map((each => {
                if (each.uid !== loggedInUser.uid && each.profileStatus === typeStatus.PRIVATE) {
                    each.status = "Profile privated";
                }
                else if (each.uid !== loggedInUser.uid && each.type === typeStatus.PRIVATE) {
                    each.status = "Post privated";
                }
                else if (each.isDeleted) {
                    each.status = "Deleted";
                }
                return each;
            }));
            setPosts(statusAddedPosts);
            if (postQuerySnapshot.empty) {
                setHasMore(false);
                setLastDocRef(null);
            }
            else {
                setHasMore(true);
                setLastDocRef(postQuerySnapshot.docs[postQuerySnapshot.docs.length - 1]);
            }
        }
        catch (e) {
            console.log("Error in fetching posts: ", e);
        }
        finally {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                setLoading(false);
            }, 100);
        }
    }

    const addNewPost = (newPost: postDbGetInterface) => {
        setPosts([newPost, ...posts]);
    }

    const removePost = (postId: string) => {
        setPosts(posts.filter(each => each.postId !== postId));
    }

    const editPost = (postId: string, type: typeStatus) => {
        const newPosts = posts.map(each => {
            if (each.postId === postId) {
                return { ...each, type: type };
            }
            return each;
        });
        setPosts(newPosts);
    }

    const processPostDocData = (doc: DocumentSnapshot<DocumentData, DocumentData>) => {
        const postData = doc.data();
        const post: postDbGetInterface = {
            postId: doc.id,
            email: postData?.email,
            text: postData?.text,
            imageURLs: postData?.imageURLs,
            likes: postData?.likes,
            uid: postData?.uid,
            time: postData?.time,
            displayName: postData?.displayName,
            photoURL: postData?.photoURL ?? "/blank-profile-picture.svg",
            type: postData?.type,
            isDeleted: postData?.isDeleted,
            status: "Commented",
            profileStatus: postData?.profileStatus,
            userId: postData?.userId
        };
        if (loggedInUser.uid === postData?.uid) {
            post.displayName = postData.displayName;
            post.photoURL = postData.photoURL;
            dispatch(addUserPosts(post));
        }
        return post;
    }

    const processCommentQueryData = (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        const commentList: commentDbInterface[] = [];
        snapshot.forEach((doc) => {
            const commentData = doc.data();
            if (doc.exists()) {
                const comment: commentDbInterface = {
                    authorUID: commentData.authorUID,
                    displayName: commentData.displayName,
                    parentId: commentData.parentId,
                    photoURL: commentData.photoURL,
                    postId: commentData.postId,
                    text: commentData.text,
                    time: commentData.time,
                };
                commentList.push(comment);
            }
        });
        return commentList;
    }

    const processPostQueryData = (snapshot: QuerySnapshot<DocumentData, DocumentData>) => {
        const postList: postDbGetInterface[] = [];
        snapshot.forEach((doc) => {
            if (doc.exists()) {
                const postData = doc.data();
                const post: postDbGetInterface = {
                    postId: doc.id,
                    email: postData.email,
                    text: postData.text,
                    imageURLs: postData.imageURLs,
                    likes: postData.likes,
                    uid: postData.uid,
                    time: postData.time,
                    displayName: postData.displayName,
                    photoURL: postData.photoURL,
                    type: postData.type,
                    isDeleted: postData.isDeleted,
                    profileStatus: postData.profileStatus,
                    userId: postData?.userId
                };
                if (postData.likes.includes(loggedInUser.uid)) {
                    post.status = "Liked";
                }
                if (loggedInUser.uid === postData.uid) {
                    post.displayName = postData.displayName;
                    post.photoURL = postData.photoURL;
                    dispatch(addUserPosts(post));
                }
                if (post) {
                    postList.push(post);
                }
            }
        });
        return postList;
    }

    return (
        <Card className={`${style.card} ${style.grid}`}>
            {((userUid === undefined) || (userUid === loggedInUser.uid)) ? <Create onPostCreated={addNewPost} /> : <span></span>}
            <Card className={`${style.card} ${style.overflow_scroll} ${style.mT3}`}>
                {
                    isLoading ? <CircularProgress size={"3rem"} title='Loading Post' className={`${style.marginAuto}`} /> :
                        posts.length > 0 ? posts.map((eachDoc, index) =>
                            <span key={index} ref={posts.length - 1 === index ? targetRef : null}>
                                <PostItem post={eachDoc} loading={isLoading} removePost={removePost} modifyPost={editPost}
                                    canDelete={userUid === loggedInUser.uid} canEdit={userUid === loggedInUser.uid}
                                />
                            </span>
                        )
                            : <></>
                }
                {!hasMore && "No more post to load....."}
            </Card>
        </Card>
    )
}

export default MainPanel;