import { Suspense } from "react";
import { TestimonialCarousel } from "@/components/auth/testimonial-carousel";

/**
 * Auth layout with split-screen design
 * Left: Form content
 * Right: Testimonials and social proof
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form content */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </div>
        </div>
      </div>

      {/* Right side - Testimonials */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:bg-muted">
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <TestimonialCarousel />
          </div>
        </div>
      </div>
    </div>
  );
}
