export interface EvaluationRecord {
  id: string;
  question: string;
  predicted_answer: string;
  actual_answer: string;
  confidence_score: number;
  is_correct: boolean;
  timestamp: string;
}

export interface FailureAnalysis {
  failureReason: string;
  suggestedAction: string;
  targetPrinciple: string;
  weightAdjustment: string;
}

// Learning loop trigger that analyzes prediction failures and computes recommendations
export const analyzePredictionFailure = (
  record: EvaluationRecord
): FailureAnalysis => {
  const lowercaseQ = record.question.toLowerCase();
  const lowercasePred = record.predicted_answer.toLowerCase();
  const lowercaseActual = record.actual_answer.toLowerCase();

  let reason = "The model over-estimated the subject's tolerance for risk in this domain.";
  let action = "Incorporate a memory detailing a historical loss or negative outcome to anchor risk processing.";
  let principle = "Protect Stability & Avoid Debt";
  let weight = "+15% proximity alignment weight on conservative paths";

  if (lowercaseQ.includes("money") || lowercaseQ.includes("invest") || lowercaseQ.includes("leverage")) {
    reason = "Financial philosophy drift detected: Model predicted higher risk-seeking behavior than actual choice.";
    action = "Create a new principle card clarifying strict leverage limits, or log a financial crisis experience.";
    principle = "Protect Stability & Avoid Debt";
    weight = "+25% weight on conservation nodes";
  } else if (lowercaseQ.includes("family") || lowercaseQ.includes("relational") || lowercaseQ.includes("kin")) {
    reason = "Relational priority mismatch: Model prioritized raw efficiency over kin alignment.";
    action = "Log a memory highlighting team/family cohesion over financial margin returns.";
    principle = "Family First";
    weight = "+20% weight on connection andMADE edges";
  } else if (lowercaseQ.includes("career") || lowercaseQ.includes("job") || lowercaseQ.includes("work")) {
    reason = "Career transition drift: Model predicted early action over stable deliberation.";
    action = "Add a career decision log documenting a slow, planned workplace shift.";
    principle = "Long-Term Thinking";
    weight = "+10% weight on deliberation nodes";
  }

  return {
    failureReason: reason,
    suggestedAction: action,
    targetPrinciple: principle,
    weightAdjustment: weight
  };
};

// Compute Calibration Error metric (Expected Calibration Error / MAE approximation)
export const calculateCalibrationError = (records: EvaluationRecord[]): number => {
  if (records.length === 0) return 0;
  
  let totalError = 0;
  records.forEach(r => {
    const accuracyValue = r.is_correct ? 1.0 : 0.0;
    totalError += Math.abs(r.confidence_score - accuracyValue);
  });
  
  return Number((totalError / records.length).toFixed(3));
};

// Generate list of automated learning suggestions for all incorrect records
export const generateLabSuggestions = (records: EvaluationRecord[]): FailureAnalysis[] => {
  return records
    .filter(r => !r.is_correct)
    .map(r => analyzePredictionFailure(r));
};
