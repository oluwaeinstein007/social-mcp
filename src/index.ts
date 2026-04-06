#!/usr/bin/env node
import { createRequire } from "node:module";
import { FastMCP } from "fastmcp";
import { CredentialsError } from "./lib/errors.js";
import { getDiscordService } from "./services/discord-service.js";
import { getFacebookService } from "./services/facebook-service.js";
import { getInstagramService } from "./services/instagram-service.js";
import { getLinkedInService } from "./services/linkedin-service.js";
import { getSlackService } from "./services/slack-service.js";
import { getTelegramService } from "./services/telegram-service.js";
import { getTwitterService } from "./services/twitter-service.js";
import { getWhatsappService } from "./services/whatsapp-service.js";
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
import { deleteTweetTool } from "./tools/twitter-tools/delete-tweet.js";
import { getUserInfoTool } from "./tools/twitter-tools/get-user-info.js";
import { likeTweetTool } from "./tools/twitter-tools/like-tweet.js";
import { replyTweetTool } from "./tools/twitter-tools/reply-tweet.js";
import { searchTweetsTool } from "./tools/twitter-tools/search-tweets.js";
import { sendTweetTool } from "./tools/twitter-tools/send-tweet.js";
import { sendMessageTool as whatsappSendMessageTool } from "./tools/whatsapp-tools/send-message.js";

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
