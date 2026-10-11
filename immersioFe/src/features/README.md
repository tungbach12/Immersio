# Frontend features

Route files in `src/pages/student` compose the screens. Keep their data requests and state transitions in the matching feature's `hooks`, and presentation in `components`.

- `dashboard`: daily invitation, learning metrics, CEFR details and conversation recommendations.
- `admin`: workspace overview, summary metrics and activity charts.
- `landing`: the public postcard homepage, SVG illustrations, editable copy and interactive lesson preview.
- `auth`: the shared sign-in and registration frame, paper and evergreen styling, and labelled auth fields.
- `scenarios`: conversation search, category filters and language selection.
- `conversations`: live dialogue, speech recognition, lesson feedback and generated cards.
- `flashcards`: collection list, study queue, typed card faces, progress and review results.
- `pronunciation`: phrase composition, microphone recording, WAV conversion and pronunciation feedback.
- `dictionary`: lookup state and bilingual word entries.
- `profile`: identity, avatar upload and notification preferences.
- `subscription`: plan content, comparison and the existing checkout API.

Shared learning UI lives in `src/components/learning`. `SaveToDeckDialog` owns loading collections and saving cards, so dictionary and conversation screens use the same flow. The native `Dialog` handles focus, Escape and the backdrop.

`WorkspaceUserProvider` refreshes the cached user once per route and shares profile updates across the shell and screens. API contracts remain in `src/services`; route components do not call `fetch`.

Styles are grouped in `src/styles`: theme tokens, workspace shell and individual learning features. Student screens use paper and teal; administration uses the darker evergreen palette. The postcard landing keeps its scoped styles in `features/landing`; auth screens share the landing's paper and evergreen palette through `features/auth`.
