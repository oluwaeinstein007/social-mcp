import { z } from "zod";
import { fetchJson } from "../lib/http.js";
import { config } from "../lib/config.js";

const whatsappMessageSchema = z.object({
  messaging_product: z.string(),
  contacts: z.array(z.object({ input: z.string(), wa_id: z.string() })),
  messages: z.array(z.object({ id: z.string() })),
});

// Define a schema for a single WhatsApp message for fetching
const whatsappMessageDetailSchema = z.object({
  id: z.string().describe("The unique ID of the message"),
  from: z.string().describe("The sender's phone number"),
  text: z.object({ body: z.string() }).optional().describe("The message text content"),
  // Add other relevant fields if available from the API, e.g., timestamp, type, etc.
});

// Define a schema for the list of messages response
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

    // Validate phone number format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(to)) {
      throw new Error("Invalid phone number format");
    }

    try {
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
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  // Method to fetch recent messages
  async getMessages(limit: number = 10) {
    // Note: The WhatsApp Business API might not directly support fetching historical messages via a simple GET request
    // without specific conversation IDs or filters. This is a placeholder implementation assuming such an endpoint exists.
    // A more realistic implementation might involve webhooks or specific conversation fetching.
    // For demonstration, we'll assume a GET request to a /messages endpoint with a limit.
    try {
      const response = await fetchJson(
        `${this.baseUrl}/me/messages?limit=${limit}`, // Placeholder endpoint
        {
          method: "GET",
          headers: this.headers,
        },
        getMessagesResponseSchema, // Use the schema defined for fetching messages
      );
      return response;
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      throw error;
    }
  }
}
