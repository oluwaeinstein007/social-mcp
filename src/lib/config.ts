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
	linkedin: {
		baseUrl: "https://api.linkedin.com/v2",
		accessToken: process.env.LINKEDIN_ACCESS_TOKEN || "",
	},
	reddit: {
		baseUrl: "https://oauth.reddit.com",
		clientId: process.env.REDDIT_CLIENT_ID || "",
		clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
		username: process.env.REDDIT_USERNAME || "",
		password: process.env.REDDIT_PASSWORD || "",
		userAgent: "social-mcp/1.0 (by /u/social_mcp_bot)",
	},
	threads: {
		baseUrl: "https://graph.threads.net/v1.0",
		accessToken: process.env.THREADS_ACCESS_TOKEN || "",
		userId: process.env.THREADS_USER_ID || "",
	},
	tiktok: {
		baseUrl: "https://open.tiktokapis.com/v2",
		accessToken: process.env.TIKTOK_ACCESS_TOKEN || "",
	},
	youtube: {
		baseUrl: "https://www.googleapis.com/youtube/v3",
		accessToken: process.env.YOUTUBE_ACCESS_TOKEN || "",
	},
	bluesky: {
		service: process.env.BLUESKY_SERVICE || "https://bsky.social",
		identifier: process.env.BLUESKY_IDENTIFIER || "",
		appPassword: process.env.BLUESKY_APP_PASSWORD || "",
	},
	mastodon: {
		instanceUrl: process.env.MASTODON_INSTANCE_URL || "https://mastodon.social",
		accessToken: process.env.MASTODON_ACCESS_TOKEN || "",
	},
	pinterest: {
		baseUrl: "https://api.pinterest.com/v5",
		accessToken: process.env.PINTEREST_ACCESS_TOKEN || "",
	},
	email: {
		mailer: process.env.MAIL_MAILER || "smtp",
		fromAddress: process.env.MAIL_FROM_ADDRESS || "",
		fromName: process.env.MAIL_FROM_NAME || "",
		smtp: {
			host: process.env.MAIL_HOST || "",
			port: parseInt(process.env.MAIL_PORT || "587", 10),
			username: process.env.MAIL_USERNAME || "",
			password: process.env.MAIL_PASSWORD || "",
			encryption: (process.env.MAIL_ENCRYPTION || "tls") as "tls" | "ssl" | "none",
		},
		sendgrid: {
			apiKey: process.env.SENDGRID_API_KEY || "",
		},
		mailgun: {
			apiKey: process.env.MAILGUN_API_KEY || "",
			domain: process.env.MAILGUN_DOMAIN || "",
		},
	},
};
