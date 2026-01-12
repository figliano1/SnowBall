
import { GameState, EnemyState, LevelData, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { Sprites } from '../assets/Sprites';
import { audio } from './AudioManager';
import { resolveWorldCollision, checkCollision, JUMP_FORCE, MOVE_SPEED, isWall } from './Physics';

class Projectile {
    x: number; y: number; vx: number; width = 16; height = 16;
    active = true;
    constructor(x: number, y: number, dir: number) {
        this.x = x; this.y = y; this.vx = dir * 9;
    }
    update(level: LevelData) {
        this.x += this.vx;
        if (isWall(this.x, this.y + 8, level) || isWall(this.x + this.width, this.y + 8, level)) this.active = false;
        if (this.x < 0 || this.x > CANVAS_WIDTH) this.active = false;
    }
}

class Enemy {
    x: number; y: number; vx: number; vy = 0; width = 28; height = 30;
    state: EnemyState = EnemyState.NORMAL;
    freezeTimer = 0;
    facing = 1;
    id: string;
    speed: number;

    constructor(x: number, y: number, levelIdx: number) {
        this.x = x; this.y = y;
        this.speed = 1.6 + (levelIdx * 0.2); // 随关卡增加速度
        this.vx = (Math.random() > 0.5 ? 1 : -1) * this.speed;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    update(level: LevelData) {
        if (this.state === EnemyState.NORMAL) {
            const grounded = resolveWorldCollision(this, level);
            if (this.vx === 0) {
                this.facing *= -1;
                this.vx = this.facing * this.speed;
            }
            // 边缘检测：避免怪物无脑掉下平台（除非是在追逐玩家）
            const nextX = this.vx > 0 ? this.x + this.width + 4 : this.x - 4;
            const floorType = (level.map[Math.floor((this.y + this.height + 4) / TILE_SIZE)] || [])[Math.floor(nextX / TILE_SIZE)];
            const noFloor = floorType === 0;
            
            if (grounded && noFloor) {
                 this.facing *= -1;
                 this.vx = this.facing * this.speed;
            }
        } else if (this.state === EnemyState.ROLLING) {
            this.x += this.vx;
            // 滚动的雪球反弹更敏捷
            if (isWall(this.vx > 0 ? this.x + this.width : this.x, this.y + this.height / 2, level)) {
                this.vx *= -1;
            }
            resolveWorldCollision(this, level);
            
            this.freezeTimer--;
            if (this.freezeTimer <= 0) {
                this.state = EnemyState.DYING;
            }
        } else if (this.state.startsWith('FROZEN')) {
            resolveWorldCollision(this, level);
            this.freezeTimer--;
            if (this.freezeTimer <= 0 && this.state !== EnemyState.FROZEN_BALL) {
                this.state = EnemyState.NORMAL;
                this.vx = this.facing * this.speed;
            }
        }
    }

    hit() {
        if (this.state === EnemyState.ROLLING || this.state === EnemyState.DYING) return;
        audio.playHit();
        if (this.state === EnemyState.NORMAL) {
            this.state = EnemyState.FROZEN_1;
        } else if (this.state === EnemyState.FROZEN_1) {
            this.state = EnemyState.FROZEN_2;
        } else if (this.state === EnemyState.FROZEN_2) {
            this.state = EnemyState.FROZEN_3;
        } else if (this.state === EnemyState.FROZEN_3) {
            this.state = EnemyState.FROZEN_BALL;
        }
        this.freezeTimer = 180; 
    }
}

export class GameEngine {
    player = { x: 50, y: 400, vx: 0, vy: 0, width: 28, height: 30, facing: 1, invul: 0 };
    enemies: Enemy[] = [];
    projectiles: Projectile[] = [];
    levelIndex = 0;
    state: GameState = GameState.START;
    keys: Record<string, boolean> = {};
    score = 0;

    constructor(private onStateChange: (state: GameState) => void) {}

    initLevel(idx: number, levels: LevelData[]) {
        const lv = levels[idx];
        this.player.x = lv.spawn.x;
        this.player.y = lv.spawn.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.invul = 60; // 出生无敌
        this.enemies = lv.enemies.map(e => new Enemy(e.x, e.y, idx));
        this.projectiles = [];
        this.levelIndex = idx;
        this.state = GameState.PLAYING;
    }

    handleInput(key: string, pressed: boolean) {
        this.keys[key] = pressed;
        if (pressed && (key === 'j' || key === ' ' || key === 'f')) {
            if (this.state === GameState.PLAYING) {
                let kicked = false;
                this.enemies.forEach(e => {
                    if (e.state === EnemyState.FROZEN_BALL && checkCollision(this.player, e)) {
                        e.state = EnemyState.ROLLING;
                        e.vx = this.player.facing * 10;
                        e.freezeTimer = 180; // 滚动更久
                        audio.playRoll();
                        kicked = true;
                    }
                });

                if (!kicked) {
                    this.projectiles.push(new Projectile(this.player.x + (this.player.facing > 0 ? 20 : -10), this.player.y + 10, this.player.facing));
                    audio.playShoot();
                }
            }
        }
    }

    update(levels: LevelData[]) {
        if (this.state !== GameState.PLAYING) return;

        const level = levels[this.levelIndex];

        if (this.keys['a'] || this.keys['ArrowLeft']) {
            this.player.vx = -MOVE_SPEED;
            this.player.facing = -1;
        } else if (this.keys['d'] || this.keys['ArrowRight']) {
            this.player.vx = MOVE_SPEED;
            this.player.facing = 1;
        } else {
            this.player.vx = 0;
        }

        const grounded = resolveWorldCollision(this.player, level);
        if (grounded && (this.keys['k'] || this.keys['w'] || this.keys['ArrowUp'])) {
            this.player.vy = JUMP_FORCE;
            audio.playJump();
        }

        if (this.player.invul > 0) this.player.invul--;

        this.projectiles.forEach(p => {
            p.update(level);
            this.enemies.forEach(e => {
                if (p.active && checkCollision(p, e)) {
                    p.active = false;
                    e.hit();
                }
            });
        });
        this.projectiles = this.projectiles.filter(p => p.active);

        this.enemies.forEach(e => {
            e.update(level);
            if (this.player.invul <= 0 && checkCollision(this.player, e)) {
                if (e.state === EnemyState.NORMAL) {
                    this.die();
                }
            }
            if (e.state === EnemyState.ROLLING) {
                this.enemies.forEach(other => {
                    if (e.id !== other.id && other.state !== EnemyState.ROLLING && other.state !== EnemyState.DYING) {
                        if (checkCollision(e, other)) {
                            other.state = EnemyState.DYING;
                            this.score += 500;
                            audio.playHit();
                        }
                    }
                });
            }
        });

        this.enemies = this.enemies.filter(e => e.state !== EnemyState.DYING);

        if (this.enemies.length === 0) {
            this.levelClear(levels);
        }
    }

    die() {
        audio.playGameOver();
        this.state = GameState.GAME_OVER;
        this.onStateChange(GameState.GAME_OVER);
    }

    levelClear(levels: LevelData[]) {
        audio.playWin();
        if (this.levelIndex < levels.length - 1) {
            this.state = GameState.LEVEL_CLEAR;
            this.onStateChange(GameState.LEVEL_CLEAR);
        } else {
            this.state = GameState.VICTORY;
            this.onStateChange(GameState.VICTORY);
        }
    }

    private drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number) {
        const levelStyles = [
            { main: '#60a5fa', light: '#93c5fd', dark: '#2563eb', accent: '#dbeafe' }, // Level 1: Ice
            { main: '#65a30d', light: '#bef264', dark: '#3f6212', accent: '#4d7c0f' }, // Level 2: Forest
            { main: '#d97706', light: '#fbbf24', dark: '#92400e', accent: '#fef3c7' }, // Level 3: Desert/Ancient
            { main: '#b91c1c', light: '#f87171', dark: '#7f1d1d', accent: '#991b1b' }, // Level 4: Lava
            { main: '#7c3aed', light: '#a78bfa', dark: '#4c1d95', accent: '#2e1065' }  // Level 5: Magic
        ];
        const style = levelStyles[this.levelIndex] || levelStyles[0];

        if (tile === 1) {
            ctx.fillStyle = style.main;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = style.light;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 4);
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, 4, TILE_SIZE);
            ctx.fillStyle = style.dark;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 4, TILE_SIZE, 4);
            ctx.fillRect(x * TILE_SIZE + TILE_SIZE - 4, y * TILE_SIZE, 4, TILE_SIZE);
            ctx.fillStyle = style.accent;
            ctx.fillRect(x * TILE_SIZE + 10, y * TILE_SIZE + 10, 4, 4);
            ctx.fillRect(x * TILE_SIZE + 18, y * TILE_SIZE + 18, 4, 4);
        } else if (tile === 2) {
            ctx.fillStyle = style.main;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 8);
            ctx.fillStyle = style.light;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, 3);
            ctx.fillStyle = style.dark;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + 6, TILE_SIZE, 2);
        }
    }

    draw(ctx: CanvasRenderingContext2D, level: LevelData) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const bgColors = ['#082f49', '#064e3b', '#451a03', '#450a0a', '#2e1065'];
        ctx.fillStyle = bgColors[this.levelIndex] || '#0f172a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        level.map.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile !== 0) {
                    this.drawTile(ctx, x, y, tile);
                }
            });
        });

        if (this.player.invul % 10 < 5) {
            ctx.save();
            if (this.player.facing < 0) {
                ctx.translate(this.player.x + this.player.width, this.player.y);
                ctx.scale(-1, 1);
                ctx.drawImage(Sprites.Nick, 0, 0, this.player.width, this.player.height);
            } else {
                ctx.drawImage(Sprites.Nick, this.player.x, this.player.y, this.player.width, this.player.height);
            }
            ctx.restore();
        }

        this.projectiles.forEach(p => {
            ctx.drawImage(Sprites.Snowball, p.x, p.y, p.width, p.height);
        });

        this.enemies.forEach(e => {
            if (e.state === EnemyState.NORMAL) {
                ctx.save();
                if (e.vx > 0) {
                    ctx.translate(e.x + e.width, e.y);
                    ctx.scale(-1, 1);
                    ctx.drawImage(Sprites.Monster, 0, 0, e.width, e.height);
                } else {
                    ctx.drawImage(Sprites.Monster, e.x, e.y, e.width, e.height);
                }
                ctx.restore();
            } else if (e.state.startsWith('FROZEN')) {
                const scale = e.state === EnemyState.FROZEN_1 ? 0.7 : e.state === EnemyState.FROZEN_2 ? 0.85 : 1;
                const sw = e.width * scale;
                const sh = e.height * scale;
                ctx.drawImage(Sprites.FrozenBall, e.x + (e.width - sw)/2, e.y + (e.height - sh)/2, sw, sh);
            } else if (e.state === EnemyState.ROLLING) {
                 ctx.save();
                 ctx.translate(e.x + e.width/2, e.y + e.height/2);
                 ctx.rotate(Date.now() / 100 * (e.vx > 0 ? 1 : -1));
                 ctx.drawImage(Sprites.FrozenBall, -e.width/2, -e.height/2, e.width, e.height);
                 ctx.restore();
            }
        });

        ctx.fillStyle = '#fff';
        ctx.font = '14px Pixel';
        ctx.fillText(`LEVEL ${this.levelIndex + 1}`, 20, 30);
        ctx.fillText(`SCORE ${this.score}`, 200, 30);
    }
}
