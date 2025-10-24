import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

/**
 * Progress indicator showing current step in the registration flow
 * Displays as "Step X/Y" with visual progress bar
 */
export function ProgressIndicator({
  currentStep,
  totalSteps,
  className,
}: ProgressIndicatorProps) {
  const clampedStep = Math.max(0, Math.min(currentStep, totalSteps));

  return (
    <div className={cn("mb-8", className)}>
      {/* Segmented progress: one pill per step */}
      <div className="grid w-full grid-cols-12 gap-1.5 sm:gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < clampedStep;
          const isActive = stepNumber === clampedStep;
          return (
            <div
              key={stepNumber}
              className={cn(
                // Base segment shape
                "col-span-12 h-0.5 rounded-full",
                // Use equal-width columns by mapping steps to the 12-col grid
                // Distribute steps evenly across 12 columns
                totalSteps === 1 && "col-span-12",
                totalSteps === 2 && "col-span-6",
                totalSteps === 3 && "col-span-4",
                totalSteps === 4 && "col-span-3",
                totalSteps === 5 && "col-span-[2]",
                totalSteps === 6 && "col-span-2",
                totalSteps >= 7 && "col-span-1",
                // Colors
                isCompleted && "bg-foreground",
                !isCompleted && !isActive && "bg-muted",
                isActive && "bg-foreground/70"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
