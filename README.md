# social-mcp

An MCP (Model Context Protocol) server that lets AI assistants post and interact across social media platforms.

## Supported Platforms

| Platform  | Tools |
|-----------|-------|
| Telegram  | Send message, get channel info, forward message, pin message, get channel administrators |
| Twitter/X | Send tweet, get user info, search tweets |
| Discord   | Send message |
| WhatsApp  | Send message, get messages |
| Facebook  | Create post |
| Instagram | Create post |
| Slack     | Send message |

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

Only include env vars for the platforms you actually use — unused platforms are simply ignored.

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
| `DISCORD_BOT_TOKEN` | Bot token from the [Discord Developer Portal](https://discord.com/developers/applications) — bot must have Send Messages permission |

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
| `SLACK_BOT_TOKEN` | Bot token from [api.slack.com](https://api.slack.com/apps) — requires `chat:write` scope |

## Available Tools

### Telegram
- **SEND_MESSAGE** — Send a message to a chat or channel (`chatId`, `text`)
- **GET_CHANNEL_INFO** — Get channel metadata (`channelId`)
- **FORWARD_MESSAGE** — Forward a message between chats (`fromChatId`, `toChatId`, `messageId`)
- **PIN_MESSAGE** — Pin a message in a chat (`chatId`, `messageId`)
- **GET_CHANNEL_MEMBERS** — List channel administrators (`channelId`, `limit`)

### Twitter / X
- **SEND_TWEET** — Post a tweet (`text`, max 280 chars)
- **GET_USER_INFO** — Get a user's profile and metrics (`username`)
- **SEARCH_TWEETS** — Search recent tweets (`query`, `maxResults`)

### Discord
- **SEND_DISCORD_MESSAGE** — Send a message to a channel (`channelId`, `content`)

### WhatsApp
- **SEND_WHATSAPP_MESSAGE** — Send a message to a phone number in E.164 format (`to`, `text`)
- **GET_WHATSAPP_MESSAGES** — Retrieve recent messages (`limit`)

### Facebook
- **CREATE_FACEBOOK_POST** — Create a post on a Facebook page (`pageId`, `message`)

### Instagram
- **CREATE_INSTAGRAM_POST** — Publish an image post (`userId`, `imageUrl`, `message`)

### Slack
- **SEND_SLACK_MESSAGE** — Send a message to a channel (`channelId`, `text`)

## Development

```bash
pnpm install
pnpm run build     # compile TypeScript
pnpm run watch     # watch mode
pnpm run lint      # lint with Biome
pnpm run format    # format with Biome
```

## License

ISC
