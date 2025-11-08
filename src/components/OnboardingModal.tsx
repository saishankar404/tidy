import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Code, Zap, FileText, ArrowRight } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to TIDY",
    description: "Your AI-powered code editor with intelligent analysis and assistance. Let's get you started with the key features.",
    icon: Code,
  },
  {
    title: "Smart Code Analysis",
    description: "Run AI-powered analysis on your code to catch bugs, improve performance, and follow best practices.",
    icon: Zap,
    highlight: "Click 'Analyze Code' in the right sidebar to get started",
  },
  {
    title: "AI Code Assistance",
    description: "Get intelligent code completions, chat with your AI assistant, and apply automated fixes to your code.",
    icon: FileText,
    highlight: "Click the sparkle icon or press Ctrl+K to access AI assistance",
  },
];

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">TIDY Onboarding</DialogTitle>
          <div className="flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <step.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          {step.highlight && (
            <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{step.highlight}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? (
                  <>
                    Get Started
                    <Check className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}