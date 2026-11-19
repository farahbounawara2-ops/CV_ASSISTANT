export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  extension: string;
}

export type InputMode = "upload" | "paste";

export type ExtractionStatus = "idle" | "extracting" | "success" | "error";

export interface ExtractionState {
  status: ExtractionStatus;
  text: string;
  error: string | null;
}

export interface ExtractTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

// ----------------- Phase 3 & 4: AI Analysis, CV Tailoring & PDF Export -----------------

export interface PersonalInfo {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface OpportunityAnalysis {
  jobTitle: string;
  companyName: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  keywords: string[];
}

export interface MatchedSkill {
  name: string;
  evidence: string;
}

export interface Compatibility {
  score: number | null;
  matchedSkills: MatchedSkill[];
  missingSkills: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  period?: string;
  details?: string;
}

export interface ProjectItem {
  name: string;
  technologies?: string[];
  description: string;
  highlights?: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  period?: string;
  description?: string;
  bulletPoints?: string[];
}

export interface TailoredCV {
  personalInfo?: PersonalInfo;
  professionalSummary: string;
  technicalSkills: string[];
  education: (string | EducationItem)[];
  projects: (string | ProjectItem)[];
  experience: (string | ExperienceItem)[];
  languages: string[];
  certifications: string[];
}

export interface AnalyzeCvResponseData {
  opportunityAnalysis: OpportunityAnalysis;
  compatibility: Compatibility;
  recommendations: string[];
  tailoredCV: TailoredCV;
  changesExplanation: string[];
}

export type AnalysisStatus = "idle" | "analyzing" | "success" | "error";

export interface AnalysisState {
  status: AnalysisStatus;
  data: AnalyzeCvResponseData | null;
  error: string | null;
  modelName?: string;
}

export interface AnalyzeCvApiResponse {
  success: boolean;
  data?: AnalyzeCvResponseData;
  error?: string;
  isDemo?: boolean;
  modelName?: string;
}
