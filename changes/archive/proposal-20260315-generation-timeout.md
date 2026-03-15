# Proposal: AI Generation Timeout Implementation (2026-03-15)

## 1. Goal Description
The user has requested the addition of a strict timeout mechanism during the AI generation pipeline. If the generation process (which relies on async webhooks and Vercel background tasks) takes too long without returning a status update or fails silently without throwing an explicit error, the UI currently hangs indefinitely in the "Generating..." state.

To create a closed-loop logic, we need to enforce a maximum wait time (e.g., 2-3 minutes). If this threshold is breached, the client should gracefully interrupt the polling, set the status to `ERROR`, and inform the user of the timeout, allowing them to retry or pivot.

## 2. Proposed Changes

### Frontend Client Polling (`FigurineGenerationGallery.tsx`)
1. **Timeout Const**: Define a `MAX_GENERATION_TIMEOUT_MS` (e.g., `120000` for 2 minutes or `180000` for 3 minutes).
2. **Timer Ref/State**: Introduce a timer mechanism when the status enters `GENERATING_PRIMARY` or `GENERATING_SECONDARY`.
3. **Interrupt Logic**:
   - If the polling interval runs continuously without seeing a `COMPLETE` or `ERROR` status from the API layer within the `MAX_TIMEOUT`, forcefully abort the interval.
   - Update the local `generationStatus` to `ERROR`.
   - Update the UI to show a "Generation Timeout" error message so the user is not stuck.

### Backend Async Job (Optional Consideration)
- The Vercel webhook (`start-generation.ts` and `api/webhooks/generate/route.ts`) already has `export const maxDuration = 120`. However, edge failures might not reflect in the DB if the Vercel function outright crashes. The client-side timeout is the ultimate safety net.

## 3. Verification Plan
- Hardcode the backend webhook to simulate an infinite hang (e.g., `await new Promise(() => {})`).
- Start a generation on the UI.
- Verify that exactly after the timeout threshold (e.g., 120 seconds), the UI breaks out of the loading state and displays an error message.
