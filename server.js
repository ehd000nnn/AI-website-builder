/**
 * AI Website Builder API server.
 *
 * Features:
 * - Serves the front-end from /public
 * - POST /generate-site -> calls OpenAI to generate HTML/CSS/JS
 * - GET /download/:projectId -> downloads generated project as a ZIP archive
 * - In-memory project storage for quick temporary saves
 */
require('dotenv').config();

const express = require('express');
const path = require('path');
const { Readable } = require('stream');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!process.env.OPENAI_API_KEY) {
  console.warn('[WARN] OPENAI_API_KEY is not set. /generate-site will fail until it is configured.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * In-memory store for generated projects.
 *
 * Shape:
 * {
 *   [projectId]: {
 *      id,
 *      createdAt,
 *      input,
 *      generated: { html, css, js },
 *      suggestions: []
 *   }
 * }
 */
const projects = Object.create(null);

function buildPrompt(input) {
  const { businessName, industry, pages, theme } = input;

  return `You are a senior web designer and front-end developer.
Create a lightweight multi-section website for this business:
- Business name: ${businessName}
- Industry/Niche: ${industry}
- Desired pages/sections: ${pages.join(', ')}
- Color/theme preference: ${theme}

Return JSON only in this exact shape:
{
  "html": "...",
  "css": "...",
  "js": "...",
  "suggestions": ["...", "..."]
}

Rules:
1) html should only contain markup inside <body> (no <html>/<head> wrapper).
2) css should be clean, responsive, and mobile-friendly.
3) js should be minimal and safe for browser execution.
4) Auto-generate useful content (home/about/contact text, CTA, footer).
5) Add a hero section and include 2-4 suggestions for image style or hero improvements in suggestions.
6) Keep code concise and production-like.
7) Output must be valid JSON only.`;
}

function safeParseGeneratedJSON(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned);
}

app.post('/generate-site', async (req, res) => {
  try {
    const { businessName, industry, pages, theme } = req.body || {};

    if (!businessName || !industry || !Array.isArray(pages) || pages.length === 0 || !theme) {
      return res.status(400).json({
        error: 'Missing required fields. Expected: businessName, industry, pages[], theme.'
      });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You generate website code in strict JSON.'
        },
        {
          role: 'user',
          content: buildPrompt({ businessName, industry, pages, theme })
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const generated = safeParseGeneratedJSON(raw);

    if (!generated.html || !generated.css || typeof generated.js !== 'string') {
      return res.status(502).json({
        error: 'Model returned incomplete output. Please try again.'
      });
    }

    const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    projects[projectId] = {
      id: projectId,
      createdAt: new Date().toISOString(),
      input: { businessName, industry, pages, theme },
      generated: {
        html: generated.html,
        css: generated.css,
        js: generated.js
      },
      suggestions: Array.isArray(generated.suggestions) ? generated.suggestions : []
    };

    return res.json({
      projectId,
      ...projects[projectId]
    });
  } catch (error) {
    console.error('Error in /generate-site:', error);
    return res.status(500).json({
      error: 'Failed to generate website. Check your API key/model and try again.'
    });
  }
});

/**
 * Streams a ZIP file containing generated index.html, styles.css, script.js.
 * Uses only built-in modules for portability.
 */
app.get('/download/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const project = projects[projectId];

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  // Dynamic import avoids loading unless needed.
  const JSZip = require('jszip');
  const zip = new JSZip();

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.input.businessName}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${project.generated.html}
<script src="script.js"></script>
</body>
</html>`;

  zip.file('index.html', indexHtml);
  zip.file('styles.css', project.generated.css);
  zip.file('script.js', project.generated.js);
  zip.file(
    'README.txt',
    `Generated by AI Website Builder\nProject ID: ${project.id}\nCreated: ${project.createdAt}\n`
  );

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${project.input.businessName.replace(/\s+/g, '_')}_website.zip"`);

  Readable.from(zipBuffer).pipe(res);
});

app.get('/projects/:projectId', (req, res) => {
  const project = projects[req.params.projectId];
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  return res.json(project);
});

app.listen(PORT, () => {
  console.log(`AI Website Builder running at http://localhost:${PORT}`);
});
