import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be less than 128 characters"),
  inviteCode: z.string().trim().regex(/^[A-Z0-9]+$/, "Invalid invite code format").min(1, "Invite code is required"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(1, "Password is required"),
});

export const videoGenerationSchema = z.object({
  prompt: z.string().trim().min(10, "Prompt must be at least 10 characters").max(2000, "Prompt must be less than 2000 characters"),
  model: z.string().min(1, "Model is required"),
  aspectRatio: z.string().min(1, "Aspect ratio is required"),
  duration: z.coerce.number().min(1).max(10),
});

export const storyboardSchema = z.object({
  prompt: z.string().trim().min(20, "Story description must be at least 20 characters").max(3000, "Story description must be less than 3000 characters"),
  aspectRatio: z.string().min(1, "Aspect ratio is required"),
  duration: z.coerce.number().min(1).max(10),
});
