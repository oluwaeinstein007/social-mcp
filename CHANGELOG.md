# social-mcp

## 2.10.0

### Minor Changes

- `BlueskyCredentials` now accepts `{ did, handle?, accessJwt, refreshJwt }` to resume an existing AT Proto session instead of requiring `identifier`/`appPassword` login on every call — for callers managing their own session lifecycle (e.g. connect-time login + external refresh). A new `getSession()` reads back the (possibly refreshed) session after an operation, since AT Proto rotates the refresh token on use, so callers can persist the new one. Also added `proxyUrl` support via `BskyAgent`'s custom `fetch` option, completing proxy coverage across every fetch/SDK-based service in the package.

## 2.9.0

### Minor Changes

- `RedditCredentials` now accepts a pre-obtained `accessToken` as an alternative to the password grant, for callers managing their own OAuth 2.0 authorization-code flow and token refresh elsewhere. Added a `link` parameter to `FacebookService.createPost` for `/feed`'s own link-preview card (distinct from `image`, which uploads a photo attachment).

## 2.8.0

### Minor Changes

- Added geo-targeting to `LinkedInService.createPost` (`geoUrns`) and `FacebookService.createPost` (`targetCountries`), and automatic 1024-char caption truncation to `WhatsappService.sendMessage` media captions (matching WhatsApp's own limit, same style as Telegram's caption handling) — closing gaps that were otherwise keeping Anthyx's own direct implementations from being able to move onto these services.

## 2.7.1

### Patch Changes

- Added `proxyUrl` support to `TikTokService` and `MediumService`, completing proxy coverage across all fetch-based services except Bluesky.

## 2.7.0

### Minor Changes

- Broad media/file pass across most platforms, plus expanded proxy support.

  **New media capabilities**: Discord (real multipart attachments, not just embed URLs), Slack (`files.uploadV2`), Telegram (`TELEGRAM_SEND_PHOTO`/`TELEGRAM_SEND_DOCUMENT`), Instagram (VIDEO/REELS support with container-status polling — previously publishing before processing finished could fail outright), Facebook (photo + new `CREATE_FACEBOOK_VIDEO_POST`), WhatsApp (image/video/document messages, with base64 uploaded to WhatsApp's media store first), Threads (IMAGE/VIDEO with the same container-polling fix as Instagram), Twitter/X (real media upload via `twitter-api-v2`'s `uploadMedia`, which picks simple vs. chunked based on size), Pinterest (native `image_base64` support, no separate upload step), Mastodon (`/api/v2/media` upload), Bluesky (`uploadBlob` + image embeds), YouTube (new `YOUTUBE_UPLOAD_VIDEO`, multipart upload), LinkedIn (image upload via the register→PUT→reference asset flow), Reddit (image/video via the lease→S3-upload flow), Ghost (`/images/upload/` for feature images), Tumblr (inline NPF media upload).

  **Twitter credentials**: `TwitterCredentials` now accepts a `bearerToken` (OAuth 2.0 user-context token) as an alternative to the four OAuth 1.0a fields, for callers that only have a bearer token.

  **Proxy support** extended from the Discord/Slack/Telegram pilot to: Twitter/X, Instagram, Facebook, WhatsApp, Threads, LinkedIn, Reddit, Pinterest, Mastodon, YouTube, Ghost, Tumblr.

  **Known gaps** (documented in README, not implemented): TikTok's `FILE_UPLOAD` mode (URL-based `PULL_FROM_URL` still works), and Dev.to/Hashnode/Beehiiv, which have no image upload endpoint in their public APIs at all.

## 2.6.0

### Minor Changes

- Added optional `proxyUrl` support to `DiscordService`, `SlackService`, and `TelegramService` for per-account IP routing (see new "Proxy Support" README section). Added real media capability to all three: Discord's `sendMessage` now uploads real multipart attachments instead of only URL embeds and `getMessages` returns attachment filenames/URLs; Slack's `sendMessage` uploads files via `files.uploadV2`; Telegram gained `TELEGRAM_SEND_PHOTO`/`TELEGRAM_SEND_DOCUMENT` tools (URL or base64), automatically following up with the full caption as a reply when it exceeds Telegram's 1024-character caption limit.

## 2.5.0

### Minor Changes

- Added `EmailService.getSESAccountStatus()` — reuses the signed `GetAccount` call from `verify()` to also report SES sandbox mode and 24h sending quota (`{ sandboxMode, max24HourSend, maxSendRate, sentLast24Hours }`), so callers can check quota before a bulk send instead of discovering it mid-batch.

## 2.4.1

### Patch Changes

- release of AWS SES support and verify

## 2.4.0

### Minor Changes

- 9b5abbf: Amazon SES: `verify()` now signs a real `GetAccount` call instead of being a no-op, so bad SES keys surface at connect time instead of on first send. Added `cc`, `bcc`, `replyTo`, `headers`, and `attachments` to `EMAIL_SEND` / `EMAIL_SEND_BULK`, supported across all four mail drivers (SMTP, SendGrid, Mailgun, SES); SES automatically switches to a raw MIME message when attachments are present since its Simple content type doesn't support them.

## 2.3.0

### Minor Changes

- Added Amazon SES driver to EmailService — sends via SES v2 REST API with AWS Signature V4 (no extra dependencies); accepts `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`, `SES_REGION` env vars or inline credentials per call

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
