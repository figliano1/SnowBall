
/**
 * Since we need original pixel art, we generate it on small canvases
 * and use them as Image sources.
 */

const createPixelSprite = (pixels: string[], palette: Record<string, string>, size: number = 16) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const pSize = size / pixels.length;

    pixels.forEach((row, y) => {
        [...row].forEach((char, x) => {
            if (char !== ' ' && palette[char]) {
                ctx.fillStyle = palette[char];
                ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
            }
        });
    });

    return canvas;
};

// Simple Snowman (Nick)
const NickPalette = {
    'W': '#FFFFFF',
    'B': '#333333',
    'R': '#FF0000',
    'O': '#FFA500',
    'U': '#0000FF'
};

const NickPixels = [
    '   WWWWW    ',
    '  WWWWWWW   ',
    ' WWWWWWWWW  ',
    ' WWBWWWWBW  ',
    ' WWWWOWWWW  ',
    '  WWWWWWW   ',
    '   RRRRR    ',
    '  WWWWWWW   ',
    ' WWWWWWWWW  ',
    ' WWWWWWWWW  ',
    ' WWWWWWWWW  ',
    '  WWWWWWW   ',
    '   UU UU    ',
    '   UU UU    '
];

// Simple Monster
const MonsterPalette = {
    'G': '#4ade80',
    'D': '#166534',
    'E': '#000000',
    'R': '#ef4444'
};

const MonsterPixels = [
    '   GGGGG    ',
    '  GGGGGGG   ',
    ' GGEGGGEG   ',
    ' GGGGGGGG   ',
    ' GGGGGGGG   ',
    ' GGGGGGGG   ',
    ' GGGGGGGG   ',
    '  GGGGGGG   ',
    '   GG GG    ',
    '   RR RR    '
];

export const Sprites = {
    Nick: createPixelSprite(NickPixels, NickPalette, 32),
    Monster: createPixelSprite(MonsterPixels, MonsterPalette, 32),
    Snowball: createPixelSprite([' WW ', 'WWWW', 'WWWW', ' WW '], NickPalette, 16),
    FrozenBall: createPixelSprite([' WWWW ', 'WWWWWW', 'WWWWWW', 'WWWWWW', ' WWWW '], NickPalette, 32),
};
