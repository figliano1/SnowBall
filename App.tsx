import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import { GameEngine } from './game/Engine';
import { LEVELS } from './game/Levels';
import { audio } from './game/AudioManager';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [gameState, setGameState] = useState<GameState>(GameState.START);

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
            setGameState(GameState.PLAYING);
        }
    };

    const handleTouchInput = (key: string, isPressed: boolean) => {
        if (isPressed && window.navigator.vibrate) {
            window.navigator.vibrate(10); // 轻微振动反馈
        }
        engineRef.current?.handleInput(key, isPressed);
    };

    return (
        <div className="flex flex-col items-center justify-start sm:justify-center min-h-screen bg-neutral-950 text-white p-0 overflow-hidden select-none">
            {/* 游戏主体容器 */}
            <div className="relative w-full sm:w-auto border-b sm:border-8 border-neutral-800 bg-black flex flex-col">
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        className="max-w-full mx-auto"
                    />

                    {/* 状态覆盖层 - 仅非游戏进行时显示 */}
                    {gameState !== GameState.PLAYING && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center">
                            {gameState === GameState.START && (
                                <div className="bg-black/90 w-full h-full flex flex-col items-center justify-center p-8">
                                    <h1 className="text-3xl sm:text-5xl font-black mb-2 text-blue-400 italic tracking-tighter" style={{ fontFamily: "'Press Start 2P', cursive" }}>SNOW BROS</h1>
                                    <p className="text-blue-200/60 text-[8px] sm:text-[10px] mb-8 uppercase tracking-[0.2em]">Pixel Reborn v1.1</p>
                                    <button
                                        onClick={startGame}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-md font-bold transition-all shadow-[0_4px_0_rgb(30,64,175)] active:translate-y-[2px]"
                                    >
                                        START GAME
                                    </button>
                                </div>
                            )}

                            {gameState === GameState.LEVEL_CLEAR && (
                                <div className="bg-blue-900/80 w-full h-full flex flex-col items-center justify-center">
                                    <h2 className="text-3xl text-yellow-400 mb-6 font-bold italic" style={{ fontFamily: "'Press Start 2P', cursive" }}>LEVEL CLEAR!</h2>
                                    <button onClick={nextLevel} className="bg-yellow-500 text-blue-900 px-10 py-3 rounded-md font-bold shadow-[0_4px_0_rgb(161,98,7)]">NEXT STAGE</button>
                                </div>
                            )}

                            {gameState === GameState.GAME_OVER && (
                                <div className="bg-red-900/90 w-full h-full flex flex-col items-center justify-center">
                                    <h2 className="text-3xl text-white mb-8 font-bold" style={{ fontFamily: "'Press Start 2P', cursive" }}>GAME OVER</h2>
                                    <button onClick={retryGame} className="bg-white text-red-900 px-10 py-3 rounded-md font-bold">TRY AGAIN</button>
                                </div>
                            )}

                            {gameState === GameState.VICTORY && (
                                <div className="bg-yellow-400 w-full h-full flex flex-col items-center justify-center">
                                    <h2 className="text-4xl text-blue-900 mb-4 font-bold italic" style={{ fontFamily: "'Press Start 2P', cursive" }}>VICTORY!</h2>
                                    <button onClick={startGame} className="bg-blue-900 text-white px-10 py-3 rounded-md font-bold">PLAY AGAIN</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 移动端手柄区域 - 位于正下方 */}
            <div className="flex-1 w-full bg-neutral-900 flex flex-col items-center justify-around py-4 sm:hidden border-t border-neutral-700">
                <div className="flex w-full justify-between px-6 max-w-lg">
                    {/* 左侧方向区 */}
                    <div className="flex gap-3">
                        <button 
                            onPointerDown={() => handleTouchInput('a', true)}
                            onPointerUp={() => handleTouchInput('a', false)}
                            onPointerLeave={() => handleTouchInput('a', false)}
                            className="w-20 h-20 bg-neutral-800 rounded-xl border-b-4 border-neutral-700 flex items-center justify-center active:bg-neutral-700 active:translate-y-1 transition-all touch-none"
                        >
                            <svg className="w-10 h-10 text-neutral-400 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </button>
                        <button 
                            onPointerDown={() => handleTouchInput('d', true)}
                            onPointerUp={() => handleTouchInput('d', false)}
                            onPointerLeave={() => handleTouchInput('d', false)}
                            className="w-20 h-20 bg-neutral-800 rounded-xl border-b-4 border-neutral-700 flex items-center justify-center active:bg-neutral-700 active:translate-y-1 transition-all touch-none"
                        >
                            <svg className="w-10 h-10 text-neutral-400" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                        </button>
                    </div>

                    {/* 右侧动作区 */}
                    <div className="flex gap-4 items-end">
                        <div className="flex flex-col gap-4">
                            <button 
                                onPointerDown={() => handleTouchInput('j', true)}
                                onPointerUp={() => handleTouchInput('j', false)}
                                onPointerLeave={() => handleTouchInput('j', false)}
                                className="w-20 h-20 bg-blue-600 rounded-full border-b-4 border-blue-800 flex flex-col items-center justify-center active:bg-blue-500 active:translate-y-1 transition-all touch-none shadow-lg"
                            >
                                <span className="text-[10px] font-bold text-blue-200">SHOOT</span>
                            </button>
                            <button 
                                onPointerDown={() => handleTouchInput('k', true)}
                                onPointerUp={() => handleTouchInput('k', false)}
                                onPointerLeave={() => handleTouchInput('k', false)}
                                className="w-20 h-20 bg-red-600 rounded-full border-b-4 border-red-800 flex flex-col items-center justify-center active:bg-red-500 active:translate-y-1 transition-all touch-none shadow-lg"
                            >
                                <span className="text-[10px] font-bold text-red-200">JUMP</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* 装饰性文字 */}
                <div className="text-neutral-700 text-[8px] uppercase tracking-widest font-mono">
                    Handheld Controller Mode
                </div>
            </div>

            <footer className="hidden sm:block mt-4 text-neutral-600 text-[9px] uppercase tracking-[0.3em] font-mono">
                Running on Vercel Edge • Standard Keyboard Controls Enabled
            </footer>
        </div>
    );
};

export default App;