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
  estimateContentDensity,
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
    // Determine spacing mode
    let spacing: 'compact' | 'normal' = 'normal';
    if (options?.spacing === 'auto') {
      spacing = estimateContentDensity(resume);
    } else if (options?.spacing === 'compact') {
      spacing = 'compact';
    } else if (options?.spacing === 'spacious') {
      spacing = 'normal'; // Spacious not implemented yet, fallback to normal
    }

    const css = getCss(options, spacing);
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
function getCss(options?: TemplateOptions, spacing: 'compact' | 'normal' = 'normal'): string {
  const customCss = options?.customCss || '';

  // Define spacing presets
  const spacingPresets = {
    compact: {
      bodyPadding: '0.35in',
      bodyFontSize: '9.5pt',
      lineHeight: '1.25',
      headerMarginBottom: '8pt',
      headerPaddingBottom: '2pt',
      headerH1FontSize: '16pt',
      headerH1MarginBottom: '2pt',
      headerContactFontSize: '8pt',
      headerContactSpanMargin: '0 2pt',
      sectionMarginBottom: '8pt',
      sectionTitleFontSize: '11pt',
      sectionTitleMarginBottom: '4pt',
      sectionTitlePaddingBottom: '2pt',
      summaryFontSize: '10pt',
      summaryLineHeight: '1.3',
      summaryMarginBottom: '10pt',
      experienceItemMarginBottom: '6pt',
      experienceHeaderMarginBottom: '2pt',
      experienceTitleFontSize: '11pt',
      experienceCompanyFontSize: '10pt',
      experienceDatesFontSize: '9pt',
      bulletMarginTop: '2pt',
      bulletMarginLeft: '16pt',
      bulletMarginBottom: '0.5pt',
      bulletFontSize: '10pt',
      skillsCategoriesMarginTop: '4pt',
      skillCategoryMarginBottom: '0.5pt',
      skillCategoryNameFontSize: '10pt',
      skillCategoryNameMarginBottom: '2pt',
      skillItemsFontSize: '10pt',
      certificationItemMarginBottom: '5pt',
      certificationNameFontSize: '10pt',
      certificationIssuerFontSize: '10pt',
      certificationIssuerMarginTop: '1pt',
    },
    normal: {
      bodyPadding: '0.5in',
      bodyFontSize: '11pt',
      lineHeight: '1.6',
      headerMarginBottom: '12pt',
      headerPaddingBottom: '4pt',
      headerH1FontSize: '20pt',
      headerH1MarginBottom: '3pt',
      headerContactFontSize: '10pt',
      headerContactSpanMargin: '0 3pt',
      sectionMarginBottom: '16pt',
      sectionTitleFontSize: '14pt',
      sectionTitleMarginBottom: '10pt',
      sectionTitlePaddingBottom: '4pt',
      summaryFontSize: '11pt',
      summaryLineHeight: '1.6',
      summaryMarginBottom: '16pt',
      experienceItemMarginBottom: '12pt',
      experienceHeaderMarginBottom: '4pt',
      experienceTitleFontSize: '12pt',
      experienceCompanyFontSize: '11pt',
      experienceDatesFontSize: '10pt',
      bulletMarginTop: '6pt',
      bulletMarginLeft: '20pt',
      bulletMarginBottom: '2pt',
      bulletFontSize: '11pt',
      skillsCategoriesMarginTop: '8pt',
      skillCategoryMarginBottom: '2pt',
      skillCategoryNameFontSize: '11pt',
      skillCategoryNameMarginBottom: '4pt',
      skillItemsFontSize: '11pt',
      certificationItemMarginBottom: '8pt',
      certificationNameFontSize: '11pt',
      certificationIssuerFontSize: '11pt',
      certificationIssuerMarginTop: '2pt',
    },
  };

  const s = spacingPresets[spacing];

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
    educationItems = [renderEducationItem(education)];
  } else if (isEducationArray(education)) {
    educationItems = education.map((edu) => renderEducationItem(edu));
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

  const items = languages
    .map((lang) => {
      return `
        <div class="language-item">
          <strong>${escapeHtml(lang.name)}</strong> - ${escapeHtml(lang.proficiency)}
        </div>
      `;
    })
    .join('');

  return `
    <div class="section">
      <h2 class="section-title">Languages</h2>
      ${items}
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
