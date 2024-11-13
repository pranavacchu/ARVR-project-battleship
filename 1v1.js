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
        this.createTurnMessage();
        
        const gameState = await get(this.gameStateRef);
        if (!gameState.exists()) {
            await set(this.gameStateRef, {
                firstPlayer: playerId,
                secondPlayer: null,
                gameStarted: false
            });
        } else {
            const state = gameState.val();
            if (!state.secondPlayer && state.firstPlayer !== playerId) {
                await set(this.gameStateRef, {
                    ...state,
                    secondPlayer: playerId,
                    gameStarted: true
                });
                await set(this.turnRef, state.firstPlayer);
            }
        }

        this.listenToTurns();
    }

    createTurnMessage() {
        this.turnMessageElement = document.createElement('div');
        this.turnMessageElement.style.position = 'fixed';
        this.turnMessageElement.style.top = '40px';  // Moved higher up
        this.turnMessageElement.style.left = '50%';
        this.turnMessageElement.style.transform = 'translateX(-50%)';
        this.turnMessageElement.style.fontFamily = "'Russo One', sans-serif";  // Changed font
        this.turnMessageElement.style.fontSize = '34px';
        this.turnMessageElement.style.fontWeight = '600';
        this.turnMessageElement.style.textTransform = 'uppercase';
        this.turnMessageElement.style.letterSpacing = '3px';
        this.turnMessageElement.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
        this.turnMessageElement.style.zIndex = '1000';
        this.turnMessageElement.style.transition = 'all 0.3s ease';
        
        
        // Add Russo One font
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        
        document.body.appendChild(this.turnMessageElement);
    }

    listenToTurns() {
        onValue(this.turnRef, (snapshot) => {
            const currentTurn = snapshot.val();
            this.isMyTurn = currentTurn === this.playerId;
            
            if (this.isMyTurn) {
                this.turnMessageElement.textContent = "YOUR TURN";
                this.turnMessageElement.style.background = 'linear-gradient(to bottom, #4ade80, #22c55e)';  // Modern green shade
                this.turnMessageElement.style.webkitBackgroundClip = 'text';
                this.turnMessageElement.style.backgroundClip = 'text';
                this.turnMessageElement.style.color = 'transparent';
                this.turnMessageElement.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.4)';
                this.turnMessageElement.style.animation = 'pulse 2s infinite';
            } else {
                this.turnMessageElement.textContent = "ENEMY'S TURN";
                this.turnMessageElement.style.background = 'linear-gradient(to bottom, #ef4444, #dc2626)';  // Modern red shade
                this.turnMessageElement.style.webkitBackgroundClip = 'text';
                this.turnMessageElement.style.backgroundClip = 'text';
                this.turnMessageElement.style.color = 'transparent';
                this.turnMessageElement.style.textShadow = '0 0 12px rgba(239, 68, 68, 0.4)';
            }
        });
    

        // Add keyframe animation for pulse effect
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
                100% { transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
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

        this.clickedSquares.add(posKey);

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