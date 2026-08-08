import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Enter a valid email address."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(60, "Display name must be 60 characters or fewer."),
});

export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>;

export const passwordSettingsSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(1, "Enter a new password.")
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type PasswordSettingsFormValues = z.infer<typeof passwordSettingsSchema>;

export const ingestUrlSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter a URL.")
    .url("Enter a valid URL, including https://."),
});

export type IngestUrlFormValues = z.infer<typeof ingestUrlSchema>;

export const ingestTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(50, "Please provide at least 50 characters."),
});

export type IngestTextFormValues = z.infer<typeof ingestTextSchema>;

export const libraryFilterSchema = z.object({
  search: z.string().trim().max(200, "Search is too long.").optional().default(""),
  library: z.string().trim().optional().default("All"),
});

export type LibraryFilterFormValues = z.infer<typeof libraryFilterSchema>;