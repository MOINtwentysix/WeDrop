import { z } from "zod";

export const expirations = ["burn", "30m", "1h", "24h", "48h", "7d"] as const;

export const dropSchema = z
  .object({
    content: z.string().min(1).max(400000),
    expiration: z.enum(expirations),
    password: z.string().max(128).optional().default(""),
    maxViews: z.number().int().min(1).max(1000).optional(),
  })
  .refine(
    (value) => value.maxViews === undefined || value.expiration === "burn",
    { message: "View limits require view-based expiration." },
  );

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username can only contain letters, numbers, underscores, and hyphens.",
  );

export const authSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(12, "Password must be at least 12 characters.").max(128),
  username: usernameSchema.optional(),
});

export const updateAccountSchema = z.object({
  username: usernameSchema.optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(254)
    .transform((v) => v.toLowerCase().trim())
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128)
    .optional(),
});

export function dropPolicy(
  content: string,
  expiration: string,
  authenticated: boolean,
) {
  if (!content.trim()) throw new Error("Add some text before creating a drop.");
  if (content.includes("\0"))
    throw new Error("Null characters are not supported.");
  if (Array.from(content).length > (authenticated ? 200000 : 50000))
    throw new Error(
      `Your limit is ${authenticated ? "200,000" : "50,000"} characters.`,
    );
  if (!authenticated && ["1h", "48h", "7d"].includes(expiration))
    throw new Error("Sign in to use this expiration.");
  const seconds: Record<string, number> = {
    "30m": 1800,
    "1h": 3600,
    "24h": 86400,
    "48h": 172800,
    "7d": 604800,
    burn: authenticated ? 604800 : 86400,
  };
  return { seconds: seconds[expiration], burn: expiration === "burn" };
}
