"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    workEmail: "",
    company: "",
    companySize: "",
    referralSource: "",
    isAgency: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend later
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-2">
          {/* Left Column - Information */}
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
                Contact sales
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight lg:text-5xl">
                Talk to our Sales team
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-400">
                Connect with our sales team to explore how we can support your
                use case.
              </p>

              {/* Benefits List */}
              <div className="mt-10 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-base text-gray-300">
                    Demo of the tacmind platform
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-500" />
                  <span className="text-base text-gray-300">
                    Custom report of your brand's visibility
                  </span>
                </div>
              </div>

              {/* Testimonial */}
              <blockquote className="mt-16 border-l-4 border-gray-700 pl-6">
                <p className="text-xl leading-relaxed text-gray-200">
                  "Identifying and analyzing LLM insights for AEO has been a key
                  priority for the marketing team. tacmind allowed us to uncover
                  behavioral patterns that traditional SEO tools couldn't fully
                  capture."
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <div>
                    <p className="font-semibold text-white">Sarah Johnson</p>
                    <p className="text-sm text-gray-400">
                      Marketing Director at TechCorp
                    </p>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="rounded-2xl border border-gray-800 bg-zinc-950 p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-semibold">How can we help?</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="h-12 border-gray-800 bg-black text-white placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Work Email */}
              <div>
                <Input
                  type="email"
                  placeholder="Work email"
                  value={formData.workEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, workEmail: e.target.value })
                  }
                  className="h-12 border-gray-800 bg-black text-white placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Company */}
              <div>
                <Input
                  type="text"
                  placeholder="Company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="h-12 border-gray-800 bg-black text-white placeholder:text-gray-500"
                  required
                />
              </div>

              {/* Company Size */}
              <div>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) =>
                    setFormData({ ...formData, companySize: value })
                  }
                >
                  <SelectTrigger className="h-12 border-gray-800 bg-black text-white">
                    <SelectValue placeholder="Company size" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-zinc-950 text-white">
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Referral Source */}
              <div>
                <Input
                  type="text"
                  placeholder="How did you hear about tacmind ?"
                  value={formData.referralSource}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      referralSource: e.target.value,
                    })
                  }
                  className="h-12 border-gray-800 bg-black text-white placeholder:text-gray-500"
                />
              </div>

              {/* Agency Checkbox */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="agency"
                  checked={formData.isAgency}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isAgency: checked as boolean,
                    })
                  }
                  className="border-gray-700 data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <label
                  htmlFor="agency"
                  className="cursor-pointer text-sm text-gray-300"
                >
                  We're an agency
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="h-12 w-full bg-white font-semibold text-black hover:bg-gray-200"
              >
                Send message
              </Button>

              {/* Additional Contact Info */}
              <p className="text-center text-sm text-gray-400">
                You can also email us at{" "}
                <a
                  href="mailto:sales@tacmind.com"
                  className="text-white underline hover:text-gray-300"
                >
                  sales@tacmind.com
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
