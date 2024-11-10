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

                // Remove existing enemy ships
                this.removeExistingShips();

                // Load new enemy ships
                shipData.forEach(shipInfo => {
                    this.loader.load(shipInfo.modelPath, (gltf) => {
                        const ship = gltf.scene;
                        
                        // Transform position to enemy grid
                        const transformedPosition = this.transformCoordinates(shipInfo.position);
                        
                        ship.position.set(
                            transformedPosition.x,
                            shipInfo.position.y,
                            shipInfo.position.z
                        );

                        // Set rotation
                        ship.rotation.set(
                            shipInfo.rotation.x,
                            shipInfo.rotation.y,
                            shipInfo.rotation.z
                        );

                        // Set scale
                        ship.scale.set(
                            shipInfo.scale.x,
                            shipInfo.scale.y,
                            shipInfo.scale.z
                        );

                        // Add to scene and track
                        this.scene.add(ship);
                        this.enemyShips.push(ship);
                    });
                });
            });
        } catch (error) {
            console.error("Error loading enemy ships:", error);
        }
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