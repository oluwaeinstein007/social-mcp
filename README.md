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
        "SLACK_BOT_TOKEN": "your_token"
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
