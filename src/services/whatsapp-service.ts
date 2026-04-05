import { z } from "zod";
import { fetchJson } from "../lib/http.js";
import { config } from "../lib/config.js";

const whatsappMessageSchema = z.object({
  messaging_product: z.string(),
  contacts: z.array(z.object({ input: z.string(), wa_id: z.string() })),
  messages: z.array(z.object({ id: z.string() })),
});

export const whatsappMessageDetailSchema = z.object({
  id: z.string().describe("The unique ID of the message"),
  from: z.string().describe("The sender's phone number"),
  text: z.object({ body: z.string() }).optional().describe("The message text content"),
});

const getMessagesResponseSchema = z.object({
  data: z.array(whatsappMessageDetailSchema),
});

export class WhatsappService {
  private baseUrl = config.whatsapp.baseUrl;
  private headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.whatsapp.accessToken}`,
  };

  async sendMessage(to: string, text: string) {
    if (!to || !text) {
      throw new Error("Both 'to' and 'text' parameters are required");
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(to)) {
      throw new Error("Invalid phone number format");
    }

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    };

    return fetchJson(
      `${this.baseUrl}/me/messages`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      },
      whatsappMessageSchema,
    );
  }

  async getMessages(limit: number = 10) {
    return fetchJson(
      `${this.baseUrl}/me/messages?limit=${limit}`,
      {
        method: "GET",
        headers: this.headers,
      },
      getMessagesResponseSchema,
    );
  }
}
