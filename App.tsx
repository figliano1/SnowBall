
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import { GameEngine } from './game/Engine';
import { LEVELS } from './game/Levels';
import { audio } from './game/AudioManager';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<GameState>(GameState.START);
    const [currentLevel, setCurrentLevel] = useState(0);

    const onStateChange = useCallback((state: GameState) => {
        setGameState(state);
    }, []);

    useEffect(() => {
        if (!engineRef.current) {
            engineRef.current = new GameEngine(onStateChange);
        }
    }, [onStateChange]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => engineRef.current?.handleInput(e.key.toLowerCase(), true);
        const handleKeyUp = (e: KeyboardEvent) => engineRef.current?.handleInput(e.key.toLowerCase(), false);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        let frame: number;
        const loop = () => {
            if (canvasRef.current && engineRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    engineRef.current.update(LEVELS);
                    engineRef.current.draw(ctx, LEVELS[engineRef.current.levelIndex]);
                }
            }
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frame);
    }, []);

    const startGame = () => {
        audio.init();
        audio.startBGM();
        engineRef.current?.initLevel(0, LEVELS);
        setCurrentLevel(0);
        setGameState(GameState.PLAYING);
    };

    const retryGame = () => {
        audio.init();
        startGame();
    };

    const nextLevel = () => {
        audio.init();
        if (engineRef.current) {
            const nextIdx = engineRef.current.levelIndex + 1;
            engineRef.current.initLevel(nextIdx, LEVELS);
            setCurrentLevel(nextIdx);
            setGameState(GameState.PLAYING);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
            <div className="relative border-4 border-neutral-700 rounded-lg overflow-hidden shadow-2xl">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="bg-black"
                />

                {gameState === GameState.START && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-8">
                        <h1 className="text-4xl font-bold mb-4 text-blue-400 drop-shadow-lg">SNOW BROS</h1>
                        <p className="text-sm mb-8 text-neutral-400 leading-relaxed max-w-xs">
                            Classic Arcade Reborn.<br/>
                            Freeze monsters, kick snowballs, clear all levels.
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-110 active:scale-95 border-b-4 border-blue-800"
                        >
                            START GAME
                        </button>
                        <div className="mt-8 text-xs text-neutral-500 grid grid-cols-2 gap-4">
                            <div>MOVE: ARROWS / WASD</div>
                            <div>SHOOT: J / SPACE</div>
                            <div>JUMP: K / W</div>
                        </div>
                    </div>
                )}

                {gameState === GameState.LEVEL_CLEAR && (
                    <div className="absolute inset-0 bg-blue-900/60 flex flex-col items-center justify-center">
                        <h2 className="text-4xl text-yellow-400 mb-6 font-bold">LEVEL CLEAR!</h2>
                        <button
                            onClick={nextLevel}
                            className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-8 py-3 rounded-full font-bold"
                        >
                            NEXT LEVEL
                        </button>
                    </div>
                )}

                {gameState === GameState.GAME_OVER && (
                    <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center">
                        <h2 className="text-4xl text-white mb-6 font-bold">GAME OVER</h2>
                        <button
                            onClick={retryGame}
                            className="bg-white text-red-900 px-8 py-3 rounded-full font-bold"
                        >
                            RETRY
                        </button>
                    </div>
                )}

                {gameState === GameState.VICTORY && (
                    <div className="absolute inset-0 bg-yellow-500/80 flex flex-col items-center justify-center text-center">
                        <h2 className="text-5xl text-white mb-4 font-bold">VICTORY!</h2>
                        <p className="text-white mb-8">You have saved the world of snow!</p>
                        <button
                            onClick={startGame}
                            className="bg-blue-900 text-white px-8 py-3 rounded-full font-bold"
                        >
                            PLAY AGAIN
                        </button>
                    </div>
                )}
            </div>
            
            <footer className="mt-6 text-neutral-500 text-[10px] uppercase tracking-widest">
                Original Pixel Engine &copy; 2024 Pixel Reborn Studios
            </footer>
        </div>
    );
};

export default App;
