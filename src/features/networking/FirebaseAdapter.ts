import type { NetworkService, PlayerState, MeetingState, ChatMessage } from "./NetworkInterface";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, update, onDisconnect, push, query, limitToLast, get, DataSnapshot } from "firebase/database";
import type { DatabaseReference } from "firebase/database";
import { v4 as uuidv4 } from 'uuid';
import toast from "react-hot-toast";

export class FirebaseAdapter implements NetworkService {
  public playerId: string;
  private roomCode: string | null = null;
  private playerName: string | null = null;

  // Throttled move function
  private lastMoveTime: number = 0;
  private readonly MOVE_THROTTLE_MS = 100; // Limit to ~10 updates/sec

  constructor() {
    this.playerId = uuidv4();
  }

  // Helper to get relative path in room
  private getRoomRef(path: string): DatabaseReference {
    if (!this.roomCode) throw new Error("Not connected to a room!");
    return ref(db, `rooms/${this.roomCode}/${path}`);
  }

  async connect(roomCode: string, playerName: string, existingPlayerId?: string, skin: string = 'doux', tint: number = 0xffffff): Promise<string> {
    this.roomCode = roomCode;
    this.playerName = playerName;
    this.playerId = existingPlayerId || this.playerId;
    // console.log(`[Firebase] Connecting to room ${roomCode} as ${playerName} (${this.playerId})`);

    const myRef = this.getRoomRef(`players/${this.playerId}`);

    // 1. Set initial state
    try {
      await set(myRef, {
        id: this.playerId,
        x: 400, // We could load this from DB if we wanted true persistence, but spawn is fine for now
        y: 300,
        color: '#ffffff', // Legacy field, kept for safety
        name: playerName,
        isOnline: true,
        skin: skin,
        tint: tint,
        // Imposter Mode fields (will be set when game starts)
        role: null,
        isAlive: true,
        status: 'active'
      });

      // console.log('[Firebase] Player write success');
    } catch (e: any) {
      console.error('[Firebase] Player write failed', e);
      toast.error('Failed to save player data. Please check your connection.');
    }

    // NEW WAY: Mark as offline (Ghost Mode)
    const myPresenceRef = this.getRoomRef(`players/${this.playerId}/isOnline`);
    onDisconnect(myPresenceRef).set(false);

    return this.playerId;
  }

  disconnect() {
    if (this.roomCode) {
      const myRef = this.getRoomRef(`players/${this.playerId}`);
      set(myRef, null);
      this.roomCode = null;
    }
  }

  subscribeToPlayers(callback: (players: PlayerState[]) => void): () => void {
    if (!this.roomCode) return () => { };
    const playersRef = this.getRoomRef('players');
    return onValue(playersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const playerList = data ? Object.values(data) as PlayerState[] : [];
      callback(playerList);
    });
  }

  sendPlayerMove(x: number, y: number): void {
    if (!this.roomCode) return;

    const now = Date.now();
    if (now - this.lastMoveTime < this.MOVE_THROTTLE_MS) {
      return; // Skip update if too soon
    }

    this.lastMoveTime = now;
    const myRef = this.getRoomRef(`players/${this.playerId}`);
    update(myRef, { x, y });
  }

  sendHackCommand(command: string): void {
    if (!this.roomCode) return;
    const hacksRef = this.getRoomRef('gamestate/hacks');
    push(hacksRef, {
      command: command,
      timestamp: Date.now(),
      author: this.playerId
    });
  }

  // --- Meeting Implementation ---

  subscribeToMeeting(callback: (state: MeetingState) => void): () => void {
    if (!this.roomCode) return () => { };
    const meetingRef = this.getRoomRef('meeting');
    return onValue(meetingRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      } else {
        callback({
          status: 'IDLE',
          callerId: null,
          meetingEndTime: 0,
          presenterId: null,
          highlightedLine: null,
          votes: {},
          result: null
        });
      }
    });
  }

 startMeeting(callerId: string): void {
    if (!this.roomCode) return;
    const meetingRef = this.getRoomRef('meeting');
    
    // CHANGED: Use 'set' instead of 'update'
    // 'set' completely wipes the previous meeting data (votes, chat, results)
    // and starts fresh.
    set(meetingRef, {
      status: 'DISCUSSION',
      callerId: callerId,
      presenterId: callerId,
      meetingEndTime: Date.now() + 60000, // 60s timer
      highlightedLine: null,
      votes: {}, // Now this actually ensures votes are empty!
      chat: {},  // This also clears the chat for the new meeting (optional, but cleaner)
      result: null 
    });
  }

  // Inside FirebaseAdapter.ts

  endMeeting(): void {
    if (!this.roomCode) return;
    const meetingRef = this.getRoomRef('meeting');
    
    // 30 Second Cooldown
    const COOLDOWN_SECONDS = 30; 

    set(meetingRef, {
      status: 'IDLE',
      callerId: null,
      presenterId: null,
      highlightedLine: null,
      votes: {},
      chat: {},
      result: null,
      
      // ADD THIS LINE:
      cooldownEnd: Date.now() + (COOLDOWN_SECONDS * 1000) 
    });
  }

  vote(voterId: string, candidateId: string): void {
    if (!this.roomCode) return;
    const voteRef = this.getRoomRef(`meeting/votes/${voterId}`);
    set(voteRef, candidateId);
  }

  highlightLine(fileId: string, line: number): void {
    if (!this.roomCode) return;
    const lineRef = this.getRoomRef('meeting/highlightedLine');
    set(lineRef, { fileId, line });
  }

  sendChatMessage(text: string, playerName: string): void {
    if (!this.roomCode) return;
    const chatRef = this.getRoomRef('meeting/chat');

    push(chatRef, {
      id: uuidv4(),
      playerId: this.playerId,
      playerName: playerName, // Use passed name from UI (Store)
      text,
      timestamp: Date.now()
    });
  }

  subscribeToChat(callback: (messages: ChatMessage[]) => void): () => void {
    if (!this.roomCode) return () => { };
    const chatRef = this.getRoomRef('meeting/chat');
    return onValue(chatRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const messages = data ? Object.values(data) as import("./NetworkInterface").ChatMessage[] : [];
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    });
  }

  updatePlayerCustomization(skin: string, tint: number): void {
    if (!this.roomCode) return;
    const myRef = this.getRoomRef(`players/${this.playerId}`);
    update(myRef, { skin, tint });
  }

  // --- Global Notifications (Toasts) ---
  sendNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    if (!this.roomCode) return;
    const notifRef = this.getRoomRef('notifications');
    push(notifRef, {
      message,
      type,
      timestamp: Date.now(),
      author: this.playerId
    });
  }

  subscribeToNotifications(callback: (message: string, type: 'success' | 'error' | 'info') => void): () => void {
    if (!this.roomCode) return () => { };
    const notifRef = this.getRoomRef('notifications');
    // Listen for new notifications
    // Using limitToLast(1) to avoid replaying old notifications on connect (simple approach)
    const recentNotifs = query(notifRef, limitToLast(1));
    return onValue(recentNotifs, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        const notif = Object.values(data)[0] as { message: string, type: string, timestamp: number };
        // Only show if it's recent (within last 5 seconds) to avoid spam on join
        if (notif.timestamp > Date.now() - 5000) {
          callback(notif.message, notif.type as any);
        }
      }
    });
  }


  submitFeedback(rating: number, comment: string): Promise<void> {
    const feedbackRef = ref(db, 'feedback');
    const newFeedbackRef = push(feedbackRef);
    return set(newFeedbackRef, {
      rating,
      comment,
      timestamp: Date.now(),
      playerId: this.playerId,
      playerName: this.playerName || 'Anonymous'
    });
  }

  // --- Team Challenge & Victory Tracking ---

  syncTeamChallengeCompletion(challengeId: string): void {
    if (!this.roomCode) return;

    // Use a set structure in Firebase to avoid duplicates
    const challengeRef = this.getRoomRef(`teamChallenges/${challengeId}`);
    set(challengeRef, true);

    // console.log(`[Firebase] Synced team challenge completion: ${challengeId}`);
  }

  subscribeToGameStatus(callback: (status: string) => void): () => void {
    if (!this.roomCode) return () => { };

    const statusRef = this.getRoomRef('status');
    // We don't need teamChallenges for victory anymore, but might want to keep tracking it for UI if needed.
    // However, the interface change requested (status: string) implies we drop the number.

    return onValue(statusRef, (snapshot: DataSnapshot) => {
      const currentStatus = snapshot.val() || 'GAME';
      callback(currentStatus);
    });
  }

  // --- Global Timer Logic ---
  subscribeToTimer(callback: (endTime: number) => void): () => void {
    if (!this.roomCode) return () => { };
    const timerRef = this.getRoomRef('gamestate/timer');

    return onValue(timerRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data || !data.endTime) {
        callback(Date.now() + 600000); // Default 10 mins from now if not set
        return;
      }
      callback(data.endTime);
    });
  }

  applyTimerPenalty(seconds: number): void {
    if (!this.roomCode) return;
    const timerRef = this.getRoomRef('gamestate/timer');

    // We need to read current end time first to subtract
    get(timerRef).then((snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data && data.endTime) {
        const newEndTime = data.endTime - (seconds * 1000);
        update(timerRef, { endTime: newEndTime });
      }
    });
  }
}
