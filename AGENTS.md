<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Notes

Persona Guide is a Next.js 16 App Router application for generating personal image analysis cards from uploaded portrait photos.

### Local Workflow

- Use `pnpm` for dependency management and scripts.
- Run `pnpm dev` for local development, `pnpm build` before deployment-sensitive changes, and `pnpm lint` after substantive edits.
- Keep `.env` local. Use `env.example` as the public template for required variables.

### Implementation Notes

- The main UI lives in `app/page.tsx`.
- The image generation endpoint lives in `app/api/analyze/route.ts` and must run on the Node.js runtime because it writes files to disk.
- Image generation is asynchronous: `POST /api/analyze` creates a job and returns `jobId`, while `GET /api/analyze?jobId=...` returns the current status and completed image URL.
- Completed images are served through `GET /api/analyze?jobId=...&asset=output`; do not expose direct filesystem paths in API responses.
- Generated records are stored under `ANALYSIS_STORAGE_DIR`, defaulting to `storage/`. Each job directory can contain `input.<ext>`, `output.<ext>`, `status.json`, and `metadata.json`. Do not commit generated images, uploaded photos, metadata, status files, or other user data.
- The OpenAI SDK is configured against an OpenAI-compatible endpoint via `OPENAI_BASE_URL`; do not hard-code provider-specific secrets or model values.
- Uploaded images are limited to 12MB on both client and server. Keep those limits aligned if changing upload behavior.

### UI Conventions

- Prefer existing lightweight components in `components/ui/` and the `cn` helper from `lib/utils.ts`.
- Tailwind CSS 4 is configured through `app/globals.css`; avoid adding legacy Tailwind config unless the project actually needs it.
- The app copy is currently Simplified Chinese. Keep user-facing text in Chinese unless a feature explicitly requires otherwise.

### Deployment

- `next.config.ts` uses `output: "standalone"` for the Docker image.
- `Dockerfile` builds with pnpm and runs the standalone Next.js server.
- `deploy.sh` maps host port `3300` to container port `3000`, mounts `.env`, and persists `storage/`.
