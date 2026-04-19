import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getTikTokService } from "../../services/tiktok-service.js";

const getPostStatusParams = z.object({
	publishId: z
		.string()
		.min(1)
		.describe("The publish ID returned when initiating a video or photo post"),
});

type GetPostStatusParams = z.infer<typeof getPostStatusParams>;

export const getPostStatusTool = {
	name: "TIKTOK_GET_POST_STATUS",
	description:
		"Check the publishing status of a TikTok video or photo post using its publish ID",
	parameters: getPostStatusParams,
	execute: async (params: GetPostStatusParams) => {
		try {
			const result = await getTikTokService().getPostStatus(params.publishId);
			if (result.error?.code && result.error.code !== "ok") {
				return `TikTok API error: ${result.error.message}`;
			}
			const d = result.data;
			const lines = [
				`Publish ID: ${params.publishId}`,
				`Status: ${d.status ?? "unknown"}`,
			];
			if (d.publicaly_available_post_id?.length) {
				lines.push(`Post ID(s): ${d.publicaly_available_post_id.join(", ")}`);
			}
			if (d.fail_reason) lines.push(`Failure reason: ${d.fail_reason}`);
			return lines.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching TikTok post status: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
