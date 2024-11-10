import { database } from './firebaseConfig.js';
import { ref, onValue } from "firebase/database";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class EnemyShips {
    constructor(scene, playerId) {
        this.scene = scene;
        this.playerId = playerId;
        this.enemyShips = [];
        this.loader = new GLTFLoader();
        this.GRID_OFFSET_X = -330; // Match the large grid position from game.js
        this.shipSizes = {
            'bigShip.glb': 5,
            'blurudestroyer.glb': 4,
            'submarine.glb': 2,
            '3boxship.glb': 3,
            'maritimedrone.glb': 3
        };
    }

    // Get the enemy player's ID
    getEnemyPlayerId() {
        return new Promise((resolve) => {
            const playersRef = ref(database, 'game/players');
            onValue(playersRef, (snapshot) => {
                const players = snapshot.val();
                if (players) {
                    const playerIds = Object.keys(players);
                    const enemyId = playerIds.find(id => id !== this.playerId);
                    resolve(enemyId);
                }
            });
        });
    }

    // Transform coordinates to match enemy grid
    transformCoordinates(position) {
        return {
            x: position.x + this.GRID_OFFSET_X, // Adjust for grid offset
            y: position.y,
            z: position.z
        };
    }

    // Load enemy ships from Firebase
    async loadEnemyShips() {
        try {
            const enemyId = await this.getEnemyPlayerId();
            if (!enemyId) return;

            const enemyShipsRef = ref(database, `game/ships/${enemyId}`);
            
            onValue(enemyShipsRef, (snapshot) => {
                const shipData = snapshot.val();
                if (!shipData) return;

                this.removeExistingShips();

                shipData.forEach(shipInfo => {
                    this.loader.load(shipInfo.modelPath, (gltf) => {
                        const ship = gltf.scene;
                        const transformedPosition = this.transformCoordinates(shipInfo.position);
                        
                        ship.position.set(
                            transformedPosition.x,
                            shipInfo.position.y,
                            shipInfo.position.z
                        );

                        ship.rotation.set(
                            shipInfo.rotation.x,
                            shipInfo.rotation.y,
                            shipInfo.rotation.z
                        );

                        ship.scale.set(
                            shipInfo.scale.x,
                            shipInfo.scale.y,
                            shipInfo.scale.z
                        );

                        // Store the model path in the ship's userData
                        ship.userData.modelPath = shipInfo.modelPath;

                        this.scene.add(ship);
                        this.enemyShips.push(ship);
                    });
                });
            });
        } catch (error) {
            console.error("Error loading enemy ships:", error);
        }
    }

    isShipAtPosition(position) {
        const gridSize = 400;
        const divisions = 8;
        const boxSize = gridSize / divisions;
        
        // Calculate clicked grid position
        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize/2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize/2) / boxSize);
        
        // Check each enemy ship
        return this.enemyShips.some(ship => {
            // Get ship metadata
            const shipPath = ship.userData.modelPath;
            const shipSize = this.shipSizes[shipPath];
            const rotation = ship.rotation.y;
            
            // Calculate ship's grid position (center point)
            const shipGridX = Math.floor((ship.position.x - this.GRID_OFFSET_X + gridSize/2) / boxSize);
            const shipGridZ = Math.floor((ship.position.z + gridSize/2) / boxSize);
            
            // Determine if ship is horizontal (rotated around Y axis)
            // π/2 (1.57...) or 3π/2 (4.71...) indicates horizontal orientation
            const isHorizontal = Math.abs(Math.cos(rotation)) < 0.5;
            
            // Calculate ship's starting position based on its size and orientation
            const startX = isHorizontal ? shipGridX - Math.floor(shipSize/2) : shipGridX;
            const startZ = isHorizontal ? shipGridZ : shipGridZ - Math.floor(shipSize/2);
            
            // Check if clicked position is within ship's occupied squares
            for (let i = 0; i < shipSize; i++) {
                const occupiedX = isHorizontal ? startX + i : shipGridX;
                const occupiedZ = isHorizontal ? shipGridZ : startZ + i;
                
                if (gridX === occupiedX && gridZ === occupiedZ) {
                    return true;
                }
            }
            
            return false;
        });
    }
    
    // Remove existing enemy ships from scene
    removeExistingShips() {
        this.enemyShips.forEach(ship => {
            this.scene.remove(ship);
            if (ship.geometry) ship.geometry.dispose();
            if (ship.material) ship.material.dispose();
        });
        this.enemyShips = [];
    }
}

export default EnemyShips;