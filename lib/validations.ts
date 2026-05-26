import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(20, "Name max 20 characters"),
  email: z.string().email("Email is invalid"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must include 1 uppercase letter, 1 lowercase letter, and 1 digit"
    ),
});

export const LoginSchema = z.object({
  email: z.string().email("Email is invalid"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const PostSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  content: z.string().trim().min(3, "Content must be at least 3 characters"),
  published: z.boolean().optional().default(false),
  thumbnail: z.string().nullable().optional(),
});

export const EditAccountSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(20, "Name max 20 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      "Password must include 1 uppercase letter, 1 lowercase letter, and 1 digit"
    )
    .optional().or(z.literal('')),
  avatar: z.string().nullable().optional(),
});
