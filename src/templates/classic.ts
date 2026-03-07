/**
 * Classic ATS-compliant resume template
 * Single-column layout with clean, professional styling
 * Uses Times New Roman font for traditional appearance
 */

import type { ResumeTemplate, TemplateOptions } from '@resume-types/template.types';
import type { Resume } from '@resume-types/resume.types';
import {
  baseTemplateValidation,
  escapeHtml,
  formatDate,
} from './templateHelpers';
import { isSingleEducation, isEducationArray } from '@resume-types/resume.types';
import { registerTemplate } from './templateRegistry';

/**
 * Classic template implementation
 */
export const classicTemplate: ResumeTemplate = {
  name: 'classic',
  description: 'Classic single-column template with clean styling and Times New Roman font',

  render(resume: Resume, options?: TemplateOptions): string {
    // Always start with multiplier 1.0 (11pt base)
    // Autofit will reduce if needed
    const multiplier = options?.multiplier ?? 1.0;
    const css = getCss(options, multiplier);
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(resume.personalInfo.name)} - Resume</title>
  <style>
    ${css}
  </style>
</head>
<body>
  <div class="resume">
    ${renderHeader(resume)}
    ${resume.summary ? renderSummary(resume.summary) : ''}
    ${renderExperience(resume.experience)}
    ${resume.education ? renderEducation(resume.education) : ''}
    ${resume.skills ? renderSkills(resume.skills) : ''}
    ${resume.certifications ? renderCertifications(resume.certifications) : ''}
    ${resume.projects ? renderProjects(resume.projects) : ''}
    ${resume.languages ? renderLanguages(resume.languages) : ''}
    ${resume.awards ? renderAwards(resume.awards) : ''}
    ${resume.courses ? renderCourses(resume.courses) : ''}
  </div>
</body>
</html>`;

    return html.trim();
  },

  validate(resume: Resume) {
    return baseTemplateValidation(resume);
  },
};

// Register the template
registerTemplate(classicTemplate);

/**
 * Get CSS styles for classic template
 * Classic styling uses Times New Roman font
 */
function getCss(options?: TemplateOptions, multiplier: number = 1.0): string {
  const customCss = options?.customCss || '';

  // Base preset with 11pt font size (maximum)
  const baseSpacing = {
    bodyPadding: '0.35in',
    bodyFontSize: 11, // Base: 11pt (stored as number)
    lineHeight: 1.6,  // Base line height
    headerMarginBottom: '8pt',
    headerPaddingBottom: '2pt',
    headerH1FontSize: 20,
    headerH1MarginBottom: '2pt',
    headerContactFontSize: 8,
    headerContactSpanMargin: '0 2pt',
    sectionMarginBottom: '8pt',
    sectionTitleFontSize: 11,
    sectionTitleMarginBottom: '4pt',
    sectionTitlePaddingBottom: '2pt',
    summaryLineHeight: 1.6,
    summaryMarginBottom: '10pt',
    experienceItemMarginBottom: '6pt',
    experienceHeaderMarginBottom: '2pt',
    bulletMarginTop: '2pt',
    bulletMarginLeft: '16pt',
    bulletMarginBottom: '0.5pt',
    skillsCategoriesMarginTop: '4pt',
    skillCategoryMarginBottom: '0.5pt',
    skillCategoryNameMarginBottom: '2pt',
    certificationItemMarginBottom: '5pt',
    certificationIssuerMarginTop: '1pt',
  };

  // Apply multiplier to typography only
  const s = {
    ...baseSpacing,
    bodyFontSize: `${(baseSpacing.bodyFontSize * multiplier).toFixed(1)}pt`,
    lineHeight: Math.max(baseSpacing.lineHeight * multiplier, 1.0).toFixed(2),
    headerH1FontSize: `${(baseSpacing.headerH1FontSize * multiplier).toFixed(1)}pt`,
    headerContactFontSize: `${(baseSpacing.headerContactFontSize * multiplier).toFixed(1)}pt`,
    sectionTitleFontSize: `${(baseSpacing.sectionTitleFontSize * multiplier).toFixed(1)}pt`,
    summaryLineHeight: Math.max(baseSpacing.summaryLineHeight * multiplier, 1.0).toFixed(2),
  };

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Times New Roman", Times, serif;
      font-size: ${s.bodyFontSize};
      line-height: ${s.lineHeight};
      font-weight: 500;
      color: #000000;
      background-color: #ffffff;
      padding: ${s.bodyPadding};
    }

    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      text-align: center;
      margin-bottom: ${s.headerMarginBottom};
      padding-bottom: ${s.headerPaddingBottom};
    }

    .header h1 {
      font-size: ${s.headerH1FontSize};
      font-weight: bold;
      margin-bottom: ${s.headerH1MarginBottom};
      color: #000000;
    }

    .header .contact-info {
      font-size: ${s.bodyFontSize};
      color: #000000;
      padding: 0;
    }

    .header .contact-info span {
      margin: ${s.headerContactSpanMargin};
    }

    .header .contact-info span:first-child {
      margin-left: 0;
    }

    .header .contact-info span:last-child {
      margin-right: 0;
    }

    .header .contact-info .separator {
      margin: 0 2pt;
      color: #000000;
    }

    .section {
      margin-bottom: ${s.sectionMarginBottom};
    }

    .section-title {
      font-size: ${s.sectionTitleFontSize};
      font-weight: bold;
      margin-bottom: ${s.sectionTitleMarginBottom};
      color: #000000;
      text-transform: uppercase;
      border-bottom: 1pt solid #000000;
      padding-bottom: ${s.sectionTitlePaddingBottom};
    }

    .summary {
      font-size: ${s.bodyFontSize};
      line-height: ${s.summaryLineHeight};
      margin-bottom: ${s.summaryMarginBottom};
      text-align: justify;
    }

    .experience-item,
    .education-item {
      margin-bottom: ${s.experienceItemMarginBottom};
    }

    .experience-header,
    .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: ${s.experienceHeaderMarginBottom};
    }

    .experience-title,
    .education-title {
      font-weight: normal;
      font-size: ${s.bodyFontSize};
      font-style: italic;
    }

    .experience-company,
    .education-institution {
      font-weight: bold;
      font-size: ${s.bodyFontSize};
    }

    .education-institution-gpa {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${s.experienceHeaderMarginBottom};
    }

    .education-gpa {
      font-size: ${s.bodyFontSize};
      color: #000000;
    }

    .experience-company-location {
      font-size: ${s.bodyFontSize};
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${s.experienceHeaderMarginBottom};
    }

    .experience-location {
      font-size: ${s.bodyFontSize};
      color: #000000;
      font-style: italic;
    }

    .education-location,
    .experience-dates,
    .education-dates {
      font-size: ${s.bodyFontSize};
      color: #000000;
      font-weight: bold;
    }

    .bullet-points {
      margin-top: ${s.bulletMarginTop};
      margin-left: ${s.bulletMarginLeft};
    }

    .bullet-points li {
      margin-bottom: ${s.bulletMarginBottom};
      font-size: ${s.bodyFontSize};
    }

    .skills-categories {
      margin-top: ${s.skillsCategoriesMarginTop};
      line-height: 1;
    }

    .skill-category {
      display: block;
      margin-bottom: ${s.skillCategoryMarginBottom};
      line-height: 1.2;
    }

    .skill-category-name {
      font-weight: bold;
      font-size: ${s.bodyFontSize};
    }

    .skill-items {
      font-size: ${s.bodyFontSize};
    }

    .certification-item,
    .project-item,
    .language-item,
    .award-item {
      margin-bottom: ${s.certificationItemMarginBottom};
    }

    .certification-name,
    .project-name,
    .award-name {
      font-weight: bold;
      font-size: ${s.bodyFontSize};
    }

    .certification-issuer,
    .project-description,
    .award-issuer {
      font-size: ${s.bodyFontSize};
      margin-top: ${s.certificationIssuerMarginTop};
    }

    @media print {
      body {
        padding: 0;
      }
      .resume {
        max-width: 100%;
      }
    }

    ${customCss}
  `;
}

/**
 * Render header with personal information
 */
function renderHeader(resume: Resume): string {
  const { personalInfo } = resume;
  const contactParts: string[] = [];

  contactParts.push(escapeHtml(personalInfo.email));
  contactParts.push(escapeHtml(personalInfo.phone));
  contactParts.push(escapeHtml(personalInfo.location));

  if (personalInfo.linkedin) {
    contactParts.push(escapeHtml(personalInfo.linkedin));
  }
  if (personalInfo.github) {
    contactParts.push(escapeHtml(personalInfo.github));
  }
  if (personalInfo.website) {
    contactParts.push(escapeHtml(personalInfo.website));
  }

  return `
    <div class="header">
      <h1>${escapeHtml(personalInfo.name)}</h1>
      <div class="contact-info">
        ${contactParts.map((part) => `<span>${part}</span>`).join(' <span class="separator">|</span> ')}
      </div>
    </div>
  `;
}

/**
 * Render summary section
 */
function renderSummary(summary: string): string {
  return `
    <div class="section">
      <div class="summary">${escapeHtml(summary)}</div>
    </div>
  `;
}

/**
 * Render experience section
 */
function renderExperience(experience: Resume['experience']): string {
  if (!experience || experience.length === 0) {
    return '';
  }

  const items = experience
    .filter((exp) => !exp.disabled)
    .map((exp) => {
      const bulletPoints = exp.bulletPoints
        .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
        .join('');

      return `
        <div class="experience-item">
          <div class="experience-header">
            <div class="experience-company">${escapeHtml(exp.company)}</div>
            <div class="experience-dates">${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}</div>
          </div>
          <div class="experience-company-location">
            <span class="experience-title">${escapeHtml(exp.role)}</span>
            <span class="experience-location">${escapeHtml(exp.location)}</span>
          </div>
          <ul class="bullet-points">
            ${bulletPoints}
          </ul>
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${items}
    </div>
  `;
}

/**
 * Render education section
 */
function renderEducation(education: Resume['education']): string {
  if (!education) {
    return '';
  }

  let educationItems: string[] = [];

  if (isSingleEducation(education)) {
    if (!education.disabled) {
      educationItems = [renderEducationItem(education)];
    }
  } else if (isEducationArray(education)) {
    educationItems = education
      .filter((edu) => !edu.disabled)
      .map((edu) => renderEducationItem(edu));
  }

  if (educationItems.length === 0) {
    return '';
  }

  return `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${educationItems.join('')}
    </div>
  `;
}

/**
 * Render a single education item
 */
function renderEducationItem(edu: {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  honors?: string[];
}): string {
  const parts: string[] = [];
  parts.push(escapeHtml(edu.degree));
  if (edu.field) {
    parts.push(escapeHtml(edu.field));
  }
  const degreeLine = parts.join(' in ');

  return `
    <div class="education-item">
      <div class="education-header">
        <div class="education-institution">${escapeHtml(edu.institution)}</div>
        <div class="education-dates">${formatDate(edu.graduationDate)}</div>
      </div>
      <div class="education-institution-gpa">
        <span class="education-title">${degreeLine}</span>
        ${edu.gpa ? `<span class="education-gpa">GPA: ${escapeHtml(edu.gpa)}</span>` : ''}
      </div>
      ${edu.honors && edu.honors.length > 0 ? `<div>Honors: ${edu.honors.map((h) => escapeHtml(h)).join(', ')}</div>` : ''}
    </div>
  `;
}

/**
 * Render skills section
 */
function renderSkills(skills: Resume['skills']): string {
  if (!skills || typeof skills !== 'object' || !skills.categories) {
    return '';
  }

  const categories = skills.categories
    .filter((category) => !category.disabled)
    .map((category) => {
      const items = category.items.map((item) => escapeHtml(item)).join(', ');
      return `
        <div class="skill-category">
          <span class="skill-category-name">${escapeHtml(category.name)}: </span>
          <span class="skill-items">${items}</span>
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      <div class="skills-categories">
        ${categories}
      </div>
    </div>
  `;
}

/**
 * Render certifications section
 */
function renderCertifications(certifications: Resume['certifications']): string {
  if (!certifications || !Array.isArray(certifications)) {
    return '';
  }

  const items = certifications
    .filter((cert) => !cert.disabled)
    .map((cert) => {
      const dateInfo = cert.expirationDate
        ? `${formatDate(cert.date)} - ${formatDate(cert.expirationDate)}`
        : formatDate(cert.date);

      return `
        <div class="certification-item">
          <div class="certification-name">${escapeHtml(cert.name)}</div>
          <div class="certification-issuer">
            ${escapeHtml(cert.issuer)} | ${dateInfo}
            ${cert.credentialId ? ` | Credential ID: ${escapeHtml(cert.credentialId)}` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      ${items}
    </div>
  `;
}

/**
 * Render projects section
 */
function renderProjects(projects: Resume['projects']): string {
  if (!projects || !Array.isArray(projects)) {
    return '';
  }

  const items = projects
    .filter((project) => !project.disabled)
    .map((project) => {
      const links: string[] = [];
      if (project.url) {
        links.push(`<a href="${escapeHtml(project.url)}">Website</a>`);
      }
      if (project.github) {
        links.push(`<a href="${escapeHtml(project.github)}">GitHub</a>`);
      }
      const linksHtml = links.length > 0 ? ` | ${links.join(' | ')}` : '';

      const technologiesBullet = project.technologies && project.technologies.length > 0
        ? `<li>Technologies: ${project.technologies.map((t) => escapeHtml(t)).join(', ')}</li>`
        : '';

      return `
        <div class="project-item">
          <div class="project-name">${escapeHtml(project.name)}${linksHtml}</div>
          <ul class="bullet-points">
            <li>${escapeHtml(project.description)}</li>
            ${technologiesBullet}
          </ul>
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Projects</h2>
      ${items}
    </div>
  `;
}

/**
 * Render languages section
 */
function renderLanguages(languages: Resume['languages']): string {
  if (!languages || !Array.isArray(languages)) {
    return '';
  }

  const enabledLanguages = languages.filter((lang) => !lang.disabled);
  
  if (enabledLanguages.length === 0) {
    return '';
  }

  const languagesText = enabledLanguages
    .map((lang) => {
      if (lang.proficiency) {
        return `${escapeHtml(lang.name)} (${escapeHtml(lang.proficiency)})`;
      }
      return escapeHtml(lang.name);
    })
    .join(', ');

  return `
    <div class="section">
      <h2 class="section-title">Languages</h2>
      <div class="language-item">${languagesText}</div>
    </div>
  `;
}

/**
 * Render awards section
 */
function renderAwards(awards: Resume['awards']): string {
  if (!awards || !Array.isArray(awards)) {
    return '';
  }

  const items = awards
    .filter((award) => !award.disabled)
    .map((award) => {
      return `
        <div class="award-item">
          <div class="award-name">${escapeHtml(award.name)}</div>
          <div class="award-issuer">
            ${escapeHtml(award.issuer)} | ${formatDate(award.date)}
            ${award.description ? ` | ${escapeHtml(award.description)}` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Awards</h2>
      ${items}
    </div>
  `;
}

/**
 * Render courses section
 */
function renderCourses(courses: Resume['courses']): string {
  if (!courses || !Array.isArray(courses)) {
    return '';
  }

  const items = courses
    .filter((course) => !course.disabled)
    .map((course) => {
      const courseName = `${escapeHtml(course.courseNumber)} - ${escapeHtml(course.title)}`;
      const parts: string[] = [];
      
      if (course.semester) {
        parts.push(`Semester: ${escapeHtml(course.semester)}`);
      }
      
      if (course.grade) {
        parts.push(`Grade Achieved: ${escapeHtml(course.grade)}`);
      }
      
      const fullLine = parts.length > 0
        ? `${courseName} | ${parts.join(' | ')}`
        : courseName;

      return `<li>${fullLine}</li>`;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Relevant Coursework</h2>
      <ul class="bullet-points">
        ${items}
      </ul>
    </div>
  `;
}
