import { database } from './firebaseConfig.js';
import { ref, onValue } from "firebase/database";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import FireEffect from './burn.js';
import * as THREE from 'three';
import { Vector3 } from 'three';
import BurnEffect from './burn2.js';  // Adjust path if necessary


class EnemyShips {
    constructor(scene, playerId) {
        this.scene = scene;
        this.playerId = playerId;
        this.enemyShips = [];
        this.loader = new GLTFLoader();
        this.GRID_OFFSET_X = -330;
        this.shipSizes = {
            'bigShip.glb': 5,
            'blurudestroyer.glb': 4,
            'submarine.glb': 2,
            '3boxship.glb': 3,
            'maritimedrone.glb': 3
        };
        this.fireEffect = new FireEffect(scene);
        this.burnEffect = new BurnEffect(scene);
        this.shipHits = new Map(); // Map to track hits per ship
        this.hitPositions = new Set(); // Track all hit positions
        this.clock = new THREE.Clock();
    }
    update() {
        const delta = this.clock.getDelta();
        this.fireEffect.update(delta); 
    }

    // [Previous methods remain unchanged: getEnemyPlayerId, transformCoordinates, loadEnemyShips, isShipAtPosition]
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

    transformCoordinates(position) {
        return {
            x: position.x + this.GRID_OFFSET_X,
            y: position.y,
            z: position.z
        };
    }

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

                        ship.userData.modelPath = shipInfo.modelPath;
                        ship.traverse((child) => {
                            if (child.isMesh) {
                                child.visible = false;
                            }
                        });

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

        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize / 2) / boxSize);

        return this.enemyShips.some(ship => {
            const shipPath = ship.userData.modelPath;
            const shipSize = this.shipSizes[shipPath];
            const rotation = ship.rotation.y;

            const shipGridX = Math.floor((ship.position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
            const shipGridZ = Math.floor((ship.position.z + gridSize / 2) / boxSize);

            if (shipPath === '3boxship.glb') {
                const isVertical = Math.abs(Math.abs(rotation) - Math.PI / 2) < 0.1 ||
                    Math.abs(Math.abs(rotation) - (3 * Math.PI / 2)) < 0.1;

                if (isVertical) {
                    for (let offset = -1; offset <= 1; offset++) {
                        if (gridX === shipGridX && gridZ === shipGridZ + offset) {
                            return true;
                        }
                    }
                } else {
                    for (let offset = -1; offset <= 1; offset++) {
                        if (gridX === shipGridX + offset && gridZ === shipGridZ) {
                            return true;
                        }
                    }
                }
                return false;
            }

            const isHorizontal = Math.abs(Math.cos(rotation)) < 0.5;
            const startX = isHorizontal ? shipGridX - Math.floor(shipSize / 2) : shipGridX;
            const startZ = isHorizontal ? shipGridZ : shipGridZ - Math.floor(shipSize / 2);

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

    // Modified handleHit method
    handleHit(position) {
        const gridSize = 400;
        const divisions = 8;
        const boxSize = gridSize / divisions;

        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize / 2) / boxSize);
        const posKey = `${gridX},${gridZ}`;

        if (!this.hitPositions.has(posKey)) {
            this.hitPositions.add(posKey);

            // Find which specific ship was hit
            this.enemyShips.forEach(ship => {
                // Check if this specific ship was hit at this position
                const shipPath = ship.userData.modelPath;
                const shipSize = this.shipSizes[shipPath];

                if (this.isShipOccupyingPosition(ship, position)) {
                    // Initialize hit counter for this ship if not exists
                    if (!this.shipHits.has(ship)) {
                        this.shipHits.set(ship, new Set());
                    }

                    // Add this hit position to the ship's hit set
                    this.shipHits.get(ship).add(posKey);

                    // Only reveal the ship if all its squares have been hit
                    if (this.shipHits.get(ship).size >= shipSize) {
                        ship.traverse((child) => {
                            if (child.isMesh) {
                                child.visible = true;
                            }
                        });
                    }
                }
            });

            // Add fire effect
            const worldX = (gridX * boxSize) + this.GRID_OFFSET_X - gridSize / 2 + boxSize / 2;
            const worldZ = (gridZ * boxSize) - gridSize / 2 + boxSize / 2;
            this.fireEffect.addFireEffectAtPosition(
                new Vector3(worldX, 5, worldZ),
                gridSize,
                divisions
            );
            this.burnEffect.addBurnEffect(new THREE.Vector3(worldX, 5, worldZ));
            return true;
        }
        return false;
    }

    // New helper method to check if a specific ship occupies a position
    isShipOccupyingPosition(ship, position) {
        const gridSize = 400;
        const divisions = 8;
        const boxSize = gridSize / divisions;

        const gridX = Math.floor((position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const gridZ = Math.floor((position.z + gridSize / 2) / boxSize);

        const shipPath = ship.userData.modelPath;
        const shipSize = this.shipSizes[shipPath];
        const rotation = ship.rotation.y;

        const shipGridX = Math.floor((ship.position.x - this.GRID_OFFSET_X + gridSize / 2) / boxSize);
        const shipGridZ = Math.floor((ship.position.z + gridSize / 2) / boxSize);

        if (shipPath === '3boxship.glb') {
            const isVertical = Math.abs(Math.abs(rotation) - Math.PI / 2) < 0.1 ||
                Math.abs(Math.abs(rotation) - (3 * Math.PI / 2)) < 0.1;

            if (isVertical) {
                for (let offset = -1; offset <= 1; offset++) {
                    if (gridX === shipGridX && gridZ === shipGridZ + offset) {
                        return true;
                    }
                }
            } else {
                for (let offset = -1; offset <= 1; offset++) {
                    if (gridX === shipGridX + offset && gridZ === shipGridZ) {
                        return true;
                    }
                }
            }
            return false;
        }

        const isHorizontal = Math.abs(Math.cos(rotation)) < 0.5;
        const startX = isHorizontal ? shipGridX - Math.floor(shipSize / 2) : shipGridX;
        const startZ = isHorizontal ? shipGridZ : shipGridZ - Math.floor(shipSize / 2);

        for (let i = 0; i < shipSize; i++) {
            const occupiedX = isHorizontal ? startX + i : shipGridX;
            const occupiedZ = isHorizontal ? shipGridZ : startZ + i;

            if (gridX === occupiedX && gridZ === occupiedZ) {
                return true;
            }
        }

        return false;
    }

    update() {
        const delta = this.clock.getDelta();
        this.fireEffect.update(delta); 
        this.burnEffect.update(delta); 
    }

    removeExistingShips() {
        this.enemyShips.forEach(ship => {
            this.scene.remove(ship);
            if (ship.geometry) ship.geometry.dispose();
            if (ship.material) ship.material.dispose();
        });
        this.enemyShips = [];
        this.fireEffect.clearFireEffects();
        this.shipHits.clear();
        this.hitPositions.clear();
    }
}

export default EnemyShips;