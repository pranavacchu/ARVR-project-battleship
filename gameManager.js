// Import necessary modules and functions from Firebase and local modules
import { database } from './firebaseConfig.js';
import { ref, set, get, onValue, onDisconnect, remove, update } from "firebase/database";
import ShipStore from './ShipStore.js';

// Define the GameManager class to handle game state and player interactions
class GameManager {
    constructor() {
        // Get or generate a unique player ID
        this.playerId = this.getPlayerId();

        // References to Firebase database paths
        this.gameRef = ref(database, "game");
        this.playerRef = ref(database, `game/players/${this.playerId}`);
        this.shipsRef = ref(database, `game/ships/${this.playerId}`);
        this.isInitialized = false;

        // Add event listeners for page load and navigation changes
        window.addEventListener('load', () => this.handlePageChange());
        window.addEventListener('popstate', () => this.handlePageChange());
    }

    // Method to retrieve an existing player ID or generate a new one
    getPlayerId() {
        let playerId = localStorage.getItem('playerId');
        if (playerId) {
            console.log('Existing Player ID:', playerId);
            return playerId;
        } else {
            // Generate a new player ID based on the current timestamp
            playerId = `player_${Date.now()}`;
            localStorage.setItem('playerId', playerId);
            console.log('New Player ID:', playerId);
            return playerId;
        }
    }

    // Asynchronous method to initialize the game manager
    async initialize() {
        if (this.isInitialized) return;

        // Store playerId in localStorage to maintain identity across pages
        localStorage.setItem('playerId', this.playerId);
        ShipStore.setPlayerId(this.playerId);

        // Get current game data from Firebase
        const gameData = await this.getCurrentPlayers();
        const players = gameData.players || {};

        // If player already exists, update their status and page
        if (players[this.playerId]) {
            await this.updatePlayerPage(window.location.pathname);
            this.isInitialized = true;
            return true;
        }

        // Define active threshold (e.g., 10 seconds) to filter out inactive players
        const ACTIVE_THRESHOLD = 10000; // 10 seconds
        const now = Date.now();

        // Filter active players based on the timestamp
        const activePlayers = Object.fromEntries(
            Object.entries(players).filter(([playerId, playerData]) => {
                return (now - playerData.timestamp) < ACTIVE_THRESHOLD;
            })
        );

        // Check if the maximum player count has been reached
        if (Object.keys(activePlayers).length >= 3) {
            alert("Game is full. Please try again later.");
            return false;
        }

        // Add the player to the game in Firebase
        try {
            await set(this.playerRef, {
                joined: true,
                timestamp: now,
                currentPage: window.location.pathname
            });

            // Set up disconnect cleanup to remove player data when they disconnect
            await onDisconnect(this.playerRef).remove().then(() => {
                clearInterval(this.heartbeatInterval);
            });

            // Start a heartbeat to update the player's timestamp regularly
            this.startHeartbeat();

            this.isInitialized = true;
            this.setupPageTracking();
            return true;
        } catch (error) {
            console.error("Error initializing player:", error);
            return false;
        }
    }

    // Method to start a heartbeat interval to keep the player's session active
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.updatePlayerTimestamp();
        }, 5000); // Update every 5 seconds
    }

    // Asynchronous method to update the player's timestamp in Firebase
    async updatePlayerTimestamp() {
        if (!this.isInitialized) return;

        try {
            await update(this.playerRef, { timestamp: Date.now() });
        } catch (error) {
            console.error("Error updating player timestamp:", error);
        }
    }

    // Update the player's current page in Firebase
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

    // Handle page changes by updating the player's current page
    async handlePageChange() {
        const currentPage = window.location.pathname;
        await this.updatePlayerPage(currentPage);
    }

    // Setup page tracking to monitor navigation changes using the history API
    setupPageTracking() {
        // Override the default pushState method
        const originalPushState = history.pushState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            this.handlePageChange();
        }.bind(this);
    }

    // Listen for changes in the game data (e.g., player join/leave)
    onPlayersChange(callback) {
        onValue(this.gameRef, (snapshot) => {
            const players = snapshot.val() || {};
            callback(players);
        });
    }

    // Asynchronous method to get the current players from Firebase
    async getCurrentPlayers() {
        const snapshot = await get(this.gameRef);
        return snapshot.val() || {};
    }

    // Save ship coordinates to Firebase for the player
    async saveShipCoordinates(playerId, ships) {
        try {
            // Save the ships data to Firebase
            await set(this.shipsRef, ships);
            return true;
        } catch (error) {
            console.error("Error saving ships:", error);
            return false;
        }
    }

    // Set the player's ready status in Firebase
    async setPlayerReady(readyStatus) {
        if (!this.isInitialized) return;

        try {
            await update(this.playerRef, { ready: readyStatus });
        } catch (error) {
            console.error("Error updating player ready status:", error);
        }
    }

    // Load ship coordinates from Firebase for the player
    async getShipCoordinates(playerId) {
        try {
            // Retrieve the ships data from Firebase
            const snapshot = await get(this.shipsRef);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            return [];
        } catch (error) {
            console.error("Error loading ships:", error);
            // If an error occurs, return an empty array
            return [];
        }
    }

    // Clear stored ship coordinates from Firebase for the player
    async clearShipCoordinates(playerId) {
        try {
            // Remove the ships data from Firebase
            await set(this.shipsRef, null);
            return true;
        } catch (error) {
            console.error("Error clearing ships:", error);
            return false;
        }
    }
}

// Create a singleton instance of the GameManager class
const gameManager = new GameManager();
export default gameManager;
