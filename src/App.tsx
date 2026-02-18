import { GameComponent } from "./features/game/GameComponent";
import { useGameStore } from "./stores/useGameStore";
import { TaskBoard } from "./features/ui/components/TaskBoard";
import { LevelManager } from "./features/game/LevelManager";
import { MeetingUI } from "./features/ui/MeetingUI";
import { MainMenu } from "./features/ui/screens/MainMenu";
import { LobbyScreen } from "./features/ui/screens/LobbyScreen";
import { IntroAnimation } from "./features/ui/IntroAnimation";
import { TutorialOverlay } from "./features/ui/TutorialOverlay";
import { VictoryAnimation } from "./features/ui/VictoryAnimation";
import { LoginScreen } from "./features/ui/screens/LoginScreen";
import { RedemptionScreen } from "./features/ui/screens/RedemptionScreen";
import { VictoryScreen } from "./features/ui/screens/VictoryScreen";

import { CyberBackground } from "./features/ui/components/CyberBackground";
import { BootLoader } from "./features/ui/BootLoader";
import { AnimatePresence, motion } from "framer-motion";
// import { SabotageMenu } from "./features/ui/SabotageMenu"; <-- Lazy Loaded
import { usePlayerRole } from "./hooks/usePlayerRole";
import toast, { Toaster } from "react-hot-toast";
import { GameTimer } from "./features/ui/components/GameTimer";
import { DeployTerminal } from "./features/ui/DeployTerminal";
import { JailOverlay } from "./features/ui/JailOverlay";
import { GlobalMentor } from "./features/ui/GlobalMentor";

// Lazy Load Heavy Components
import { lazy, Suspense } from 'react';
const CodeEditor = lazy(() => import("./features/ui/CodeEditor").then(module => ({ default: module.CodeEditor })));
const CentralTerminal = lazy(() => import("./features/ui/screens/CentralTerminal").then(module => ({ default: module.CentralTerminal })));
const AcademyUI = lazy(() => import("./features/ui/AcademyUI").then(module => ({ default: module.AcademyUI })));
const SabotageMenu = lazy(() => import("./features/ui/SabotageMenu").then(module => ({ default: module.SabotageMenu })));


import { ChallengeMonitor } from "./features/game/ChallengeMonitor";
import { usePlayerProgress } from "./stores/usePlayerProgress";
import { useAuthStore } from "./stores/useAuthStore";
import { useState, useEffect } from "react";
import type { PlayerState } from "./features/networking/NetworkInterface";
import "./index.css";
import { DEMO_MODE } from "./config/demoMode";

function App() {
  const { isTerminalOpen, terminalType, gameState, network, roomCode, isHost, playerId, activeFileId } = useGameStore();
  const { shouldShowIntro, shouldShowTutorial, completedChallenges, hasSeenVictory, shouldShowVictory } = usePlayerProgress();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const [showVictory, setShowVictory] = useState(false);
  const playerRole = usePlayerRole(roomCode, playerId);

  // Multiplayer victory state
  const [multiplayerVictoryStatus, setMultiplayerVictoryStatus] = useState<'VICTORY_CREW' | 'VICTORY_IMPOSTER' | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);


  // Initialize Firebase auth on mount (skip if demo mode)
  useEffect(() => {
    if (!DEMO_MODE) {
      initialize();
    }
  }, [initialize]);

  // BACKGROUND PREFETCH: Load heavy UI components silently after game start
  useEffect(() => {
    const prefetch = async () => {
      try {
        // Wait 3 seconds for intro/loading to settle so we don't slow down startup
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Trigger the imports so they are in the browser cache
        const imports = [
          import("./features/ui/CodeEditor"),
          import("./features/ui/screens/CentralTerminal"),
          import("./features/ui/AcademyUI"),
          import("./features/ui/SabotageMenu")
        ];
        await Promise.all(imports);
        // console.log("[App] Background prefetch complete - Terminals will open instantly now");
      } catch (e) {
        console.warn("[App] Prefetch failed", e);
      }
    };

    // Only run in production/authenticated mode to save dev bandwidth, 
    // or just run always. Let's run always so user experience is consistent.
    prefetch();
  }, []);

  // Subscribe to multiplayer game status (for victory detection)
  useEffect(() => {
    if (!network || gameState !== 'GAME') return;

    // Subscribe to game status and team challenge completed count
    // Subscribe to game status and team challenge completed count
    network.subscribeToGameStatus((status) => {

      if (status === 'VICTORY_CREW' || status === 'VICTORY_IMPOSTER') {
        setMultiplayerVictoryStatus(status);
      } else if (status === 'LOBBY') {
        setMultiplayerVictoryStatus(null);
        useGameStore.getState().setGameState('LOBBY');
      }
    });

    // Subscribe to players to show in victory screen
    network.subscribeToPlayers((playerList: PlayerState[]) => {
      setPlayers(playerList);
    });

    // Subscribe to Global Notifications
    network.subscribeToNotifications((message: string, type: 'success' | 'error' | 'info') => {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        default:
          toast(message, { icon: '📢' });
          break;
      }
    });

  }, [network, gameState]);

  // Check for victory condition
  useEffect(() => {
    const shouldShow = shouldShowVictory();
    if (shouldShow && !showVictory) {
      setShowVictory(true);
    }
  }, [completedChallenges, shouldShowVictory, showVictory, hasSeenVictory]);

  // Boot Loader State
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    // If in demo mode, skip boot
    if (DEMO_MODE) setIsBooting(false);
  }, []);

  // Loading state (skip if demo mode)
  if (!DEMO_MODE && isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">🌍</div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  // Login screen if not authenticated (skip if demo mode)
  if (!DEMO_MODE && !isAuthenticated) {
    return <LoginScreen />;
  }

  // Boot Sequence
  if (isBooting && !DEMO_MODE) {
    return <BootLoader onComplete={() => setIsBooting(false)} />;
  }

  // Main game (authenticated or demo mode)
  return (
    <div className="w-full h-full relative bg-gray-900 text-white overflow-hidden">

      {/* 0. GLOBAL BACKGROUND */}
      <CyberBackground />

      {/* INTRO ANIMATION (First-time only) */}
      <AnimatePresence>
        {shouldShowIntro() && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50"
          >
            <IntroAnimation onComplete={() => { }} />
          </motion.div>
        )}
      </AnimatePresence>


      {/* VICTORY ANIMATION (When all challenges complete) */}
      <AnimatePresence>
        {showVictory && (
          <VictoryAnimation onClose={() => setShowVictory(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* 1. MAIN MENU */}
        {gameState === 'MENU' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <MainMenu />
          </motion.div>
        )}

        {/* 2. LOBBY */}
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <LobbyScreen />
            {/* TUTORIAL OVERLAY (First-time in lobby) */}
            {shouldShowTutorial() && <TutorialOverlay />}
          </motion.div>
        )}

        {/* 3. GAME */}
        {gameState === 'GAME' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <GameComponent />
            <ChallengeMonitor />
            <GameTimer />
            <DeployTerminal />
            <JailOverlay />

            <TaskBoard /> {/* Always visible to user */}
            <LevelManager /> {/* <--- The Reset Button */}

            {/* Meeting Overlay (Handles its own visibility) */}
            <MeetingUI />
            <RedemptionScreen />

            {/* The 4 UI Types - Wrapped in Suspense */}
            <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center text-white bg-black/50 z-50">Loading Interface...</div>}>
              {isTerminalOpen && terminalType === 'editor' && <CodeEditor />}
              {isTerminalOpen && terminalType === 'hub' && <CentralTerminal />}
              {isTerminalOpen && terminalType === 'academy' && <AcademyUI />}
            </Suspense>

            {/* Multiplayer Victory Screen */}
            {multiplayerVictoryStatus && (
              <VictoryScreen
                status={multiplayerVictoryStatus}
                players={players}
                teamChallengesCompleted={0} // Fixed to 0 as tracking was removed from App.tsx
                onReturnToLobby={isHost ? () => {
                  // Host can reset game to lobby
                  if (network && roomCode) {
                    import('firebase/database').then(({ ref, set }) => {
                      import('./firebaseConfig').then(({ db }) => {
                        set(ref(db, `rooms/${roomCode}/status`), 'LOBBY');
                        setMultiplayerVictoryStatus(null);
                      });
                    });
                  }
                } : undefined}
                onLeaveGame={() => {
                  // Leave the game (disconnect)
                  if (network) {
                    network.disconnect();
                  }
                  useGameStore.getState().setGameState('MENU');
                  setMultiplayerVictoryStatus(null);
                }}
                onContinuePlaying={() => {
                  // Just hide the victory screen, letting them play in the background
                  setMultiplayerVictoryStatus(null);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-right" />


      {/* Global Sabotage Menu for Imposters */}
      {gameState === 'GAME' && playerRole === 'imposter' && roomCode && playerId && (
        <Suspense fallback={null}>
          <SabotageMenu
            roomCode={roomCode}
            playerId={playerId}
            targetFileId={activeFileId || undefined}
          />
        </Suspense>
      )}

      {/* Global AI Mentor (Professor Gaia) */}
      <GlobalMentor />
    </div>
  );
}
export default App;
