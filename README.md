# Studora

Studora is a React study planner with permanent email accounts, cloud-saved study spaces, photo attachments, and scanning for printed documents and handwriting.

## Development

Install dependencies with `npm install`. Run `netlify dev --port 8889` to use the app with Identity, Functions, Database, and Blobs. Plain Vite alone does not emulate these services.

Identity handles email/password signup, confirmation links, login, persistent sessions, and password recovery. Registration requires email confirmation unless the site's Identity settings enable automatic confirmation. Set the public site URL and permitted email redirect URLs in Identity before release.

The database schema lives in `db/schema.ts`. Migration files live in `netlify/database/migrations` and apply automatically during deployment. Do not apply them manually. Uploaded attachments use private, account-scoped Netlify Blobs. Study-space writes use revision checks so an older device cannot silently overwrite a newer save. Conflicts keep the current browser's work available for export; export, reload, and reconcile the changes before saving again.

Existing device-only users can sign up, then select **Import old device data** in the account status bar. Import merges previously saved lists without replacing matching records already in the account. The old device copy remains available until users remove it themselves. New edits save to the cloud, not browser storage. An internet connection is required to load and save accounts. Leave the app open until the status reads **Saved to your account**.

## Scanner

The timetable and note editors support camera capture, file selection, preview, rotation, and editable scan results. Handwriting + printed-text mode uses an authenticated server function and Netlify AI Gateway. Printed-text mode runs Tesseract on the device, with automatic rotation and larger images; its language data needs to download initially. Printed timetable fallback expects one day's schedule per photograph. Never assume handwritten text, uncertain class times, or multi-column schedules were transcribed perfectly.

Photos selected only for scanning are sent for recognition but are not added to the user's stored photo attachments. The app does not store scan inputs separately. AI processing is subject to the inference service's data handling. Attached photos and profile/background images save separately to private object storage.

## Checks

- `npm run check` checks frontend TypeScript.
- `npm test` checks time parsing and private endpoint access.
- With the development server on port 8889, `npm run test:browser` checks signup, recovery, scanned note editing, cloud reload, and timetable review. Install the test browser with `npx playwright install chromium` first.

Browser tests mock Identity, database responses, and AI responses; they do not send real email or measure recognition quality on real student photos. Live confirmation email delivery, AI inference, cloud persistence, and self-service deletion need a smoke test after the deploy applies its migration.

## iOS and Android

See [MOBILE_RELEASE.md](MOBILE_RELEASE.md) for native projects, signing, device tests, and store submission. These are Capacitor applications with native camera access. They load the HTTPS Studora site and require network access. They are prepared projects, not published store listings.
