import { database } from './firebaseConfig.js';
import { ref, set, get, onValue, onDisconnect, remove, update } from "firebase/database";
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
        let playerId = localStorage.getItem('playerId');
        if (playerId) {
            console.log('Existing Player ID:', playerId);
            return playerId;
        } else {
            playerId = `player_${Date.now()}`;
            localStorage.setItem('playerId', playerId);
            console.log('New Player ID:', playerId);
            return playerId;
        }
    }


    async initialize() {
        if (this.isInitialized) return;

        // Store playerId in localStorage to maintain identity across pages
        localStorage.setItem('playerId', this.playerId);
        ShipStore.setPlayerId(this.playerId);

        // Get current game data
        const gameData = await this.getCurrentPlayers();
        const players = gameData.players || {};

        // If player already exists, update their status and page
        if (players[this.playerId]) {
            await this.updatePlayerPage(window.location.pathname);
            this.isInitialized = true;
            return true;
        }

        // Define active threshold (e.g., 10 seconds)
        const ACTIVE_THRESHOLD = 10000; // 10 seconds
        const now = Date.now();

        // Filter active players
        const activePlayers = Object.fromEntries(
            Object.entries(players).filter(([playerId, playerData]) => {
                return (now - playerData.timestamp) < ACTIVE_THRESHOLD;
            })
        );

        // Check player count
        if (Object.keys(activePlayers).length >= 3) {
            alert("Game is full. Please try again later.");
            return false;
        }

        // Add player to the game
        try {
            await set(this.playerRef, {
                joined: true,
                timestamp: now,
                currentPage: window.location.pathname
            });

            // Set up disconnect cleanup
            await onDisconnect(this.playerRef).remove().then(() => {
                clearInterval(this.heartbeatInterval);
            });

            // Start heartbeat to update timestamp regularly
            this.startHeartbeat();

            this.isInitialized = true;
            this.setupPageTracking();
            return true;
        } catch (error) {
            console.error("Error initializing player:", error);
            return false;
        }
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.updatePlayerTimestamp();
        }, 5000); // Update every 5 seconds
    }
    async updatePlayerTimestamp() {
        if (!this.isInitialized) return;

        try {
            await update(this.playerRef, { timestamp: Date.now() });
        } catch (error) {
            console.error("Error updating player timestamp:", error);
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
        history.pushState = function () {
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
    // Set player's ready status
    async setPlayerReady(readyStatus) {
        if (!this.isInitialized) return;

        try {
            await update(this.playerRef, { ready: readyStatus });
        } catch (error) {
            console.error("Error updating player ready status:", error);
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