## Steps
- Set Supabase credentials as environment variables for the dev server (no secrets written to disk, no values echoed in app output)
- Restart the dev server to ensure Next.js picks up the env vars
- Verify routes load: `/auth/signup`, `/auth/login`, `/create`, `/dashboard`, `/{username}`
- Validate the signup flow: after submitting, show verification screen if email confirmation is enabled; otherwise redirect to `/create`
- Validate login flow: correct success/failure handling and redirect to `/dashboard`

## Notes
- I will not display your keys in any output; they will be applied in the server environment only.
- If your Supabase project uses email confirmations, “Verify your Email” will appear after signup; otherwise you’ll be signed in immediately.

Once you confirm, I’ll apply the credentials, restart dev, and share the live preview to test signup/login end-to-end.