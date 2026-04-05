import dedent from "dedent";
import { z } from "zod";
import { WhatsappService, type whatsappMessageDetailSchema } from "../../services/whatsapp-service.js";

const getMessagesParams = z.object({
  limit: z.number().optional().default(10).describe("Maximum number of messages to retrieve"),
});

type GetMessagesParams = z.infer<typeof getMessagesParams>;

export const getMessagesTool = {
  name: "GET_WHATSAPP_MESSAGES",
  description: "Retrieve recent WhatsApp messages",
  parameters: getMessagesParams,
  execute: async (params: GetMessagesParams) => {
    const whatsappService = new WhatsappService();

    try {
      const messages = await whatsappService.getMessages(params.limit);

      if (!messages || messages.data.length === 0) {
        return "No recent WhatsApp messages found.";
      }

      const messageList = messages.data.map((message: z.infer<typeof whatsappMessageDetailSchema>, index: number) => dedent`
        ${index + 1}. Message ID: ${message.id}
           From: ${message.from}
           Text: ${message.text?.body || "N/A"}
      `).join("\n\n");

      return dedent`
        Recent WhatsApp Messages (retrieved ${messages.data.length}):

        ${messageList}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("WHATSAPP_ACCESS_TOKEN")) {
          return "Error: WhatsApp access token is not configured. Please set the WHATSAPP_ACCESS_TOKEN environment variable.";
        }
        return `Error retrieving WhatsApp messages: ${error.message}`;
      }
      return "An unknown error occurred while retrieving WhatsApp messages";
    }
  },
} as const;
