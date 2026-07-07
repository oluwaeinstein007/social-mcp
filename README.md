# social-mcp

An MCP (Model Context Protocol) server that lets AI assistants post and interact across social media platforms.

## Supported Platforms

| Platform  | Tools                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Telegram  | Send message, get channel info, forward message, pin message, get channel administrators, edit message, delete message |
| Twitter/X | Send tweet, reply to tweet, like tweet, delete tweet, get user info, search tweets                                     |
| Discord   | Send message, get messages                                                                                             |
| WhatsApp  | Send message                                                                                                           |
| Facebook  | Create post, get posts                                                                                                 |
| Instagram | Create post, get posts                                                                                                 |
| Slack     | Send message, get messages, list channels                                                                              |
| LinkedIn  | Get profile, create post, get posts, like post, add comment, search people                                             |
| Reddit    | Submit post, get posts, comment, vote, search, get user info                                                           |
| Threads   | Get profile, create post, reply, get posts, delete post                                                                |
| Bluesky   | Get profile, create post, reply, get posts, delete post, like post, search posts                                       |
| Mastodon  | Get profile, create post, reply, search posts, boost post, favourite post, delete post                                 |
| TikTok    | Query creator info, get user info, post video, photo post, get post status                                             |
| YouTube   | Get channel info, search videos, get video info, list channel videos, get comments, post comment, update video         |
| Pinterest | Get boards, create board, create pin, get pin, get board pins, delete pin                                              |
| Medium    | Get user profile, publish article (Markdown, up to 5 tags, public/draft/unlisted)                                      |
| Email     | Send email, send bulk email (drivers: SMTP, SendGrid, Mailgun, Amazon SES)                                             |
| Dev.to    | Create article, get my articles, get article by ID, update article                                                     |
| Hashnode  | Create post, get posts, get publication info                                                                            |
| Beehiiv   | Create newsletter post, get posts, get subscribers                                                                     |
| Ghost     | Create post, get posts, update post, delete post                                                                        |
| Twitch    | Get user, get live streams, get channel info, search channels, send chat message                                        |
| Tumblr    | Get blog info, create post, get posts, delete post                                                                      |

## Quick Start

Run directly with `npx` — no install required:

```bash
npx social-mcp
```

Or install globally:

```bash
npm install -g social-mcp
social-mcp
```

## MCP Client Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "social-mcp": {
      "command": "npx",
      "args": ["social-mcp"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your_token",
        "TWITTER_APP_KEY": "your_key",
        "TWITTER_APP_SECRET": "your_secret",
        "TWITTER_ACCESS_TOKEN": "your_token",
        "TWITTER_ACCESS_SECRET": "your_secret",
        "DISCORD_BOT_TOKEN": "your_token",
        "WHATSAPP_ACCESS_TOKEN": "your_token",
        "WHATSAPP_PHONE_NUMBER_ID": "your_id",
        "FACEBOOK_ACCESS_TOKEN": "your_token",
        "INSTAGRAM_ACCESS_TOKEN": "your_token",
        "SLACK_BOT_TOKEN": "your_token",
        "LINKEDIN_ACCESS_TOKEN": "your_token",
        "REDDIT_CLIENT_ID": "your_client_id",
        "REDDIT_CLIENT_SECRET": "your_client_secret",
        "REDDIT_USERNAME": "your_username",
        "REDDIT_PASSWORD": "your_password",
        "THREADS_ACCESS_TOKEN": "your_token",
        "THREADS_USER_ID": "your_user_id",
        "BLUESKY_IDENTIFIER": "your_handle",
        "BLUESKY_APP_PASSWORD": "your_app_password",
        "MASTODON_ACCESS_TOKEN": "your_token",
        "MASTODON_INSTANCE_URL": "https://mastodon.social",
        "TIKTOK_ACCESS_TOKEN": "your_token",
        "YOUTUBE_ACCESS_TOKEN": "your_token",
        "PINTEREST_ACCESS_TOKEN": "your_token",
        "MAIL_MAILER": "smtp",
        "MAIL_FROM_ADDRESS": "you@example.com",
        "MAIL_FROM_NAME": "Your Name",
        "MAIL_HOST": "smtp.gmail.com",
        "MAIL_PORT": "587",
        "MAIL_USERNAME": "you@gmail.com",
        "MAIL_PASSWORD": "your_password",
        "MAIL_ENCRYPTION": "tls",
        "SES_ACCESS_KEY_ID": "your_access_key_id",
        "SES_SECRET_ACCESS_KEY": "your_secret_access_key",
        "SES_REGION": "us-east-1",
        "DEVTO_API_KEY": "your_api_key",
        "HASHNODE_ACCESS_TOKEN": "your_token",
        "HASHNODE_PUBLICATION_ID": "your_publication_id",
        "BEEHIIV_API_KEY": "your_api_key",
        "BEEHIIV_PUBLICATION_ID": "your_publication_id",
        "GHOST_SITE_URL": "https://your-blog.ghost.io",
        "GHOST_ADMIN_API_KEY": "your_id:your_secret",
        "TWITCH_CLIENT_ID": "your_client_id",
        "TWITCH_CLIENT_SECRET": "your_client_secret",
        "TWITCH_ACCESS_TOKEN": "your_user_token",
        "TUMBLR_ACCESS_TOKEN": "your_oauth_token",
        "TUMBLR_BLOG_IDENTIFIER": "your-blog-name"
      }
    }
  }
}
```

### Cursor / VS Code (via MCP extension)

```json
{
  "mcp": {
    "servers": {
      "social-mcp": {
        "command": "npx",
        "args": ["social-mcp"],
        "env": { "...": "same env vars as above" }
      }
    }
  }
}
```

Only include env vars for the platforms you actually use — unconfigured platforms are reported at startup but do not prevent the server from running.

## Environment Variables

Copy `example.env` to `.env` and fill in the credentials for the platforms you want to use.

### Telegram

| Variable             | Description                                         |
| -------------------- | --------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |

### Twitter / X

| Variable                | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `TWITTER_APP_KEY`       | API key from the [Twitter Developer Portal](https://developer.twitter.com) |
| `TWITTER_APP_SECRET`    | API secret                                                                 |
| `TWITTER_ACCESS_TOKEN`  | Access token (OAuth 1.0a, Read & Write)                                    |
| `TWITTER_ACCESS_SECRET` | Access token secret                                                        |

### Discord

| Variable            | Description                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DISCORD_BOT_TOKEN` | Bot token from the [Discord Developer Portal](https://discord.com/developers/applications) — bot must have Send Messages and Read Message History permissions |

### WhatsApp Business

| Variable                   | Description                             |
| -------------------------- | --------------------------------------- |
| `WHATSAPP_ACCESS_TOKEN`    | Access token from Meta for Developers   |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID from WhatsApp API Setup |

### Facebook

| Variable                | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `FACEBOOK_ACCESS_TOKEN` | Page Access Token from Meta Graph API Explorer |

### Instagram

| Variable                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `INSTAGRAM_ACCESS_TOKEN` | Token with `instagram_content_publish` scope |

### Slack

| Variable          | Description                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `SLACK_BOT_TOKEN` | Bot token from [api.slack.com](https://api.slack.com/apps) — requires `chat:write`, `channels:history`, `channels:read` scopes |

### LinkedIn

| Variable                | Description                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 access token from the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) — requires `r_liteprofile`, `w_member_social` scopes |

### Reddit

| Variable               | Description                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `REDDIT_CLIENT_ID`     | App client ID from [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) (create a "script" type app) |
| `REDDIT_CLIENT_SECRET` | App client secret                                                                                          |
| `REDDIT_USERNAME`      | Reddit account username                                                                                    |
| `REDDIT_PASSWORD`      | Reddit account password                                                                                    |

### Threads

| Variable               | Description                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `THREADS_ACCESS_TOKEN` | OAuth 2.0 access token from the [Meta for Developers](https://developers.facebook.com) — requires `threads_basic`, `threads_content_publish` scopes |
| `THREADS_USER_ID`      | Your Threads user ID (returned from the Threads API `/me` endpoint)                                                                                 |

### Bluesky

| Variable               | Description                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `BLUESKY_IDENTIFIER`   | Your Bluesky handle (e.g., `user.bsky.social`) or email address                                               |
| `BLUESKY_APP_PASSWORD` | App-specific password generated at [bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords) |
| `BLUESKY_SERVICE`      | (Optional) Bluesky service URL (defaults to `https://bsky.social`)                                            |

### Mastodon

| Variable                | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `MASTODON_ACCESS_TOKEN` | OAuth 2.0 access token from your Mastodon instance                            |
| `MASTODON_INSTANCE_URL` | (Optional) Your Mastodon instance URL (defaults to `https://mastodon.social`) |

### TikTok

| Variable              | Description                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TIKTOK_ACCESS_TOKEN` | OAuth 2.0 access token from the [TikTok for Developers](https://developers.tiktok.com) — requires `user.info.basic`, `video.publish`, `video.upload` scopes |

### YouTube

| Variable               | Description                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `YOUTUBE_ACCESS_TOKEN` | OAuth 2.0 access token from the [Google Cloud Console](https://console.cloud.google.com) — requires `https://www.googleapis.com/auth/youtube` scope |

### Pinterest

| Variable                  | Description                                                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PINTEREST_ACCESS_TOKEN`  | OAuth 2.0 Bearer token from the [Pinterest Developer Portal](https://developers.pinterest.com) — requires `boards:read boards:write pins:read pins:write` scopes |

### Medium

| Variable               | Description                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `MEDIUM_ACCESS_TOKEN`  | Integration token from [Medium Settings](https://medium.com/me/settings) → Security and apps → Integration tokens → Get integration token    |

### Dev.to

| Variable       | Description                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `DEVTO_API_KEY` | API key from [dev.to/settings/extensions](https://dev.to/settings/extensions) → DEV API Keys            |

### Hashnode

| Variable                   | Description                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `HASHNODE_ACCESS_TOKEN`    | Personal Access Token from [hashnode.com/settings/developer](https://hashnode.com/settings/developer) |
| `HASHNODE_PUBLICATION_ID`  | Your publication's ID (visible in the Hashnode dashboard URL or via `HASHNODE_GET_PUBLICATION`)   |

### Beehiiv

| Variable                  | Description                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `BEEHIIV_API_KEY`         | API key from [app.beehiiv.com/settings/api](https://app.beehiiv.com/settings/api)            |
| `BEEHIIV_PUBLICATION_ID`  | Your publication ID (found in the Beehiiv dashboard URL)                                      |

### Ghost

| Variable               | Description                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `GHOST_SITE_URL`       | Your Ghost site URL (e.g. `https://your-blog.ghost.io`)                                                           |
| `GHOST_ADMIN_API_KEY`  | Admin API key in `id:secret` format from Ghost Admin → Settings → Integrations → Add custom integration          |

### Twitch

| Variable               | Description                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `TWITCH_CLIENT_ID`     | Client ID from the [Twitch Developer Console](https://dev.twitch.tv/console/apps)                                             |
| `TWITCH_CLIENT_SECRET` | Client secret from the Twitch Developer Console                                                                                |
| `TWITCH_ACCESS_TOKEN`  | (Optional) User OAuth token with `chat:edit` scope — only required for `TWITCH_SEND_CHAT_MESSAGE`                             |

### Tumblr

| Variable                  | Description                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `TUMBLR_ACCESS_TOKEN`     | OAuth 2.0 Bearer token from the [Tumblr API console](https://www.tumblr.com/oauth/apps) — requires write access for creating/deleting posts |
| `TUMBLR_BLOG_IDENTIFIER`  | Your blog name or URL (e.g. `myblog` or `myblog.tumblr.com`)                                                                             |

### Email

Email uses a Laravel-style driver system. **Env vars are optional** — credentials can also be passed inline per tool call (see [Per-org / Multi-account Usage](#per-org--multi-account-usage)).

Set `MAIL_MAILER` to select your provider (`smtp`, `sendgrid`, `mailgun`, or `ses`) and only configure the variables for the driver you choose.

| Variable             | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `MAIL_MAILER`        | Mail driver: `smtp`, `sendgrid`, or `mailgun` (default: `smtp`)        |
| `MAIL_FROM_ADDRESS`  | Sender email address (required for all drivers)                        |
| `MAIL_FROM_NAME`     | Sender display name (optional)                                         |

**SMTP** (`MAIL_MAILER=smtp`)

| Variable          | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `MAIL_HOST`       | SMTP server hostname (e.g. `smtp.gmail.com`, `smtp.mailgun.org`)           |
| `MAIL_PORT`       | SMTP port (default: `587`)                                                 |
| `MAIL_USERNAME`   | SMTP authentication username                                               |
| `MAIL_PASSWORD`   | SMTP authentication password                                               |
| `MAIL_ENCRYPTION` | Connection security: `tls` (default), `ssl`, or `none`                     |

> **SMTP verification:** On startup, social-mcp calls `transporter.verify()` against your SMTP server. A misconfigured host or wrong password shows `[!!]` in the startup log rather than failing silently on the first send.

**SendGrid** (`MAIL_MAILER=sendgrid`)

| Variable           | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| `SENDGRID_API_KEY` | API key from the [SendGrid dashboard](https://app.sendgrid.com/settings/api_keys)      |

**Mailgun** (`MAIL_MAILER=mailgun`)

| Variable          | Description                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `MAILGUN_API_KEY` | API key from [Mailgun account settings](https://app.mailgun.com/app/account/security/api_keys) |
| `MAILGUN_DOMAIN`  | Your Mailgun sending domain (e.g. `mg.yourdomain.com`)                                       |

**Amazon SES** (`MAIL_MAILER=ses`)

| Variable               | Description                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `SES_ACCESS_KEY_ID`    | AWS IAM Access Key ID — the IAM user must have `ses:SendEmail` permission                                                                     |
| `SES_SECRET_ACCESS_KEY`| AWS IAM Secret Access Key                                                                                                                     |
| `SES_REGION`           | AWS region where your SES sending identity is verified (default: `us-east-1`)                                                                 |

> **Note:** The sender address (`MAIL_FROM_ADDRESS`) must be a verified identity in your SES account. Sending uses the SES v2 REST API with AWS Signature V4 — no AWS SDK required. On startup (and via `EmailService.verify()`), your keys are checked with a signed `GetAccount` call, the same way SMTP is checked with `transporter.verify()`. To also check sandbox mode and 24h sending quota (e.g. before kicking off a bulk send), call `EmailService.getSESAccountStatus()` — it reuses that same signed request and returns `{ sandboxMode, max24HourSend, maxSendRate, sentLast24Hours }`.

## Available Tools

### Telegram

- **TELEGRAM_SEND_MESSAGE** — Send a message to a chat or channel (`chatId`, `text`)
- **TELEGRAM_SEND_PHOTO** — Send a photo from a public URL or base64 bytes (`chatId`, `photo`, `filename`, `caption`)
- **TELEGRAM_SEND_DOCUMENT** — Send a file from a public URL or base64 bytes (`chatId`, `document`, `filename`, `caption`)
- **TELEGRAM_GET_CHANNEL_INFO** — Get channel metadata (`channelId`)
- **TELEGRAM_FORWARD_MESSAGE** — Forward a message between chats (`fromChatId`, `toChatId`, `messageId`)
- **TELEGRAM_PIN_MESSAGE** — Pin a message in a chat (`chatId`, `messageId`)
- **TELEGRAM_GET_CHANNEL_MEMBERS** — List channel administrators (`channelId`, `limit`)
- **TELEGRAM_EDIT_MESSAGE** — Edit the text of a message (`chatId`, `messageId`, `text`)
- **TELEGRAM_DELETE_MESSAGE** — Delete a message (`chatId`, `messageId`)

> **Note:** Captions over 1024 characters (Telegram's limit) are automatically sent as a follow-up reply instead of failing the call.

### Twitter / X

- **SEND_TWEET** — Post a tweet, optionally with up to 4 image attachments or 1 gif/video (`text`, max 280 chars, `media`)
- **REPLY_TWEET** — Reply to a tweet (`tweetId`, `text`)
- **LIKE_TWEET** — Like a tweet (`tweetId`)
- **DELETE_TWEET** — Delete a tweet (`tweetId`)
- **GET_TWITTER_USER_INFO** — Get a user's profile and metrics (`username`)
- **SEARCH_TWEETS** — Search recent tweets (`query`, `maxResults`)

> **Note:** `media` takes `{ content, mimeType }[]` with `content` as base64, uploaded via `twitter-api-v2`'s `uploadMedia` (picks simple vs. chunked upload based on file size, so video is supported). `TwitterCredentials` also accepts a `bearerToken` in place of the four OAuth 1.0a fields (`appKey`/`appSecret`/`accessToken`/`accessSecret`) for callers that only have an OAuth 2.0 user-context token — X accepts it on both v2 and v1.1 media upload endpoints.

### Discord

- **SEND_DISCORD_MESSAGE** — Send a message to a channel, optionally with file attachments (`channelId`, `content`, `attachments`)
- **GET_DISCORD_MESSAGES** — Retrieve recent messages from a channel, including attachment filenames/URLs (`channelId`, `limit`)

> **Note:** `attachments` take `{ filename, content, contentType? }` with `content` as base64 and are uploaded as real multipart attachments (not just an embedded image URL).

### WhatsApp

- **SEND_WHATSAPP_MESSAGE** — Send a text, image, video, or document message (`to`, `text`, `media`, `mediaKind`, `mediaContentType`, `mediaFilename`)

> **Note:** `media` is a public URL (sent as `link`) or base64-encoded bytes — base64 is uploaded to WhatsApp's media store first (`/media`) and referenced by the returned ID, since messages can't carry bytes inline. WhatsApp message retrieval requires webhook setup and cannot be polled via the API.

### Facebook

- **CREATE_FACEBOOK_POST** — Create a post on a Facebook page, optionally with a photo (`pageId`, `message`, `image`, `imageFilename`)
- **CREATE_FACEBOOK_VIDEO_POST** — Upload and publish a video on a page (`pageId`, `description`, `video`, `filename`)
- **GET_FACEBOOK_POSTS** — Retrieve recent posts from a page (`pageId`, `limit`)

> **Note:** `image`/`video` take either a public URL (fetched server-side via `/photos`' `url` / `/videos`' `file_url`) or base64-encoded bytes (uploaded as a real multipart `source`).

### Instagram

- **CREATE_INSTAGRAM_POST** — Publish an image, video, or Reels post (`userId`, `imageUrl`, `caption`, `mediaType`: IMAGE/VIDEO/REELS)
- **GET_INSTAGRAM_POSTS** — Retrieve recent posts from an account, including `media_url`/`permalink` (`userId`, `limit`)

> **Note:** `imageUrl` must be a publicly reachable URL for all media types — Instagram's Content Publishing API has no direct byte-upload path. For VIDEO/REELS, the container is polled until Meta finishes processing before publishing (previously publishing immediately could fail while the video was still processing).

### Slack

- **SEND_SLACK_MESSAGE** — Send a message to a channel, optionally with file attachments (`channelId`, `text`, `attachments`)
- **GET_SLACK_MESSAGES** — Retrieve recent messages from a channel (`channelId`, `limit`)
- **LIST_SLACK_CHANNELS** — List public channels in the workspace (`limit`)

> **Note:** `attachments` take `{ filename, content }` with `content` as base64, uploaded via Slack's `files.uploadV2`. When present, `text` becomes the initial comment on the first file.

### LinkedIn

- **GET_LINKEDIN_PROFILE** — Get the authenticated user's profile information
- **CREATE_LINKEDIN_POST** — Create a UGC post, optionally with an image (`authorUrn`, `text`, `visibility`, `image`, `imageTitle`)
- **GET_LINKEDIN_POSTS** — Retrieve recent posts by a member or organization (`authorUrn`, `count`)
- **DELETE_LINKEDIN_POST** — Delete a UGC post (`ugcPostUrn`)
- **LIKE_LINKEDIN_POST** — Like a post (`actorUrn`, `ugcPostUrn`)
- **ADD_LINKEDIN_COMMENT** — Comment on a post (`actorUrn`, `ugcPostUrn`, `text`)
- **SEARCH_LINKEDIN_PEOPLE** — Search for people by keywords (`keywords`, `count`)

> **Note:** `SEARCH_LINKEDIN_PEOPLE` uses the LinkedIn People Search API which requires [Partner Program](https://learn.microsoft.com/en-us/linkedin/talent/recruiter-system-connect/getting-access) access. Most developer apps will receive a 403. All other tools work with a standard OAuth 2.0 token. `image` is base64-encoded bytes — LinkedIn's UGC API has no URL-reference option, so it always goes through the register-upload → PUT bytes → reference-asset-URN flow.

### Reddit

- **REDDIT_SUBMIT_POST** — Submit a text, link, or image post to a subreddit (`subreddit`, `title`, `kind`, `text`, `url`, `image`, `imageFilename`, `imageMimeType`)
- **REDDIT_GET_POSTS** — Get posts from a subreddit (`subreddit`, `sort`, `limit`)
- **REDDIT_COMMENT** — Comment on a post or reply to a comment (`parentId`, `text`)
- **REDDIT_VOTE** — Upvote, downvote, or remove a vote (`id`, `direction`)
- **REDDIT_SEARCH** — Search Reddit across all or a specific subreddit (`query`, `subreddit`, `sort`, `limit`)
- **REDDIT_GET_USER_INFO** — Get public info about a Reddit user (`username`)

> **Note:** Reddit requires a "script" type app in [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps). The password grant flow is used — 2FA must be disabled on the account. For `kind: "image"`, base64 bytes go through Reddit's lease-then-S3-upload flow (`/api/media/asset.json`) and the post links to the resulting `i.redd.it` asset.

### Threads

- **THREADS_GET_PROFILE** — Get your Threads profile information
- **THREADS_CREATE_POST** — Create a new post, optionally with an image or video (`text`, `replyToId`, `mediaUrl`, `mediaType`: IMAGE/VIDEO)
- **THREADS_REPLY** — Reply to a Threads post (`replyToId`, `text`)
- **THREADS_GET_POSTS** — Get recent posts from your account, including `media_url` (`limit`)
- **THREADS_DELETE_POST** — Delete a post by ID (`mediaId`)

> **Note:** `mediaUrl` must be a publicly reachable URL, same as Instagram (shared Meta infrastructure). IMAGE/VIDEO containers are polled until processing finishes before publishing.

### Bluesky

- **BLUESKY_GET_PROFILE** — Get your Bluesky profile information
- **BLUESKY_CREATE_POST** — Create a new post, optionally with up to 4 images (`text`, `images`)
- **BLUESKY_REPLY_TO_POST** — Reply to a Bluesky post (`text`, `parentUri`, `parentCid`, `rootUri`, `rootCid`)
- **BLUESKY_GET_POSTS** — Get recent posts from your feed (`limit`)
- **BLUESKY_DELETE_POST** — Delete a post by URI (`uri`, `cid`)
- **BLUESKY_LIKE_POST** — Like a post (`uri`, `cid`)
- **BLUESKY_SEARCH_POSTS** — Search for posts on Bluesky (`query`, `limit`)

> **Note:** `images` take `{ content, mimeType, alt? }[]` with `content` as base64 — AT Proto has no URL-reference option, every image is uploaded as a blob (`uploadBlob`) and referenced in the post's embed. For library consumers managing their own session (e.g. an app that already exchanged an identifier/app-password for a session and refreshes it independently), `BlueskyCredentials` also accepts `{ did, handle?, accessJwt, refreshJwt }` to resume that session instead of logging in fresh — call `getSession()` afterward to read back the session in case AT Proto rotated the refresh token during the call, so you can persist the new one.

### Mastodon

- **MASTODON_GET_PROFILE** — Get your Mastodon profile information
- **MASTODON_CREATE_POST** — Create a new post, optionally with up to 4 media attachments (`status`, `inReplyToId` optional, `visibility`, `media`)
- **MASTODON_REPLY_TO_POST** — Reply to a Mastodon post (`status`, `inReplyToId`)
- **MASTODON_SEARCH_POSTS** — Search for posts on your instance (`query`, `limit`)
- **MASTODON_BOOST_POST** — Reblog/boost a post (`statusId`)
- **MASTODON_FAVOURITE_POST** — Favorite/like a post (`statusId`)
- **MASTODON_DELETE_POST** — Delete a post (`statusId`)

> **Note:** `media` take `{ content, filename?, description? }[]` with `content` as base64, uploaded via `/api/v2/media` and attached by ID.

### TikTok

- **TIKTOK_QUERY_CREATOR_INFO** — Query creator info including posting permissions and privacy options
- **TIKTOK_GET_USER_INFO** — Get TikTok account profile and stats
- **TIKTOK_DIRECT_POST_VIDEO** — Post a video by URL (`videoUrl`, `title`, `privacyLevel`, ...)
- **TIKTOK_PHOTO_POST** — Create a photo/carousel post (`photoUrls`, `title`, `description`, `privacyLevel`)
- **TIKTOK_GET_POST_STATUS** — Check the publishing status of a video or photo post (`publishId`)

> **Note:** TikTok's Content Posting API requires app approval from [TikTok for Developers](https://developers.tiktok.com). Videos are pulled from a public URL by TikTok's servers (`PULL_FROM_URL`) rather than uploaded directly — TikTok's alternative `FILE_UPLOAD` mode (chunked byte upload for base64/local content) is not yet implemented here; if you need it, it's the same style of lease-then-PUT flow used for LinkedIn/Reddit media above.

### YouTube

- **YOUTUBE_GET_CHANNEL_INFO** — Get channel info and stats (`channelId` optional — omit for your own channel)
- **YOUTUBE_SEARCH_VIDEOS** — Search YouTube for videos (`query`, `maxResults`, `pageToken`)
- **YOUTUBE_GET_VIDEO_INFO** — Get detailed info and stats for a video (`videoId`)
- **YOUTUBE_LIST_CHANNEL_VIDEOS** — List recent uploads from a channel (`channelId`, `maxResults`, `pageToken`)
- **YOUTUBE_GET_COMMENTS** — Get top-level comments on a video (`videoId`, `maxResults`)
- **YOUTUBE_POST_COMMENT** — Post a comment on a video (`videoId`, `text`)
- **YOUTUBE_UPDATE_VIDEO** — Update a video's title, description, and tags (`videoId`, `title`, `description`, `tags`, `categoryId`)
- **YOUTUBE_UPLOAD_VIDEO** — Upload a video to the authenticated user's channel (`content`, `contentType`, `title`, `description`, `tags`, `categoryId`, `privacyStatus`)

> **Note:** YouTube requires an OAuth 2.0 access token with the `https://www.googleapis.com/auth/youtube` scope (or `.upload` for uploads). Enable the **YouTube Data API v3** in your [Google Cloud Console](https://console.cloud.google.com) project. `YOUTUBE_UPLOAD_VIDEO` uses a single-request multipart upload (not YouTube's resumable/chunked protocol) — appropriate since `content` arrives as one base64 tool argument rather than a large local file; very large videos may need the resumable flow instead.

### Pinterest

- **PINTEREST_GET_BOARDS** — List all boards on your Pinterest account (`pageSize`)
- **PINTEREST_CREATE_BOARD** — Create a new board (`name`, `description`)
- **PINTEREST_CREATE_PIN** — Create a pin on a board (`boardId`, `title`, `description`, `image`, `imageContentType`, `link`)
- **PINTEREST_GET_PIN** — Get details of a specific pin, including media URLs (`pinId`)
- **PINTEREST_GET_BOARD_PINS** — List all pins on a board (`boardId`, `pageSize`)
- **PINTEREST_DELETE_PIN** — Delete a pin by ID (`pinId`)

> **Note:** `image` takes either a public URL or base64-encoded bytes — unlike most platforms, Pinterest's v5 API accepts base64 directly in the pin body (`image_base64`), no separate upload step needed.

### Medium

- **MEDIUM_GET_USER** — Get your Medium profile and user ID (required for publishing)
- **MEDIUM_CREATE_POST** — Publish a Markdown article (`authorId`, `title`, `content`, `tags` up to 5, `publishStatus`, `canonicalUrl`)

> **Note:** Medium Integration tokens are permanent and do not expire. Articles are published under your personal profile. To get your `authorId`, call `MEDIUM_GET_USER` first. The `canonicalUrl` field is useful for cross-posting from your own blog.

### Email

- **EMAIL_SEND** — Send an email to a single recipient (`to`, `subject`, `text`, `html`, `cc`, `bcc`, `replyTo`, `headers`, `attachments`; plus optional inline credentials — see below)
- **EMAIL_SEND_BULK** — Send the same email to multiple recipients (`recipients`, `subject`, `text`, `html`, `cc`, `bcc`, `replyTo`, `headers`, `attachments`; plus optional inline credentials)

> The active mail driver is selected by `MAIL_MAILER`. Switching providers requires only changing that one variable — no code changes needed. Credentials can also be passed inline per call for multi-account / per-org use cases. `attachments` take `{ filename, content, contentType? }` with `content` as base64; for SES this transparently switches to a raw MIME message since attachments aren't supported by the plain send API.

### Dev.to

- **DEVTO_CREATE_ARTICLE** — Create or draft a Dev.to article (`title`, `bodyMarkdown`, `tags` up to 4, `published`, `description`, `canonicalUrl`, `series`, `mainImage`)
- **DEVTO_GET_MY_ARTICLES** — List all articles published by the authenticated user (`page`, `perPage`)
- **DEVTO_GET_ARTICLE** — Get a specific article by ID including its full Markdown body (`id`)
- **DEVTO_UPDATE_ARTICLE** — Update an existing article (`id`, `title`, `bodyMarkdown`, `published`, `tags`, `description`, `canonicalUrl`)
- **DEVTO_GET_ME** — Get the authenticated user's profile — also useful to validate an API key at connect time

> **Note:** Get your API key at [dev.to/settings/extensions](https://dev.to/settings/extensions). Set `published: false` to save as a draft. `mainImage` is a URL only — Dev.to's public API has no image upload endpoint; body images must already be hosted and linked in the Markdown.

### Hashnode

- **HASHNODE_GET_PUBLICATION** — Get publication info including ID, title, and URL
- **HASHNODE_GET_POSTS** — List recent posts from a Hashnode publication (`first`, `publicationId`)
- **HASHNODE_CREATE_POST** — Publish a post to a Hashnode publication (`title`, `contentMarkdown`, `tags`, `subtitle`, `coverImageUrl`, `publicationId`)

> **Note:** Tags are passed as `[{ name, slug }]` objects. Get your publication ID via `HASHNODE_GET_PUBLICATION` or from the Hashnode dashboard URL. `coverImageURL` is a URL only — Hashnode's GraphQL API expects an already-hosted image, not a byte upload.

### Beehiiv

- **BEEHIIV_CREATE_POST** — Create a newsletter post (`title`, `bodyHtml`, `subtitle`, `status`, `audience`, `publicationId`)
- **BEEHIIV_GET_POSTS** — List posts with send stats including open rate (`page`, `limit`, `publicationId`)
- **BEEHIIV_GET_SUBSCRIBERS** — List subscribers with status and tier info (`page`, `limit`, `publicationId`)

> **Note:** Set `status: "confirmed"` to schedule the post for sending. `status: "draft"` saves it without sending. `bodyHtml` is raw HTML — Beehiiv's public API has no image/attachment upload; inline images must already be hosted.

### Ghost

- **GHOST_CREATE_POST** — Create a post on a Ghost blog, optionally with a feature image (`title`, `html`, `status`, `tags`, `excerpt`, `publishedAt`, `featureImage`, `featureImageFilename`)
- **GHOST_GET_POSTS** — List posts filtered by status (`page`, `limit`, `status`)
- **GHOST_UPDATE_POST** — Update an existing post — requires the post's current `updated_at` timestamp for optimistic locking (`id`, `updatedAt`, `title`, `html`, `status`, `tags`, `excerpt`)
- **GHOST_DELETE_POST** — Permanently delete a post (`id`)

> **Note:** The Admin API key (`GHOST_ADMIN_API_KEY`) must be in `id:secret` format from Ghost Admin → Settings → Integrations. Ghost uses JWT authentication which is generated automatically per request. `featureImage` takes a public URL or base64-encoded bytes; base64 is uploaded via Ghost's `/images/upload/` endpoint first.

### Twitch

- **TWITCH_GET_USER** — Get Twitch user info by username (`login`)
- **TWITCH_GET_STREAMS** — Get currently live streams, filtered by usernames or game ID (`userLogins`, `gameId`, `first`)
- **TWITCH_GET_CHANNEL_INFO** — Get channel details including current game and stream title (`broadcasterId`)
- **TWITCH_SEARCH_CHANNELS** — Search channels by name with optional live-only filter (`query`, `liveOnly`, `first`)
- **TWITCH_SEND_CHAT_MESSAGE** — Send a message to a Twitch chat channel (`broadcasterId`, `senderId`, `message`) — requires user OAuth token with `chat:edit` scope

> **Note:** Most read tools use app access tokens generated automatically from `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET`. `TWITCH_SEND_CHAT_MESSAGE` additionally requires `TWITCH_ACCESS_TOKEN` — a user-level OAuth token with the `chat:edit` scope.

### Tumblr

- **TUMBLR_GET_BLOG_INFO** — Get blog info including title, description, post count, and follower count (`blogIdentifier`)
- **TUMBLR_CREATE_POST** — Create a post using the Neue Post Format, optionally with an image (`text`, `title`, `tags`, `state`, `blogIdentifier`, `image`, `imageContentType`)
- **TUMBLR_GET_POSTS** — Get posts from a blog, optionally filtered by type (`offset`, `limit`, `type`, `blogIdentifier`)
- **TUMBLR_DELETE_POST** — Delete a post by ID (`postId`, `blogIdentifier`)

> **Note:** Tumblr uses OAuth 2.0 Bearer tokens. Set `state: "draft"` or `"queue"` to save without publishing immediately. `image` takes a public URL (referenced directly in the NPF content block) or base64-encoded bytes (uploaded inline via a multipart request with an `identifier`-referenced block).

## Per-org / Multi-account Usage

Both email tools accept **inline credentials** as optional parameters. When provided, they take full priority over env vars — a fresh, isolated `EmailService` is created for that call. This enables per-organization or per-user email accounts without any env var changes.

**Example — SMTP:**
```json
{
  "mailer": "smtp",
  "fromAddress": "team@acme.com",
  "fromName": "Acme Corp",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpUsername": "team@acme.com",
  "smtpPassword": "app-password",
  "smtpEncryption": "tls",
  "to": "customer@example.com",
  "subject": "Hello",
  "text": "Hi there!"
}
```

**Example — SendGrid:**
```json
{
  "mailer": "sendgrid",
  "fromAddress": "team@acme.com",
  "sendgridApiKey": "SG.xxxx",
  "recipients": ["a@example.com", "b@example.com"],
  "subject": "Newsletter",
  "text": "Plain text body",
  "html": "<p>HTML body</p>"
}
```

**Example — Mailgun:**
```json
{
  "mailer": "mailgun",
  "fromAddress": "team@acme.com",
  "mailgunApiKey": "key-xxxx",
  "mailgunDomain": "mg.acme.com",
  "to": "customer@example.com",
  "subject": "Hello",
  "text": "Hi there!"
}
```

When `mailer` and `fromAddress` are omitted, the tool falls back to the env var configuration (`MAIL_MAILER`, `MAIL_FROM_ADDRESS`, etc.).

## Proxy Support

Most services accept an optional `proxyUrl` in their credentials (e.g. `new DiscordService({ botToken, proxyUrl: "http://user:pass@host:port" })`), routing that account's API calls through an HTTP(S) proxy — useful for a multi-tenant host that wants each connected account's traffic to originate from a distinct, consistent IP. This is a constructor-level option for programmatic/library consumers (not an MCP tool parameter, since it's server-operator infrastructure rather than message content).

Supported today: Discord, Slack, Telegram, Twitter/X, Instagram, Facebook, WhatsApp, Threads, LinkedIn, Reddit, Pinterest, Mastodon, YouTube, Ghost, Tumblr, TikTok, Medium, Bluesky. Not yet wired: Dev.to, Hashnode, Beehiiv, Twitch — these currently ignore any `proxyUrl` passed to them.

Three mechanisms are used depending on how each service talks to its platform, since passing the wrong one is a silent no-op rather than an error:
- `createProxyDispatcher()` (undici `ProxyAgent`) for services using raw `fetch()` — most of the list above.
- `createProxyAgent()` (`https-proxy-agent`) for services built on SDKs that take a classic `http.Agent` (Slack's `@slack/web-api`, Telegram's `telegraf`, Twitter's `twitter-api-v2` via its `httpAgent` client option).
- Bluesky's `BskyAgent` takes a custom `fetch` function directly (`AtpAgentOptions.fetch`) — `BlueskyService` wraps `createProxyDispatcher()`'s dispatcher in one when `proxyUrl` is set.

`createProxyDispatcher`/`createProxyAgent` are exported from `social-mcp/dist/lib/proxy.js` if you need to build the agent/dispatcher yourself.

## Development

```bash
pnpm install
pnpm run build      # compile TypeScript
pnpm run clean      # remove dist/
pnpm run watch      # watch mode
pnpm run test       # run tests
pnpm run lint       # lint with Biome
pnpm run format     # format with Biome
```

For a clean rebuild:

```bash
pnpm run clean && pnpm run build
```

## Support

If you find this project useful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-%23EA4AAA?logo=github)](https://github.com/sponsors/oluwaeinstein007)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-lanrecodes-%23FFDD00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/lanrecodes)

## License

MIT
