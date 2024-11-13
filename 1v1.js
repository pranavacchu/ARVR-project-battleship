import { database } from './firebaseConfig.js';
import { ref, set, get, onValue } from "firebase/database";

class TurnBasedManager {
    constructor() {
        this.gameStateRef = ref(database, 'game/state');
        this.turnRef = ref(database, 'game/currentTurn');
        this.playerId = null;
        this.turnMessageElement = null;
        this.isMyTurn = false;
        this.clickedSquares = new Set();
    }

    async initialize(playerId) {
        this.playerId = playerId;
        
        // Create turn message element
        this.createTurnMessage();
        
        // Initialize game state if not exists
        const gameState = await get(this.gameStateRef);
        if (!gameState.exists()) {
            // First player joins
            await set(this.gameStateRef, {
                firstPlayer: playerId,
                secondPlayer: null,
                gameStarted: false
            });
        } else {
            const state = gameState.val();
            if (!state.secondPlayer && state.firstPlayer !== playerId) {
                // Second player joins
                await set(this.gameStateRef, {
                    ...state,
                    secondPlayer: playerId,
                    gameStarted: true
                });
                // Initialize turn to first player
                await set(this.turnRef, state.firstPlayer);
            }
        }

        // Listen for turn changes
        this.listenToTurns();
    }

    createTurnMessage() {
        // Create turn message element
        this.turnMessageElement = document.createElement('div');
        this.turnMessageElement.style.position = 'fixed';
        this.turnMessageElement.style.top = '80px';
        this.turnMessageElement.style.left = '50%';
        this.turnMessageElement.style.transform = 'translateX(-50%)';
        this.turnMessageElement.style.padding = '10px 20px';
        this.turnMessageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.turnMessageElement.style.color = 'white';
        this.turnMessageElement.style.borderRadius = '5px';
        this.turnMessageElement.style.fontFamily = 'Impact, Arial, sans-serif';
        this.turnMessageElement.style.fontSize = '24px';
        this.turnMessageElement.style.zIndex = '1000';
        document.body.appendChild(this.turnMessageElement);
    }

    listenToTurns() {
        onValue(this.turnRef, (snapshot) => {
            const currentTurn = snapshot.val();
            this.isMyTurn = currentTurn === this.playerId;
            
            if (this.isMyTurn) {
                this.turnMessageElement.textContent = "YOUR TURN";
                this.turnMessageElement.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
            } else {
                this.turnMessageElement.textContent = "ENEMY'S TURN";
                this.turnMessageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
            }
        });
    }

    async handleSquareClick(position) {
        if (!this.isMyTurn) {
            console.log("Not your turn!");
            return false;
        }

        const posKey = `${position.x},${position.z}`;
        if (this.clickedSquares.has(posKey)) {
            console.log("Square already clicked!");
            return false;
        }

        // Mark square as clicked
        this.clickedSquares.add(posKey);

        // Switch turn to other player
        const gameState = (await get(this.gameStateRef)).val();
        const nextTurn = this.playerId === gameState.firstPlayer ? 
            gameState.secondPlayer : gameState.firstPlayer;
        await set(this.turnRef, nextTurn);

        return true;
    }

    canClick() {
        return this.isMyTurn;
    }
}

export default new TurnBasedManager();