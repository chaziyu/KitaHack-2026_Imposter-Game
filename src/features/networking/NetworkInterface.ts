export interface PlayerState {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
  isOnline?: boolean;
  skin?: string;
  tint?: number;
  // Imposter Mode fields
  role?: 'hero' | 'imposter' | 'reformed';
  isAlive?: boolean;
  status?: 'active' | 'ejected' | 'reformed' | 'jailed';
  jailEndTime?: number;
}

export interface MeetingState {
  status: 'IDLE' | 'DISCUSSION' | 'VOTING' | 'RESULTS';
  callerId: string | null;
  meetingEndTime: number;
  presenterId: string | null;
  highlightedLine: { fileId: string, line: number } | null;
  votes: Record<string, string>; // voterId -> candidateId
  result: string | null;
  outcome?: {
    ejectedId: string | null;
    wasImposter: boolean;
    reason: 'VOTE_TIE' | 'VOTE_SKIP' | 'VOTE_EJECT' | 'TASK_WIN' | 'IMPOSTER_WIN';
  };
}

export interface NetworkService {
  // Returns the local player's ID after connection
  connect(roomCode: string, playerName: string): Promise<string>;

  // Disconnect cleanly
  disconnect(): void;

  // Listen for other players moving/joining
  subscribeToPlayers(callback: (players: PlayerState[]) => void): void;

  // Listen for Meeting Updates
  subscribeToMeeting(callback: (state: MeetingState) => void): void;

  // Send my own position to the server
  sendPlayerMove(x: number, y: number): void;

  // Send a hacking command (e.g., "SPEED_Hack_0.5")
  sendHackCommand(command: string): void;

  // Meeting Actions
  startMeeting(callerId: string): void;
  endMeeting(): void;
  vote(voterId: string, candidateId: string): void;
  highlightLine(fileId: string, line: number): void;

  // Chat
  playerId: string; // Expose ID for UI
  sendChatMessage(text: string, playerName: string): void;
  subscribeToChat(callback: (messages: ChatMessage[]) => void): void;
  updatePlayerCustomization(skin: string, tint: number): void;

  // Notifications
  sendNotification(message: string, type?: 'success' | 'error' | 'info'): void;
  subscribeToNotifications(callback: (message: string, type: 'success' | 'error' | 'info') => void): void;


  // Team Challenge Tracking & Victory
  syncTeamChallengeCompletion(challengeId: string): void;
  subscribeToGameStatus(callback: (status: string) => void): void; // Simplified wrapper

  // Global Timer
  subscribeToTimer(callback: (remainingTime: number) => void): void;
  applyTimerPenalty(seconds: number): void;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string; // Optional if we want to resolve it locally, but easier to send
  text: string;
  timestamp: number;
}