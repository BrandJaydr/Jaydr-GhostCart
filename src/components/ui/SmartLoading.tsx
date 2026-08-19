import React from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export type LoadingStage = 'IDLE' | 'VALIDATING' | 'DETECTING' | 'CHECKING_DUPLICATES' | 'INGESTING' | 'COMPLETE' | 'ERROR';

interface SmartLoadingProps {
  stage: LoadingStage;
  error?: string;
}

/**
 * 🏗️ Forge Scaffold: SmartLoading
 * @agent:atlas - Implement actual transition logic, animations, and state management.
 */
export function SmartLoading({ stage, error }: SmartLoadingProps) {
  // TODO(@agent:atlas): Add smooth transitions between stages and handle edge cases.
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-white border border-[#e0dbd8] rounded-xl shadow-sm">
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#f3f1ef] text-[#791228]">
        {stage === 'ERROR' ? (
          <AlertCircle className="w-8 h-8 text-red-500" />
        ) : stage === 'COMPLETE' ? (
          <CheckCircle className="w-8 h-8 text-green-500" />
        ) : stage !== 'IDLE' ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : null}
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          {stage === 'IDLE' && 'Ready to Import'}
          {stage === 'VALIDATING' && 'Validating URL...'}
          {stage === 'DETECTING' && 'Detecting Supplier...'}
          {stage === 'CHECKING_DUPLICATES' && 'Checking Catalog...'}
          {stage === 'INGESTING' && 'Ingesting Product Data...'}
          {stage === 'COMPLETE' && 'Import Complete'}
          {stage === 'ERROR' && 'Import Failed'}
        </h3>
        
        {error ? (
          <p className="text-sm text-red-500 max-w-md">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Please wait while we process this product.
          </p>
        )}
      </div>

      {/* Stage Indicators Scaffold */}
      <div className="flex gap-2 mt-4">
        {/* TODO(@agent:atlas): Build dynamic progress step indicators */}
        <div className={`w-2 h-2 rounded-full ${stage !== 'IDLE' ? 'bg-[#791228]' : 'bg-[#e0dbd8]'}`} />
        <div className={`w-2 h-2 rounded-full ${['DETECTING', 'CHECKING_DUPLICATES', 'INGESTING', 'COMPLETE'].includes(stage) ? 'bg-[#791228]' : 'bg-[#e0dbd8]'}`} />
        <div className={`w-2 h-2 rounded-full ${['CHECKING_DUPLICATES', 'INGESTING', 'COMPLETE'].includes(stage) ? 'bg-[#791228]' : 'bg-[#e0dbd8]'}`} />
        <div className={`w-2 h-2 rounded-full ${['INGESTING', 'COMPLETE'].includes(stage) ? 'bg-[#791228]' : 'bg-[#e0dbd8]'}`} />
      </div>
    </div>
  );
}
