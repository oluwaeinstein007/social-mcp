# social-mcp

## 2.2.0

### Minor Changes

- Added Dev.to tools: create article, get my articles, get article by ID, update article
- Added Hashnode tools: create post, get posts, get publication info (GraphQL API)
- Added Beehiiv tools: create newsletter post, get posts (with open/click stats), get subscribers
- Added Ghost tools: create post, get posts, update post, delete post (Admin API with JWT auth)
- Added Twitch tools: get user, get live streams, get channel info, search channels, send chat message (Helix API)
- Added Tumblr tools: get blog info, create post, get posts, delete post (NPF v2 API)

## 2.1.0

### Minor Changes

- Added Medium tools: get user profile, publish Markdown article (public/draft/unlisted, up to 5 tags, canonical URL support)

## 2.0.0

### Major Changes

- adjusted all tools to now accept inline credentials per call — enables per-org / per-user accounts without env vars

## 1.8.1

### Patch Changes

- Email tools now accept inline credentials per call — enables per-org / per-user accounts without env vars
- SMTP connection is verified at startup via `transporter.verify()` so misconfigured credentials surface immediately

## 1.8.0

### Minor Changes

- Added Pinterest tools: get boards, create board, create pin, get pin, get board pins, delete pin
- Added Email tools with Laravel-style driver system: send email, send bulk email (supports SMTP, SendGrid, Mailgun)

## 1.7.1

### Patch Changes

- added sponsor

## 1.7.0

### Minor Changes

- added bluesky and mastodon

## 1.6.1

### Patch Changes

- doc update for youtube tool

## 1.6.0

### Minor Changes

- added youtube tool

## 1.5.0

### Minor Changes

- 83319e7: Add LinkedIn platform support with 7 tools: get profile, create post, get posts, delete post, like post, add comment, and search people
- 09e7224: **New tools (10 additions)**

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

- 373d97b: added reddit, thread and tiktok

### Patch Changes

- minor version bump

## 2.0.0

### Major Changes

- release of the social mcp

## 1.1.1

### Patch Changes

- becac39: ### Patch Changes
  - Added a new release note to the project.
  - Updated the documentation to include the new release note.

## 1.1.0

### Minor Changes

- e2ab605: updated doc
- 775eaab: updated the doc

## 1.0.2

### Patch Changes

- Updated release workflow to use a personal access token
