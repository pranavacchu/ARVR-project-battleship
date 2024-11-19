// Import the Firebase database configuration
import { database } from './firebaseConfig.js';

// Import specific functions from Firebase database module
import { ref, onValue } from "firebase/database";

// Import GLTFLoader for loading 3D models in GLTF format
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Import custom fire effect classes
import FireEffect from './burn.js';
import * as THREE from 'three';
import { Vector3 } from 'three';
import BurnEffect from './burn2.js';  

// Import score tracking module
import scoreTracker from './scores.js';

class EnemyShips {
    constructor(scene, playerId) {
        // Reference to the Three.js scene
        this.scene = scene;

        // Unique identifier for the player
        this.playerId = playerId;

        // Array to store enemy ship objects
        this.enemyShips = [];

        // Loader for GLTF models
        this.loader = new GLTFLoader();

        // Offset for grid positioning on the X-axis
        this.GRID_OFFSET_X = -330;

        // Mapping of ship model paths to their sizes (number of grid squares they occupy)
        this.shipSizes = {
            'bigShip.glb': 5,
            'blurudestroyer.glb': 4,
            'submarine.glb': 2,
            '3boxship.glb': 3,
            'maritimedrone.glb': 3
        };

        // Instantiate fire and burn effect classes
        this.fireEffect = new FireEffect(scene);
        this.burnEffect = new BurnEffect(scene);

        // Map to track the number of hits on each ship
        this.shipHits = new Map(); // Map to track hits per ship

        // Set to track all positions that have been hit
        this.hitPositions = new Set(); // Track all hit positions

        // Clock for tracking time in animations
        this.clock = new THREE.Clock();
    }

    // Method to update effects each frame
    update() {
        const delta = this.clock.getDelta(); // Time elapsed since last frame
        this.fireEffect.update(delta);       // Update fire effects
    }

    // [Previous methods remain unchanged: getEnemyPlayerId, transformCoordinates, loadEnemyShips, isShipAtPosition]

    // Method to get the enemy player's ID from the database
    getEnemyPlayerId() {
        return new Promise((resolve) => {
            const playersRef = ref(database, 'game/players'); // Reference to players data
            onValue(playersRef, (snapshot) => {
                const players = snapshot.val(); // Get current players
                if (players) {
                    const playerIds = Object.keys(players); // Array of player IDs
                    const enemyId = playerIds.find(id => id !== this.playerId); // Find the ID that is not this player's
                    resolve(enemyId); // Return the enemy's ID
                }
            });
        });
    }

    // Method to adjust coordinates based on grid offset
    transformCoordinates(position) {
        return {
            x: position.x + this.GRID_OFFSET_X, // Adjust X position
            y: position.y,                      // Y position remains the same
            z: position.z                       // Z position remains the same
        };
    }

    // Method to load enemy ships from the database and add them to the scene
    async loadEnemyShips() {
        try {
            const enemyId = await this.getEnemyPlayerId(); // Get enemy player's ID
            if (!enemyId) return; // Exit if no enemy ID found

            const enemyShipsRef = ref(database, `game/ships/${enemyId}`); // Reference to enemy ships data

            onValue(enemyShipsRef, (snapshot) => {
                const shipData = snapshot.val(); // Get enemy ships data
                if (!shipData) return; // Exit if no ship data

                this.removeExistingShips(); // Remove any existing ships from the scene

                shipData.forEach(shipInfo => {
                    // Load each ship model
                    this.loader.load(shipInfo.modelPath, (gltf) => {
                        const ship = gltf.scene; // Get the ship scene
                        const transformedPosition = this.transformCoordinates(shipInfo.position); // Adjust position

                        // Set ship's position
                        ship.position.set(
                            transformedPosition.x,
                            shipInfo.position.y,
                            shipInfo.position.z
                        );

                        // Set ship's rotation
                        ship.rotation.set(
                            shipInfo.rotation.x,
                            shipInfo.rotation.y,
                            shipInfo.rotation.z
                        );

                        // Set ship's scale
                        ship.scale.set(
                            shipInfo.scale.x,
                            shipInfo.scale.y,
                            shipInfo.scale.z
                        );

                        // Store model path in user data for reference
                        ship.userData.modelPath = shipInfo.modelPath;

                        // Hide the ship initially by making its meshes invisible
                        ship.traverse((child) => {
                            if (child.isMesh) {
                                child.visible = false;
                            }
                        });

                        this.scene.add(ship);         // Add ship to the scene
                        this.enemyShips.push(ship);   // Add ship to the enemy ships array
                    });
                });
            });
        } catch (error) {
            console.error("Error loading enemy ships:", error); // Log any errors
        }
    }

    // Method to check if a ship occupies a given position
    isShipAtPosition(position) {
        const gridSize = 400;                      // Total size of the grid
        const divisions = 8;                       // Number of grid divisions
        const boxSize = gridSize / divisions;      // Size of each grid box

        // Calculate grid coordinates from world position
        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize / 2) / boxSize);

        // Check if any enemy ship occupies the calculated grid position
        return this.enemyShips.some(ship => {
            const shipPath = ship.userData.modelPath;      // Get ship's model path
            const shipSize = this.shipSizes[shipPath];     // Get ship's size based on model path
            const rotation = ship.rotation.y;              // Get ship's rotation

            // Calculate ship's grid position
            const shipGridX = Math.floor((ship.position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
            const shipGridZ = Math.floor((ship.position.z + gridSize / 2) / boxSize);

            if (shipPath === '3boxship.glb') {
                // Special handling for specific ship model
                const isVertical = Math.abs(Math.abs(rotation) - Math.PI / 2) < 0.1 ||
                    Math.abs(Math.abs(rotation) - (3 * Math.PI / 2)) < 0.1;

                if (isVertical) {
                    // Check vertically occupied positions
                    for (let offset = -1; offset <= 1; offset++) {
                        if (gridX === shipGridX && gridZ === shipGridZ + offset) {
                            return true;
                        }
                    }
                } else {
                    // Check horizontally occupied positions
                    for (let offset = -1; offset <= 1; offset++) {
                        if (gridX === shipGridX + offset && gridZ === shipGridZ) {
                            return true;
                        }
                    }
                }
                return false;
            }

            // Determine if ship is horizontal based on rotation
            const isHorizontal = Math.abs(Math.cos(rotation)) < 0.5;

            // Calculate starting grid positions based on orientation
            const startX = isHorizontal ? shipGridX - Math.floor(shipSize / 2) : shipGridX;
            const startZ = isHorizontal ? shipGridZ : shipGridZ - Math.floor(shipSize / 2);

            // Check all positions occupied by the ship
            for (let i = 0; i < shipSize; i++) {
                const occupiedX = isHorizontal ? startX + i : shipGridX;
                const occupiedZ = isHorizontal ? shipGridZ : startZ + i;

                if (gridX === occupiedX && gridZ === occupiedZ) {
                    return true; // Ship occupies this position
                }
            }

            return false; // Ship does not occupy this position
        });
    }

    // Modified method to handle a hit at a given position
    handleHit(position) {
        const gridSize = 400;                      // Total size of the grid
        const divisions = 8;                       // Number of grid divisions
        const boxSize = gridSize / divisions;      // Size of each grid box

        // Calculate grid coordinates from world position
        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize / 2) / boxSize);
        const posKey = `${gridX},${gridZ}`;        // Create a unique key for the position

        if (!this.hitPositions.has(posKey)) {
            this.hitPositions.add(posKey);         // Mark position as hit

            // Iterate over enemy ships to check for hits
            this.enemyShips.forEach(ship => {
                const shipPath = ship.userData.modelPath;  // Ship's model path
                const shipSize = this.shipSizes[shipPath]; // Ship's size

                if (this.isShipOccupyingPosition(ship, position)) {
                    // Initialize hit counter for the ship if it doesn't exist
                    if (!this.shipHits.has(ship)) {
                        this.shipHits.set(ship, new Set());
                    }

                    // Record the hit position for the ship
                    this.shipHits.get(ship).add(posKey);

                    // Check if the ship has been completely destroyed
                    if (this.shipHits.get(ship).size >= shipSize) {
                        // Reveal the ship by making its meshes visible
                        ship.traverse((child) => {
                            if (child.isMesh) {
                                child.visible = true;
                            }
                        });
                        // Update the score tracker for the destroyed ship
                        scoreTracker.checkShipDestroyed(ship);
                    }
                }
            });

            // Calculate world coordinates for the effects
            const worldX = (gridX * boxSize) + this.GRID_OFFSET_X - gridSize / 2 + boxSize / 2;
            const worldZ = (gridZ * boxSize) - gridSize / 2 + boxSize / 2;

            // Add fire effect at the hit position
            this.fireEffect.addFireEffectAtPosition(
                new Vector3(worldX, 5, worldZ),
                gridSize,
                divisions
            );
            // Add burn effect at the hit position
            this.burnEffect.addBurnEffect(new THREE.Vector3(worldX, 5, worldZ));
            return true; // Hit was successful
        }
        return false; // Position was already hit
    }

    // New helper method to check if a specific ship occupies a position
    isShipOccupyingPosition(ship, position) {
        const gridSize = 400;                      // Total size of the grid
        const divisions = 8;                       // Number of grid divisions
        const boxSize = gridSize / divisions;      // Size of each grid box

        // Calculate grid coordinates from world position
        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize / 2) / boxSize);

        const shipPath = ship.userData.modelPath;      // Ship's model path
        const shipSize = this.shipSizes[shipPath];     // Ship's size
        const rotation = ship.rotation.y;              // Ship's rotation

        // Calculate ship's grid position
        const shipGridX = Math.floor((ship.position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const shipGridZ = Math.floor((ship.position.z + gridSize / 2) / boxSize);

        if (shipPath === '3boxship.glb') {
            // Special handling for specific ship model
            const isVertical = Math.abs(Math.abs(rotation) - Math.PI / 2) < 0.1 ||
                Math.abs(Math.abs(rotation) - (3 * Math.PI / 2)) < 0.1;

            if (isVertical) {
                // Check vertically occupied positions
                for (let offset = -1; offset <= 1; offset++) {
                    if (gridX === shipGridX && gridZ === shipGridZ + offset) {
                        return true;
                    }
                }
            } else {
                // Check horizontally occupied positions
                for (let offset = -1; offset <= 1; offset++) {
                    if (gridX === shipGridX + offset && gridZ === shipGridZ) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Determine if ship is horizontal based on rotation
        const isHorizontal = Math.abs(Math.cos(rotation)) < 0.5;

        // Calculate starting grid positions based on orientation
        const startX = isHorizontal ? shipGridX - Math.floor(shipSize / 2) : shipGridX;
        const startZ = isHorizontal ? shipGridZ : shipGridZ - Math.floor(shipSize / 2);

        // Check all positions occupied by the ship
        for (let i = 0; i < shipSize; i++) {
            const occupiedX = isHorizontal ? startX + i : shipGridX;
            const occupiedZ = isHorizontal ? shipGridZ : startZ + i;

            if (gridX === occupiedX && gridZ === occupiedZ) {
                return true; // Ship occupies this position
            }
        }

        return false; // Ship does not occupy this position
    }

    // Update method to update effects each frame
    update() {
        const delta = this.clock.getDelta(); // Time elapsed since last frame
        this.fireEffect.update(delta);       // Update fire effects
        this.burnEffect.update(delta);       // Update burn effects
    }

    // Method to remove existing ships and reset related data
    removeExistingShips() {
        this.enemyShips.forEach(ship => {
            this.scene.remove(ship);                 // Remove ship from the scene
            if (ship.geometry) ship.geometry.dispose(); // Dispose of geometry
            if (ship.material) ship.material.dispose(); // Dispose of material
        });
        this.enemyShips = [];            // Clear enemy ships array
        this.fireEffect.clearFireEffects(); // Clear fire effects
        this.shipHits.clear();           // Reset ship hits tracking
        this.hitPositions.clear();       // Reset hit positions
    }
}

// Export the EnemyShips class as the default export
export default EnemyShips;
