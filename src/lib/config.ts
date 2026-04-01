export const config = {
  discord: {
    baseUrl: "https://discord.com/api/v10",
    botToken: process.env.DISCORD_BOT_TOKEN || "",
  },
  whatsapp: {
    baseUrl: "https://graph.facebook.com/v21.0",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  },
  facebook: {
    baseUrl: "https://graph.facebook.com/v21.0",
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || "",
  },
  instagram: {
    baseUrl: "https://graph.facebook.com/v21.0",
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || "",
  },
};
