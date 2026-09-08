import type { Court, GameState, Team } from "../types";

export const DEFAULT_COURT_COUNT = 3;

export function createCourt(number: number): Court {
  return {
    id: `court-${number}`,
    number,
    currentTeam: null,
    gameStartedAt: null,
  };
}

export function createInitialGameState(): GameState {
  return {
    players: [],
    waitingTeams: [],
    courts: Array.from({ length: DEFAULT_COURT_COUNT }, (_, index) =>
      createCourt(index + 1),
    ),
  };
}

export function renumberWaitingTeams(teams: Team[]): Team[] {
  return teams.map((team, index) => {
    const order = index + 1;

    return {
      ...team,
      name: `팀 ${order}`,
      order,
    };
  });
}

export function normalizeGameState(value: unknown): GameState {
  if (!value || typeof value !== "object") {
    return createInitialGameState();
  }

  const partialState = value as Partial<GameState>;

  return {
    players: Array.isArray(partialState.players) ? partialState.players : [],
    waitingTeams: Array.isArray(partialState.waitingTeams)
      ? renumberWaitingTeams(partialState.waitingTeams)
      : [],
    courts:
      Array.isArray(partialState.courts) && partialState.courts.length > 0
        ? partialState.courts.map((court, index) => ({
            id: typeof court.id === "string" ? court.id : `court-${index + 1}`,
            number:
              typeof court.number === "number" ? court.number : index + 1,
            currentTeam: court.currentTeam ?? null,
            gameStartedAt:
              typeof court.gameStartedAt === "number"
                ? court.gameStartedAt
                : null,
          }))
        : createInitialGameState().courts,
  };
}
