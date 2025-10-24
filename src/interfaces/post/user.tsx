import { typeStatus } from "../user/user";

interface postCreateInterface {
    text: string,
    images: File[],
    type: typeStatus,
}

interface commentDbInterface {
    postId: string,
    text: string,
    parentId: string | null,
    time: number | string,
    displayName: string | null,
    photoURL: string | null,
    authorUID: string,
    thisCommentId?: string,
    replies?: commentDbInterface[]
}

interface postCreateDbInterface {
    email: string,
    text: string,
    imageURLs: string[],
    likes: string[],
    uid: string,
    time: number,
    displayName: string,
    photoURL: string,
    type: typeStatus,
    isDeleted: boolean,
    userId: string,
    profileStatus: typeStatus
}

interface postDbGetInterface {
    postId: string,
    email: string,
    text: string,
    imageURLs: string[],
    likes: string[],
    uid: string,
    time: number,
    displayName: string,
    photoURL: string,
    type: typeStatus,
    isDeleted: boolean,
    status?: string,
    isVisible?: boolean,
    userId: string,
    profileStatus: typeStatus
}

export type { postCreateInterface, postCreateDbInterface, commentDbInterface, postDbGetInterface };