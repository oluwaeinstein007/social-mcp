import { z } from "zod";
import { fetchJson } from "../lib/http.js";
import { config } from "../lib/config.js";

const instagramMediaSchema = z.object({
  id: z.string(),
});

export class InstagramService {
  private baseUrl = config.instagram.baseUrl;
  private headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.instagram.accessToken}`,
  };

  async createPost(userId: string, imageUrl: string, caption: string) {
    // First, create the media container
    const containerResponse = await fetchJson(
      `${this.baseUrl}/${userId}/media`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ image_url: imageUrl, caption }),
      },
      z.object({ id: z.string() }),
    );

    // Then, publish the media
    return fetchJson(
      `${this.baseUrl}/${userId}/media_publish`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ creation_id: containerResponse.id }),
      },
      instagramMediaSchema,
    );
  }
}
