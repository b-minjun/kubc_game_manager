export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  order: number;
  players: Player[];
};

export type Court = {
  id: string;
  number: number;
  currentTeam: Team | null;
  gameStartedAt: number | null;
};

export type PlayerStatus = "available" | "selected" | "waiting" | "playing";

export type GameState = {
  players: Player[];
  waitingTeams: Team[];
  courts: Court[];
};

export type RoomRole = "host" | "guest";

export type RoomSession = {
  code: string;
  password: string;
  role: RoomRole;
  hostToken?: string;
};
