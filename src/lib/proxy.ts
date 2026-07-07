import { HttpsProxyAgent } from "https-proxy-agent";
import { type Dispatcher, ProxyAgent } from "undici";

// Two flavors because Node has two incompatible HTTP client worlds: SDKs built on
// axios/http.request (Slack, Telegram) take a classic http.Agent, while raw fetch()
// (undici under the hood) takes a Dispatcher instead — passing the wrong one is a
// silent no-op, not an error, so callers must pick the one matching their client.

export function createProxyAgent(
	proxyUrl?: string,
): HttpsProxyAgent<string> | undefined {
	return proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
}

export function createProxyDispatcher(
	proxyUrl?: string,
): Dispatcher | undefined {
	return proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
}
