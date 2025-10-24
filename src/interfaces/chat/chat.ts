interface chatInputInterface {
    senderId: string,
    receiverId: string,
    text: string,
    time: number,
}

interface chatStatusInterface {
    senderId: string,
    receiverId: string,
    isSenderTyping: boolean,
    isReceiverTyping: boolean,
}

export type { chatInputInterface, chatStatusInterface };