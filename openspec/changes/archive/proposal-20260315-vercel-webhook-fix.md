# Proposal: Diagnosing & Fixing Vercel Webhook Silent Failure (2026-03-15)

## 1. Goal Description
The user reported a critical bug online: The AI 3D Generation process hangs indefinitely (the user's screenshot showed 4:34 elapsed). Although the "2-minute timeout" (Phase 16) was not yet active on the user's specific browser tab when the screenshot was taken, the core issue remains that the background webhook is silently failing or being killed without writing a `COMPLETE` or `FAILED` status to the database.

## 2. Root Cause Theories
In a Vercel Serverless environment, there are three primary suspects for "Silent Webhook Death":

1. **Serverless Container Freeze (Fire-and-forget Kill)**: 
   In `start-generation.ts`, we trigger the webhook using an un-awaited `fetch`. Vercel automatically freezes the Node.js container the exact millisecond the Server Action (`return { success: true }`) finishes. This terminates the TCP connection to the webhook before it can even start.
2. **Vercel Hobby Plan Timeout Limitation**:
   The webhook route (`/api/webhooks/generate/route.ts`) specifies `export const maxDuration = 120;`. However, if the user's Vercel account is on the **Hobby Plan**, background functions are strictly capped at 10 seconds or 60 seconds. Gemini generation takes 30-45 seconds, which would instantly trigger a `504 Gateway Timeout` from Vercel infrastructure, silently killing the generation mid-flight.
3. **Internal Routing Lock (`VERCEL_URL`)**: 
   Sometimes calling `https://${process.env.VERCEL_URL}` from within Vercel fails if Vercel Authentication / Password protection is active on the branch, returning a 401 instead of triggering the webhook.

## 3. Proposed Resolution Plan
1. **Gather Telemetry**: Instruct the user to open the Vercel Dashboard -> **Logs** tab and observe the output when triggering a generation. The logs will explicitly state if it was a `Function Execution Timeout (504)`, an internal `500`, or a `Fetch` abort.
2. **Implement Vercel `waitUntil` / Next.js `after`**: If it's a Serverless freeze issue, we must wrap the background fetch in Next.js 15's `after()` or Vercel's `waitUntil()` APIs to prevent the container from freezing.
3. **Queue / Edge Fallback (If Hobby Timeout)**: If the issue is a hard 10s Hobby Timeout, we may need to reconsider the architecture (e.g., streaming the API directly to the client instead of webhooks, or using Upstash/Vercel Inngest for async queuing).

---
*Status: Awaiting Vercel Serverless Logs from the Commander to finalize the patch.*
