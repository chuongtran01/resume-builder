/**
 * Classic ATS-compliant resume template
 * Professional single-column layout with traditional styling
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
 * Classic template implementation
 */
export const classicTemplate: ResumeTemplate = {
  name: 'classic',
  description: 'Classic professional template with traditional styling',

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
registerTemplate(classicTemplate);

/**
 * Get CSS styles for classic template
 * Classic styling uses Times New Roman font and more traditional layout
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
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000000;
      background-color: #ffffff;
      padding: 0.75in;
    }

    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      text-align: left;
      margin-bottom: 18pt;
      padding-bottom: 12pt;
      border-bottom: 1.5pt solid #000000;
    }

    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 6pt;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }

    .header .contact-info {
      font-size: 10pt;
      color: #000000;
      line-height: 1.8;
    }

    .header .contact-info span {
      margin-right: 12pt;
    }

    .section {
      margin-bottom: 14pt;
    }

    .section-title {
      font-size: 13pt;
      font-weight: bold;
      margin-bottom: 8pt;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      border-bottom: 1pt solid #666666;
      padding-bottom: 3pt;
    }

    .summary {
      font-size: 11pt;
      line-height: 1.6;
      margin-bottom: 14pt;
      text-align: left;
      font-style: italic;
    }

    .experience-item,
    .education-item {
      margin-bottom: 10pt;
    }

    .experience-header,
    .education-header {
      margin-bottom: 3pt;
    }

    .experience-title,
    .education-title {
      font-weight: bold;
      font-size: 11pt;
      display: inline;
    }

    .experience-company,
    .education-institution {
      font-weight: bold;
      font-size: 11pt;
      display: inline;
    }

    .experience-company::before,
    .education-institution::before {
      content: " - ";
      font-weight: normal;
    }

    .experience-dates,
    .education-dates {
      float: right;
      font-size: 10pt;
      color: #000000;
      font-weight: normal;
    }

    .experience-location {
      font-size: 10pt;
      color: #666666;
      font-style: italic;
      margin-top: 2pt;
    }

    .bullet-points {
      margin-top: 5pt;
      margin-left: 24pt;
      list-style-type: disc;
    }

    .bullet-points li {
      margin-bottom: 3pt;
      font-size: 11pt;
    }

    .skills-categories {
      margin-top: 6pt;
    }

    .skill-category {
      margin-bottom: 8pt;
    }

    .skill-category-name {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 3pt;
      text-decoration: underline;
    }

    .skill-items {
      font-size: 11pt;
      margin-left: 12pt;
    }

    .certification-item,
    .project-item,
    .language-item,
    .award-item {
      margin-bottom: 6pt;
    }

    .certification-name,
    .project-name,
    .award-name {
      font-weight: bold;
      font-size: 11pt;
      display: inline;
    }

    .certification-issuer,
    .project-description,
    .award-issuer {
      font-size: 11pt;
      margin-top: 2pt;
      margin-left: 12pt;
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
      <h2 class="section-title">Professional Experience</h2>
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
      ${edu.gpa ? `<div style="margin-left: 12pt; margin-top: 2pt;">GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
      ${edu.honors && edu.honors.length > 0 ? `<div style="margin-left: 12pt; margin-top: 2pt;">Honors: ${edu.honors.map((h) => escapeHtml(h)).join(', ')}</div>` : ''}
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
      <h2 class="section-title">Technical Skills</h2>
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

      return `
        <div class="project-item">
          <div class="project-name">${escapeHtml(project.name)}${linksHtml}</div>
          <div class="project-description">${escapeHtml(project.description)}</div>
          ${project.technologies && project.technologies.length > 0
            ? `<div style="margin-left: 12pt; margin-top: 2pt;">Technologies: ${project.technologies.map((t) => escapeHtml(t)).join(', ')}</div>`
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
      <h2 class="section-title">Awards & Recognition</h2>
      ${items}
    </div>
  `;
}
