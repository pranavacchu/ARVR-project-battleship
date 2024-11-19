// ShipStore.js

// Import necessary modules from Firebase and local modules
import { database } from './firebaseConfig.js';
import { ref, set, get } from "firebase/database";
import gameManager from './gameManager.js';

// Define the ShipStore class to manage ship data storage and retrieval
class ShipStore {
    constructor() {
        this.ships = []; // Array to hold ship data
        // Retrieve the player ID from localStorage or set to null if not found
        this.playerId = localStorage.getItem('playerId') || null;
    }

    // Method to save ship data to both localStorage and Firebase
    async saveShips(ships) {
        try {
            // Prepare ship data by extracting necessary properties
            const shipData = ships.map(ship => ({
                modelPath: ship.userData.modelPath, // Path to the ship model
                position: {
                    x: ship.position.x,
                    y: ship.position.y,
                    z: ship.position.z
                },
                rotation: {
                    x: ship.rotation.x,
                    y: ship.rotation.y,
                    z: ship.rotation.z
                },
                scale: {
                    x: ship.scale.x,
                    y: ship.scale.y,
                    z: ship.scale.z
                }
            }));

            // Save ship data to localStorage as a JSON string
            localStorage.setItem('battleshipData', JSON.stringify(shipData));

            // If a player ID exists, save ship data to Firebase
            if (this.playerId) {
                await gameManager.saveShipCoordinates(this.playerId, shipData);
            }

            return true; // Indicate success
        } catch (error) {
            console.error("Error saving ships:", error); // Log any errors
            return false; // Indicate failure
        }
    }

    // Method to load ships from localStorage and Firebase
    async getShips() {
        try {
            // If a player ID exists, attempt to load ship data from Firebase
            if (this.playerId) {
                const shipData = await gameManager.getShipCoordinates(this.playerId);
                if (shipData.length > 0) {
                    return shipData; // Return ship data from Firebase if available
                }
            }

            // Fall back to localStorage if Firebase data is not available
            const localShipData = localStorage.getItem('battleshipData');
            return localShipData ? JSON.parse(localShipData) : []; // Parse and return data or an empty array
        } catch (error) {
            console.error("Error loading ships:", error); // Log any errors
            return []; // Return an empty array if an error occurs
        }
    }

    // Method to clear stored ship data from both localStorage and Firebase
    async clearShips() {
        try {
            // Remove ship data from localStorage
            localStorage.removeItem('battleshipData');
            
            // If a player ID exists, clear ship data from Firebase
            if (this.playerId) {
                await gameManager.clearShipCoordinates(this.playerId);
            }
            return true; // Indicate success
        } catch (error) {
            console.error("Error clearing ships:", error); // Log any errors
            return false; // Indicate failure
        }
    }

    // Method to set the player ID and store it in localStorage
    setPlayerId(id) {
        this.playerId = id; // Update the player ID
        localStorage.setItem('playerId', id); // Save the player ID to localStorage
    }
}

// Export an instance of ShipStore as the default export
export default new ShipStore();
