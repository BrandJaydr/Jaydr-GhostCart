import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number; // 0 to 100
  label?: string;
}

/**
 * 🏗️ Forge Scaffold: ConfidenceIndicator
 * Visual confidence badge for AI/supplier metadata quality.
 * @agent:atlas - Implement actual logic, tooltip explanations, and accessible labels.
 */
export function ConfidenceIndicator({ score, label = "Confidence" }: ConfidenceIndicatorProps) {
  // TODO(@agent:atlas): Add dynamic tooltips based on score threshold and field level validation.
  const isHigh = score >= 85;
  const isMedium = score >= 60 && score < 85;
  
  let colorClass = "text-red-600 bg-red-50 border-red-200";
  let Icon = ShieldAlert;
  
  if (isHigh) {
    colorClass = "text-green-700 bg-green-50 border-green-200";
    Icon = ShieldCheck;
  } else if (isMedium) {
    colorClass = "text-yellow-700 bg-yellow-50 border-yellow-200";
    Icon = Shield;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}: {score}%</span>
    </div>
  );
}
