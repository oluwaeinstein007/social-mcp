import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getYouTubeService } from "../../services/youtube-service.js";

const params = z.object({
	videoId: z.string().describe("YouTube video ID (the part after ?v= in the URL)"),
});

type Params = z.infer<typeof params>;

export const getVideoInfoTool = {
	name: "YOUTUBE_GET_VIDEO_INFO",
	description: "Get detailed information about a YouTube video including statistics and status",
	parameters: params,
	execute: async (p: Params) => {
		try {
			const result = await getYouTubeService().getVideoInfo(p.videoId);
			const video = result.items?.[0];
			if (!video) return `No video found with ID: ${p.videoId}`;
			const s = video.snippet;
			const st = video.statistics;
			return [
				`YouTube Video Info:`,
				s?.title ? `Title: ${s.title}` : null,
				s?.channelTitle ? `Channel: ${s.channelTitle}` : null,
				s?.publishedAt ? `Published: ${s.publishedAt}` : null,
				s?.description ? `Description: ${s.description.slice(0, 200)}${s.description.length > 200 ? "..." : ""}` : null,
				s?.tags?.length ? `Tags: ${s.tags.join(", ")}` : null,
				video.status?.privacyStatus ? `Privacy: ${video.status.privacyStatus}` : null,
				st?.viewCount ? `Views: ${st.viewCount}` : null,
				st?.likeCount ? `Likes: ${st.likeCount}` : null,
				st?.commentCount ? `Comments: ${st.commentCount}` : null,
				`URL: https://www.youtube.com/watch?v=${p.videoId}`,
			]
				.filter(Boolean)
				.join("\n");
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching YouTube video info: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
