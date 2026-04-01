import { z } from "zod";
import { fetchJson } from "../lib/http.js";
import { config } from "../lib/config.js";

const facebookPostSchema = z.object({
  id: z.string(),
  post_id: z.string(),
});

export class FacebookService {
  private baseUrl = config.facebook.baseUrl;
  private headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.facebook.accessToken}`,
  };

  async createPost(pageId: string, message: string) {
    return fetchJson(
      `${this.baseUrl}/${pageId}/feed`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ message }),
      },
      facebookPostSchema,
    );
  }
}
