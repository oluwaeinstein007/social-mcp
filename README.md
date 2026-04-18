# social-mcp

An MCP (Model Context Protocol) server that lets AI assistants post and interact across social media platforms.

## Supported Platforms

| Platform  | Tools |
|-----------|-------|
| Telegram  | Send message, get channel info, forward message, pin message, get channel administrators, edit message, delete message |
| Twitter/X | Send tweet, reply to tweet, like tweet, delete tweet, get user info, search tweets |
| Discord   | Send message, get messages |
| WhatsApp  | Send message |
| Facebook  | Create post, get posts |
| Instagram | Create post, get posts |
| Slack     | Send message, get messages, list channels |
| LinkedIn  | Get profile, create post, get posts, like post, add comment, search people |
| Reddit    | Submit post, get posts, comment, vote, search, get user info |
| Threads   | Get profile, create post, reply, get posts, delete post |
| TikTok    | Query creator info, get user info, post video, photo post, get post status |
| YouTube   | Get channel info, search videos, get video info, list channel videos, get comments, post comment, update video |

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
        "TIKTOK_ACCESS_TOKEN": "your_token",
        "YOUTUBE_ACCESS_TOKEN": "your_token"
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
| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |

### Twitter / X
| Variable | Description |
|----------|-------------|
| `TWITTER_APP_KEY` | API key from the [Twitter Developer Portal](https://developer.twitter.com) |
| `TWITTER_APP_SECRET` | API secret |
| `TWITTER_ACCESS_TOKEN` | Access token (OAuth 1.0a, Read & Write) |
| `TWITTER_ACCESS_SECRET` | Access token secret |

### Discord
| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Bot token from the [Discord Developer Portal](https://discord.com/developers/applications) — bot must have Send Messages and Read Message History permissions |

### WhatsApp Business
| Variable | Description |
|----------|-------------|
| `WHATSAPP_ACCESS_TOKEN` | Access token from Meta for Developers |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID from WhatsApp API Setup |

### Facebook
| Variable | Description |
|----------|-------------|
| `FACEBOOK_ACCESS_TOKEN` | Page Access Token from Meta Graph API Explorer |

### Instagram
| Variable | Description |
|----------|-------------|
| `INSTAGRAM_ACCESS_TOKEN` | Token with `instagram_content_publish` scope |

### Slack
| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot token from [api.slack.com](https://api.slack.com/apps) — requires `chat:write`, `channels:history`, `channels:read` scopes |

### LinkedIn
| Variable | Description |
|----------|-------------|
| `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 access token from the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) — requires `r_liteprofile`, `w_member_social` scopes |

### Reddit
| Variable | Description |
|----------|-------------|
| `REDDIT_CLIENT_ID` | App client ID from [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) (create a "script" type app) |
| `REDDIT_CLIENT_SECRET` | App client secret |
| `REDDIT_USERNAME` | Reddit account username |
| `REDDIT_PASSWORD` | Reddit account password |

### Threads
| Variable | Description |
|----------|-------------|
| `THREADS_ACCESS_TOKEN` | OAuth 2.0 access token from the [Meta for Developers](https://developers.facebook.com) — requires `threads_basic`, `threads_content_publish` scopes |
| `THREADS_USER_ID` | Your Threads user ID (returned from the Threads API `/me` endpoint) |

### TikTok
| Variable | Description |
|----------|-------------|
| `TIKTOK_ACCESS_TOKEN` | OAuth 2.0 access token from the [TikTok for Developers](https://developers.tiktok.com) — requires `user.info.basic`, `video.publish`, `video.upload` scopes |

### YouTube
| Variable | Description |
|----------|-------------|
| `YOUTUBE_ACCESS_TOKEN` | OAuth 2.0 access token from the [Google Cloud Console](https://console.cloud.google.com) — requires `https://www.googleapis.com/auth/youtube` scope |

## Available Tools

### Telegram
- **TELEGRAM_SEND_MESSAGE** — Send a message to a chat or channel (`chatId`, `text`)
- **TELEGRAM_GET_CHANNEL_INFO** — Get channel metadata (`channelId`)
- **TELEGRAM_FORWARD_MESSAGE** — Forward a message between chats (`fromChatId`, `toChatId`, `messageId`)
- **TELEGRAM_PIN_MESSAGE** — Pin a message in a chat (`chatId`, `messageId`)
- **TELEGRAM_GET_CHANNEL_MEMBERS** — List channel administrators (`channelId`, `limit`)
- **TELEGRAM_EDIT_MESSAGE** — Edit the text of a message (`chatId`, `messageId`, `text`)
- **TELEGRAM_DELETE_MESSAGE** — Delete a message (`chatId`, `messageId`)

### Twitter / X
- **SEND_TWEET** — Post a tweet (`text`, max 280 chars)
- **REPLY_TWEET** — Reply to a tweet (`tweetId`, `text`)
- **LIKE_TWEET** — Like a tweet (`tweetId`)
- **DELETE_TWEET** — Delete a tweet (`tweetId`)
- **GET_TWITTER_USER_INFO** — Get a user's profile and metrics (`username`)
- **SEARCH_TWEETS** — Search recent tweets (`query`, `maxResults`)

### Discord
- **SEND_DISCORD_MESSAGE** — Send a message to a channel (`channelId`, `content`)
- **GET_DISCORD_MESSAGES** — Retrieve recent messages from a channel (`channelId`, `limit`)

### WhatsApp
- **SEND_WHATSAPP_MESSAGE** — Send a message to a phone number in E.164 format (`to`, `text`)

> **Note:** WhatsApp message retrieval requires webhook setup and cannot be polled via the API.

### Facebook
- **CREATE_FACEBOOK_POST** — Create a post on a Facebook page (`pageId`, `message`)
- **GET_FACEBOOK_POSTS** — Retrieve recent posts from a page (`pageId`, `limit`)

### Instagram
- **CREATE_INSTAGRAM_POST** — Publish an image post (`userId`, `imageUrl`, `caption`)
- **GET_INSTAGRAM_POSTS** — Retrieve recent posts from an account (`userId`, `limit`)

### Slack
- **SEND_SLACK_MESSAGE** — Send a message to a channel (`channelId`, `text`)
- **GET_SLACK_MESSAGES** — Retrieve recent messages from a channel (`channelId`, `limit`)
- **LIST_SLACK_CHANNELS** — List public channels in the workspace (`limit`)

### LinkedIn
- **GET_LINKEDIN_PROFILE** — Get the authenticated user's profile information
- **CREATE_LINKEDIN_POST** — Create a UGC post (`authorUrn`, `text`, `visibility`)
- **GET_LINKEDIN_POSTS** — Retrieve recent posts by a member or organization (`authorUrn`, `count`)
- **DELETE_LINKEDIN_POST** — Delete a UGC post (`ugcPostUrn`)
- **LIKE_LINKEDIN_POST** — Like a post (`actorUrn`, `ugcPostUrn`)
- **ADD_LINKEDIN_COMMENT** — Comment on a post (`actorUrn`, `ugcPostUrn`, `text`)
- **SEARCH_LINKEDIN_PEOPLE** — Search for people by keywords (`keywords`, `count`)

> **Note:** `SEARCH_LINKEDIN_PEOPLE` uses the LinkedIn People Search API which requires [Partner Program](https://learn.microsoft.com/en-us/linkedin/talent/recruiter-system-connect/getting-access) access. Most developer apps will receive a 403. All other tools work with a standard OAuth 2.0 token.

### Reddit
- **REDDIT_SUBMIT_POST** — Submit a text or link post to a subreddit (`subreddit`, `title`, `kind`, `text`, `url`)
- **REDDIT_GET_POSTS** — Get posts from a subreddit (`subreddit`, `sort`, `limit`)
- **REDDIT_COMMENT** — Comment on a post or reply to a comment (`parentId`, `text`)
- **REDDIT_VOTE** — Upvote, downvote, or remove a vote (`id`, `direction`)
- **REDDIT_SEARCH** — Search Reddit across all or a specific subreddit (`query`, `subreddit`, `sort`, `limit`)
- **REDDIT_GET_USER_INFO** — Get public info about a Reddit user (`username`)

> **Note:** Reddit requires a "script" type app in [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps). The password grant flow is used — 2FA must be disabled on the account.

### Threads
- **THREADS_GET_PROFILE** — Get your Threads profile information
- **THREADS_CREATE_POST** — Create a new text post (`text`)
- **THREADS_REPLY** — Reply to a Threads post (`replyToId`, `text`)
- **THREADS_GET_POSTS** — Get recent posts from your account (`limit`)
- **THREADS_DELETE_POST** — Delete a post by ID (`mediaId`)

### TikTok
- **TIKTOK_QUERY_CREATOR_INFO** — Query creator info including posting permissions and privacy options
- **TIKTOK_GET_USER_INFO** — Get TikTok account profile and stats
- **TIKTOK_DIRECT_POST_VIDEO** — Post a video by URL (`videoUrl`, `title`, `privacyLevel`, ...)
- **TIKTOK_PHOTO_POST** — Create a photo/carousel post (`photoUrls`, `title`, `description`, `privacyLevel`)
- **TIKTOK_GET_POST_STATUS** — Check the publishing status of a video or photo post (`publishId`)

> **Note:** TikTok's Content Posting API requires app approval from [TikTok for Developers](https://developers.tiktok.com). Videos are pulled from a public URL by TikTok's servers rather than uploaded directly.

### YouTube
- **YOUTUBE_GET_CHANNEL_INFO** — Get channel info and stats (`channelId` optional — omit for your own channel)
- **YOUTUBE_SEARCH_VIDEOS** — Search YouTube for videos (`query`, `maxResults`, `pageToken`)
- **YOUTUBE_GET_VIDEO_INFO** — Get detailed info and stats for a video (`videoId`)
- **YOUTUBE_LIST_CHANNEL_VIDEOS** — List recent uploads from a channel (`channelId`, `maxResults`, `pageToken`)
- **YOUTUBE_GET_COMMENTS** — Get top-level comments on a video (`videoId`, `maxResults`)
- **YOUTUBE_POST_COMMENT** — Post a comment on a video (`videoId`, `text`)
- **YOUTUBE_UPDATE_VIDEO** — Update a video's title, description, and tags (`videoId`, `title`, `description`, `tags`, `categoryId`)

> **Note:** YouTube requires an OAuth 2.0 access token with the `https://www.googleapis.com/auth/youtube` scope. Enable the **YouTube Data API v3** in your [Google Cloud Console](https://console.cloud.google.com) project. Video uploads are not supported via this API — use the YouTube Studio or resumable upload flow directly.

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

## License

ISC
