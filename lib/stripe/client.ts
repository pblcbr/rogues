import { loadStripe } from "@stripe/stripe-js";
import Stripe from "stripe";

/**
 * Client-side Stripe instance for frontend
 */
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

/**
 * Server-side Stripe instance for backend operations
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});
