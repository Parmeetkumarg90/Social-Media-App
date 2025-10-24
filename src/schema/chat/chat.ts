import * as zod from "zod";

const chatInputSchema = zod.object({
    senderId: zod.string().trim().min(1, "Sender Id must not be empty"),
    receiverId: zod.string().trim().min(1, "Receiver Id must not be empty"),
    text: zod.string().trim().min(1, "Text must not be empty").max(500, "Text should be smaller than 500 characters"),
    time: zod.number(),
});

export { chatInputSchema };