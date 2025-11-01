export interface Diagnosis {
  potentialDiagnosis: string;
  confidence: 'High' | 'Medium' | 'Low';
  rationale: string;
  nextSteps: string;
  managementPlan?: string;
  managementPlanSources?: { uri: string; title: string }[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
