import { typeStatus } from '@/interfaces/user/user';
import * as zod from 'zod';

const usersSchema = zod.object({
    email: zod.string().email().min(10, "Invalid Length"),
    password: zod.string().min(6, "Invalid Length")
});

const logInUserSchema = zod.object({
    email: zod.string().email().min(10, "Invalid Length"),
    password: zod.string().min(6, "Invalid Length"),
});

const signUpUserSchema = zod.object({
    email: zod.string().email().min(10, "Invalid Length"),
    password: zod.string().min(6, "Invalid Length"),
    confirmPassword: zod.string().min(6, "Invalid Length"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const updateUserSchema = zod.object({
    displayName: zod.string().trim().min(3, "Name should have atleast 3 characters").max(20, "Name should have atmost 20 characters").nullable(),
    phoneNumber: zod.string().regex(/^\d{10}$/, "Phone Number should be 10 digits without country code").nullable(),
    photoURL: zod.instanceof(File).nullable(),
    type: zod.enum(typeStatus).default(typeStatus.PUBLIC),
}).refine((data) => data.displayName || data.phoneNumber || data.photoURL || data.type, {
    message: "Atleast one fields can't be nullable",
});

export { usersSchema, logInUserSchema, signUpUserSchema, updateUserSchema };