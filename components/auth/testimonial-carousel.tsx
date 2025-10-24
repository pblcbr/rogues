"use client";

import { useState, useEffect } from "react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "ChatGPT now refers 10% of new Vercel signups, which have also accelerated",
    author: "Guillermo Rauch",
    role: "CEO",
    company: "Vercel",
  },
  {
    quote:
      "Profound has been instrumental in helping us boost our clients' AI search visibility. Their insights into how brands appear for key topics have empowered us to deliver strategic recommendations that directly impact digital marketing performance.",
    author: "Joe Kerlin",
    role: "Director of SXO",
    company: "Rocket55",
  },
  {
    quote:
      "Profound has given us actionable insights on how our brand is performing for GEO. It's exciting to see our visibility going up and which citations are affecting the score. Using Profound, I can start to get a good idea of how and what to do to improve our GEO.",
    author: "Jay Douglas",
    role: "Marketing Director",
    company: "1840 & Company",
  },
];

/**
 * Testimonial carousel component
 * Displays rotating testimonials on the right side of auth pages
 */
export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(timer);
  }, []);

  const current = testimonials[currentIndex];

  return (
    <div className="space-y-8">
      {/* Main testimonial card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md transition-all duration-500">
        <p className="mb-6 text-lg leading-relaxed text-white/90">
          &quot;{current.quote}&quot;
        </p>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60" />
          <div>
            <p className="font-semibold text-white">{current.author}</p>
            <p className="text-sm text-white/70">
              {current.role}, {current.company}
            </p>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 w-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-8 bg-white"
                : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
