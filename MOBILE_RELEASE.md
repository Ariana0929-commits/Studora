# Studora mobile release

The repository contains native Android and iOS projects with the Studora leaf icon and camera integration. The identifier is `app.studora.mobile`; confirm its availability in your developer accounts before registering it. The native apps load `https://studora1.netlify.app` over HTTPS, so deploy the updated web app before testing native builds. Keep this domain under your control: its web code executes with the app's native bridge permissions. The checked-in `mobile` page is a fallback shell, not an offline copy of the planner.

## Open the projects

1. Install dependencies with `npm install`.
2. Run `npm run mobile:sync` after changing native plugins or Capacitor configuration.
3. For Android, run `npm run mobile:android` and use a supported Android Studio/JDK/SDK installation.
4. For iOS, use macOS with Xcode and run `npm run mobile:ios`. Resolve Swift packages, select your signing team, and use a real device for camera checks.

Both platforms include the native camera plugin. iOS camera and photo-library purpose descriptions are already included. Android uses the system camera and photo picker without requesting broad storage access. Changes to native permissions or plugins require a new signed release; web-only updates load from the hosted site.

## Before submission

Use your own Apple Developer and Google Play Console accounts. Register the app identifier, set signing certificates or upload keys, set the release version/build number, and archive a signed iOS application and Android App Bundle in their IDEs. Do not check signing keys, passwords, or provisioning credentials into this repository.

Test signup, email confirmation in a browser followed by login in the app, password recovery, logout/relogin, two-device persistence, a save conflict, image attachments, camera permission denial, camera capture, image rotation, printed worksheets, real handwritten notes, timetable review, and loss of connectivity. The app requires the internet; do not advertise offline operation. Browser backup downloads must also be tested in each platform's web view before release.

Account deletion is available in **Backup → Delete my account** after signing in. It removes study data and account-scoped uploaded photos, then removes the Identity account. Failed deletions show a retry message and may already have removed some study data. Existing backups exported by users and historical platform backups are separate from the active account. Verify deletion against a disposable real account after deployment.

The public privacy explanation is at `https://studora1.netlify.app/privacy.html`, and the account-deletion instructions are at `https://studora1.netlify.app/delete-account.html`. Review the wording, add your support contact and any legally required operator details before submission, and complete Apple's privacy labels and Google's Data safety form accurately. Disclose account email/name, study content, private photo storage, and AI processing of scanned images. Provide screenshots, an age rating, support details, and reviewer access as required by each store.

The projects have not been signed, tested on physical devices, or submitted to either store in this environment. Store acceptance is determined by Apple and Google, including their minimum functionality requirements.
