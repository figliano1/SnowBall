
class AudioManager {
    private ctx: AudioContext | null = null;
    private bgmOsc: OscillatorNode | null = null;
    private bgmGain: GainNode | null = null;
    private isBgmPlaying = false;

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    private async playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.2, slideFreq?: number) {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') await this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot() {
        this.playTone(800, 'square', 0.1, 0.15, 200);
    }

    playJump() {
        this.playTone(400, 'triangle', 0.2, 0.2, 600);
    }

    playHit() {
        this.playTone(150, 'sawtooth', 0.15, 0.25, 50);
    }

    playRoll() {
        this.playTone(100, 'square', 0.5, 0.2, 50);
    }

    playWin() {
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'square', 0.4, 0.2), i * 150);
        });
    }

    playGameOver() {
        const notes = [440, 330, 220, 110];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sawtooth', 0.6, 0.2), i * 200);
        });
    }

    startBGM() {
        this.init();
        if (this.isBgmPlaying || !this.ctx) return;
        this.isBgmPlaying = true;
        
        // Very simple arcade-style looping melody
        const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        let step = 0;

        const playStep = () => {
            if (!this.isBgmPlaying || !this.ctx) return;
            const note = melody[step % melody.length];
            this.playTone(note, 'triangle', 0.2, 0.03); // Quiet background layer
            step++;
            setTimeout(playStep, 250);
        };
        playStep();
    }

    stopBGM() {
        this.isBgmPlaying = false;
    }
}

export const audio = new AudioManager();
