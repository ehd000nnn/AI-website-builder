/**
 * Front-end logic:
 * - Collect form data
 * - Call /generate-site
 * - Render generated website in iframe preview via srcdoc
 * - Enable ZIP download for generated project
 */

const siteForm = document.getElementById('siteForm');
const businessNameInput = document.getElementById('businessName');
const industryInput = document.getElementById('industry');
const themeInput = document.getElementById('theme');
const previewFrame = document.getElementById('previewFrame');
const statusText = document.getElementById('status');
const suggestionsList = document.getElementById('suggestions');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');

let currentProjectId = null;

function getSelectedPages() {
  return Array.from(document.querySelectorAll('input[name="pages"]:checked')).map((cb) => cb.value);
}

function renderPreview({ html, css, js }) {
  const fullDoc = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>${js}<\/script>
  </body>
</html>`;

  previewFrame.srcdoc = fullDoc;
}

function renderSuggestions(suggestions = []) {
  suggestionsList.innerHTML = '';
  if (!suggestions.length) {
    const li = document.createElement('li');
    li.textContent = 'No suggestions returned for this generation.';
    suggestionsList.appendChild(li);
    return;
  }

  suggestions.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    suggestionsList.appendChild(li);
  });
}

siteForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const pages = getSelectedPages();
  if (pages.length === 0) {
    statusText.textContent = 'Please select at least one page.';
    return;
  }

  const payload = {
    businessName: businessNameInput.value.trim(),
    industry: industryInput.value.trim(),
    pages,
    theme: themeInput.value.trim()
  };

  generateBtn.disabled = true;
  downloadBtn.disabled = true;
  statusText.textContent = 'Generating website with AI...';

  try {
    const response = await fetch('/generate-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate website.');
    }

    currentProjectId = data.projectId;

    renderPreview(data.generated);
    renderSuggestions(data.suggestions || []);

    downloadBtn.disabled = false;
    statusText.textContent = `Website generated successfully for ${payload.businessName}.`;
  } catch (error) {
    console.error(error);
    statusText.textContent = `Error: ${error.message}`;
  } finally {
    generateBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', () => {
  if (!currentProjectId) return;
  window.location.href = `/download/${currentProjectId}`;
});
