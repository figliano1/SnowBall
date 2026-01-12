
export enum GameState {
    START = 'START',
    PLAYING = 'PLAYING',
    LEVEL_CLEAR = 'LEVEL_CLEAR',
    GAME_OVER = 'GAME_OVER',
    VICTORY = 'VICTORY'
}

export enum EnemyState {
    NORMAL = 'NORMAL',
    FROZEN_1 = 'FROZEN_1',
    FROZEN_2 = 'FROZEN_2',
    FROZEN_3 = 'FROZEN_3',
    FROZEN_BALL = 'FROZEN_BALL',
    ROLLING = 'ROLLING',
    DYING = 'DYING'
}

export interface Position {
    x: number;
    y: number;
}

export interface Velocity {
    vx: number;
    vy: number;
}

export interface LevelData {
    map: number[][];
    enemies: { type: string; x: number; y: number }[];
    spawn: Position;
}

export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 480;
