"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companySchema,
  type CompanyFormData,
} from "@/lib/validations/registration";
import { useRegistrationStore } from "@/stores/registration";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProgressIndicator } from "../progress-indicator";
import { ArrowLeft } from "lucide-react";

/**
 * Step 2: Company Information
 * Collects company size and agency status
 */
export function StepCompany() {
  const { setCompanyInfo, nextStep, previousStep } = useRegistrationStore();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isAgency, setIsAgency] = useState(false);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      isAgency: false,
    },
  });

  const companySizes = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-100", label: "11-100 employees" },
    { value: "101-500", label: "101-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1001+", label: "1001+ employees" },
  ];

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    setValue("companySize", size as CompanyFormData["companySize"]);
  };

  const onSubmit = (data: CompanyFormData) => {
    setCompanyInfo(data.companySize, data.isAgency);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <ProgressIndicator currentStep={2} totalSteps={8} />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Tell us about your company
        </h1>
        <p className="text-muted-foreground">
          This will help us personalize your experience.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <Label>What&apos;s your company size?</Label>
          <div className="grid gap-3">
            {companySizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => handleSizeSelect(size.value)}
                className={`rounded-lg border-2 p-4 text-left transition-colors hover:border-primary ${
                  selectedSize === size.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
          {errors.companySize && (
            <p className="text-sm text-destructive">
              {errors.companySize.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="agency"
            checked={isAgency}
            onCheckedChange={(checked) => {
              setIsAgency(checked as boolean);
              setValue("isAgency", checked as boolean);
            }}
          />
          <Label
            htmlFor="agency"
            className="cursor-pointer text-sm font-normal"
          >
            Yes, I&apos;m an agency
          </Label>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={previousStep}
            className="w-32"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="flex-1" disabled={!selectedSize}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
