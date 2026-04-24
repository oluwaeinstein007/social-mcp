import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const getBoardsParams = z.object({
	pageSize: z
		.number()
		.min(1)
		.max(250)
		.optional()
		.describe("Number of boards to return (default 25, max 250)"),
});

type GetBoardsParams = z.infer<typeof getBoardsParams>;

export const getBoardsTool = {
	name: "PINTEREST_GET_BOARDS",
	description: "List all boards for the authenticated Pinterest account",
	parameters: getBoardsParams,
	execute: async (params: GetBoardsParams) => {
		try {
			const result = await getPinterestService().getBoards(params.pageSize);
			if (result.items.length === 0) return "No boards found.";
			const list = result.items
				.map(
					(b) =>
						`• ${b.name} (ID: ${b.id})${b.description ? ` — ${b.description}` : ""}${b.pin_count !== undefined ? ` [${b.pin_count} pins]` : ""}`,
				)
				.join("\n");
			return `Pinterest boards (${result.items.length}):\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Pinterest boards: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
