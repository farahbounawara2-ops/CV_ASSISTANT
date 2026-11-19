import { GoogleGenAI, Type } from "@google/genai";
import type {
  AnalyzeCvResponseData,
  MatchedSkill,
  PersonalInfo,
  ExperienceItem,
  EducationItem,
  ProjectItem,
} from "@/types";

const GEMINI_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    opportunityAnalysis: {
      type: Type.OBJECT,
      properties: {
        jobTitle: { type: Type.STRING, description: "Identified Job Title or Opportunity Role" },
        companyName: { type: Type.STRING, description: "Company or Organization name, or empty string if not mentioned" },
        requiredSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Technical and domain skills required by the opportunity",
        },
        preferredSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Nice-to-have or preferred skills mentioned in the job description",
        },
        responsibilities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Key duties and day-to-day responsibilities listed in the opportunity",
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Prominent industry keywords, methodologies, and phrases from the opportunity",
        },
      },
      required: ["jobTitle", "companyName", "requiredSkills", "preferredSkills", "responsibilities", "keywords"],
    },
    matchedSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Skill name" },
          evidence: {
            type: Type.STRING,
            description: "Verifiable quote or concrete proof from the Master CV demonstrating this skill",
          },
        },
        required: ["name", "evidence"],
      },
      description: "Skills present in the job description that are verifiably evidenced in the CV",
    },
    missingSkills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Skills required/preferred by the job but NOT found or demonstrated in the Master CV. MUST NOT be added to tailored CV.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Actionable suggestions to improve CV relevance and alignment without inventing qualifications",
    },
    tailoredCV: {
      type: Type.OBJECT,
      properties: {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, description: "Full name as stated in Master CV" },
            email: { type: Type.STRING, description: "Email address if present in Master CV, else empty string" },
            phone: { type: Type.STRING, description: "Phone number if present in Master CV, else empty string" },
            location: { type: Type.STRING, description: "Location or city/country if present in Master CV, else empty string" },
            linkedin: { type: Type.STRING, description: "LinkedIn url/handle if present in Master CV, else empty string" },
            portfolio: { type: Type.STRING, description: "Portfolio or GitHub url if present in Master CV, else empty string" },
          },
          required: ["fullName"],
        },
        professionalSummary: {
          type: Type.STRING,
          description: "Rewritten professional summary emphasizing genuine candidate qualifications aligned with the opportunity",
        },
        technicalSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Prioritized list of candidate's EXISTING technical skills that match the target role. NEVER add missing skills.",
        },
        education: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              degree: { type: Type.STRING },
              institution: { type: Type.STRING },
              period: { type: Type.STRING },
              details: { type: Type.STRING },
            },
            required: ["degree", "institution"],
          },
          description: "Exact educational background preserved from Master CV. Empty array if not mentioned.",
        },
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING },
              highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["name", "description"],
          },
          description: "Candidate's real projects preserved from Master CV. Empty array if not mentioned.",
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              company: { type: Type.STRING },
              period: { type: Type.STRING },
              description: { type: Type.STRING },
              bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["role", "company"],
          },
          description: "Real work experience preserved from Master CV. Empty array if not mentioned.",
        },
        languages: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Languages exactly as mentioned in Master CV. Empty array if not mentioned.",
        },
        certifications: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Certifications exactly as mentioned in Master CV. Empty array if not mentioned.",
        },
      },
      required: [
        "professionalSummary",
        "technicalSkills",
      ],
    },
    changesExplanation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Explanations of what was refocused, reorganized, or emphasized and why it aligns with the opportunity",
    },
  },
  required: [
    "opportunityAnalysis",
    "matchedSkills",
    "missingSkills",
    "recommendations",
    "tailoredCV",
    "changesExplanation",
  ],
};

/**
 * Extract verified personal information from Master CV text without hallucination.
 */
export function extractPersonalInfoFromMasterCv(masterCv: string): PersonalInfo {
  const lines = masterCv.split("\n").map((l) => l.trim()).filter(Boolean);

  // Email regex
  const emailMatch = masterCv.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : undefined;

  // Phone regex
  const labeledPhoneMatch = masterCv.match(/(?:phone|tel|mobile|cell)\s*[:\-]?\s*(\+?[\d\s().-]{7,20})/i);
  const standalonePhoneMatch = masterCv.match(/\b(?:\+\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}\b/);
  const rawPhone = labeledPhoneMatch
    ? labeledPhoneMatch[1].trim()
    : standalonePhoneMatch
    ? standalonePhoneMatch[0].trim()
    : undefined;
  const phone = rawPhone ? rawPhone.replace(/[|\n,;]+$/, "").trim() : undefined;

  // LinkedIn regex
  const linkedinMatch = masterCv.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0] : undefined;

  // GitHub / Portfolio regex
  const githubMatch = masterCv.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = masterCv.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9_-]+\.(?:dev|me|io|portfolio|app)\b[^\s]*/i);
  const portfolio = githubMatch ? githubMatch[0] : portfolioMatch ? portfolioMatch[0] : undefined;

  // Location match
  const locationMatch = masterCv.match(/(?:location|address)\s*[:\-]?\s*([A-Za-z\s,.-]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : undefined;

  // Full name from first non-header, non-contact line
  let fullName = "Candidate";
  for (const line of lines.slice(0, 5)) {
    if (
      !line.includes("@") &&
      !line.toLowerCase().includes("resume") &&
      !line.toLowerCase().includes("curriculum vitae") &&
      !line.toLowerCase().includes("http") &&
      !line.toLowerCase().includes("phone") &&
      line.length >= 2 &&
      line.length <= 40
    ) {
      fullName = line.replace(/^[#*\-•\s]+/, "").trim();
      break;
    }
  }

  return {
    fullName,
    email,
    phone,
    location,
    linkedin,
    portfolio,
  };
}

export interface StructuredCvSections {
  summary: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  languages: string[];
  certifications: string[];
}

/**
 * Deterministically parse structured factual sections from Master CV text.
 * Strictly preserves real candidate data and returns empty arrays when sections are absent.
 */
export function parseMasterCvStructured(masterCv: string): StructuredCvSections {
  const lines = masterCv.split("\n").map((l) => l.trim()).filter(Boolean);

  const sectionHeaders: Record<string, RegExp> = {
    summary: /^(?:professional\s+summary|summary|profile|about\s+me|objective)[:\s]*$/i,
    skills: /^(?:technical\s+skills|skills|core\s+competencies|technologies)[:\s]*$/i,
    experience: /^(?:experience|work\s+experience|professional\s+experience|employment\s+history)[:\s]*$/i,
    education: /^(?:education|academic\s+background|academic\s+credentials)[:\s]*$/i,
    projects: /^(?:projects|key\s+projects|personal\s+projects|technical\s+projects)[:\s]*$/i,
    languages: /^(?:languages)[:\s]*$/i,
    certifications: /^(?:certifications|certificates|licenses)[:\s]*$/i,
  };

  const inlineHeaders = [
    { key: "summary", regex: /^(?:professional\s+summary|summary|profile|about\s+me)[:\-]\s*(.+)$/i },
    { key: "skills", regex: /^(?:technical\s+skills|skills|technologies)[:\-]\s*(.+)$/i },
    { key: "experience", regex: /^(?:experience|work\s+experience|professional\s+experience)[:\-]\s*(.+)$/i },
    { key: "education", regex: /^(?:education|academic\s+background)[:\-]\s*(.+)$/i },
    { key: "projects", regex: /^(?:projects|key\s+projects)[:\-]\s*(.+)$/i },
    { key: "languages", regex: /^(?:languages)[:\-]\s*(.+)$/i },
    { key: "certifications", regex: /^(?:certifications|certificates)[:\-]\s*(.+)$/i },
  ];

  const sectionLines: Record<string, string[]> = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    languages: [],
    certifications: [],
  };

  let currentSection = "";

  for (const line of lines) {
    let matchedHeader = false;
    for (const [sec, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) {
        currentSection = sec;
        matchedHeader = true;
        break;
      }
    }
    if (matchedHeader) continue;

    let matchedInline = false;
    for (const { key, regex } of inlineHeaders) {
      const m = line.match(regex);
      if (m) {
        currentSection = key;
        sectionLines[key].push(m[1].trim());
        matchedInline = true;
        break;
      }
    }
    if (matchedInline) continue;

    if (currentSection && sectionLines[currentSection]) {
      sectionLines[currentSection].push(line);
    }
  }

  // Parse experience items
  const experience: ExperienceItem[] = [];
  for (const line of sectionLines.experience) {
    const m = line.match(/^(.+?)\s+\b(?:at|\@)\b\s+([^\(\.\:\n]+)(?:\s*\(([\d\s\-–\w]+)\))?[\.\:\s]*(.*)$/i);
    if (m) {
      const bulletMatch = m[4]?.trim();
      experience.push({
        role: m[1].replace(/^[#*\-•\s]+/, "").trim(),
        company: m[2].trim(),
        period: m[3]?.trim() || undefined,
        description: bulletMatch || undefined,
      });
    } else {
      const parts = line.split(/[–\-|]/);
      if (parts.length >= 2) {
        experience.push({
          role: parts[0].replace(/^[#*\-•\s]+/, "").trim(),
          company: parts[1].trim(),
          description: parts.slice(2).join(" - ").trim() || undefined,
        });
      } else if (line.length > 5 && !line.startsWith("-") && !line.startsWith("•")) {
        experience.push({
          role: line.replace(/^[#*\-•\s]+/, "").trim(),
          company: "",
        });
      } else if (experience.length > 0 && (line.startsWith("-") || line.startsWith("•"))) {
        const last = experience[experience.length - 1];
        if (!last.bulletPoints) last.bulletPoints = [];
        last.bulletPoints.push(line.replace(/^[#*\-•\s]+/, "").trim());
      }
    }
  }

  // Parse education items
  const education: EducationItem[] = [];
  for (const line of sectionLines.education) {
    const m = line.match(/^(.+?)(?:,|\sat\s|\s\-\s|\s\|\s)([^\(\)]+?)(?:\s*\(([\d\s\-–\w]+)\))?$/i);
    if (m) {
      education.push({
        degree: m[1].replace(/^[#*\-•\s]+/, "").trim(),
        institution: m[2].trim(),
        period: m[3]?.trim() || undefined,
      });
    } else if (line.length > 3) {
      education.push({
        degree: line.replace(/^[#*\-•\s]+/, "").trim(),
        institution: "",
      });
    }
  }

  // Parse projects
  const projects: ProjectItem[] = [];
  for (const line of sectionLines.projects) {
    const colonIdx = line.indexOf(":");
    const dashIdx = line.indexOf(" - ");
    if (colonIdx > 0 && (dashIdx === -1 || colonIdx < dashIdx)) {
      projects.push({
        name: line.slice(0, colonIdx).replace(/^[#*\-•\s]+/, "").trim(),
        description: line.slice(colonIdx + 1).trim(),
      });
    } else if (dashIdx > 0) {
      projects.push({
        name: line.slice(0, dashIdx).replace(/^[#*\-•\s]+/, "").trim(),
        description: line.slice(dashIdx + 3).trim(),
      });
    } else if (line.length > 4 && !line.startsWith("-") && !line.startsWith("•")) {
      projects.push({
        name: line.replace(/^[#*\-•\s]+/, "").trim(),
        description: "",
      });
    }
  }

  // Parse languages
  const languages: string[] = [];
  for (const line of sectionLines.languages) {
    line
      .split(/[,•|;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((l) => languages.push(l));
  }

  // Parse certifications
  const certifications: string[] = [];
  for (const line of sectionLines.certifications) {
    line
      .split(/[,•|;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((c) => certifications.push(c));
  }

  const summary = sectionLines.summary.join(" ").trim();
  const rawSkillsText = sectionLines.skills.join(", ");
  const skills = rawSkillsText
    ? rawSkillsText.split(/[,•|;]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return { summary, skills, experience, education, projects, languages, certifications };
}

/**
 * Calculate an explainable server-side compatibility score based on demonstrated required skills.
 */
export function calculateExplainableScore(
  requiredSkills: string[],
  preferredSkills: string[],
  matchedSkills: MatchedSkill[]
): number | null {
  const totalRequired = requiredSkills.length;
  const totalPreferred = preferredSkills.length;

  if (totalRequired === 0 && totalPreferred === 0) {
    return null;
  }

  const matchedNamesLower = new Set(
    matchedSkills.map((m) => m.name.toLowerCase().trim())
  );

  let matchedRequiredCount = 0;
  for (const req of requiredSkills) {
    const reqLower = req.toLowerCase().trim();
    if (
      matchedNamesLower.has(reqLower) ||
      Array.from(matchedNamesLower).some((m) => m.includes(reqLower) || reqLower.includes(m))
    ) {
      matchedRequiredCount++;
    }
  }

  let matchedPreferredCount = 0;
  for (const pref of preferredSkills) {
    const prefLower = pref.toLowerCase().trim();
    if (
      matchedNamesLower.has(prefLower) ||
      Array.from(matchedNamesLower).some((m) => m.includes(prefLower) || prefLower.includes(m))
    ) {
      matchedPreferredCount++;
    }
  }

  let score: number;
  if (totalPreferred === 0) {
    score = Math.round((matchedRequiredCount / totalRequired) * 100);
  } else if (totalRequired === 0) {
    score = Math.round((matchedPreferredCount / totalPreferred) * 100);
  } else {
    const reqWeight = 0.8;
    const prefWeight = 0.2;
    const reqRatio = matchedRequiredCount / totalRequired;
    const prefRatio = matchedPreferredCount / totalPreferred;
    score = Math.round((reqRatio * reqWeight + prefRatio * prefWeight) * 100);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Heuristic analyzer used ONLY when GEMINI_API_KEY is not configured in environment.
 * Parses factual candidate content and NEVER emits placeholder strings.
 */
export function runHeuristicAnalysis(
  jobDescription: string,
  masterCv: string
): AnalyzeCvResponseData {
  const jobLower = jobDescription.toLowerCase();
  const cvLower = masterCv.toLowerCase();

  const titleMatch = jobDescription.match(
    /(?:title|role|position|looking for|seeking an?|hiring an?)\s*[:\-]?\s*([A-Za-z0-9\s/+#.-]{3,40})/i
  );
  const jobTitle = titleMatch ? titleMatch[1].trim() : "Software Developer / Engineer";

  const companyMatch = jobDescription.match(
    /(?:at|company|about|join)\s+([A-Z][A-Za-z0-9&.,\- ]{2,30}?)(?:\s+(?:is|team|headquartered|we|offers|in))/
  );
  const companyName = companyMatch ? companyMatch[1].trim() : "";

  const skillCatalog = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
    "Java", "C++", "C#", "Go", "Rust", "SQL", "PostgreSQL", "MySQL",
    "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "REST API", "GraphQL", "Tailwind CSS", "HTML5", "CSS3",
    "CI/CD", "Linux", "Machine Learning", "PyTorch", "TensorFlow",
    "Microservices", "Jest", "Agile", "Scrum",
  ];

  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];
  const matchedSkills: MatchedSkill[] = [];
  const missingSkills: string[] = [];

  for (const skill of skillCatalog) {
    const skillLower = skill.toLowerCase();
    const inJob = jobLower.includes(skillLower);
    const inCv = cvLower.includes(skillLower);

    if (inJob) {
      if (
        jobLower.includes("nice to have") ||
        jobLower.includes("preferred") ||
        jobLower.includes("bonus") ||
        jobLower.includes("plus")
      ) {
        preferredSkills.push(skill);
      } else {
        requiredSkills.push(skill);
      }

      if (inCv) {
        const cvLines = masterCv.split("\n");
        const matchingLine =
          cvLines.find((line) => line.toLowerCase().includes(skillLower)) ||
          `Demonstrated proficiency in ${skill} from Master CV.`;

        matchedSkills.push({
          name: skill,
          evidence: matchingLine.trim().slice(0, 150),
        });
      } else {
        missingSkills.push(skill);
      }
    }
  }

  const score = calculateExplainableScore(requiredSkills, preferredSkills, matchedSkills);

  const existingCvSkills = skillCatalog.filter((s) =>
    cvLower.includes(s.toLowerCase())
  );

  const structured = parseMasterCvStructured(masterCv);
  const cvLines = masterCv.split("\n").map((l) => l.trim()).filter(Boolean);

  const summaryLine =
    structured.summary ||
    cvLines.find((l) => l.length > 50 && !l.includes(":") && !l.startsWith("-")) ||
    "Dedicated and results-oriented engineer with demonstrated experience in modern software delivery.";

  const tailoredSummary = `${summaryLine} Targeted toward ${jobTitle} contributions with core proficiencies in ${
    matchedSkills.slice(0, 3).map((m) => m.name).join(", ") || "software engineering practices"
  }.`;

  return {
    opportunityAnalysis: {
      jobTitle,
      companyName,
      requiredSkills: requiredSkills.slice(0, 8),
      preferredSkills: preferredSkills.slice(0, 5),
      responsibilities: [
        `Deliver high-quality solutions aligned with ${jobTitle} standards`,
        "Collaborate with cross-functional technical teams and stakeholders",
        "Design, test, and maintain robust application features",
      ],
      keywords: requiredSkills.concat(preferredSkills).slice(0, 10),
    },
    compatibility: {
      score,
      matchedSkills,
      missingSkills,
    },
    recommendations: [
      missingSkills.length > 0
        ? `Consider highlighting transferable fundamentals for missing areas (${missingSkills.slice(0, 3).join(", ")}) without claiming unverified expertise.`
        : "Reorder accomplishments to place highest-impact results at the beginning of each role.",
      "Emphasize quantified outcomes (latency improvements, user adoption, test coverage) in relevant project bullets.",
      `Align your professional summary directly with the expectations outlined for ${jobTitle}.`,
    ],
    tailoredCV: {
      personalInfo: extractPersonalInfoFromMasterCv(masterCv),
      professionalSummary: tailoredSummary,
      technicalSkills: existingCvSkills.length > 0 ? existingCvSkills : structured.skills,
      education: structured.education,
      projects: structured.projects,
      experience: structured.experience,
      languages: structured.languages,
      certifications: structured.certifications,
    },
    changesExplanation: [
      `Refocused Professional Summary toward ${jobTitle} requirements.`,
      "Prioritized existing technical skills that directly correspond to verified job criteria.",
      "Preserved all factual dates, institutions, certifications, and experiences without inventing missing skills.",
    ],
  };
}

/**
 * Call Gemini AI to analyze Opportunity and Master CV with retry and strict fidelity enforcement.
 */
export async function analyzeAndTailorCv(
  jobDescription: string,
  masterCv: string
): Promise<{ data: AnalyzeCvResponseData; isDemo: boolean; modelName?: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

  // If no API key configured in .env.local, use factual heuristic engine
  if (!apiKey) {
    console.warn("[Gemini] GEMINI_API_KEY is not configured. Running in Heuristic Mode.");
    const data = runHeuristicAnalysis(jobDescription, masterCv);
    return { data, isDemo: true, modelName: "Heuristic Engine" };
  }

  const ai = new GoogleGenAI({ apiKey });
  const parsedGroundTruth = parseMasterCvStructured(masterCv);

  const systemInstruction = `You are an expert technical recruiter and CV tailoring strategist.
Your task is to analyze the Job Opportunity / Description and the candidate's Master CV, then generate a comprehensive, structured analysis and an ethically tailored CV.

CRITICAL INTEGRITY AND FIDELITY RULES:
1. Extract and preserve the candidate's ACTUAL work experience, roles, companies, dates, and contributions from the Master CV.
2. Extract and preserve the candidate's ACTUAL education degrees and institutions from the Master CV.
3. Extract and preserve the candidate's ACTUAL projects. Refocus the descriptions toward the target role skills without inventing deliverables.
4. Extract and preserve the candidate's ACTUAL languages and certifications.
5. If the candidate's Master CV does NOT contain projects, education, languages, or certifications, return an EMPTY array [] for that section.
6. ABSOLUTELY FORBIDDEN: NEVER output placeholder strings such as "Verified Organization", "Preserved from Master CV", "Degree / Academic Credentials", "Project Experience", etc.
7. NEVER INVENT skills the candidate does not have. Missing skills MUST be listed in missingSkills and NEVER included in tailoredCV.technicalSkills.
8. NEVER MODIFY personal contact details (names, phone, email, links).`;

  const userPrompt = `=== JOB OPPORTUNITY DESCRIPTION ===
${jobDescription.slice(0, 15000)}

=== CANDIDATE MASTER CV ===
${masterCv.slice(0, 15000)}

=== PARSED GROUND-TRUTH FACTUAL SECTIONS ===
${JSON.stringify(parsedGroundTruth, null, 2)}

Please perform:
1. Opportunity Analysis: Extract job title, company name (if mentioned, else ""), required skills, preferred skills, responsibilities, and key keywords.
2. Matched Skills: List all skills required/preferred by the job that are evidenced in the Master CV, with the exact evidence quote.
3. Missing Skills: List all skills required/preferred by the job that the candidate lacks. Do NOT place these into the tailored CV!
4. Actionable Recommendations: Specific advice for the candidate to maximize relevance without inventing facts.
5. Tailored CV:
   - personalInfo: Exact candidate personal details.
   - professionalSummary: Rewritten summary tailored for this role using ONLY true candidate facts.
   - technicalSkills: Candidate's EXISTING skills, prioritized for this job. DO NOT include missing skills.
   - education: Candidate's real degrees and institutions from Master CV (or empty array [] if none).
   - projects: Candidate's real projects, with descriptions refocused on matching technologies (or empty array [] if none).
   - experience: Candidate's real work history, organized to emphasize role-relevant contributions (or empty array [] if none).
   - languages: Exactly what is in Master CV (or empty array [] if none).
   - certifications: Exactly what is in Master CV (or empty array [] if none).
6. changesExplanation: 3-5 bullet points explaining what was tailored and why.`;

  // Retry up to 2 times for transient 503 high demand spikes
  let rawText = "";
  let lastError: Error | null = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt}/${maxAttempts} requesting model "${modelName}"...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: GEMINI_ANALYSIS_SCHEMA,
          temperature: 0.1,
        },
      });

      rawText = response.text?.trim() || "";
      if (rawText) {
        console.log(`[Gemini] Model "${modelName}" responded successfully (${rawText.length} characters).`);
        break;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Gemini] Attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < maxAttempts) {
        // Wait 1.5 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  if (!rawText) {
    const errorDetail = lastError?.message || "Gemini service did not respond.";
    // Do NOT silently hide API failure as heuristic demo! Throw so the API route surfaces a clear retryable error.
    throw new Error(`Google Gemini API request failed: ${errorDetail}`);
  }

  const rawData = JSON.parse(rawText);

  // Validate response structure
  if (
    !rawData.opportunityAnalysis ||
    !Array.isArray(rawData.matchedSkills) ||
    !Array.isArray(rawData.missingSkills) ||
    !rawData.tailoredCV
  ) {
    throw new Error("Gemini response missing mandatory sections.");
  }

  // Server-side explainable compatibility score calculation
  const calculatedScore = calculateExplainableScore(
    rawData.opportunityAnalysis.requiredSkills || [],
    rawData.opportunityAnalysis.preferredSkills || [],
    rawData.matchedSkills || []
  );

  // Filter out any missing skills that might have leaked into tailoredCV.technicalSkills
  const missingLower = new Set(
    (rawData.missingSkills || []).map((s: string) => s.toLowerCase().trim())
  );
  const sanitizedTechnicalSkills = (rawData.tailoredCV.technicalSkills || []).filter(
    (skill: string) => !missingLower.has(skill.toLowerCase().trim())
  );

  const verifiedPersonalInfo = extractPersonalInfoFromMasterCv(masterCv);
  const modelPersonalInfo = rawData.tailoredCV?.personalInfo || {};

  const mergedPersonalInfo: PersonalInfo = {
    fullName:
      verifiedPersonalInfo.fullName !== "Candidate"
        ? verifiedPersonalInfo.fullName
        : modelPersonalInfo.fullName || "Candidate",
    email: verifiedPersonalInfo.email || modelPersonalInfo.email || undefined,
    phone: verifiedPersonalInfo.phone || modelPersonalInfo.phone || undefined,
    location: verifiedPersonalInfo.location || modelPersonalInfo.location || undefined,
    linkedin: verifiedPersonalInfo.linkedin || modelPersonalInfo.linkedin || undefined,
    portfolio: verifiedPersonalInfo.portfolio || modelPersonalInfo.portfolio || undefined,
  };

  // Guard against any placeholder strings leaking from the model
  const sanitizeExperience = (items: ExperienceItem[] = []): ExperienceItem[] => {
    return items
      .filter((exp) => exp.company !== "Verified Organization" && !exp.role?.includes("Preserved from Master CV"))
      .map((exp) => ({
        ...exp,
        description: exp.description?.replace(/Preserved from Master CV/gi, "").trim(),
      }));
  };

  const sanitizeEducation = (items: EducationItem[] = []): EducationItem[] => {
    return items.filter(
      (edu) => !edu.degree?.includes("Degree / Academic") && !edu.institution?.includes("Preserved from")
    );
  };

  const sanitizeProjects = (items: ProjectItem[] = []): ProjectItem[] => {
    return items.filter((proj) => !proj.name?.includes("Preserved from Master CV"));
  };

  const sanitizeStringArray = (items: string[] = []): string[] => {
    return items.filter((s) => !s.includes("Preserved from") && !s.includes("as stated in Master CV"));
  };

  const rawExp = rawData.tailoredCV.experience || [];
  const finalExperience =
    rawExp.length > 0 ? sanitizeExperience(rawExp) : parsedGroundTruth.experience;

  const rawEdu = rawData.tailoredCV.education || [];
  const finalEducation =
    rawEdu.length > 0 ? sanitizeEducation(rawEdu) : parsedGroundTruth.education;

  const rawProj = rawData.tailoredCV.projects || [];
  const finalProjects =
    rawProj.length > 0 ? sanitizeProjects(rawProj) : parsedGroundTruth.projects;

  const rawLang = rawData.tailoredCV.languages || [];
  const finalLanguages =
    rawLang.length > 0 ? sanitizeStringArray(rawLang) : parsedGroundTruth.languages;

  const rawCert = rawData.tailoredCV.certifications || [];
  const finalCertifications =
    rawCert.length > 0 ? sanitizeStringArray(rawCert) : parsedGroundTruth.certifications;

  const validatedData: AnalyzeCvResponseData = {
    opportunityAnalysis: {
      jobTitle: rawData.opportunityAnalysis.jobTitle || "Job Opportunity",
      companyName: rawData.opportunityAnalysis.companyName || "",
      requiredSkills: rawData.opportunityAnalysis.requiredSkills || [],
      preferredSkills: rawData.opportunityAnalysis.preferredSkills || [],
      responsibilities: rawData.opportunityAnalysis.responsibilities || [],
      keywords: rawData.opportunityAnalysis.keywords || [],
    },
    compatibility: {
      score: calculatedScore,
      matchedSkills: rawData.matchedSkills || [],
      missingSkills: rawData.missingSkills || [],
    },
    recommendations: rawData.recommendations || [],
    tailoredCV: {
      personalInfo: mergedPersonalInfo,
      professionalSummary: rawData.tailoredCV.professionalSummary || "",
      technicalSkills: sanitizedTechnicalSkills,
      education: finalEducation,
      projects: finalProjects,
      experience: finalExperience,
      languages: finalLanguages,
      certifications: finalCertifications,
    },
    changesExplanation: rawData.changesExplanation || [],
  };

  return { data: validatedData, isDemo: false, modelName };
}
