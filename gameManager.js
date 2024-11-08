import { database } from './firebaseConfig.js';
import { ref, set, get, onValue, onDisconnect, remove } from "firebase/database";
import ShipStore from './ShipStore.js';

class GameManager {
    constructor() {
        this.playerId = this.getPlayerId();
        this.gameRef = ref(database, "game");
        this.playerRef = ref(database, `game/players/${this.playerId}`);
        this.shipsRef = ref(database, `game/ships/${this.playerId}`);
        this.isInitialized = false;
        
        // Add page change listener
        window.addEventListener('load', () => this.handlePageChange());
        window.addEventListener('popstate', () => this.handlePageChange());
    }

    getPlayerId() {
        return localStorage.getItem('playerId') || `player_${Date.now()}`;
    }

    async initialize() {
        if (this.isInitialized) return;

        // Store playerId in localStorage to maintain identity across pages
        localStorage.setItem('playerId', this.playerId);
        ShipStore.setPlayerId(this.playerId);

        // Check if player already exists (page refresh/navigation)
        const players = await this.getCurrentPlayers();
        
        // If player already exists, update their status and page
        if (players[this.playerId]) {
            await this.updatePlayerPage(window.location.pathname);
            this.isInitialized = true;
            return true;
        }

        // Check player count
        if (Object.keys(players).length >= 2) {
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
            this.setupPageTracking();
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

    // Handle page changes
    async handlePageChange() {
        const currentPage = window.location.pathname;
        await this.updatePlayerPage(currentPage);
    }

    // Setup page tracking
    setupPageTracking() {
        // Update page on navigation using history API
        const originalPushState = history.pushState;
        history.pushState = function() {
            originalPushState.apply(this, arguments);
            this.handlePageChange();
        }.bind(this);
    }

    // Listen for player changes
    onPlayersChange(callback) {
        onValue(this.gameRef, (snapshot) => {
            const players = snapshot.val() || {};
            callback(players);
        });
    }

    // Get current players
    async getCurrentPlayers() {
        const snapshot = await get(this.gameRef);
        return snapshot.val() || {};
    }

    // Save ship coordinates
    async saveShipCoordinates(playerId, ships) {
        try {
            // Save to Firebase
            await set(this.shipsRef, ships);
            return true;
        } catch (error) {
            console.error("Error saving ships:", error);
            return false;
        }
    }

    // Load ship coordinates
    async getShipCoordinates(playerId) {
        try {
            // Load from Firebase
            const snapshot = await get(this.shipsRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return [];
        } catch (error) {
            console.error("Error loading ships:", error);
            // If all else fails, return empty array
            return [];
        }
    }

    // Clear stored ship coordinates
    async clearShipCoordinates(playerId) {
        try {
            // Clear from Firebase
            await set(this.shipsRef, null);
            return true;
        } catch (error) {
            console.error("Error clearing ships:", error);
            return false;
        }
    }
}

// Create singleton instance
const gameManager = new GameManager();
export default gameManager;