
import { TILE_SIZE, LevelData } from '../types';

export const GRAVITY = 0.55;
export const JUMP_FORCE = -12.0; // 略微提升，确保 3 个 Tile 高度绝对能跳上
export const MOVE_SPEED = 4.2;
export const FRICTION = 0.85;

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const checkCollision = (r1: Rect, r2: Rect) => {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
};

export const getTileAt = (x: number, y: number, level: LevelData) => {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (ty < 0 || ty >= level.map.length || tx < 0 || tx >= level.map[0].length) return 1;
    return level.map[ty][tx];
};

export const isWall = (x: number, y: number, level: LevelData) => {
    return getTileAt(x, y, level) === 1;
};

export const isPlatform = (x: number, y: number, level: LevelData) => {
    return getTileAt(x, y, level) === 2;
};

export const resolveWorldCollision = (entity: { x: number, y: number, vx: number, vy: number, width: number, height: number }, level: LevelData) => {
    const prevBottomY = entity.y + entity.height;

    // 水平冲突
    entity.x += entity.vx;
    if (entity.vx > 0) {
        if (isWall(entity.x + entity.width, entity.y + 4, level) || isWall(entity.x + entity.width, entity.y + entity.height - 4, level)) {
            entity.x = Math.floor((entity.x + entity.width) / TILE_SIZE) * TILE_SIZE - entity.width;
            entity.vx = 0;
        }
    } else if (entity.vx < 0) {
        if (isWall(entity.x, entity.y + 4, level) || isWall(entity.x, entity.y + entity.height - 4, level)) {
            entity.x = Math.floor(entity.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
            entity.vx = 0;
        }
    }

    // 垂直冲突
    entity.vy += GRAVITY;
    entity.y += entity.vy;
    let grounded = false;

    if (entity.vy > 0) { // 下落
        const currentBottomY = entity.y + entity.height;
        const tileY = Math.floor(currentBottomY / TILE_SIZE);
        
        // 检测脚底两个点
        const hitWall = isWall(entity.x + 8, currentBottomY, level) || isWall(entity.x + entity.width - 8, currentBottomY, level);
        const hitPlatform = isPlatform(entity.x + 8, currentBottomY, level) || isPlatform(entity.x + entity.width - 8, currentBottomY, level);
        
        // 只有当之前在平台上方时，才会落在穿透平台上
        const wasAbove = prevBottomY <= tileY * TILE_SIZE + 4;

        if (hitWall || (hitPlatform && wasAbove)) {
            entity.y = tileY * TILE_SIZE - entity.height;
            entity.vy = 0;
            grounded = true;
        }
    } else if (entity.vy < 0) { // 上跳
        // 只有实心墙(Type 1)会挡住上跳
        if (isWall(entity.x + 8, entity.y, level) || isWall(entity.x + entity.width - 8, entity.y, level)) {
            entity.y = Math.floor(entity.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
            entity.vy = 0;
        }
    }

    return grounded;
};
