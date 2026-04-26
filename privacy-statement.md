# ToneIQ Privacy Statement

**Effective date:** See repository commit history.

## What we collect

| Data            | Where stored        | Retention                      |
|-----------------|---------------------|-------------------------------|
| Voice audio     | RAM / temp buffer   | Deleted after transcription (≤ 60 seconds) |
| Transcript text | Supabase (encrypted)| 90 days, or until you delete   |
| Tone scores     | Supabase            | Until account deleted          |
| Email / name    | Supabase Auth       | Until account deleted          |

## What we never do
- We never store raw audio long-term.
- We never share your conversation data with third parties.
- We never sell your personal data.
- We never use your practice sessions to train external AI models.

## Your rights
- **Delete all data:** Settings → Delete my data, or `DELETE /api/user/:id/data`.
- **Export:** Contact us for a JSON export of your session history.

## Third-party processors
| Processor   | Purpose          | Data sent           |
|-------------|-----------------|---------------------|
| OpenAI      | Speech-to-text  | Audio clip (≤ 60s)  |
| Anthropic   | AI conversation | Transcript text     |
| Hume AI     | Tone analysis   | Transcript text     |
| ElevenLabs  | Text-to-speech  | AI reply text       |
| Supabase    | Database        | Scores, transcripts |

All processors operate under their own privacy policies and data processing agreements.

## Contact
For privacy requests: privacy@toneiq.app (replace with your domain)
