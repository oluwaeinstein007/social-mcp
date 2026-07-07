import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const uploadVideoParams = z.object({
	content: z.string().describe("Base64-encoded video bytes."),
	contentType: z
		.string()
		.optional()
		.describe("MIME type, e.g. video/mp4. Defaults to video/*."),
	title: z.string().min(1).max(100).describe("Video title."),
	description: z.string().optional().describe("Video description."),
	tags: z.array(z.string()).optional().describe("Search tags for the video."),
	categoryId: z
		.string()
		.optional()
		.describe("YouTube category ID (default 22 — People & Blogs)."),
	privacyStatus: z
		.enum(["public", "unlisted", "private"])
		.optional()
		.default("unlisted")
		.describe("Visibility of the uploaded video."),
});

type UploadVideoParams = z.infer<typeof uploadVideoParams>;

export const uploadVideoTool = {
	name: "YOUTUBE_UPLOAD_VIDEO",
	description: "Upload a video to the authenticated user's YouTube channel",
	parameters: uploadVideoParams,
	execute: async (params: UploadVideoParams) => {
		try {
			const video = await getYouTubeService().uploadVideo(params);
			return `Video uploaded successfully to YouTube!\n\nVideo ID: ${video.id}\nTitle: ${video.snippet?.title ?? params.title}\nUpload status: ${video.status?.uploadStatus ?? "unknown"}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error uploading video: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
