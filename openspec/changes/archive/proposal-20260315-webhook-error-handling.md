# Proposal: Webhook Error State Handling & API Key Replacement (2026-03-15)

## 1. Goal Description
The server architecture is now fully unblocked! Vercel successfully fired the background webhook. However, the background process explicitly crashed because **Google AI Studio rejected the provided Gemini API Key** with the error:
`"code":403,"message":"Your API key was reported as leaked. Please use another API key."`

Currently, when the webhook crashes with a Fatal Error, it returns a 500 HTTP response but **does not update the database `status` to `FAILED`**. This leaves the `GeneratedAsset` stuck in `PENDING`. As a result, the frontend continues polling until our 120-second timeout safety net (from Phase 16) forcefully cuts it off.

## 2. Proposed Changes
### Backend (`src/app/api/webhooks/generate/route.ts`)
- Update the `catch (error)` block to proactively update the `GeneratedAsset` status to `FAILED` in the database if `assetId` is available.
- This will allow the frontend's polling interval to instantly detect the failure on its next 3-second tick, display the error immediately, and avoid making the user wait 2 full minutes for a timeout.

### Owner Action Required
- The provided `GEMINI_API_KEY` has been permanently revoked by Google due to being exposed/leaked (likely uploaded to a public GitHub repo or pasted in plain text).
- The user must generate a brand new API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and update the Vercel Environment Variables.

## 3. Verification Plan
- Push code changes to update the DB on failure.
- The user updates the Vercel API key.
- The next generation attempt should either succeed seamlessly or, if it encounters an API error, instantly fail on the frontend within 3 seconds rather than 120 seconds.
