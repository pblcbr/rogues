import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Hero section component that demonstrates best practices
 * Uses Server Component by default (no 'use client')
 */
export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Build Amazing Apps with{" "}
          <span className="text-primary">Next.js 14</span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
          A modern, production-ready template built with TypeScript, Tailwind
          CSS, and industry best practices.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>TypeScript First</CardTitle>
            <CardDescription>
              Full type safety across your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Catch errors early with TypeScript's powerful type system and
              enjoy better IDE support.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modern Stack</CardTitle>
            <CardDescription>
              Built with the latest technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Next.js 14, React Server Components, Tailwind CSS, and Shadcn UI
              for a modern development experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
            <CardDescription>Production-ready from day one</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ESLint, Prettier, and optimized configuration following industry
              standards.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
