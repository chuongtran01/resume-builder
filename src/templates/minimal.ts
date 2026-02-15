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
    const css = getCss(options);
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
function getCss(options?: TemplateOptions): string {
  const customCss = options?.customCss || '';
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
      padding: 0.6in;
    }

    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      text-align: left;
      margin-bottom: 16pt;
      padding-bottom: 10pt;
      border-bottom: 0.5pt solid #cccccc;
    }

    .header h1 {
      font-size: 16pt;
      font-weight: normal;
      margin-bottom: 6pt;
      color: #000000;
      letter-spacing: 0.5pt;
    }

    .header .contact-info {
      font-size: 9pt;
      color: #666666;
      line-height: 1.6;
    }

    .header .contact-info span {
      margin-right: 10pt;
    }

    .section {
      margin-bottom: 12pt;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 600;
      margin-bottom: 8pt;
      color: #000000;
      text-transform: none;
      letter-spacing: 0.3pt;
      border-bottom: 0.5pt solid #cccccc;
      padding-bottom: 2pt;
    }

    .summary {
      font-size: 11pt;
      line-height: 1.6;
      margin-bottom: 14pt;
      text-align: left;
      color: #333333;
    }

    .experience-item,
    .education-item {
      margin-bottom: 10pt;
    }

    .experience-header,
    .education-header {
      margin-bottom: 3pt;
      line-height: 1.4;
    }

    .experience-title,
    .education-title {
      font-weight: 600;
      font-size: 11pt;
      display: inline;
    }

    .experience-company,
    .education-institution {
      font-weight: normal;
      font-size: 11pt;
      display: inline;
      color: #666666;
    }

    .experience-company::before,
    .education-institution::before {
      content: " • ";
      color: #999999;
    }

    .experience-dates,
    .education-dates {
      float: right;
      font-size: 10pt;
      color: #666666;
      font-weight: normal;
    }

    .experience-location {
      font-size: 9pt;
      color: #999999;
      margin-top: 1pt;
    }

    .bullet-points {
      margin-top: 4pt;
      margin-left: 18pt;
      list-style-type: circle;
    }

    .bullet-points li {
      margin-bottom: 2pt;
      font-size: 11pt;
      line-height: 1.5;
    }

    .skills-categories {
      margin-top: 6pt;
    }

    .skill-category {
      margin-bottom: 6pt;
    }

    .skill-category-name {
      font-weight: 600;
      font-size: 10pt;
      margin-bottom: 2pt;
      color: #666666;
    }

    .skill-items {
      font-size: 11pt;
      margin-left: 8pt;
      color: #333333;
    }

    .certification-item,
    .project-item,
    .language-item,
    .award-item {
      margin-bottom: 5pt;
    }

    .certification-name,
    .project-name,
    .award-name {
      font-weight: 600;
      font-size: 11pt;
      display: inline;
    }

    .certification-issuer,
    .project-description,
    .award-issuer {
      font-size: 10pt;
      margin-top: 1pt;
      margin-left: 8pt;
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
    contactParts.push(`<a href="${escapeHtml(personalInfo.linkedin)}">LinkedIn</a>`);
  }
  if (personalInfo.github) {
    contactParts.push(`<a href="${escapeHtml(personalInfo.github)}">GitHub</a>`);
  }
  if (personalInfo.website) {
    contactParts.push(`<a href="${escapeHtml(personalInfo.website)}">Website</a>`);
  }

  return `
    <div class="header">
      <h1>${escapeHtml(personalInfo.name)}</h1>
      <div class="contact-info">
        ${contactParts.map((part) => `<span>${part}</span>`).join('')}
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
            <span class="experience-title">${escapeHtml(exp.role)}</span>
            <span class="experience-company">${escapeHtml(exp.company)}</span>
            <span class="experience-dates">${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}</span>
          </div>
          <div class="experience-location">${escapeHtml(exp.location)}</div>
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
          <div class="skill-category-name">${escapeHtml(category.name)}</div>
          <div class="skill-items">${items}</div>
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
