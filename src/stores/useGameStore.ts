import { create } from 'zustand';
import type { NetworkService } from '../features/networking/NetworkInterface';

interface GameStore {
    isTerminalOpen: boolean;
    terminalType: 'hacking' | 'editor' | 'hub' | 'academy' | null;
    academyType: 'solar' | 'waste' | 'oxygen' | null;
    activeFileId: string | null;
    network: NetworkService | null;
    bgmVolume: number; // 0.0 to 1.0
    sfxVolume: number; // 0.0 to 1.0

    // Lobby State
    roomCode: string | null;
    playerId: string | null;
    playerName: string | null;
    isHost: boolean;
    gameState: 'MENU' | 'LOBBY' | 'GAME';

    // Customization State
    playerSkin: string; // 'doux', 'mort', etc.
    playerTint: number; // Hex color

    openEditor: (fileId: string) => void;
    openAcademy: (type: 'solar' | 'waste' | 'oxygen') => void;
    openTerminal: (type: 'hacking' | 'editor' | 'hub' | 'academy') => void;
    closeTerminal: () => void;
    setNetwork: (network: NetworkService) => void;
    setBgmVolume: (volume: number) => void;
    setSfxVolume: (volume: number) => void;

    // Lobby Actions
    setRoomCode: (code: string | null) => void;
    setPlayerId: (id: string | null) => void;
    setPlayerName: (name: string | null) => void;
    setPlayerSkin: (skin: string) => void;
    setPlayerTint: (tint: number) => void;
    setIsHost: (isHost: boolean) => void;
    setGameState: (state: 'MENU' | 'LOBBY' | 'GAME') => void;

    // Level State
    currentLevel: number;
    setLevel: (level: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
    isTerminalOpen: false,
    terminalType: null,
    academyType: null,
    activeFileId: null,
    network: null,
    bgmVolume: 0.5,
    sfxVolume: 0.5,

    // Lobby State Defaults
    roomCode: null,
    playerId: null,
    playerName: null,
    isHost: false,
    gameState: 'MENU',

    // Default Customization
    playerSkin: 'doux',
    playerTint: 0xffffff,

    openEditor: (fileId) => set({
        isTerminalOpen: true,
        terminalType: 'editor',
        activeFileId: fileId
    }),

    openAcademy: (type) => set({
        isTerminalOpen: true,
        terminalType: 'academy',
        academyType: type,
        activeFileId: null
    }),

    openTerminal: (type) => set({
        isTerminalOpen: true,
        terminalType: type,
        academyType: null,
        activeFileId: null
    }),

    closeTerminal: () => set({
        isTerminalOpen: false,
        terminalType: null,
        academyType: null,
        activeFileId: null
    }),

    setNetwork: (network) => set({ network }),
    setBgmVolume: (volume) => set({ bgmVolume: volume }),
    setSfxVolume: (volume) => set({ sfxVolume: volume }),

    // Lobby Actions
    setRoomCode: (code) => set({ roomCode: code }),
    setPlayerId: (id) => set({ playerId: id }),
    setPlayerName: (name) => set({ playerName: name }),
    setPlayerSkin: (skin) => set({ playerSkin: skin }),
    setPlayerTint: (tint) => set({ playerTint: tint }),
    setIsHost: (isHost) => set({ isHost }),
    setGameState: (gameState) => set({ gameState }),

    // Level State
    currentLevel: 1,
    setLevel: (level) => set({ currentLevel: level }),


}));