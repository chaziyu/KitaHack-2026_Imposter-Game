import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        // 1. Create Loading Bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Example...', {
            font: '20px monospace',
            color: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            font: '18px monospace',
            color: '#ffffff'
        });
        percentText.setOrigin(0.5, 0.5);

        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            font: '18px monospace',
            color: '#ffffff'
        });
        assetText.setOrigin(0.5, 0.5);

        // 2. Event Listeners
        this.load.on('progress', (value: number) => {
            percentText.setText(parseInt((value * 100).toString()) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('fileprogress', (file: any) => {
            assetText.setText('Loading asset: ' + file.key);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // 3. Load Assets
        // Spritesheets
        this.load.spritesheet('doux', 'assets/sprites/DinoSprites - doux.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('mort', 'assets/sprites/DinoSprites - mort.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('tard', 'assets/sprites/DinoSprites - tard.png', { frameWidth: 24, frameHeight: 24 });
        this.load.spritesheet('vita', 'assets/sprites/DinoSprites - vita.png', { frameWidth: 24, frameHeight: 24 });

        // Images
        this.load.image('tiles', 'assets/tilesets/scifi.png');
        this.load.image('terminal', 'assets/objects/small terminal.png');
        this.load.image('table', 'assets/objects/large_round_table.png');
        this.load.image('background', 'assets/background/bg.png');

        // Audio (Small files only)
        this.load.audio('bgm', 'assets/sounds/music/background.ogg');
        this.load.audio('footsteps', 'assets/sounds/sfx/walking.mp3');

        // NOTE: 'meeting_bgm' is intentionally omitted here to be lazy-loaded in MainScene
    }

    create() {
        this.scene.start('MainScene');
    }
}
