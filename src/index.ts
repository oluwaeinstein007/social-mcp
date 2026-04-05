#!/usr/bin/env node
import { FastMCP } from "fastmcp";
import { forwardMessageTool } from "./tools/telegram-tools/forward-message.js";
import { getChannelInfoTool } from "./tools/telegram-tools/get-channel-info.js";
import { getChannelMembersTool } from "./tools/telegram-tools/get-channel-members.js";
import { pinMessageTool } from "./tools/telegram-tools/pin-message.js";
import { sendMessageTool } from "./tools/telegram-tools/send-message.js";
import { getUserInfoTool } from "./tools/twitter-tools/get-user-info.js";
import { searchTweetsTool } from "./tools/twitter-tools/search-tweets.js";
import { sendTweetTool } from "./tools/twitter-tools/send-tweet.js";

// Discord tools
import { sendMessageTool as discordSendMessageTool } from "./tools/discord-tools/send-message.js";

// WhatsApp tools
import { sendMessageTool as whatsappSendMessageTool } from "./tools/whatsapp-tools/send-message.js";
import { getMessagesTool as whatsappGetMessagesTool } from "./tools/whatsapp-tools/get-messages.js";

// Facebook tools
import { createPostTool as facebookCreatePostTool } from "./tools/facebook-tools/create-post.js";

// Instagram tools
import { createPostTool as instagramCreatePostTool } from "./tools/instagram-tools/create-post.js";

// Slack tools
import { sendMessageTool as slackSendMessageTool } from "./tools/slack-tools/send-message.js";

async function main() {
	const server = new FastMCP({
		name: "Social MCP Server",
		version: "1.2.0",
	});

	// Add Telegram tools
	server.addTool(sendMessageTool);
	server.addTool(getChannelInfoTool);
	server.addTool(forwardMessageTool);
	server.addTool(pinMessageTool);
	server.addTool(getChannelMembersTool);

	// Add Twitter tools
	server.addTool(sendTweetTool);
	server.addTool(getUserInfoTool);
	server.addTool(searchTweetsTool);

	// Add Discord tools
	server.addTool(discordSendMessageTool);

	// Add WhatsApp tools
	server.addTool(whatsappSendMessageTool);
	server.addTool(whatsappGetMessagesTool);

	// Add Facebook tools
	server.addTool(facebookCreatePostTool);

	// Add Instagram tools
	server.addTool(instagramCreatePostTool);

	// Add Slack tools
	server.addTool(slackSendMessageTool);

	try {
		await server.start({
			transportType: "stdio",
		});
	} catch (error) {
		console.error("Failed to start Social MCP Server:", error);
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("Unexpected error in Social MCP Server:", error);
	process.exit(1);
});
