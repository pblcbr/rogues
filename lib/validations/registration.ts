import { z } from "zod";
import { isBusinessDomain } from "../openai/utils";

/**
 * Validation schemas for registration flow
 * Each step has its own schema for progressive validation
 */

// Step 1: Email validation
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email")
    .refine((email) => isBusinessDomain(email), {
      message: "Please use your business email (no Gmail, Yahoo, etc.)",
    }),
});

export type EmailFormData = z.infer<typeof emailSchema>;

// Step 2: Company information
export const companySchema = z.object({
  companySize: z.enum(["1-10", "11-100", "101-500", "501-1000", "1001+"], {
    errorMap: () => ({ message: "Please select your company size" }),
  }),
  isAgency: z.boolean().default(false),
});

export type CompanyFormData = z.infer<typeof companySchema>;

// Step 3: Account creation
export const accountSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms and conditions" }),
  }),
});

export type AccountFormData = z.infer<typeof accountSchema>;

// Step 4: Email verification
export const verificationSchema = z.object({
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^[0-9]+$/, "Verification code must contain only numbers"),
});

export type VerificationFormData = z.infer<typeof verificationSchema>;

// Step 5: Prompt selection
export const promptSelectionSchema = z.object({
  selectedPrompts: z
    .array(z.string())
    .min(1, "Please select at least one prompt")
    .max(10, "You can select up to 10 prompts"),
  customPrompts: z.array(z.string()).max(5, "Maximum 5 custom prompts"),
});

export type PromptSelectionFormData = z.infer<typeof promptSelectionSchema>;

// Step 6: Plan selection
export const planSelectionSchema = z.object({
  planId: z.enum(["starter", "growth", "enterprise"], {
    errorMap: () => ({ message: "Please select a plan" }),
  }),
});

export type PlanSelectionFormData = z.infer<typeof planSelectionSchema>;

// Combined registration data
export const registrationDataSchema = emailSchema
  .merge(companySchema)
  .merge(accountSchema.omit({ agreedToTerms: true }))
  .merge(promptSelectionSchema)
  .merge(planSelectionSchema);

export type RegistrationData = z.infer<typeof registrationDataSchema>;
