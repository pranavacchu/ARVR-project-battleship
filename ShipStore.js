// ShipStore.js
import { database } from './firebaseConfig.js';
import { ref, set, get } from "firebase/database";
import gameManager from './gameManager.js';

class ShipStore {
    constructor() {
        this.ships = [];
        this.playerId = localStorage.getItem('playerId') || null;
    }

    // Save ship data to both localStorage and Firebase
    async saveShips(ships) {
        try {
            // Prepare ship data
            const shipData = ships.map(ship => ({
                modelPath: ship.userData.modelPath,
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

            // Save to localStorage
            localStorage.setItem('battleshipData', JSON.stringify(shipData));

            // Save to Firebase if we have a playerId
            if (this.playerId) {
                await gameManager.saveShipCoordinates(this.playerId, shipData);
            }

            return true;
        } catch (error) {
            console.error("Error saving ships:", error);
            return false;
        }
    }

    // Load ships from localStorage and Firebase
    async getShips() {
        try {
            // If we have a playerId, try to get from Firebase first
            if (this.playerId) {
                const shipData = await gameManager.getShipCoordinates(this.playerId);
                if (shipData.length > 0) {
                    return shipData;
                }
            }

            // Fall back to localStorage
            const localShipData = localStorage.getItem('battleshipData');
            return localShipData ? JSON.parse(localShipData) : [];
        } catch (error) {
            console.error("Error loading ships:", error);
            // If all else fails, return empty array
            return [];
        }
    }

    // Clear stored ship data from both localStorage and Firebase
    async clearShips() {
        try {
            localStorage.removeItem('battleshipData');
            
            if (this.playerId) {
                await gameManager.clearShipCoordinates(this.playerId);
            }
            return true;
        } catch (error) {
            console.error("Error clearing ships:", error);
            return false;
        }
    }

    setPlayerId(id) {
        this.playerId = id;
        localStorage.setItem('playerId', id);
    }
}

export default new ShipStore();