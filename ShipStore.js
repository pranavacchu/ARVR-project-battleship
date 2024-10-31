// ShipStore.js
class ShipStore {
    constructor() {
        this.ships = [];
        this.gridSize = 200; // Size of small grid
        this.divisions = 8;
        this.cellSize = this.gridSize / this.divisions;
        this.loadShips();
    }

    // Calculate grid-aligned position
    alignToGrid(position) {
        const halfGrid = this.gridSize / 2;
        const halfCell = this.cellSize / 2;
        
        return {
            x: Math.floor((position.x + halfGrid) / this.cellSize) * this.cellSize - halfGrid + halfCell,
            y: position.y,
            z: Math.floor((position.z + halfGrid) / this.cellSize) * this.cellSize - halfGrid + halfCell
        };
    }

    // Check if position is within grid bounds
    isWithinBounds(position) {
        const halfGrid = this.gridSize / 2;
        return Math.abs(position.x) <= halfGrid && Math.abs(position.z) <= halfGrid;
    }

    // Save ship data to localStorage with proper scaling and positioning
    saveShips(ships) {
        const shipData = ships.map(ship => {
            const alignedPos = this.alignToGrid(ship.position);
            
            return {
                modelPath: ship.userData.modelPath,
                position: {
                    x: alignedPos.x,
                    y: 0.5, // Slightly above water
                    z: alignedPos.z
                },
                rotation: {
                    x: 0,
                    y: Math.PI * Math.round(ship.rotation.y / Math.PI), // Snap to 90-degree rotations
                    z: 0
                },
                scale: {
                    x: this.cellSize / 30, // Scale relative to cell size
                    y: this.cellSize / 30,
                    z: this.cellSize / 30
                }
            };
        });
        localStorage.setItem('battleshipData', JSON.stringify(shipData));
    }

    loadShips() {
        const shipData = localStorage.getItem('battleshipData');
        return shipData ? JSON.parse(shipData) : [];
    }

    getShips() {
        return this.loadShips();
    }

    clearShips() {
        localStorage.removeItem('battleshipData');
    }
}

export default new ShipStore();