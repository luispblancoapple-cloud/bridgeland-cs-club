# What changed

## Security
- **Removed the plaintext admin password from the source.** Login now hashes passwords
  (SHA-256 + a static salt) and only ever stores/compares hashes — nobody can read a
  password via "View Source" or by reading the Firestore document anymore.
- **Existing members won't be locked out.** If your club already has members who
  registered under the old system, their record has a plaintext `password` field
  instead of `passwordHash`. The first time they log in, the app detects this,
  logs them in normally, and silently upgrades their record to a hash (removing the
  plaintext). No action needed from them or you.
- Honest caveat: this is a real, meaningful improvement, but it's not the same as
  full server-side auth (Firebase Authentication). The password check still happens
  in the browser. If you want the stronger version later, migrating login/register to
  Firebase Authentication (email+password) is the natural next step — happy to do
  that as a follow-up if you want it.

## Bugs fixed
- **"Site resets when a new member joins."** Root cause: the entire app's data lived
  in one Firestore document, and every save called `setDoc()` with the browser tab's
  full in-memory copy — overwriting the *whole* document, including any other
  officer's concurrent edits. Fixed by only writing the fields that actually changed
  (`updateDoc` with a diff) instead of the whole document.
- **MCQ problems.** `<ProblemView>` had no `key` prop, so React reused the same
  component instance when moving from one problem to the next inside a unit — the
  next question loaded already "submitted," showing the previous question's
  selection/coloring. Fixed by keying it on the problem id.
- **ID collisions.** Several places generated ids with bare `Date.now()`, which can
  collide if two items are created in the same millisecond. Replaced with a
  collision-resistant id generator.
- **Code editor auto-close brackets never worked** (found while in the file — a `Set`
  was being indexed like a plain object). One-line fix, unrelated to your list but
  worth doing.

## New features
- **MCQ images** — officers can attach an image to a question when creating or
  editing it; it now shows above the answer choices.
- **Edit/delete individual problems** — problems could previously only be created,
  never edited or removed outside of a unit. Added a searchable "All problems" list
  on the Problems page with Edit/Delete for officers.
- **Search** — added to the Problems page and the Discussion Forum.
- **Import MCQs from Google Sheets** — "Import from Google Sheets" button on the
  Problems page. Publish a sheet to the web as CSV (File → Share → Publish to web →
  CSV) with columns `Title, Difficulty, Question, Choice A, Choice B, Choice C,
  Choice D, Correct Answer` (A–D or 1–4), paste the link, preview, import.
- **Important Links** — a pinned, officer-editable link list, shown on both the Home
  page and the Resources page.
- **Announcements at the top of the site** — a dismissible banner with the latest
  announcement now shows under the nav bar on every page (not just Home).
- **Notification bell** — Schoology-style bell in the header. Officers posting an
  announcement or event notifies everyone; a member messaging officers notifies
  officers; an officer's reply notifies that member. Unread count badge, click to
  mark read.
- **Contact officers / DMs** — "💬 Contact officers" button for signed-in members.
  Messages land in a new **Messages** inbox in the Officer Portal, where officers can
  reply (which notifies the member).
- **Activity log** — a new **Activity Log** section in the Officer Portal shows who
  did what (announcements, events, problems, units, links, memberships), so you can
  track officer changes over time.
- Registration now optionally collects **email and phone**, with per-user
  `notifyEmail` / `notifyText` flags, ready for the notification feature below.

## Text/email notifications — needs one more piece
This is the one item I couldn't fully wire up, and I want to be upfront about why:
a client-side site (no backend) **cannot securely send email or text messages** —
doing so would mean putting an email/SMS provider's secret API key directly in the
public JS bundle, which anyone could steal and abuse to send spam on your account's
dime. Real delivery needs a small piece of server-side code.

What's already in place: every user has an email/phone and notification preferences
stored, and the in-app "notifications" collection already fires an event any time
something worth notifying about happens (new announcement/event, new DM, a reply).

To finish this, the standard approach is a Firebase Cloud Function that watches the
`notifications` collection and fans out real emails/texts:

- **Email**: easiest is Firebase's official *"Trigger Email"* Extension — install it
  from the Firebase console, point it at an SMTP provider (e.g. SendGrid's free tier),
  and write matching documents to its mail collection whenever a notification with
  `notifyEmail` recipients is created.
- **Text messages**: needs a Twilio account (or similar) and a small Cloud Function
  that calls their API from `functions/index.js` — Twilio's free trial is enough to
  test with.

I didn't set these up because they require your own Firebase billing plan (Cloud
Functions need the Blaze plan) and your own Twilio/SendGrid account — things I can't
create on your behalf. Happy to write the actual Cloud Function code for both in a
follow-up once you've got those accounts, if you want to take this further.

## Before you deploy
- **Firestore security rules**: this project has no security rules that I could see,
  meaning anyone can currently read/write everything directly, including the new
  `auditLog` and `contactMessages` collections. Worth locking those down (e.g. only
  officers can read `auditLog`/`contactMessages`) — I can help draft rules if useful,
  but couldn't apply them since I don't have console access to your Firebase project.
- Run `npm install && npm run build` locally once before pushing, just to confirm it
  builds clean in your environment too (it does in mine — see below).
