#!/usr/bin/env node
import { createRequire } from "node:module";
import { FastMCP } from "fastmcp";
import { CredentialsError } from "./lib/errors.js";
import { getDiscordService } from "./services/discord-service.js";
import { getFacebookService } from "./services/facebook-service.js";
import { getInstagramService } from "./services/instagram-service.js";
import { getLinkedInService } from "./services/linkedin-service.js";
import { getRedditService } from "./services/reddit-service.js";
import { getSlackService } from "./services/slack-service.js";
import { getTelegramService } from "./services/telegram-service.js";
import { getThreadsService } from "./services/threads-service.js";
import { getTikTokService } from "./services/tiktok-service.js";
import { getTwitterService } from "./services/twitter-service.js";
import { getWhatsappService } from "./services/whatsapp-service.js";
import { getYouTubeService } from "./services/youtube-service.js";
import { getMessagesTool as discordGetMessagesTool } from "./tools/discord-tools/get-messages.js";
import { sendMessageTool as discordSendMessageTool } from "./tools/discord-tools/send-message.js";
import { createPostTool as facebookCreatePostTool } from "./tools/facebook-tools/create-post.js";
import { getPostsTool as facebookGetPostsTool } from "./tools/facebook-tools/get-posts.js";
import { createPostTool as instagramCreatePostTool } from "./tools/instagram-tools/create-post.js";
import { getPostsTool as instagramGetPostsTool } from "./tools/instagram-tools/get-posts.js";
import { addCommentTool as linkedInAddCommentTool } from "./tools/linkedin-tools/add-comment.js";
import { createPostTool as linkedInCreatePostTool } from "./tools/linkedin-tools/create-post.js";
import { deletePostTool as linkedInDeletePostTool } from "./tools/linkedin-tools/delete-post.js";
import { getPostsTool as linkedInGetPostsTool } from "./tools/linkedin-tools/get-posts.js";
import { getProfileTool as linkedInGetProfileTool } from "./tools/linkedin-tools/get-profile.js";
import { likePostTool as linkedInLikePostTool } from "./tools/linkedin-tools/like-post.js";
import { searchPeopleTool as linkedInSearchPeopleTool } from "./tools/linkedin-tools/search-people.js";
import { commentTool as redditCommentTool } from "./tools/reddit-tools/comment.js";
import { getUserInfoTool as redditGetUserInfoTool } from "./tools/reddit-tools/get-user-info.js";
import { getPostsTool as redditGetPostsTool } from "./tools/reddit-tools/get-posts.js";
import { searchTool as redditSearchTool } from "./tools/reddit-tools/search.js";
import { submitPostTool as redditSubmitPostTool } from "./tools/reddit-tools/submit-post.js";
import { voteTool as redditVoteTool } from "./tools/reddit-tools/vote.js";
import { getMessagesTool as slackGetMessagesTool } from "./tools/slack-tools/get-messages.js";
import { listChannelsTool as slackListChannelsTool } from "./tools/slack-tools/list-channels.js";
import { sendMessageTool as slackSendMessageTool } from "./tools/slack-tools/send-message.js";
import { deleteMessageTool } from "./tools/telegram-tools/delete-message.js";
import { editMessageTool } from "./tools/telegram-tools/edit-message.js";
import { forwardMessageTool } from "./tools/telegram-tools/forward-message.js";
import { getChannelInfoTool } from "./tools/telegram-tools/get-channel-info.js";
import { getChannelMembersTool } from "./tools/telegram-tools/get-channel-members.js";
import { pinMessageTool } from "./tools/telegram-tools/pin-message.js";
import { sendMessageTool } from "./tools/telegram-tools/send-message.js";
import { createPostTool as threadsCreatePostTool } from "./tools/threads-tools/create-post.js";
import { deletePostTool as threadsDeletePostTool } from "./tools/threads-tools/delete-post.js";
import { getPostsTool as threadsGetPostsTool } from "./tools/threads-tools/get-posts.js";
import { getProfileTool as threadsGetProfileTool } from "./tools/threads-tools/get-profile.js";
import { replyTool as threadsReplyTool } from "./tools/threads-tools/reply.js";
import { directPostVideoTool as tiktokDirectPostVideoTool } from "./tools/tiktok-tools/direct-post-video.js";
import { getPostStatusTool as tiktokGetPostStatusTool } from "./tools/tiktok-tools/get-post-status.js";
import { getUserInfoTool as tiktokGetUserInfoTool } from "./tools/tiktok-tools/get-user-info.js";
import { photoPostTool as tiktokPhotoPostTool } from "./tools/tiktok-tools/photo-post.js";
import { queryCreatorInfoTool as tiktokQueryCreatorInfoTool } from "./tools/tiktok-tools/query-creator-info.js";
import { deleteTweetTool } from "./tools/twitter-tools/delete-tweet.js";
import { getUserInfoTool } from "./tools/twitter-tools/get-user-info.js";
import { likeTweetTool } from "./tools/twitter-tools/like-tweet.js";
import { replyTweetTool } from "./tools/twitter-tools/reply-tweet.js";
import { searchTweetsTool } from "./tools/twitter-tools/search-tweets.js";
import { sendTweetTool } from "./tools/twitter-tools/send-tweet.js";
import { sendMessageTool as whatsappSendMessageTool } from "./tools/whatsapp-tools/send-message.js";
import { getChannelInfoTool as youtubeGetChannelInfoTool } from "./tools/youtube-tools/get-channel-info.js";
import { getCommentsTool as youtubeGetCommentsTool } from "./tools/youtube-tools/get-comments.js";
import { getVideoInfoTool as youtubeGetVideoInfoTool } from "./tools/youtube-tools/get-video-info.js";
import { listChannelVideosTool as youtubeListChannelVideosTool } from "./tools/youtube-tools/list-channel-videos.js";
import { postCommentTool as youtubePostCommentTool } from "./tools/youtube-tools/post-comment.js";
import { searchVideosTool as youtubeSearchVideosTool } from "./tools/youtube-tools/search-videos.js";
import { updateVideoTool as youtubeUpdateVideoTool } from "./tools/youtube-tools/update-video.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as {
	version: `${number}.${number}.${number}`;
};

function checkPlatform(name: string, init: () => unknown): void {
	try {
		init();
		console.error(`  [ok] ${name}`);
	} catch (err) {
		if (err instanceof CredentialsError) {
			console.error(`  [--] ${name}: ${err.message}`);
		} else {
			console.error(
				`  [!!] ${name}: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}
}

async function main() {
	console.error("Social MCP Server — platform availability:");
	checkPlatform("Telegram", getTelegramService);
	checkPlatform("Twitter/X", getTwitterService);
	checkPlatform("Discord", getDiscordService);
	checkPlatform("WhatsApp", getWhatsappService);
	checkPlatform("Facebook", getFacebookService);
	checkPlatform("Instagram", getInstagramService);
	checkPlatform("Slack", getSlackService);
	checkPlatform("LinkedIn", getLinkedInService);
	checkPlatform("Reddit", getRedditService);
	checkPlatform("Threads", getThreadsService);
	checkPlatform("TikTok", getTikTokService);
	checkPlatform("YouTube", getYouTubeService);
	console.error("");

	const server = new FastMCP({ name: "Social MCP Server", version });

	// Telegram
	server.addTool(sendMessageTool);
	server.addTool(getChannelInfoTool);
	server.addTool(forwardMessageTool);
	server.addTool(pinMessageTool);
	server.addTool(getChannelMembersTool);
	server.addTool(deleteMessageTool);
	server.addTool(editMessageTool);

	// Twitter
	server.addTool(sendTweetTool);
	server.addTool(getUserInfoTool);
	server.addTool(searchTweetsTool);
	server.addTool(replyTweetTool);
	server.addTool(likeTweetTool);
	server.addTool(deleteTweetTool);

	// Discord
	server.addTool(discordSendMessageTool);
	server.addTool(discordGetMessagesTool);

	// WhatsApp
	server.addTool(whatsappSendMessageTool);

	// Facebook
	server.addTool(facebookCreatePostTool);
	server.addTool(facebookGetPostsTool);

	// Instagram
	server.addTool(instagramCreatePostTool);
	server.addTool(instagramGetPostsTool);

	// Slack
	server.addTool(slackSendMessageTool);
	server.addTool(slackGetMessagesTool);
	server.addTool(slackListChannelsTool);

	// LinkedIn
	server.addTool(linkedInGetProfileTool);
	server.addTool(linkedInCreatePostTool);
	server.addTool(linkedInGetPostsTool);
	server.addTool(linkedInDeletePostTool);
	server.addTool(linkedInLikePostTool);
	server.addTool(linkedInAddCommentTool);
	server.addTool(linkedInSearchPeopleTool);

	// Reddit
	server.addTool(redditSubmitPostTool);
	server.addTool(redditGetPostsTool);
	server.addTool(redditCommentTool);
	server.addTool(redditVoteTool);
	server.addTool(redditSearchTool);
	server.addTool(redditGetUserInfoTool);

	// Threads
	server.addTool(threadsGetProfileTool);
	server.addTool(threadsCreatePostTool);
	server.addTool(threadsReplyTool);
	server.addTool(threadsGetPostsTool);
	server.addTool(threadsDeletePostTool);

	// TikTok
	server.addTool(tiktokQueryCreatorInfoTool);
	server.addTool(tiktokGetUserInfoTool);
	server.addTool(tiktokDirectPostVideoTool);
	server.addTool(tiktokPhotoPostTool);
	server.addTool(tiktokGetPostStatusTool);

	// YouTube
	server.addTool(youtubeGetChannelInfoTool);
	server.addTool(youtubeSearchVideosTool);
	server.addTool(youtubeGetVideoInfoTool);
	server.addTool(youtubeListChannelVideosTool);
	server.addTool(youtubeGetCommentsTool);
	server.addTool(youtubePostCommentTool);
	server.addTool(youtubeUpdateVideoTool);

	try {
		await server.start({ transportType: "stdio" });
	} catch (error) {
		console.error("Failed to start Social MCP Server:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("Unexpected error in Social MCP Server:", error);
	process.exit(1);
});
