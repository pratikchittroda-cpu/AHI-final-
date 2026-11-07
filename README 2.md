# AHI · Ayurveda Health Index — V5 website + app

One Expo (SDK 58) + Expo Router + TypeScript codebase that ships:

- **Website**: the V5 desktop design (sticky-header landing page, sidebar dashboard, two-column assessment with “Why we ask”, split sign-in, onboarding with live profile panel). Built with `react-native-web`.
- **iOS and Android app**: the V5 mobile design (welcome, Today, Index, Assess, Plan and Me tabs, one-question-at-a-time flow, dark result header).

Wide screens (≥ 960 px, desktop web and landscape tablets) get the desktop layouts. Phones get the mobile layouts. The design matches V5: forest green on ivory with sage and moss, Gloock headings, Newsreader italic accents, Instrument Sans body text, Tiro Devanagari Sanskrit, and the herbal motion (drifting glows, a turning leaf wreath, falling leaves, a swaying sprig, self-drawing rings). All motion switches off when reduce motion is on.

## Run it

```bash
npm install
npm run web        # website at http://localhost:8081
npm run ios        # iOS simulator (needs Expo Go or a dev build)
npm run android    # Android emulator
npm run build:web  # static website in dist/
npm run typecheck
```

## Questions and scoring

The questions come from two documents, and are no longer the 65 questions of the old spec:

- **"Final all questions.docx"** (`src/data/modules.ts`):
  - **Ayurveda Health Index**: nine domains, 98 questions. Agni 13, Nidrā 10, Bala 7, Mala 10, Sāra 20, Saṃhanana 9, Sātmya 5, Sattva 15, Vyādhikṣamatva 9.
  - Most questions use four options, Never / Rarely / Often / Almost always, scored 1–4 or reversed exactly as the document gives them. Sāra uses Low / Medium / High (1–3).
  - **Prakṛti**: 27 questions, 9 for each doṣa. The result shows each doṣa's share of the total points and the leading doṣa. If two or three doṣas are within 5 points of the leader, the result names all of them (for example Vāta–Pitta). Prakṛti is not part of the index.
- **"AHI_ Agni etc.docx"**:
  - **Agni in depth**: 25 statements in 5 domains, each out of 20.
  - **Mala in depth (MAQ-H)**: 40 statements on Purīṣa (48), Mūtra (44), Sveda (48) and overall satisfaction (20).
  - Both use Never 0 … Always 4. They show the document's own interpretation labels and a score for each domain.
  - The Viṣama / Tīkṣṇa / Manda / Sama indicators drive the **Agni type** check.
  - The document's major domains (physiological, psychological, lifestyle) group the nine domains on the assessment page.
- **Scoring** (`src/lib/scoring.ts`):
  - Domain score = `round((sum − min) / (max − min) × 100)`, using each domain's lowest and highest possible sums.
  - AHI = the average of the nine domains, all equally weighted. It shows “–” until all nine are done.
- **Bands** (from the AHI document): 81–100 Excellent, 61–80 Good, 41–60 Mild Imbalance, 21–40 Moderate Disturbance, 0–20 Severe Disturbance. Each band is always shown as a text label.
- **Saving**: answers, scores, drafts, history, routine and profile are kept on the device (AsyncStorage, or localStorage on web) under `ahi.v5.state.v2`. **Reset all data** is on the Me / Settings screen.

### Corrections made to "Final all questions"

- **Agni Q13** ("irregular digestion…"): the document scores Never = 1 … Almost always = 4. It is scored the other way round here (Never = 4), like the other twelve Agni questions.
- **Bala Q6**: the document gives “Almost always” 4 points. It is scored 1 here.
- **Sattva Q12**: the document lists 44 / 33 / 22 / 11. These are read as 4 / 3 / 2 / 1.
- **Nidrā** has 10 questions, two of them numbered Q9. All 10 are used, so the range is 10–40, not the stated 9–36.
- **Sāra**: the document states a range of 20–80, but 20 questions scored 1–3 give 20–60. The 20–60 range is used.
- **Mala Q3** reads “more than two times a day”.

## Not built (no backend)

- **Sign-in and OTP** are UI only: any 6-digit code signs you in on this device. The screen says so.
- The **Vaidya portal** and “Continue with Google” from the V5 mocks are not included, because both need a server. The landing page’s “For Vaidyas” section is kept as a preview and marked “coming soon”.
