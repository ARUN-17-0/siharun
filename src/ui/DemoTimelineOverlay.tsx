import React, { useEffect } from 'react';
import { Zap, CheckCircle2, ChevronRight, X, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { COMPLETE_DEMO_STEPS, DemoStep } from '../simulation/DemoSequence';

interface DemoTimelineOverlayProps {
  demoStatus: {
    running: boolean;
    stepIndex: number;
    currentStep: DemoStep | null;
    progress: number;
  };
  onStopDemo: () => void;
}

export const DemoTimelineOverlay: React.FC<DemoTimelineOverlayProps> = ({
  demoStatus,
  onStopDemo
}) => {
  if (!demoStatus.running || !demoStatus.currentStep) return null;

  const currentStep = demoStatus.currentStep;
  const stepNumber = demoStatus.stepIndex + 1;
  const totalSteps = COMPLETE_DEMO_STEPS.length;

  useEffect(() => {
    if (stepNumber === totalSteps) {
      // Trigger celebratory confetti upon final milestone completion
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [stepNumber, totalSteps]);

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[680px] max-w-[90vw] pointer-events-auto">
      <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-4 shadow-2xl font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">
              SIH 2026 Complete Demo Sequence
            </span>
            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              Step {stepNumber} of {totalSteps}
            </span>
          </div>

          <button
            onClick={onStopDemo}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition"
            title="Stop Demonstration"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Milestone Steps Mini-Track */}
        <div className="flex items-center gap-1 my-2.5">
          {COMPLETE_DEMO_STEPS.map((s, idx) => {
            const isDone = idx < demoStatus.stepIndex;
            const isCurrent = idx === demoStatus.stepIndex;
            return (
              <div
                key={`step-dot-${idx}`}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  isDone 
                    ? 'bg-purple-500' 
                    : isCurrent 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-slate-800'
                }`}
                title={s.title}
              />
            );
          })}
        </div>

        {/* Current Step Title and Description */}
        <div className="mt-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100">
              {currentStep.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-yellow-400 transition-all duration-200"
            style={{ width: `${demoStatus.progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
