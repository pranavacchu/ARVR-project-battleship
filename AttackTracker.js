import { database } from './firebaseConfig.js';
import { ref, set, onValue, get } from "firebase/database";


class AttackTracker {
    constructor() {
        this.attacksRef = null;
        this.playerId = null;
        this.gridSquares = [];
        this.PLAYER_GRID_OFFSET = 150;
        this.ENEMY_GRID_OFFSET = -330;
    }

    initialize(playerId, gridSquares) {
        this.playerId = playerId;
        this.gridSquares = gridSquares;
        this.attacksRef = ref(database, 'game/attacks');
        this.createAttacksNode();
        this.listenToAttacks();
    }

    async createAttacksNode() {
        const attacksSnapshot = await get(this.attacksRef);
        if (!attacksSnapshot.exists()) {
            await set(this.attacksRef, {
                player_attacks: {}
            });
        }
    }

    async recordAttack(position, isHit) {
        const attack = {
            x: position.x - this.ENEMY_GRID_OFFSET,
            y: position.y,
            z: position.z,
            isHit: isHit,
            timestamp: Date.now(),
            attackerId: this.playerId
        };

        const attackKey = `${attack.x}_${attack.z}`;
        await set(ref(database, `game/attacks/player_attacks/${attackKey}`), attack);
    }

    findMatchingGridSquare(position, isOpponentAttack) {
        const targetGridType = isOpponentAttack ? 'player' : 'enemy';
        const gridOffset = isOpponentAttack ? this.PLAYER_GRID_OFFSET : this.ENEMY_GRID_OFFSET;
        
        return this.gridSquares.find(square => {
            // Only look for squares in the correct grid
            if (square.userData.gridType !== targetGridType) return false;
            
            const tolerance = 1;
            const adjustedX = position.x + gridOffset;
            
            return Math.abs(square.position.x - adjustedX) < tolerance &&
                   Math.abs(square.position.z - position.z) < tolerance;
        });
    }

    listenToAttacks() {
        const attacksRef = ref(database, 'game/attacks/player_attacks');
        onValue(attacksRef, (snapshot) => {
            const attacks = snapshot.val();
            if (!attacks) return;

            Object.values(attacks).forEach(attack => {
                const isOpponentAttack = attack.attackerId !== this.playerId;
                
                const position = { 
                    x: attack.x,
                    y: attack.y, 
                    z: attack.z 
                };
                
                const targetSquare = this.findMatchingGridSquare(position, isOpponentAttack);

                if (targetSquare) {
                    targetSquare.visible = true;
                    targetSquare.material.color.setHex(attack.isHit ? 0xff0000 : 0xffffff);
                    targetSquare.material.opacity = 0.5;
                }
            });
        });
    }
}

export default new AttackTracker();