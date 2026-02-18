import React, { useState } from 'react';

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

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in modal-overlay-high z-[10000] overflow-y-auto p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-theme-modal-gradient rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-theme-primary font-roboto">
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="text-theme-primary hover:text-theme-primary-hover transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => handleStepClick(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-roboto font-semibold transition-all duration-200 ${
                      index === currentStep
                        ? 'bg-blue-500 text-white scale-110'
                        : index < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-theme-input text-theme-primary border-2 border-theme'
                    }`}
                  >
                    {index < currentStep ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.stepNumber
                    )}
                  </button>
                  <div className="mt-2 text-center max-w-[120px]">
                    <p
                      className={`text-xs font-roboto ${
                        index === currentStep
                          ? 'text-blue-500 font-semibold'
                          : index < currentStep
                          ? 'text-green-500'
                          : 'text-theme-primary opacity-70'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                      index < currentStep ? 'bg-green-500' : 'bg-theme-input'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6 min-h-[300px]">
          <div className="bg-theme-card p-6 rounded-lg border border-theme-card-hover">
            <h3 className="text-xl font-bold text-theme-primary mb-4 font-roboto">
              Step {currentStepData.stepNumber}: {currentStepData.title}
            </h3>
            <div className="text-theme-primary">{currentStepData.content}</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-theme-card-hover">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="bg-theme-button-primary text-theme-primary px-6 py-2 rounded-lg font-roboto hover:bg-theme-button-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </button>
          <div className="text-theme-primary font-roboto">
            {currentStep + 1} / {steps.length}
          </div>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-roboto hover:bg-blue-600 transition-colors flex items-center"
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="bg-green-500 text-white px-6 py-2 rounded-lg font-roboto hover:bg-green-600 transition-colors flex items-center"
            >
              Finish
              <i className="fas fa-check ml-2"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

