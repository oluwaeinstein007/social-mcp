import { z } from "zod";
import { config } from "../lib/config.js";
import { CredentialsError } from "../lib/errors.js";
import { fetchJson } from "../lib/http.js";

const tokenSchema = z.object({
	access_token: z.string(),
	token_type: z.string(),
	expires_in: z.number().optional(),
});

const userSchema = z.object({
	id: z.string(),
	login: z.string(),
	display_name: z.string(),
	description: z.string().optional(),
	profile_image_url: z.string().optional(),
	view_count: z.number().optional(),
	created_at: z.string().optional(),
	broadcaster_type: z.string().optional(),
});

const streamSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	user_login: z.string(),
	user_name: z.string(),
	game_name: z.string().optional(),
	title: z.string().optional(),
	viewer_count: z.number().optional(),
	started_at: z.string().optional(),
	language: z.string().optional(),
	thumbnail_url: z.string().optional(),
	is_mature: z.boolean().optional(),
});

const channelSchema = z.object({
	broadcaster_id: z.string(),
	broadcaster_login: z.string(),
	broadcaster_name: z.string(),
	game_name: z.string().optional(),
	game_id: z.string().optional(),
	title: z.string().optional(),
	delay: z.number().optional(),
	tags: z.array(z.string()).optional(),
	content_classification_labels: z.array(z.string()).optional(),
});

const searchChannelSchema = z.object({
	id: z.string(),
	display_name: z.string(),
	broadcaster_login: z.string(),
	game_name: z.string().optional(),
	title: z.string().optional(),
	is_live: z.boolean().optional(),
	started_at: z.string().optional(),
	thumbnail_url: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

export interface TwitchCredentials {
	clientId: string;
	clientSecret: string;
	accessToken?: string;
}

export class TwitchService {
	private baseUrl = config.twitch.baseUrl;
	private clientId: string;
	private clientSecret: string;
	private _accessToken: string;
	private _appToken: string | null = null;

	constructor(credentials?: TwitchCredentials) {
		const clientId = credentials?.clientId ?? config.twitch.clientId;
		const clientSecret = credentials?.clientSecret ?? config.twitch.clientSecret;

		if (!clientId || !clientSecret) {
			throw new CredentialsError("Twitch", ["TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET"]);
		}

		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this._accessToken = credentials?.accessToken ?? config.twitch.accessToken;
	}

	private async getAppToken(): Promise<string> {
		if (this._appToken) return this._appToken;
		const response = await fetch(
			`https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
			{ method: "POST" },
		);
		if (!response.ok) {
			throw new Error(`Twitch auth failed: ${response.status} ${await response.text()}`);
		}
		const data = tokenSchema.parse(await response.json());
		this._appToken = data.access_token;
		return this._appToken;
	}

	private async headers(useUserToken = false): Promise<Record<string, string>> {
		const token = useUserToken && this._accessToken ? this._accessToken : await this.getAppToken();
		return {
			Authorization: `Bearer ${token}`,
			"Client-Id": this.clientId,
			"Content-Type": "application/json",
		};
	}

	async getUser(login?: string) {
		const hdrs = await this.headers();
		const url = login
			? `${this.baseUrl}/users?login=${login}`
			: `${this.baseUrl}/users`;
		return fetchJson(url, { method: "GET", headers: hdrs }, z.object({ data: z.array(userSchema) }));
	}

	async getStreams(opts: { userLogins?: string[]; gameId?: string; first?: number } = {}) {
		const hdrs = await this.headers();
		const params = new URLSearchParams();
		for (const login of opts.userLogins ?? []) params.append("user_login", login);
		if (opts.gameId) params.set("game_id", opts.gameId);
		params.set("first", String(opts.first ?? 10));
		return fetchJson(
			`${this.baseUrl}/streams?${params}`,
			{ method: "GET", headers: hdrs },
			z.object({ data: z.array(streamSchema), pagination: z.object({ cursor: z.string().optional() }).optional() }),
		);
	}

	async getChannelInfo(broadcasterId: string) {
		const hdrs = await this.headers();
		return fetchJson(
			`${this.baseUrl}/channels?broadcaster_id=${broadcasterId}`,
			{ method: "GET", headers: hdrs },
			z.object({ data: z.array(channelSchema) }),
		);
	}

	async searchChannels(query: string, liveOnly = false, first = 10) {
		const hdrs = await this.headers();
		const params = new URLSearchParams({ query, live_only: String(liveOnly), first: String(first) });
		return fetchJson(
			`${this.baseUrl}/search/channels?${params}`,
			{ method: "GET", headers: hdrs },
			z.object({ data: z.array(searchChannelSchema), pagination: z.object({ cursor: z.string().optional() }).optional() }),
		);
	}

	async sendChatMessage(broadcasterId: string, senderId: string, message: string) {
		const hdrs = await this.headers(true);
		const response = await fetch(`${this.baseUrl}/chat/messages`, {
			method: "POST",
			headers: hdrs,
			body: JSON.stringify({ broadcaster_id: broadcasterId, sender_id: senderId, message }),
		});
		if (!response.ok) {
			throw new Error(`Twitch API error ${response.status}: ${await response.text()}`);
		}
		return response.json() as Promise<{ data: Array<{ message_id: string; is_sent: boolean }> }>;
	}
}

let _instance: TwitchService | undefined;
export function getTwitchService(): TwitchService {
	if (!_instance) _instance = new TwitchService();
	return _instance;
}
