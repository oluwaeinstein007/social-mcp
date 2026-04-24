import { z } from "zod";
import { CredentialsError } from "../../lib/errors.js";
import { getPinterestService } from "../../services/pinterest-service.js";

const createBoardParams = z.object({
	name: z.string().min(1).describe("The name of the board"),
	description: z.string().optional().describe("Optional board description"),
});

type CreateBoardParams = z.infer<typeof createBoardParams>;

export const createBoardTool = {
	name: "PINTEREST_CREATE_BOARD",
	description: "Create a new board on Pinterest",
	parameters: createBoardParams,
	execute: async (params: CreateBoardParams) => {
		try {
			const board = await getPinterestService().createBoard(
				params.name,
				params.description,
			);
			return `Board created successfully!\n\nName: ${board.name}\nID: ${board.id}${board.description ? `\nDescription: ${board.description}` : ""}`;
		} catch (error) {
			if (error instanceof CredentialsError) return `Error: ${error.message}`;
			return `Error creating Pinterest board: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
} as const;
