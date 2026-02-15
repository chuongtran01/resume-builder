/**
 * Minimal ATS-compliant resume template
 * Clean, minimalist single-column layout with minimal styling
 */

import type { ResumeTemplate, TemplateOptions } from '../types/template.types';
import type { Resume } from '../types/resume.types';
import {
  baseTemplateValidation,
  escapeHtml,
  formatDate,
  estimateContentDensity,
} from './templateHelpers';
import { isSingleEducation, isEducationArray } from '../types/resume.types';
import { registerTemplate } from './templateRegistry';

/**
 * Minimal template implementation
 */
export const minimalTemplate: ResumeTemplate = {
  name: 'minimal',
  description: 'Minimalist template with clean, simple styling',

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
registerTemplate(minimalTemplate);

/**
 * Get CSS styles for minimal template
 * Minimal styling with clean lines and minimal decoration
 */
function getCss(options?: TemplateOptions, spacing: 'compact' | 'normal' = 'normal'): string {
  const customCss = options?.customCss || '';

  // Define spacing presets for minimal template
  const spacingPresets = {
    compact: {
      bodyPadding: '0.35in',
      bodyFontSize: '10pt',
      lineHeight: '1.25',
      headerMarginBottom: '6pt',
      headerPaddingBottom: '2pt',
      headerH1FontSize: '15pt',
      headerH1MarginBottom: '2pt',
      headerContactFontSize: '8pt',
      headerContactLineHeight: '1.4',
      headerContactSpanMarginRight: '2pt',
      sectionMarginBottom: '8pt',
      sectionTitleFontSize: '11pt',
      sectionTitleMarginBottom: '4pt',
      sectionTitlePaddingBottom: '1pt',
      summaryFontSize: '10pt',
      summaryLineHeight: '1.3',
      summaryMarginBottom: '8pt',
      experienceItemMarginBottom: '6pt',
      experienceHeaderMarginBottom: '2pt',
      experienceHeaderLineHeight: '1.3',
      experienceTitleFontSize: '10pt',
      experienceCompanyFontSize: '10pt',
      experienceDatesFontSize: '9pt',
      experienceLocationFontSize: '8pt',
      experienceLocationMarginTop: '1pt',
      bulletMarginTop: '2pt',
      bulletMarginLeft: '16pt',
      bulletMarginBottom: '0.5pt',
      bulletFontSize: '10pt',
      bulletLineHeight: '1.4',
      skillsCategoriesMarginTop: '4pt',
      skillCategoryMarginBottom: '0.5pt',
      skillCategoryNameFontSize: '10pt',
      skillCategoryNameMarginBottom: '1pt',
      skillItemsFontSize: '10pt',
      skillItemsMarginLeft: '6pt',
      certificationItemMarginBottom: '4pt',
      certificationNameFontSize: '10pt',
      certificationIssuerFontSize: '9pt',
      certificationIssuerMarginTop: '1pt',
      certificationIssuerMarginLeft: '6pt',
    },
    normal: {
      bodyPadding: '0.6in',
      bodyFontSize: '11pt',
      lineHeight: '1.5',
      headerMarginBottom: '10pt',
      headerPaddingBottom: '4pt',
      headerH1FontSize: '16pt',
      headerH1MarginBottom: '3pt',
      headerContactFontSize: '9pt',
      headerContactLineHeight: '1.6',
      headerContactSpanMarginRight: '3pt',
      sectionMarginBottom: '12pt',
      sectionTitleFontSize: '12pt',
      sectionTitleMarginBottom: '8pt',
      sectionTitlePaddingBottom: '2pt',
      summaryFontSize: '11pt',
      summaryLineHeight: '1.6',
      summaryMarginBottom: '14pt',
      experienceItemMarginBottom: '10pt',
      experienceHeaderMarginBottom: '3pt',
      experienceHeaderLineHeight: '1.4',
      experienceTitleFontSize: '11pt',
      experienceCompanyFontSize: '11pt',
      experienceDatesFontSize: '10pt',
      experienceLocationFontSize: '9pt',
      experienceLocationMarginTop: '1pt',
      bulletMarginTop: '4pt',
      bulletMarginLeft: '18pt',
      bulletMarginBottom: '1pt',
      bulletFontSize: '11pt',
      bulletLineHeight: '1.5',
      skillsCategoriesMarginTop: '6pt',
      skillCategoryMarginBottom: '1pt',
      skillCategoryNameFontSize: '10pt',
      skillCategoryNameMarginBottom: '2pt',
      skillItemsFontSize: '11pt',
      skillItemsMarginLeft: '8pt',
      certificationItemMarginBottom: '5pt',
      certificationNameFontSize: '11pt',
      certificationIssuerFontSize: '10pt',
      certificationIssuerMarginTop: '1pt',
      certificationIssuerMarginLeft: '8pt',
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
      font-family: Calibri, Arial, sans-serif;
      font-size: ${s.bodyFontSize};
      line-height: ${s.lineHeight};
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
      text-align: left;
      margin-bottom: ${s.headerMarginBottom};
      padding-bottom: ${s.headerPaddingBottom};
    }

    .header h1 {
      font-size: ${s.headerH1FontSize};
      font-weight: normal;
      margin-bottom: ${s.headerH1MarginBottom};
      color: #000000;
      letter-spacing: 0.5pt;
    }

    .header .contact-info {
      font-size: ${s.headerContactFontSize};
      color: #666666;
      line-height: ${s.headerContactLineHeight};
      padding: 0;
    }

    .header .contact-info span {
      margin-right: ${s.headerContactSpanMarginRight};
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
      font-weight: 600;
      margin-bottom: ${s.sectionTitleMarginBottom};
      color: #000000;
      text-transform: none;
      letter-spacing: 0.3pt;
      border-bottom: 0.5pt solid #cccccc;
      padding-bottom: ${s.sectionTitlePaddingBottom};
    }

    .summary {
      font-size: ${s.bodyFontSize};
      line-height: ${s.summaryLineHeight};
      margin-bottom: ${s.summaryMarginBottom};
      text-align: left;
      color: #333333;
    }

    .experience-item,
    .education-item {
      margin-bottom: ${s.experienceItemMarginBottom};
    }

    .experience-header,
    .education-header {
      margin-bottom: ${s.experienceHeaderMarginBottom};
      line-height: ${s.experienceHeaderLineHeight};
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .experience-title,
    .education-title {
      font-weight: 600;
      font-size: ${s.bodyFontSize};
    }

    .experience-company-location {
      font-size: ${s.bodyFontSize};
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${s.experienceHeaderMarginBottom};
    }

    .experience-company,
    .education-institution {
      font-weight: normal;
      font-size: ${s.bodyFontSize};
      color: #666666;
    }

    .experience-dates,
    .education-dates {
      float: right;
      font-size: ${s.bodyFontSize};
      color: #666666;
      font-weight: normal;
    }

    .experience-location {
      font-size: ${s.bodyFontSize};
      color: #000000;
    }

    .bullet-points {
      margin-top: ${s.bulletMarginTop};
      margin-left: ${s.bulletMarginLeft};
      list-style-type: circle;
    }

    .bullet-points li {
      margin-bottom: ${s.bulletMarginBottom};
      font-size: ${s.bodyFontSize};
      line-height: ${s.bulletLineHeight};
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
      font-weight: 600;
      font-size: ${s.bodyFontSize};
      color: #666666;
    }

    .skill-items {
      font-size: ${s.bodyFontSize};
      color: #333333;
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
      font-weight: 600;
      font-size: ${s.bodyFontSize};
      display: inline;
    }

    .certification-issuer,
    .project-description,
    .award-issuer {
      font-size: ${s.bodyFontSize};
      margin-top: ${s.certificationIssuerMarginTop};
      margin-left: ${s.certificationIssuerMarginLeft};
      color: #666666;
    }

    a {
      color: #000000;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    @media print {
      body {
        padding: 0.5in;
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
        <span class="education-title">${degreeLine}</span>
        <span class="education-institution">${escapeHtml(edu.institution)}</span>
        <span class="education-dates">${formatDate(edu.graduationDate)}</span>
      </div>
      ${edu.gpa ? `<div style="margin-left: 8pt; margin-top: 1pt; font-size: 10pt; color: #666666;">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
      ${edu.honors && edu.honors.length > 0 ? `<div style="margin-left: 8pt; margin-top: 1pt; font-size: 10pt; color: #666666;">Honors: ${edu.honors.map((h) => escapeHtml(h)).join(', ')}</div>` : ''}
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
            ${cert.credentialId ? ` | ${escapeHtml(cert.credentialId)}` : ''}
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

      return `
        <div class="project-item">
          <div class="project-name">${escapeHtml(project.name)}${linksHtml}</div>
          <div class="project-description">${escapeHtml(project.description)}</div>
          ${project.technologies && project.technologies.length > 0
            ? `<div style="margin-left: 8pt; margin-top: 1pt; font-size: 10pt; color: #666666;">${project.technologies.map((t) => escapeHtml(t)).join(', ')}</div>`
            : ''}
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
          <span style="font-weight: 600;">${escapeHtml(lang.name)}</span> - ${escapeHtml(lang.proficiency)}
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
