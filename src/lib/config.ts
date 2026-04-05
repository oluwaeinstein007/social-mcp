export const META_API_VERSION = "v21.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export const config = {
	discord: {
		baseUrl: "https://discord.com/api/v10",
		botToken: process.env.DISCORD_BOT_TOKEN || "",
	},
	whatsapp: {
		baseUrl: META_BASE,
		accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
		phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
	},
	facebook: {
		baseUrl: META_BASE,
		accessToken: process.env.FACEBOOK_ACCESS_TOKEN || "",
	},
	instagram: {
		baseUrl: META_BASE,
		accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
	},
};
