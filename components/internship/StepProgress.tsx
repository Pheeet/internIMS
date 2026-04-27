import { Check } from "lucide-react";
import { Fragment } from "react";

export type StepState = "done" | "active" | "pending";

export interface Step {
  label: string;
  state: StepState;
}

interface StepProgressProps {
  steps: Step[];
  onStepClick?: (index: number) => void;
}

export function StepProgress({ steps, onStepClick }: StepProgressProps) {
  return (
    <div className="flex items-center w-full py-3">
      {steps.map((step, i) => (
        <Fragment key={i}>
          <button
            type="button"
            onClick={() => onStepClick?.(i)}
            disabled={step.state === "pending"}
            className="flex items-center gap-2 shrink-0 disabled:cursor-not-allowed"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${
                step.state === "done"
                  ? "bg-[#9E76B4] text-white"
                  : step.state === "active"
                  ? "border-2 border-[#9E76B4] text-[#9E76B4] bg-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.state === "done" ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span
              className={`text-[13px] font-extrabold transition-colors ${
                step.state === "active"
                  ? "text-[#9E76B4]"
                  : step.state === "done"
                  ? "text-gray-500"
                  : "text-gray-300"
              }`}
            >
              {step.label}
            </span>
          </button>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 transition-colors ${
                step.state === "done" ? "bg-[#9E76B4]" : "bg-gray-100"
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
