interface logInUserInterface {
    email: string,
    password: string,
    isSignWithGoogle?: boolean,
}

interface authorizedInterface {
    email: string,
    token: string,
    photoURL: string,
    displayName: string,
    phoneNumber: string,
    isSignWithGoogle?: boolean,
    uid: string,
    totalPosts: number,
    followers: string[],
    following: string[],
    id: string,
    isOnline: boolean,
    type: typeStatus,
}

interface userInterface {
    email: string,
    photoURL: string,
    displayName: string,
    uid: string,
    id: string,
    isOnline: boolean,
}

interface signUpUserInterface {
    email: string,
    password: string,
    confirmPassword: string,
}

enum typeStatus {
    PUBLIC = "public",
    PRIVATE = "private"
}

interface updateUserInterface {
    displayName: string | null,
    phoneNumber: string | null,
    photoURL: File | null,
    type: typeStatus,
}

export type { logInUserInterface, signUpUserInterface, authorizedInterface, updateUserInterface, userInterface };
export { typeStatus };