import React, { useState } from 'react';
import { useBackdropClose } from '../../hooks/useBackdropClose';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  MODAL_CLOSE,
  MODAL_HEADER,
  MODAL_OVERLAY,
  MODAL_SURFACE,
  MODAL_TITLE,
} from './ui';

export interface Step {
  title: string;
  content: React.ReactNode;
  stepNumber: number;
}

interface StepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
  title?: string;
}

export const StepperModal: React.FC<StepperModalProps> = ({
  isOpen,
  onClose,
  steps,
  title = 'Guided Tour',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const backdropProps = useBackdropClose(handleClose);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = steps[currentStep];

  return (
    <div className={`${MODAL_OVERLAY} z-[10000] overflow-y-auto p-4`} {...backdropProps}>
      <div
        className={`${MODAL_SURFACE} w-full max-w-4xl max-h-[90vh] overflow-y-auto relative my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{title}</h2>
          <button onClick={handleClose} className={MODAL_CLOSE} aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-8 mt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-1 flex-col items-center">
                  <button
                    onClick={() => handleStepClick(index)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border font-bold transition-all duration-200 ${
                      index === currentStep
                        ? 'border-violet-400/70 bg-violet-500 text-white scale-110'
                        : index < currentStep
                        ? 'border-green-500/50 bg-violet-950/50 text-green-300'
                        : 'border-white/20 bg-violet-950/40 text-white/60'
                    }`}
                  >
                    {index < currentStep ? <i className="fas fa-check"></i> : step.stepNumber}
                  </button>
                  <div className="mt-2 max-w-[120px] text-center">
                    <p
                      className={`text-xs ${
                        index === currentStep
                          ? 'font-semibold text-theme-primary'
                          : index < currentStep
                          ? 'text-green-300'
                          : 'text-white/55'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-px flex-1 transition-all duration-300 ${
                      index < currentStep ? 'bg-green-500/70' : 'bg-white/15'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6 min-h-[300px]">
          <div className="rounded-lg border border-white/15 bg-violet-950/30 p-6">
            <p className="mb-4 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.09em] text-white/70">
              Step {currentStepData.stepNumber} of {steps.length}
            </p>
            <h3 className="mb-4 text-xl font-bold text-theme-primary">{currentStepData.title}</h3>
            <div className="text-theme-primary">{currentStepData.content}</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`${BTN_GHOST} flex items-center gap-2`}
          >
            <i className="fas fa-arrow-left"></i>
            Previous
          </button>
          <div className="font-mono text-sm tabular-nums text-white/70">
            {currentStep + 1} / {steps.length}
          </div>
          {currentStep < steps.length - 1 ? (
            <button onClick={handleNext} className={`${BTN_PRIMARY} flex items-center gap-2`}>
              Next
              <i className="fas fa-arrow-right"></i>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-violet-950/50 px-4 py-2 font-semibold text-green-300 transition-colors hover:bg-green-500/20"
            >
              Finish
              <i className="fas fa-check"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
