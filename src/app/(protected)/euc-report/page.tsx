"use client";

import React, { useState } from "react";
import { EUCReportForm } from "@/components/features/euc-report";
import { EUCReportStep2 } from "@/components/features/euc-report/EUCReportStep2";

export default function EucReportPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handleBackStep = () => {
    setCurrentStep(1);
  };

  return (
    <>
      {currentStep === 1 && <EUCReportForm onNextStep={handleNextStep} />}
      {currentStep === 2 && <EUCReportStep2 onBackStep={handleBackStep} />}
    </>
  );
}
