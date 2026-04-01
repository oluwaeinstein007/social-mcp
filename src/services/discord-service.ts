import { z } from "zod";
import { fetchJson } from "../lib/http.js";
import { config } from "../lib/config.js";

const discordMessageSchema = z.object({
  id: z.string(),
  channel_id: z.string(),
  content: z.string(),
  timestamp: z.string(),
});

export class DiscordService {
  private baseUrl = config.discord.baseUrl;
  private headers = {
    "Content-Type": "application/json",
    Authorization: `Bot ${config.discord.botToken}`,
  };

  async sendMessage(channelId: string, content: string) {
    return fetchJson(
      `${this.baseUrl}/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ content }),
      },
      discordMessageSchema,
    );
  }
}
