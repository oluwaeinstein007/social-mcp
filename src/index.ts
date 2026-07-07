#!/usr/bin/env node
import { createRequire } from "node:module";
import { FastMCP } from "fastmcp";
import { CredentialsError } from "./lib/errors.js";
import { getBeehiivService } from "./services/beehiiv-service.js";
import { getBlueskyService } from "./services/bluesky-service.js";
import { getDevToService } from "./services/devto-service.js";
import { getDiscordService } from "./services/discord-service.js";
import { getEmailService } from "./services/email-service.js";
import { getFacebookService } from "./services/facebook-service.js";
import { getGhostService } from "./services/ghost-service.js";
import { getHashnodeService } from "./services/hashnode-service.js";
import { getInstagramService } from "./services/instagram-service.js";
import { getLinkedInService } from "./services/linkedin-service.js";
import { getMastodonService } from "./services/mastodon-service.js";
import { getMediumService } from "./services/medium-service.js";
import { getPinterestService } from "./services/pinterest-service.js";
import { getRedditService } from "./services/reddit-service.js";
import { getSlackService } from "./services/slack-service.js";
import { getTelegramService } from "./services/telegram-service.js";
import { getThreadsService } from "./services/threads-service.js";
import { getTikTokService } from "./services/tiktok-service.js";
import { getTumblrService } from "./services/tumblr-service.js";
import { getTwitchService } from "./services/twitch-service.js";
import { getTwitterService } from "./services/twitter-service.js";
import { getWhatsappService } from "./services/whatsapp-service.js";
import { getYouTubeService } from "./services/youtube-service.js";
import { createPostTool as beehiivCreatePostTool } from "./tools/beehiiv-tools/create-post.js";
import { getPostsTool as beehiivGetPostsTool } from "./tools/beehiiv-tools/get-posts.js";
import { getSubscribersTool as beehiivGetSubscribersTool } from "./tools/beehiiv-tools/get-subscribers.js";
import { createPostTool as blueskyCreatePostTool } from "./tools/bluesky-tools/create-post.js";
import { deletePostTool as blueskyDeletePostTool } from "./tools/bluesky-tools/delete-post.js";
import { getProfileTool as blueskyGetProfileTool } from "./tools/bluesky-tools/get-profile.js";
import { likePostTool as blueskyLikePostTool } from "./tools/bluesky-tools/like-post.js";
import { replyToPostTool as blueskyReplyToPostTool } from "./tools/bluesky-tools/reply-to-post.js";
import { searchPostsTool as blueskySearchPostsTool } from "./tools/bluesky-tools/search-posts.js";
import { createArticleTool as devtoCreateArticleTool } from "./tools/devto-tools/create-article.js";
import { getArticleTool as devtoGetArticleTool } from "./tools/devto-tools/get-article.js";
import { getArticlesTool as devtoGetArticlesTool } from "./tools/devto-tools/get-articles.js";
import { getMeTool as devtoGetMeTool } from "./tools/devto-tools/get-me.js";
import { updateArticleTool as devtoUpdateArticleTool } from "./tools/devto-tools/update-article.js";
import { getMessagesTool as discordGetMessagesTool } from "./tools/discord-tools/get-messages.js";
import { sendMessageTool as discordSendMessageTool } from "./tools/discord-tools/send-message.js";
import { sendBulkEmailTool } from "./tools/email-tools/send-bulk-email.js";
import { sendEmailTool } from "./tools/email-tools/send-email.js";
import { createPostTool as facebookCreatePostTool } from "./tools/facebook-tools/create-post.js";
import { createVideoPostTool as facebookCreateVideoPostTool } from "./tools/facebook-tools/create-video-post.js";
import { getPostsTool as facebookGetPostsTool } from "./tools/facebook-tools/get-posts.js";
import { createPostTool as ghostCreatePostTool } from "./tools/ghost-tools/create-post.js";
import { deletePostTool as ghostDeletePostTool } from "./tools/ghost-tools/delete-post.js";
import { getPostsTool as ghostGetPostsTool } from "./tools/ghost-tools/get-posts.js";
import { updatePostTool as ghostUpdatePostTool } from "./tools/ghost-tools/update-post.js";
import { createPostTool as hashnodeCreatePostTool } from "./tools/hashnode-tools/create-post.js";
import { getPostsTool as hashnodeGetPostsTool } from "./tools/hashnode-tools/get-posts.js";
import { getPublicationTool as hashnodeGetPublicationTool } from "./tools/hashnode-tools/get-publication.js";
import { createPostTool as instagramCreatePostTool } from "./tools/instagram-tools/create-post.js";
import { getPostsTool as instagramGetPostsTool } from "./tools/instagram-tools/get-posts.js";
import { addCommentTool as linkedInAddCommentTool } from "./tools/linkedin-tools/add-comment.js";
import { createPostTool as linkedInCreatePostTool } from "./tools/linkedin-tools/create-post.js";
import { deletePostTool as linkedInDeletePostTool } from "./tools/linkedin-tools/delete-post.js";
import { getPostsTool as linkedInGetPostsTool } from "./tools/linkedin-tools/get-posts.js";
import { getProfileTool as linkedInGetProfileTool } from "./tools/linkedin-tools/get-profile.js";
import { likePostTool as linkedInLikePostTool } from "./tools/linkedin-tools/like-post.js";
import { searchPeopleTool as linkedInSearchPeopleTool } from "./tools/linkedin-tools/search-people.js";
import { boostPostTool as mastodonBoostPostTool } from "./tools/mastodon-tools/boost-post.js";
import { createPostTool as mastodonCreatePostTool } from "./tools/mastodon-tools/create-post.js";
import { deletePostTool as mastodonDeletePostTool } from "./tools/mastodon-tools/delete-post.js";
import { favouritePostTool as mastodonFavouritePostTool } from "./tools/mastodon-tools/favourite-post.js";
import { getProfileTool as mastodonGetProfileTool } from "./tools/mastodon-tools/get-profile.js";
import { replyToPostTool as mastodonReplyToPostTool } from "./tools/mastodon-tools/reply-to-post.js";
import { searchPostsTool as mastodonSearchPostsTool } from "./tools/mastodon-tools/search-posts.js";
import { createPostTool as mediumCreatePostTool } from "./tools/medium-tools/create-post.js";
import { getUserTool as mediumGetUserTool } from "./tools/medium-tools/get-user.js";
import { createBoardTool as pinterestCreateBoardTool } from "./tools/pinterest-tools/create-board.js";
import { createPinTool as pinterestCreatePinTool } from "./tools/pinterest-tools/create-pin.js";
import { deletePinTool as pinterestDeletePinTool } from "./tools/pinterest-tools/delete-pin.js";
import { getBoardPinsTool as pinterestGetBoardPinsTool } from "./tools/pinterest-tools/get-board-pins.js";
import { getBoardsTool as pinterestGetBoardsTool } from "./tools/pinterest-tools/get-boards.js";
import { getPinTool as pinterestGetPinTool } from "./tools/pinterest-tools/get-pin.js";
import { commentTool as redditCommentTool } from "./tools/reddit-tools/comment.js";
import { getPostsTool as redditGetPostsTool } from "./tools/reddit-tools/get-posts.js";
import { getUserInfoTool as redditGetUserInfoTool } from "./tools/reddit-tools/get-user-info.js";
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
import { sendDocumentTool } from "./tools/telegram-tools/send-document.js";
import { sendMessageTool } from "./tools/telegram-tools/send-message.js";
import { sendPhotoTool } from "./tools/telegram-tools/send-photo.js";
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
import { createPostTool as tumblrCreatePostTool } from "./tools/tumblr-tools/create-post.js";
import { deletePostTool as tumblrDeletePostTool } from "./tools/tumblr-tools/delete-post.js";
import { getBlogInfoTool as tumblrGetBlogInfoTool } from "./tools/tumblr-tools/get-blog-info.js";
import { getPostsTool as tumblrGetPostsTool } from "./tools/tumblr-tools/get-posts.js";
import { getChannelInfoTool as twitchGetChannelInfoTool } from "./tools/twitch-tools/get-channel-info.js";
import { getStreamsTool as twitchGetStreamsTool } from "./tools/twitch-tools/get-streams.js";
import { getUserTool as twitchGetUserTool } from "./tools/twitch-tools/get-user.js";
import { searchChannelsTool as twitchSearchChannelsTool } from "./tools/twitch-tools/search-channels.js";
import { sendChatMessageTool as twitchSendChatMessageTool } from "./tools/twitch-tools/send-chat-message.js";
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
import { uploadVideoTool as youtubeUploadVideoTool } from "./tools/youtube-tools/upload-video.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as {
	version: `${number}.${number}.${number}`;
};

async function checkPlatform(
	name: string,
	init: () => unknown | Promise<unknown>,
): Promise<void> {
	try {
		await init();
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
	await checkPlatform("Telegram", getTelegramService);
	await checkPlatform("Twitter/X", getTwitterService);
	await checkPlatform("Discord", getDiscordService);
	await checkPlatform("WhatsApp", getWhatsappService);
	await checkPlatform("Facebook", getFacebookService);
	await checkPlatform("Instagram", getInstagramService);
	await checkPlatform("Slack", getSlackService);
	await checkPlatform("LinkedIn", getLinkedInService);
	await checkPlatform("Reddit", getRedditService);
	await checkPlatform("Threads", getThreadsService);
	await checkPlatform("TikTok", getTikTokService);
	await checkPlatform("YouTube", getYouTubeService);
	await checkPlatform("Bluesky", getBlueskyService);
	await checkPlatform("Mastodon", getMastodonService);
	await checkPlatform("Medium", getMediumService);
	await checkPlatform("Pinterest", getPinterestService);
	await checkPlatform("Dev.to", getDevToService);
	await checkPlatform("Hashnode", getHashnodeService);
	await checkPlatform("Beehiiv", getBeehiivService);
	await checkPlatform("Ghost", getGhostService);
	await checkPlatform("Twitch", getTwitchService);
	await checkPlatform("Tumblr", getTumblrService);
	await checkPlatform("Email", async () => {
		const service = getEmailService();
		await service.verify();
	});
	console.error("");

	const server = new FastMCP({ name: "Social MCP Server", version });

	// Telegram
	server.addTool(sendMessageTool);
	server.addTool(sendPhotoTool);
	server.addTool(sendDocumentTool);
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
	server.addTool(facebookCreateVideoPostTool);
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
	server.addTool(youtubeUploadVideoTool);

	// Bluesky
	server.addTool(blueskyCreatePostTool);
	server.addTool(blueskyReplyToPostTool);
	server.addTool(blueskyDeletePostTool);
	server.addTool(blueskyLikePostTool);
	server.addTool(blueskyGetProfileTool);
	server.addTool(blueskySearchPostsTool);

	// Mastodon
	server.addTool(mastodonCreatePostTool);
	server.addTool(mastodonReplyToPostTool);
	server.addTool(mastodonDeletePostTool);
	server.addTool(mastodonBoostPostTool);
	server.addTool(mastodonFavouritePostTool);
	server.addTool(mastodonGetProfileTool);
	server.addTool(mastodonSearchPostsTool);

	// Medium
	server.addTool(mediumGetUserTool);
	server.addTool(mediumCreatePostTool);

	// Pinterest
	server.addTool(pinterestGetBoardsTool);
	server.addTool(pinterestCreateBoardTool);
	server.addTool(pinterestCreatePinTool);
	server.addTool(pinterestGetPinTool);
	server.addTool(pinterestGetBoardPinsTool);
	server.addTool(pinterestDeletePinTool);

	// Email
	server.addTool(sendEmailTool);
	server.addTool(sendBulkEmailTool);

	// Dev.to
	server.addTool(devtoCreateArticleTool);
	server.addTool(devtoGetArticlesTool);
	server.addTool(devtoGetArticleTool);
	server.addTool(devtoUpdateArticleTool);
	server.addTool(devtoGetMeTool);

	// Hashnode
	server.addTool(hashnodeCreatePostTool);
	server.addTool(hashnodeGetPostsTool);
	server.addTool(hashnodeGetPublicationTool);

	// Beehiiv
	server.addTool(beehiivCreatePostTool);
	server.addTool(beehiivGetPostsTool);
	server.addTool(beehiivGetSubscribersTool);

	// Ghost
	server.addTool(ghostCreatePostTool);
	server.addTool(ghostGetPostsTool);
	server.addTool(ghostUpdatePostTool);
	server.addTool(ghostDeletePostTool);

	// Twitch
	server.addTool(twitchGetUserTool);
	server.addTool(twitchGetStreamsTool);
	server.addTool(twitchGetChannelInfoTool);
	server.addTool(twitchSearchChannelsTool);
	server.addTool(twitchSendChatMessageTool);

	// Tumblr
	server.addTool(tumblrGetBlogInfoTool);
	server.addTool(tumblrCreatePostTool);
	server.addTool(tumblrGetPostsTool);
	server.addTool(tumblrDeletePostTool);

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
