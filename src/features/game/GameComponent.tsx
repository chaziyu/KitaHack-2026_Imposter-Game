import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { PreloadScene } from './scenes/PreloadScene';
import { useMeetingStore } from '../../stores/useMeetingStore';
import { useGameStore } from '../../stores/useGameStore';
import { SettingsUI } from '../ui/SettingsUI';

export const GameComponent = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const status = useMeetingStore((state) => state.status);

  useEffect(() => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
    if (!scene) return;

    if (status === 'DISCUSSION') {
      // Auto-end meeting check
      const interval = setInterval(() => {
        const { meetingEndTime } = useMeetingStore.getState();
        if (Date.now() > meetingEndTime) {
          const network = useGameStore.getState().network;
          if (network) network.endMeeting();
        }
      }, 1000);

      return () => clearInterval(interval);

    } else if (status === 'IDLE') {
      // Idle state
    }
  }, [status]);

  useEffect(() => {
    if (gameRef.current) return; // Prevent double-init

    // The Configuration Object
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL, // WebGL Force
      width: '100%',
      height: '100%',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      parent: 'phaser-container', // Attaches to the div below
      backgroundColor: '#000000',
      scene: [PreloadScene, MainScene], // Our scene list
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }, // Top-down game, no gravity
          debug: false, // Enable debug to see collision boxes
        },
      },
      maxLights: 50,
      render: {
        pixelArt: false, // Enable antialiasing for text
        antialias: true,
        roundPixels: true,
      },
    };

    gameRef.current = new Phaser.Game(config);

    // Cleanup when component unmounts
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div id="phaser-container" className="w-full h-screen overflow-hidden text-center bg-[#2d2d2d]">
      <SettingsUI />
      {/* Phaser injects canvas here */}
    </div>
  );
};