import { typeStatus } from "../user/user";

enum follower_following_type {
    FOLLOWER = "follower",
    FOLLOWING = "following"
}

enum follower_following_action_type {
    FOLLOW = "follow",
    UNFOLLOW = "unfollow",
    FOLLOW_BACK = "follow_back",
    SEND_REQUEST = "send_request_to_follow",
}

interface follow_following_Interface {
    uid: string,
    displayName: string,
    photoURL: string,
    email: string,
    id: string,
    type: typeStatus
}

interface follow_following_view_Interface {
    list: follow_following_Interface[],
    currentUserUid: string,
    type: follower_following_type,
}

export type { follow_following_Interface, follow_following_view_Interface };
export { follower_following_type, follower_following_action_type };