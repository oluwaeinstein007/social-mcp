import dedent from "dedent";
import { z } from "zod";
import { WhatsappService } from "../../services/whatsapp-service.js";

const sendMessageParams = z.object({
  to: z.string().describe("The recipient's phone number"),
  text: z.string().min(1).describe("The message text to send"),
});

type SendMessageParams = z.infer<typeof sendMessageParams>;

export const sendMessageTool = {
  name: "SEND_WHATSAPP_MESSAGE",
  description: "Send a message to a WhatsApp user",
  parameters: sendMessageParams,
  execute: async (params: SendMessageParams) => {
    const whatsappService = new WhatsappService();

    try {
      const message = await whatsappService.sendMessage(params.to, params.text);

      return dedent`
        Message sent successfully via WhatsApp!

        Message ID: ${message.messages[0].id}
        Recipient: ${message.contacts[0].input}
      `;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("WHATSAPP_ACCESS_TOKEN")) {
          return "Error: WhatsApp access token is not configured. Please set the WHATSAPP_ACCESS_TOKEN environment variable.";
        }
        return `Error sending message: ${error.message}`;
      }
      return "An unknown error occurred while sending the message";
    }
  },
} as const;
