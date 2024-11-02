// ShipStore.js
class ShipStore {
    constructor() {
        this.ships = [];
        this.loadShips();
    }

    // Save ship data to localStorage
    saveShips(ships) {
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
        localStorage.setItem('battleshipData', JSON.stringify(shipData));
    }

    // Load ships from localStorage
    loadShips() {
        const shipData = localStorage.getItem('battleshipData');
        return shipData ? JSON.parse(shipData) : [];
    }

    // Get stored ship data
    getShips() {
        return this.loadShips();
    }

    // Clear stored ship data
    clearShips() {
        localStorage.removeItem('battleshipData');
    }
}

export default new ShipStore();