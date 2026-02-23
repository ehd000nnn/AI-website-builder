# AI Website Builder Service

A full-stack app that generates starter websites from business details using OpenAI.

## Features

- Landing page form for business details
- AI-powered generation of HTML/CSS/JS via `/generate-site`
- Real-time preview in the browser
- Download generated site as a ZIP file
- Temporary in-memory project storage
- AI suggestions for hero/image direction

## Project Structure

- `server.js` - Express backend and OpenAI integration
- `public/index.html` - Front-end page
- `public/styles.css` - Responsive styling
- `public/script.js` - Front-end interactivity and API calls
- `.env.example` - Environment variables template

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and set `OPENAI_API_KEY`.
4. Start server:
   ```bash
   npm start
   ```
5. Open:
   - `http://localhost:3000`

## Notes

- Projects are stored only in memory and will reset when the server restarts.
- The generated output quality depends on the model and prompt constraints.
