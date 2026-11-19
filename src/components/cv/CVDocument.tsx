import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { TailoredCV, ExperienceItem, ProjectItem, EducationItem } from "@/types";

// Design specifications:
// - A4 paper, white background
// - Dark navy headings: #0f172a / #1e293b
// - Subtle blue accent color: #2563eb
// - Professional Helvetica typography
// - Consistent margins and line spacing
// - Clean section dividers
const styles = StyleSheet.create({
  page: {
    size: "A4",
    backgroundColor: "#ffffff",
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#334155", // slate-700
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb", // blue accent line
    paddingBottom: 10,
  },
  fullName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a", // dark navy
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  targetRole: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb", // blue accent
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    fontSize: 8.5,
    color: "#64748b", // slate-500
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactBullet: {
    marginHorizontal: 4,
    color: "#cbd5e1",
  },
  section: {
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a", // dark navy
    textTransform: "uppercase",
    letterSpacing: 0.6,
    borderBottomWidth: 0.75,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 3,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.45,
    textAlign: "justify",
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillBadge: {
    backgroundColor: "#f1f5f9",
    color: "#1e293b",
    fontSize: 8.5,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  itemBlock: {
    marginBottom: 8,
  },
  itemHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1.5,
  },
  itemTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  itemSubtitle: {
    fontSize: 9,
    color: "#2563eb",
    fontFamily: "Helvetica-Bold",
  },
  itemPeriod: {
    fontSize: 8.5,
    color: "#64748b",
  },
  itemDescription: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.35,
    marginTop: 2,
  },
  bulletList: {
    marginTop: 2.5,
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 8,
    color: "#2563eb",
    marginRight: 4,
  },
  bulletText: {
    fontSize: 8.5,
    color: "#475569",
    flex: 1,
    lineHeight: 1.35,
  },
  techPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
  },
  techPill: {
    fontSize: 7.5,
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  inlineList: {
    fontSize: 9,
    color: "#334155",
  },
});

interface CVDocumentProps {
  cv: TailoredCV;
  jobTitle?: string;
}

export default function CVDocument({ cv, jobTitle }: CVDocumentProps) {
  const info = cv.personalInfo;

  // Filter available contact fields without inventing missing details
  const contacts: string[] = [];
  if (info?.email) contacts.push(info.email);
  if (info?.phone) contacts.push(info.phone);
  if (info?.location) contacts.push(info.location);
  if (info?.linkedin) contacts.push(info.linkedin.replace(/^https?:\/\/(www\.)?/, ""));
  if (info?.portfolio) contacts.push(info.portfolio.replace(/^https?:\/\/(www\.)?/, ""));

  // Filter valid experience items and drop placeholders
  const validExperience = (cv.experience || []).filter((item) => {
    if (typeof item === "string") {
      const s = item.trim();
      return s.length > 0 && !s.includes("Preserved from Master CV");
    }
    const exp = item as ExperienceItem;
    if (exp.company === "Verified Organization" || exp.role?.includes("Preserved from Master CV")) {
      return false;
    }
    return Boolean(exp.role || exp.company || exp.description);
  });

  // Filter valid education items and drop placeholders
  const validEducation = (cv.education || []).filter((item) => {
    if (typeof item === "string") {
      const s = item.trim();
      return s.length > 0 && !s.includes("Degree / Academic") && !s.includes("Preserved from");
    }
    const edu = item as EducationItem;
    if (edu.degree?.includes("Degree / Academic") || edu.institution?.includes("Preserved from")) {
      return false;
    }
    return Boolean(edu.degree || edu.institution);
  });

  // Filter valid projects and drop placeholders
  const validProjects = (cv.projects || []).filter((item) => {
    if (typeof item === "string") {
      const s = item.trim();
      return s.length > 0 && !s.includes("Preserved from Master CV");
    }
    const proj = item as ProjectItem;
    if (proj.name?.includes("Preserved from Master CV")) {
      return false;
    }
    return Boolean(proj.name || proj.description);
  });

  // Filter valid languages and drop placeholders
  const validLanguages = (cv.languages || []).filter(
    (l) => l.trim().length > 0 && !l.includes("as stated in Master CV") && !l.includes("Preserved from")
  );

  // Filter valid certifications and drop placeholders
  const validCertifications = (cv.certifications || []).filter(
    (c) => c.trim().length > 0 && !c.includes("Preserved from Master CV")
  );

  const displayName = info?.fullName || "Candidate";

  return (
    <Document
      title={`${displayName} - CV`}
      author="CV Tailor AI"
      subject="Tailored Curriculum Vitae"
      keywords="CV, Resume, Tailored"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* 1. Personal Information Header */}
        <View style={styles.header}>
          <Text style={styles.fullName}>{displayName}</Text>
          {jobTitle && <Text style={styles.targetRole}>{jobTitle}</Text>}
          {contacts.length > 0 && (
            <View style={styles.contactRow}>
              {contacts.map((contact, index) => (
                <View key={index} style={styles.contactItem}>
                  <Text>{contact}</Text>
                  {index < contacts.length - 1 && (
                    <Text style={styles.contactBullet}>•</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 2. Professional Summary */}
        {cv.professionalSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{cv.professionalSummary}</Text>
          </View>
        )}

        {/* 3. Technical Skills */}
        {cv.technicalSkills && cv.technicalSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <View style={styles.skillsWrap}>
              {cv.technicalSkills.map((skill, index) => (
                <Text key={index} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* 4. Professional Experience */}
        {validExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {validExperience.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <View key={index} style={styles.itemBlock} wrap={false}>
                    <Text style={styles.itemDescription}>{item}</Text>
                  </View>
                );
              }
              const exp = item as ExperienceItem;
              return (
                <View key={index} style={styles.itemBlock} wrap={false}>
                  <View style={styles.itemHeaderRow}>
                    <Text style={styles.itemTitle}>{exp.role}</Text>
                    {exp.period && <Text style={styles.itemPeriod}>{exp.period}</Text>}
                  </View>
                  {exp.company && <Text style={styles.itemSubtitle}>{exp.company}</Text>}
                  {exp.description && (
                    <Text style={styles.itemDescription}>{exp.description}</Text>
                  )}
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.bulletPoints.map((bp, bidx) => (
                        <View key={bidx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>›</Text>
                          <Text style={styles.bulletText}>{bp}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 5. Education */}
        {validEducation.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {validEducation.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <View key={index} style={styles.itemBlock} wrap={false}>
                    <Text style={styles.itemDescription}>{item}</Text>
                  </View>
                );
              }
              const edu = item as EducationItem;
              return (
                <View key={index} style={styles.itemBlock} wrap={false}>
                  <View style={styles.itemHeaderRow}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    {edu.period && <Text style={styles.itemPeriod}>{edu.period}</Text>}
                  </View>
                  {edu.institution && <Text style={styles.itemSubtitle}>{edu.institution}</Text>}
                  {edu.details && (
                    <Text style={styles.itemDescription}>{edu.details}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 6. Projects */}
        {validProjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Projects</Text>
            {validProjects.map((item, index) => {
              if (typeof item === "string") {
                return (
                  <View key={index} style={styles.itemBlock} wrap={false}>
                    <Text style={styles.itemDescription}>{item}</Text>
                  </View>
                );
              }
              const proj = item as ProjectItem;
              return (
                <View key={index} style={styles.itemBlock} wrap={false}>
                  <View style={styles.itemHeaderRow}>
                    <Text style={styles.itemTitle}>{proj.name}</Text>
                  </View>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <View style={styles.techPillsRow}>
                      {proj.technologies.map((t, tidx) => (
                        <Text key={tidx} style={styles.techPill}>
                          {t}
                        </Text>
                      ))}
                    </View>
                  )}
                  {proj.description && (
                    <Text style={styles.itemDescription}>{proj.description}</Text>
                  )}
                  {proj.highlights && proj.highlights.length > 0 && (
                    <View style={styles.bulletList}>
                      {proj.highlights.map((h, hidx) => (
                        <View key={hidx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>›</Text>
                          <Text style={styles.bulletText}>{h}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* 7. Languages */}
        {validLanguages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.inlineList}>{validLanguages.join("   •   ")}</Text>
          </View>
        )}

        {/* 8. Certifications */}
        {validCertifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications &amp; Credentials</Text>
            <Text style={styles.inlineList}>{validCertifications.join("   •   ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
