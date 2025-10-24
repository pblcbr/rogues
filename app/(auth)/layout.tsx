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
    <>
      <div className="flex min-h-screen">
        {/* Left side - Form content */}
        <div className="left-panel flex w-full flex-col lg:w-1/2">
          <div className="flex min-h-screen items-center justify-center p-8">
            <div className="content-max w-full max-w-md">
              <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            </div>
          </div>
        </div>

        {/* Right side - Testimonials */}
        <div className="auth-right hidden lg:relative lg:flex lg:w-1/2 lg:flex-col lg:overflow-hidden">
          {/* Background Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source
              src="/7020028_Background_Screensaver_3840x2160.mp4"
              type="video/mp4"
            />
          </video>

          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Content */}
          <div className="relative z-10 flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <TestimonialCarousel />
            </div>
          </div>
        </div>
      </div>
      {/* Global styles are defined in app/globals.css to keep this as a Server Component */}
    </>
  );
}
