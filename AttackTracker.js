// Import necessary modules and functions from Firebase
import { database } from './firebaseConfig.js'; 
import { ref, set, onValue, get } from "firebase/database";

// Define the AttackTracker class to manage attack events and updates
class AttackTracker {
    constructor() {
        // Reference to the attacks data in the database
        this.attacksRef = null;
        // ID of the current player
        this.playerId = null;
        // Array of grid square meshes in the game
        this.gridSquares = [];
        // Constants to adjust positions relative to player and enemy grids
        this.PLAYER_GRID_OFFSET = 150;
        this.ENEMY_GRID_OFFSET = -330;
    }

    // Initialize the AttackTracker with player ID and grid squares
    initialize(playerId, gridSquares) {
        this.playerId = playerId;
        this.gridSquares = gridSquares;
        // Reference to the attacks node in the database
        this.attacksRef = ref(database, 'game/attacks');
        // Ensure the attacks node exists
        this.createAttacksNode();
        // Start listening to attack updates
        this.listenToAttacks();
    }

    // Create the attacks node in the database if it doesn't exist
    async createAttacksNode() {
        const attacksSnapshot = await get(this.attacksRef);
        if (!attacksSnapshot.exists()) {
            await set(this.attacksRef, {
                player_attacks: {}
            });
        }
    }

    // Record an attack made by the player
    async recordAttack(position, isHit) {
        // Prepare the attack data
        const attack = {
            x: position.x - this.ENEMY_GRID_OFFSET, // Adjust X position relative to the enemy grid
            y: position.y,
            z: position.z,
            isHit: isHit,               // Whether the attack was a hit
            timestamp: Date.now(),      // Time of the attack
            attackerId: this.playerId   // ID of the player who made the attack
        };

        // Create a unique key for the attack based on position
        const attackKey = `${attack.x}_${attack.z}`;
        // Store the attack data in the database
        await set(ref(database, `game/attacks/player_attacks/${attackKey}`), attack);
    }

    // Find the grid square that matches the given attack position
    findMatchingGridSquare(position, isOpponentAttack) {
        // Determine which grid to search based on who made the attack
        const targetGridType = isOpponentAttack ? 'player' : 'enemy';
        const gridOffset = isOpponentAttack ? this.PLAYER_GRID_OFFSET : this.ENEMY_GRID_OFFSET;
        
        // Search for the matching grid square
        return this.gridSquares.find(square => {
            // Only consider squares in the correct grid
            if (square.userData.gridType !== targetGridType) return false;
            
            const tolerance = 1; // Tolerance for position matching
            const adjustedX = position.x + gridOffset; // Adjust position based on grid offset
            
            // Check if the square's position matches the attack position
            return Math.abs(square.position.x - adjustedX) < tolerance &&
                   Math.abs(square.position.z - position.z) < tolerance;
        });
    }

    // Listen for attack updates from the database and update the game state
    listenToAttacks() {
        const attacksRef = ref(database, 'game/attacks/player_attacks');
        onValue(attacksRef, (snapshot) => {
            const attacks = snapshot.val();
            if (!attacks) return;

            // Iterate over each attack
            Object.values(attacks).forEach(attack => {
                // Determine if the attack was made by the opponent
                const isOpponentAttack = attack.attackerId !== this.playerId;
                
                // Reconstruct the attack position
                const position = { 
                    x: attack.x,
                    y: attack.y, 
                    z: attack.z 
                };
                
                // Find the corresponding grid square
                const targetSquare = this.findMatchingGridSquare(position, isOpponentAttack);

                if (targetSquare) {
                    // Update the grid square's appearance based on hit or miss
                    targetSquare.visible = true;
                    targetSquare.material.color.setHex(attack.isHit ? 0xff0000 : 0xffffff); // Red for hit, white for miss
                    targetSquare.material.opacity = 0.5;
                }
            });
        });
    }
}

// Export an instance of AttackTracker
export default new AttackTracker();
