
import { LevelData, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from '../types';

/**
 * 0: 空白
 * 1: 实心墙 (不可跳穿)
 * 2: 穿透平台 (可从下方跳过)
 */

const generateLevel = (platformRows: number[][], enemies: {type: string, x: number, y: number}[]): LevelData => {
    const rows = Math.floor(CANVAS_HEIGHT / TILE_SIZE);
    const cols = Math.floor(CANVAS_WIDTH / TILE_SIZE);
    const map = Array(rows).fill(0).map(() => Array(cols).fill(0));

    // 边界实心墙 (四周闭合)
    for (let y = 0; y < rows; y++) {
        map[y][0] = 1;
        map[y][cols - 1] = 1;
    }
    for (let x = 0; x < cols; x++) {
        map[0][x] = 1;
        map[rows - 1][x] = 1;
    }

    platformRows.forEach(([y, xStart, xEnd, type = 2]) => {
        for (let x = xStart; x <= xEnd; x++) {
            if (y < rows && x < cols) map[y][x] = type;
        }
    });

    return {
        map,
        enemies,
        spawn: { x: 64, y: CANVAS_HEIGHT - 64 }
    };
};

export const LEVELS: LevelData[] = [
    // Level 1: 基础环路
    generateLevel(
        [
            [11, 4, 15, 2],
            [8, 1, 7, 2], [8, 12, 18, 2],
            [5, 5, 14, 2],
        ],
        [
            { type: 'monster', x: 200, y: 150 },
            { type: 'monster', x: 440, y: 150 },
            { type: 'monster', x: 320, y: 320 }
        ]
    ),
    // Level 2: 交错阶梯
    generateLevel(
        [
            [12, 1, 8, 2], [12, 13, 18, 2],
            [9, 6, 13, 2],
            [6, 1, 5, 2], [6, 14, 18, 2],
            [3, 8, 11, 2],
        ],
        [
            { type: 'monster', x: 100, y: 350 },
            { type: 'monster', x: 500, y: 350 },
            { type: 'monster', x: 320, y: 250 },
            { type: 'monster', x: 100, y: 150 },
            { type: 'monster', x: 500, y: 150 }
        ]
    ),
    // Level 3: 中心屏障 (引入实心方块增加绕路)
    generateLevel(
        [
            [12, 4, 15, 2],
            [9, 1, 4, 1], [9, 15, 18, 1], // 实心侧撑
            [9, 8, 11, 2],
            [6, 4, 15, 2],
            [3, 1, 6, 2], [3, 13, 18, 2],
        ],
        [
            { type: 'monster', x: 320, y: 350 },
            { type: 'monster', x: 120, y: 200 },
            { type: 'monster', x: 520, y: 200 },
            { type: 'monster', x: 320, y: 100 }
        ]
    ),
    // Level 4: 漏斗竞技场
    generateLevel(
        [
            [13, 1, 5, 2], [13, 14, 18, 2],
            [10, 4, 15, 2],
            [7, 1, 6, 2], [7, 13, 18, 2],
            [4, 6, 13, 2],
        ],
        [
            { type: 'monster', x: 100, y: 380 },
            { type: 'monster', x: 540, y: 380 },
            { type: 'monster', x: 320, y: 280 },
            { type: 'monster', x: 120, y: 180 },
            { type: 'monster', x: 520, y: 180 }
        ]
    ),
    // Level 5: 最终巅峰 (修复顶部无法到达问题)
    generateLevel(
        [
            [12, 2, 7, 2], [12, 12, 17, 2],
            [9, 6, 13, 2],
            [6, 2, 7, 2], [6, 12, 17, 2],
            [3, 6, 13, 2], // 顶部中央平台，现在设为 Type 2，可以跳上去
        ],
        [
            { type: 'monster', x: 100, y: 350 },
            { type: 'monster', x: 540, y: 350 },
            { type: 'monster', x: 320, y: 250 },
            { type: 'monster', x: 100, y: 150 },
            { type: 'monster', x: 540, y: 150 },
            { type: 'monster', x: 320, y: 50 }
        ]
    )
];
