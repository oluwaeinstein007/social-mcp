# social-mcp

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
