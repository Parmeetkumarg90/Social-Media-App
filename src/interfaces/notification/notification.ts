enum notificationType {
    COMMENT = "comment",
    LIKE = "like",
    CHAT = "chat",
    REQUEST_TO_FOLLOW = "request to follow"
}

interface notificationInterface {
    senderId: string,
    receiverId: string,
    postId: string | null,
    notificationText: string,
    type: notificationType,
    id?: string,
    senderUid: string,
}

export type { notificationInterface };
export { notificationType };