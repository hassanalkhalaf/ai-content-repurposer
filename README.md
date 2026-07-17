# Repurpose — AI Content Repurposer (MVP)

Paste a transcript or long-form text, pick a format, get a Twitter/X thread,
LinkedIn post, or SEO blog article back.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Anthropic Claude API for generation (`/lib/llm.ts`)
- No database — the MVP is stateless by design (see "Data model" below)

## Setup

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Architecture

```
app/
  page.tsx                  # dashboard UI (client component, holds all state)
  api/repurpose/route.ts    # POST endpoint — validates input, calls the LLM
  layout.tsx, globals.css
components/
  FormatSelector.tsx        # segmented control for choosing output format
  OutputCard.tsx            # renders result differently per format
  CopyButton.tsx            # reusable copy-to-clipboard
lib/
  types.ts                  # shared types + the API request/response contract
  prompts.ts                # per-format system prompts (strict-JSON output)
  llm.ts                    # Anthropic API client, timeout + error handling
  markdown-lite.tsx          # tiny renderer for the blog format's markdown
prisma/
  schema.prisma             # optional future schema for saving history
```

## Data model

The MVP holds a single generation in React state on the client — there's
nothing to persist between page loads, so a database would only add
operational surface area without adding value at this stage.

`prisma/schema.prisma` sketches out what a `Generation` table would look
like if/when you want to add history or accounts. It isn't imported or used
anywhere in the app yet.

## API

**`POST /api/repurpose`**

```jsonc
// request
{ "transcript": "string, 40–20000 chars", "format": "twitter" | "linkedin" | "blog" }

// success (200)
{ "format": "twitter", "data": { "tweets": ["...", "...", "...", "...", "..."] } }
{ "format": "linkedin", "data": { "post": "..." } }
{ "format": "blog", "data": { "title": "...", "content": "## markdown body..." } }

// error (4xx/5xx)
{ "error": "human-readable message" }
```

Validation and failure modes handled server-side:
- empty / too-short / too-long transcript
- invalid or missing format
- missing `ANTHROPIC_API_KEY`
- upstream timeout (30s), rate limiting (429), 5xx from the provider
- malformed / non-JSON model output (parsed and shape-checked before it
  ever reaches the client)

None of these throw past the route handler — every branch returns a typed
`{ error }` response instead of crashing the request.

## Swapping in OpenAI instead of Claude

`lib/llm.ts` isolates the provider call in one function. To use OpenAI:

1. Point the fetch at `https://api.openai.com/v1/chat/completions`.
2. Use `model: "gpt-4o"` (or similar) with `response_format: { type: "json_object" }` for the same strict-JSON guarantee.
3. Send the same `system` prompt from `lib/prompts.ts` as the `system` message, and the transcript as the `user` message.
4. Leave `parseAndValidate()` as-is — it only depends on the JSON shape, not the provider.

## Known MVP limitations (by design)

- No auth, no rate limiting per-user (add before any public deployment).
- No streaming — responses arrive all at once (fine for these output lengths; could switch to SSE/streaming later for perceived speed).
- No persistence — refreshing the page loses your last result.
