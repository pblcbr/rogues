/**
 * Application-wide constants
 */

export const APP_NAME = "Rogues";
export const APP_DESCRIPTION = "Answer Engine Optimization Platform";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  // Add more routes as needed
} as const;

export const API_ENDPOINTS = {
  AUTH_SIGNUP: "/api/auth/signup",
  AUTH_VERIFY_OTP: "/api/auth/verify-otp",
  AUTH_RESEND_OTP: "/api/auth/resend-otp",
  STRIPE_CREATE_CHECKOUT: "/api/stripe/create-checkout",
  WORKSPACE_INITIALIZE: "/api/workspace/initialize",
  PROMPTS_GENERATE: "/api/prompts/generate",
  // Define your API endpoints here
} as const;

export const STRIPE_PRICE_IDS = {
  STARTER: "price_1SLSzGLlfnJ045i4EQxm8k8X",
  GROWTH: "price_1SLSzULlfnJ045i472fRK92l",
} as const;
