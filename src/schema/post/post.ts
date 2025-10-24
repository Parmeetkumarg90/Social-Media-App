import { typeStatus } from "@/interfaces/user/user";
import * as zod from "zod";

const postCreateSchema = zod.object({
    text: zod.string().trim().min(1, "Text cannot be empty or spaces").max(500, "Textsize should be smaller than 500 characters"),
    images: zod.array(zod.instanceof(File)).min(1, "Provide atleast 1 image").max(4, "Provide images between 1-4"),
    type: zod.enum(typeStatus).default(typeStatus.PUBLIC),
    userId: zod.string().trim().min(3),
});

const commentDbSchema = zod.object({
    postId: zod.string().trim(),
    text: zod.string().trim().min(1, "Text cannot be empty or spaces").max(500, "Textsize should be smaller than 500 characters"),
    parentId: zod.string().trim().nullable(),
    time: zod.number(),
    displayName: zod.string().trim().nullable(),
    photoURL: zod.string().trim().nullable(),
    authorUID: zod.string().trim(),
    replies: zod.array(zod.any()).optional(),
    thisCommentId: zod.string().optional(),
});

const postCreateDbSchema = zod.object({
    email: zod.email().trim(),
    text: zod.string().trim().min(1, "Text cannot be empty or spaces").max(500, "Textsize should be smaller than 500 characters"),
    imageURLs: zod.array(zod.string()).min(1, "Provide atleast 1 image").max(4, "Provide images between 1-4"),
    likes: zod.array(zod.string()).default([]).optional(),
    uid: zod.string().trim(),
    time: zod.number(),
    displayName: zod.string().trim().nullable(),
    photoURL: zod.string().trim().nullable(),
    type: zod.enum(typeStatus).default(typeStatus.PUBLIC),
    isDeleted: zod.boolean(),
    profileStatus: zod.enum(typeStatus).default(typeStatus.PUBLIC),
    userId: zod.string().trim().min(3),
});

export { postCreateSchema, postCreateDbSchema, commentDbSchema };