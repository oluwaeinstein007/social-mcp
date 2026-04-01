import dedent from "dedent";
import { z } from "zod";
import { DiscordService } from "../../services/discord-service.js";

const sendMessageParams = z.object({
  channelId: z.string().describe("The ID of the Discord channel"),
  content: z.string().min(1).describe("The message content to send"),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
  name: "SEND_DISCORD_MESSAGE",
  description: "Send a message to a Discord channel",
  parameters: sendMessageParams,
  execute: async (params: SendMessageParams) => {
    const discordService = new DiscordService();

    try {
      const message = await discordService.sendMessage(
        params.channelId,
        params.content,
      );

      return dedent`
        Message sent successfully to Discord channel ${message.channel_id}!

        Message ID: ${message.id}
        Content: ${message.content}
        Timestamp: ${message.timestamp}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("DISCORD_BOT_TOKEN")) {
          return "Error: Discord bot token is not configured. Please set the DISCORD_BOT_TOKEN environment variable.";
        }
        return `Error sending message: ${error.message}`;
      }
      return "An unknown error occurred while sending the message";
    }
  },
} as const;
