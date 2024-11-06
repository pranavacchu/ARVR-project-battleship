// gameManager.js
import { database } from './firebaseConfig.js';
import { ref, onValue, set, get, onDisconnect } from "firebase/database";

class GameManager {
    constructor() {
        this.playerId = localStorage.getItem('playerId') || `player_${Date.now()}`;
        this.gameRef = ref(database, "game/players");
        this.playerRef = ref(database, `game/players/${this.playerId}`);
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        // Store playerId in localStorage to maintain identity across pages
        localStorage.setItem('playerId', this.playerId);

        // Check if player already exists (page refresh/navigation)
        const snapshot = await get(this.gameRef);
        const players = snapshot.val() || {};
        
        // If player already exists, just return
        if (players[this.playerId]) {
            this.isInitialized = true;
            return true;
        }

        // Check player count
        const playerCount = Object.keys(players).length;
        if (playerCount >= 2) {
            alert("Game is full. Please try again later.");
            return false;
        }

        // Add player to the game
        try {
            await set(this.playerRef, {
                joined: true,
                timestamp: Date.now(),
                currentPage: window.location.pathname
            });

            // Set up disconnect cleanup
            await onDisconnect(this.playerRef).remove();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Error initializing player:", error);
            return false;
        }
    }

    // Update player's current page
    async updatePlayerPage(page) {
        if (!this.isInitialized) return;
        
        try {
            await set(this.playerRef, {
                joined: true,
                timestamp: Date.now(),
                currentPage: page
            });
        } catch (error) {
            console.error("Error updating player page:", error);
        }
    }

    // Listen for player changes
    onPlayersChange(callback) {
        onValue(this.gameRef, (snapshot) => {
            const players = snapshot.val() || {};
            callback(players);
        });
    }
}

// Create singleton instance
const gameManager = new GameManager();
export default gameManager;