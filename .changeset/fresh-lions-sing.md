---
"social-mcp": minor
---

Amazon SES: `verify()` now signs a real `GetAccount` call instead of being a no-op, so bad SES keys surface at connect time instead of on first send. Added `cc`, `bcc`, `replyTo`, `headers`, and `attachments` to `EMAIL_SEND` / `EMAIL_SEND_BULK`, supported across all four mail drivers (SMTP, SendGrid, Mailgun, SES); SES automatically switches to a raw MIME message when attachments are present since its Simple content type doesn't support them.
