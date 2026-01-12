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
            const nextIdx = (engineRef.current.levelIndex + 1) % LEVELS.length;
            engineRef.current.initLevel(nextIdx, LEVELS);
            setCurrentLevel(nextIdx);
            setGameState(GameState.PLAYING);
        }
    };

    // 虚拟按键处理
    const handleTouchInput = (key: string, isPressed: boolean) => {
        engineRef.current?.handleInput(key, isPressed);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-0 font-sans overflow-hidden">
            <div className="relative border-x-0 sm:border-8 border-neutral-800 rounded-none sm:rounded-xl overflow-hidden shadow-2xl bg-black w-full sm:w-auto">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="max-w-full h-auto mx-auto"
                />

                {/* 状态覆盖层 (Start, Game Over, etc.) */}
                {gameState === GameState.START && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8 z-20">
                        <h1 className="text-3xl sm:text-5xl font-black mb-2 text-blue-400 italic tracking-tighter" style={{ fontFamily: "'Press Start 2P', cursive" }}>SNOW BROS</h1>
                        <p className="text-blue-200/60 text-[8px] sm:text-[10px] mb-8 uppercase tracking-[0.2em]" style={{ fontFamily: "'Press Start 2P', cursive" }}>Pixel Reborn v1.0</p>
                        
                        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg mb-8 backdrop-blur-sm">
                            <p className="text-[10px] sm:text-xs mb-6 text-blue-100 leading-loose max-w-xs font-mono">
                                Freeze monsters into snowballs, then kick them to clear the stage!
                            </p>
                            <button
                                onClick={startGame}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-md font-bold transition-all transform active:scale-95 shadow-[0_4px_0_rgb(30,64,175)] active:translate-y-[2px]"
                            >
                                START GAME
                            </button>
                        </div>

                        <div className="hidden sm:grid text-[10px] text-neutral-500 grid-cols-2 gap-x-8 gap-y-2 font-mono uppercase">
                            <div className="flex items-center gap-2"><span className="bg-neutral-700 px-1 rounded text-neutral-300">WASD</span> MOVE</div>
                            <div className="flex items-center gap-2"><span className="bg-neutral-700 px-1 rounded text-neutral-300">SPACE</span> SHOOT</div>
                        </div>
                    </div>
                )}

                {gameState === GameState.LEVEL_CLEAR && (
                    <div className="absolute inset-0 bg-blue-900/60 flex flex-col items-center justify-center z-20">
                        <h2 className="text-3xl text-yellow-400 mb-6 font-bold italic" style={{ fontFamily: "'Press Start 2P', cursive" }}>LEVEL CLEAR!</h2>
                        <button
                            onClick={nextLevel}
                            className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 px-10 py-3 rounded-md font-bold shadow-[0_4px_0_rgb(161,98,7)] active:scale-95"
                        >
                            NEXT STAGE
                        </button>
                    </div>
                )}

                {gameState === GameState.GAME_OVER && (
                    <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20">
                        <h2 className="text-3xl text-white mb-8 font-bold" style={{ fontFamily: "'Press Start 2P', cursive" }}>GAME OVER</h2>
                        <button
                            onClick={retryGame}
                            className="bg-white text-red-900 px-10 py-3 rounded-md font-bold shadow-[0_4px_0_rgb(150,150,150)] active:scale-95"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                )}

                {gameState === GameState.VICTORY && (
                    <div className="absolute inset-0 bg-yellow-400 flex flex-col items-center justify-center text-center p-8 z-20">
                        <h2 className="text-4xl text-blue-900 mb-4 font-bold italic" style={{ fontFamily: "'Press Start 2P', cursive" }}>VICTORY!</h2>
                        <p className="text-blue-800 mb-8 font-mono uppercase text-xs">You are the Master of Snow!</p>
                        <button
                            onClick={startGame}
                            className="bg-blue-900 text-white px-10 py-3 rounded-md font-bold shadow-[0_4px_0_rgb(30,58,138)] active:scale-95"
                        >
                            PLAY AGAIN
                        </button>
                    </div>
                )}

                {/* 移动端触摸控制 UI (仅在 Playing 状态显示) */}
                {gameState === GameState.PLAYING && (
                    <div className="absolute inset-0 pointer-events-none z-10 select-none">
                        {/* 左侧控制区: 方向键 */}
                        <div className="absolute bottom-4 left-4 flex gap-4 pointer-events-auto">
                            <button 
                                onPointerDown={() => handleTouchInput('a', true)}
                                onPointerUp={() => handleTouchInput('a', false)}
                                onPointerLeave={() => handleTouchInput('a', false)}
                                className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center active:bg-white/40 active:scale-90 transition-all touch-none"
                            >
                                <svg className="w-8 h-8 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                            </button>
                            <button 
                                onPointerDown={() => handleTouchInput('d', true)}
                                onPointerUp={() => handleTouchInput('d', false)}
                                onPointerLeave={() => handleTouchInput('d', false)}
                                className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/30 flex items-center justify-center active:bg-white/40 active:scale-90 transition-all touch-none"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                            </button>
                        </div>

                        {/* 右侧控制区: 动作键 */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-4 pointer-events-auto items-end">
                            <button 
                                onPointerDown={() => handleTouchInput('k', true)}
                                onPointerUp={() => handleTouchInput('k', false)}
                                onPointerLeave={() => handleTouchInput('k', false)}
                                className="w-20 h-20 bg-red-500/40 backdrop-blur-md rounded-full border-2 border-red-500/50 flex flex-col items-center justify-center active:bg-red-500/60 active:scale-90 transition-all touch-none"
                            >
                                <span className="text-[10px] font-bold">JUMP</span>
                                <span className="text-xl">K</span>
                            </button>
                            <div className="mr-20"> {/* 错开排列，符合人体工学 */}
                                <button 
                                    onPointerDown={() => handleTouchInput('j', true)}
                                    onPointerUp={() => handleTouchInput('j', false)}
                                    onPointerLeave={() => handleTouchInput('j', false)}
                                    className="w-20 h-20 bg-blue-500/40 backdrop-blur-md rounded-full border-2 border-blue-500/50 flex flex-col items-center justify-center active:bg-blue-500/60 active:scale-90 transition-all touch-none"
                                >
                                    <span className="text-[10px] font-bold">SHOOT</span>
                                    <span className="text-xl">J</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <footer className="mt-4 hidden sm:block text-neutral-600 text-[9px] uppercase tracking-[0.3em] font-mono">
                Running on Vercel Edge • Supports Keyboard & Touch
            </footer>
        </div>
    );
};

export default App;