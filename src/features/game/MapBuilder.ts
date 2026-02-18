import Phaser from 'phaser';
import { LEVEL_LAYOUT, TILE_SIZE } from './MapConfig';
import { TILES } from './TileSet';

export class MapBuilder {
    private scene: Phaser.Scene;
    private map!: Phaser.Tilemaps.Tilemap;
    private wallLayer!: Phaser.Tilemaps.TilemapLayer;
    private doorTiles: { x: number, y: number }[] = [];
    
    // NEW: Store references to lights so we can turn them off
    private ceilingLights: Phaser.GameObjects.Light[] = [];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    build() {
        // 1. Create a blank tilemap
        // Map dimensions based on LEVEL_LAYOUT
        const height = LEVEL_LAYOUT.length;
        const width = LEVEL_LAYOUT[0].length;

        this.map = this.scene.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width: width,
            height: height
        });

        // 2. Add Tileset image
        const tileset = this.map.addTilesetImage('tiles', undefined, 32, 32, 0, 0);
        if (!tileset) {
            console.error("Could not load tileset image 'tiles'");
            return this.getEmptyResult();
        }

        // 3. Create Layers
        const groundLayer = this.map.createBlankLayer('Ground', tileset);
        const wallLayer = this.map.createBlankLayer('Walls', tileset);

        if (!groundLayer || !wallLayer) {
            console.error("Could not create layers");
            return this.getEmptyResult();
        }

        this.wallLayer = wallLayer;

        // Scale layers to match our desired TILE_SIZE (64) if source is 32
        const scale = TILE_SIZE / 32;
        groundLayer.setScale(scale);
        this.wallLayer.setScale(scale);

        // Enable Light2D pipeline for layers
        groundLayer.setPipeline('Light2D');
        this.wallLayer.setPipeline('Light2D');

        // 4. Populate Layers
        LEVEL_LAYOUT.forEach((row, y) => {
            row.forEach((tileIndex, x) => {
                if (tileIndex === -1) return; // Void

                // Check if it's a floor
                if (this.isFloor(tileIndex)) {
                    groundLayer.putTileAt(tileIndex, x, y);
                }
                // Check if it's a DOOR (99)
                else if (tileIndex === 99) {
                    // Put a floor underneath
                    groundLayer.putTileAt(TILES.FLOOR_MIDDLEMIDDLE, x, y);
                    // Put a Wall-like tile on top (using WALL_TOPMIDDLE for now, or similar)
                    this.wallLayer.putTileAt(TILES.WALL_TOPMIDDLE, x, y);
                    // Store coordinate to toggle later
                    this.doorTiles.push({ x, y });
                }
                else {
                    // It's a Wall, Furniture, or Decoration
                    // 1. Put a generic floor underneath it (so transparency looks right)
                    groundLayer.putTileAt(TILES.FLOOR_MIDDLEMIDDLE, x, y);

                    // 2. Put the object in the Wall Layer
                    this.wallLayer.putTileAt(tileIndex, x, y);
                }
            });
        });

        // 5. Collision
        // Collide with everything in the wall layer (Walls + Furniture)
        this.wallLayer.setCollisionByExclusion([-1]);

        // 6. Define Zones (Updated for Expanded Layout)
        // Database Room: Top-Left (Row 2, Col 4 approx)
        const dbZone = this.createZone(4.5, 2.5, 0x00ff00);

        // Hub: Center (Row 12, Col 7)
        const hubZone = this.createZone(7.5, 12.5, 0x0000ff);

        // API Room: Bottom (Row 21, Col 7)
        const apiZone = this.createZone(7.5, 21.5, 0xffff00);

        // Meeting Room: Right (Row 12, Col 16 approx)
        const meetingZone = this.createZone(16.5, 12.5, 0xff00ff);

        // Academy Zones (Placed near challenges)
        const solarAcademyZone = this.createZone(6.5, 2.5, 0xffaa00);
        const wasteAcademyZone = this.createZone(9.5, 12.5, 0xffaa00);
        const oxygenAcademyZone = this.createZone(5.5, 21.5, 0xffaa00);

        // Spawn Point (Database Room)
        const spawnPoint = { x: 4.5 * TILE_SIZE, y: 2.5 * TILE_SIZE };

        // 7. Add Ceiling Lights
        this.addCeilingLights();

        return {
            walls: this.wallLayer,
            dbZone,
            apiZone,
            hubZone,
            meetingZone,
            solarAcademyZone,
            wasteAcademyZone,
            oxygenAcademyZone,
            spawnPoint,
            doorTiles: this.doorTiles,
            // NEW: Return the builder instance so MainScene can control lights
            builder: this 
        };
    }

    public toggleDoor(isOpen: boolean) {
        this.doorTiles.forEach(pos => {
            const tile = this.wallLayer.getTileAt(pos.x, pos.y);
            if (tile) {
                // If Open -> No Collision, Invisible (or semi-transparent)
                // If Closed -> Collision, Visible
                tile.setCollision(!isOpen);
                tile.setVisible(!isOpen);
            }
        });
    }

    // NEW: Function to toggle lights for blackout
    public setBlackout(isBlackout: boolean) {
        this.ceilingLights.forEach(light => {
            // If blackout, intensity 0. If normal, restore to 0.6
            light.setIntensity(isBlackout ? 0 : 0.6);
        });
    }

    private addCeilingLights() {
        // Uniform, dim lights to make the map visible but atmospheric
        // Increased intensity from 0.6 to 0.8 and radius from 180 to 220
        const lightConfig = { radius: 220, color: 0xffffee, intensity: 0.6 };

        const positions = [
            // Database Room
            { x: 4, y: 3 },
            { x: 5, y: 3 },
            { x: 6, y: 3 },

            // Hallway
            { x: 5, y: 7 },

            // Hub (Top)
            { x: 3, y: 11 }, { x: 5, y: 11 }, { x: 7, y: 11 }, { x: 9, y: 11 },
            // Hub (Bottom)
            { x: 3, y: 13 }, { x: 5, y: 13 }, { x: 7, y: 13 }, { x: 9, y: 13 },

            // Lower Corridor
            { x: 5, y: 17 },

            // API Room
            { x: 5, y: 21 },
            { x: 6, y: 21 },
            { x: 7, y: 21 },

            // Meeting Room
            { x: 14, y: 12 }, { x: 16, y: 12 }, { x: 18, y: 12 },
            { x: 14, y: 14 }, { x: 16, y: 14 }, { x: 18, y: 14 }
        ];

        positions.forEach(pos => {
            const light = this.scene.lights.addLight(
                pos.x * TILE_SIZE,
                pos.y * TILE_SIZE,
                lightConfig.radius
            ).setColor(lightConfig.color).setIntensity(lightConfig.intensity);

            // NEW: Store the light in our array
            this.ceilingLights.push(light);
        });
    }

    private isFloor(index: number): boolean {
        const floors: number[] = [
            TILES.FLOOR_TOPLEFT, TILES.FLOOR_TOPMIDDLE, TILES.FLOOR_TOPRIGHT,
            TILES.FLOOR_MIDDLELEFT, TILES.FLOOR_MIDDLEMIDDLE, TILES.FLOOR_MIDDLERIGHT,
            TILES.FLOOR_BOTTOMLEFT, TILES.FLOOR_BOTTOMMIDDLE, TILES.FLOOR_BOTTOMRIGHT,
            TILES.FLOOR_TOPLEFT_CRACKED, TILES.FLOOR_TOPMIDDLE_CRACKED, TILES.FLOOR_TOPRIGHT_CRACKED,
            TILES.FLOOR_MIDDLELEFT_CRACKED, TILES.FLOOR_MIDDLEMIDDLE_CRACKED, TILES.FLOOR_MIDDLERIGHT_CRACKED,
            TILES.FLOOR_BOTTOMLEFT_CRACKED, TILES.FLOOR_BOTTOMMIDDLE_CRACKED, TILES.FLOOR_BOTTOMRIGHT_CRACKED,
            TILES.FlOOR_VENT1, TILES.FLOOR_VENT2, TILES.FLOOR_CAUTION
        ];
        return floors.includes(index);
    }

    private createZone(gridX: number, gridY: number, color: number) {
        const x = gridX * TILE_SIZE;
        const y = gridY * TILE_SIZE;
        const zone = this.scene.add.rectangle(x, y, TILE_SIZE * 0.8, TILE_SIZE * 0.8, color, 0.3);
        this.scene.physics.add.existing(zone, true);
        return zone;
    }

    private getEmptyResult() {
        return {
            walls: this.scene.physics.add.staticGroup(),
            dbZone: null, apiZone: null, hubZone: null, meetingZone: null,
            solarAcademyZone: null, wasteAcademyZone: null, oxygenAcademyZone: null,
            spawnPoint: null,
            doorTiles: [],
            builder: this
        };
    }
}