/**
 * Modern ATS-compliant resume template
 * Single-column layout with clean, professional styling
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
 * Modern template implementation
 */
export const modernTemplate: ResumeTemplate = {
  name: 'modern',
  description: 'Modern single-column template with clean styling',

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
registerTemplate(modernTemplate);

/**
 * Get CSS styles for modern template
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
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000000;
      background-color: #ffffff;
      padding: 0.5in;
    }

    .resume {
      max-width: 8.5in;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .header {
      text-align: center;
      margin-bottom: 20pt;
      padding-bottom: 15pt;
      border-bottom: 2pt solid #000000;
    }

    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 8pt;
      color: #000000;
    }

    .header .contact-info {
      font-size: 10pt;
      color: #000000;
    }

    .header .contact-info span {
      margin: 0 8pt;
    }

    .section {
      margin-bottom: 16pt;
    }

    .section-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10pt;
      color: #000000;
      text-transform: uppercase;
      border-bottom: 1pt solid #000000;
      padding-bottom: 4pt;
    }

    .summary {
      font-size: 11pt;
      line-height: 1.6;
      margin-bottom: 16pt;
      text-align: justify;
    }

    .experience-item,
    .education-item {
      margin-bottom: 12pt;
    }

    .experience-header,
    .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4pt;
    }

    .experience-title,
    .education-title {
      font-weight: bold;
      font-size: 12pt;
    }

    .experience-company,
    .education-institution {
      font-weight: bold;
      font-size: 11pt;
    }

    .experience-location,
    .education-location,
    .experience-dates,
    .education-dates {
      font-size: 10pt;
      color: #000000;
    }

    .bullet-points {
      margin-top: 6pt;
      margin-left: 20pt;
    }

    .bullet-points li {
      margin-bottom: 4pt;
      font-size: 11pt;
    }

    .skills-categories {
      margin-top: 8pt;
    }

    .skill-category {
      margin-bottom: 10pt;
    }

    .skill-category-name {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 4pt;
    }

    .skill-items {
      font-size: 11pt;
    }

    .certification-item,
    .project-item,
    .language-item,
    .award-item {
      margin-bottom: 8pt;
    }

    .certification-name,
    .project-name,
    .award-name {
      font-weight: bold;
      font-size: 11pt;
    }

    .certification-issuer,
    .project-description,
    .award-issuer {
      font-size: 11pt;
      margin-top: 2pt;
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
            <div>
              <div class="experience-title">${escapeHtml(exp.role)}</div>
              <div class="experience-company">${escapeHtml(exp.company)}</div>
            </div>
            <div class="experience-dates">${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}</div>
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
        <div>
          <div class="education-title">${degreeLine}</div>
          <div class="education-institution">${escapeHtml(edu.institution)}</div>
        </div>
        <div class="education-dates">${formatDate(edu.graduationDate)}</div>
      </div>
      ${edu.gpa ? `<div>GPA: ${escapeHtml(edu.gpa)}</div>` : ''}
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
            ? `<div>Technologies: ${project.technologies.map((t) => escapeHtml(t)).join(', ')}</div>`
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
      <h2 class="section-title">Awards</h2>
      ${items}
    </div>
  `;
}
