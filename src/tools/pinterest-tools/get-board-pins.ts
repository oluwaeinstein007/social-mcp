import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const getBoardPinsParams = z.object({
	boardId: z.string().min(1).describe("The ID of the board"),
	pageSize: z
		.number()
		.min(1)
		.max(250)
		.optional()
		.describe("Number of pins to return (default 25, max 250)"),
});

type GetBoardPinsParams = z.infer<typeof getBoardPinsParams>;

export const getBoardPinsTool = {
	name: "PINTEREST_GET_BOARD_PINS",
	description: "List all pins on a specific Pinterest board",
	parameters: getBoardPinsParams,
	execute: async (params: GetBoardPinsParams) => {
		try {
			const result = await getPinterestService().getBoardPins(
				params.boardId,
				params.pageSize,
			);
			if (result.items.length === 0) return "No pins found on this board.";
			const list = result.items
				.map(
					(p) =>
						`• ${p.title ?? "(no title)"} (ID: ${p.id})${p.description ? ` — ${p.description}` : ""}${p.link ? ` [${p.link}]` : ""}`,
				)
				.join("\n");
			return `Pins on board ${params.boardId} (${result.items.length}):\n\n${list}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error fetching Pinterest board pins: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
