---
"social-mcp": minor
---

**New tools (10 additions)**

- `TELEGRAM_EDIT_MESSAGE` — edit the text of a sent Telegram message
- `TELEGRAM_DELETE_MESSAGE` — delete a Telegram message
- `REPLY_TWEET` — reply to an existing tweet
- `LIKE_TWEET` — like a tweet
- `DELETE_TWEET` — delete a tweet
- `GET_DISCORD_MESSAGES` — retrieve recent messages from a Discord channel
- `GET_SLACK_MESSAGES` — retrieve recent messages from a Slack channel
- `LIST_SLACK_CHANNELS` — list public channels in a Slack workspace
- `GET_FACEBOOK_POSTS` — retrieve recent posts from a Facebook page
- `GET_INSTAGRAM_POSTS` — retrieve recent posts from an Instagram account

**Bug fixes**

- WhatsApp `sendMessage` now correctly calls `/{phoneNumberId}/messages` instead of `/me/messages`
- Removed broken `GET_WHATSAPP_MESSAGES` tool — WhatsApp message retrieval requires webhooks, not polling
- Facebook post schema now marks `post_id` as optional (Graph API does not always return it)
- Slack `sendMessage` now checks `result.ok` and throws on API errors instead of silently succeeding

**Breaking changes**

- Telegram tool names are now prefixed: `SEND_MESSAGE` → `TELEGRAM_SEND_MESSAGE`, `GET_CHANNEL_INFO` → `TELEGRAM_GET_CHANNEL_INFO`, `FORWARD_MESSAGE` → `TELEGRAM_FORWARD_MESSAGE`, `PIN_MESSAGE` → `TELEGRAM_PIN_MESSAGE`, `GET_CHANNEL_MEMBERS` → `TELEGRAM_GET_CHANNEL_MEMBERS`
- `GET_USER_INFO` (Twitter) renamed to `GET_TWITTER_USER_INFO`
- `CREATE_INSTAGRAM_POST` parameter `message` renamed to `caption`

**Improvements**

- All services are now module-level lazy singletons — API clients are created once per process instead of on every tool call
- Consistent `CredentialsError` thrown in every service constructor when credentials are missing; replaces fragile substring matching in tool error handlers
- `META_API_VERSION` constant in config — updating the Graph API version is now a one-line change
- Server version is read from `package.json` at runtime, eliminating version drift
- Startup log lists which platforms are configured and which are missing credentials
- Removed `dedent` runtime dependency
- Added `vitest` test suite (31 tests covering errors, config, HTTP utilities, Zod schemas, and service credential validation)
- Added `pnpm run clean` script to remove `dist/`
