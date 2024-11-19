// Import the Firebase database configuration
import { database } from './firebaseConfig.js';

// Import necessary Firebase database functions
import { ref, set, get, onValue } from "firebase/database";

class TurnBasedManager {
    constructor() {
        // Reference to the game state in the Firebase database
        this.gameStateRef = ref(database, 'game/state');
        
        // Reference to the current turn in the Firebase database
        this.turnRef = ref(database, 'game/currentTurn');
        
        // Unique identifier for the player
        this.playerId = null;
        
        // DOM element to display turn messages to the player
        this.turnMessageElement = null;
        
        // Boolean indicating if it's the player's turn
        this.isMyTurn = false;
        
        // Set to keep track of clicked squares to prevent repeated clicks
        this.clickedSquares = new Set();
    }

    async initialize(playerId) {
        // Set the player's unique identifier
        this.playerId = playerId;
        
        // Create the turn message DOM element
        this.createTurnMessage();
        
        // Get the current game state from the database
        const gameState = await get(this.gameStateRef);
        
        if (!gameState.exists()) {
            // If no game state exists, this is the first player; initialize game state
            await set(this.gameStateRef, {
                firstPlayer: playerId,
                secondPlayer: null,
                gameStarted: false
            });
        } else {
            // Game state exists
            const state = gameState.val();
            if (!state.secondPlayer && state.firstPlayer !== playerId) {
                // If there is no second player and the current player is not the first player,
                // set the second player and start the game
                await set(this.gameStateRef, {
                    ...state,
                    secondPlayer: playerId,
                    gameStarted: true
                });
                // Set the current turn to the first player
                await set(this.turnRef, state.firstPlayer);
            }
        }

        // Start listening to turn changes
        this.listenToTurns();
    }

    createTurnMessage() {
        // Create a new div element to display turn messages
        this.turnMessageElement = document.createElement('div');
        
        // Style the turn message element
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
        
        // Add Russo One font by creating a link element and appending it to the head
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        
        // Append the turn message element to the body
        document.body.appendChild(this.turnMessageElement);
    }

    listenToTurns() {
        // Listen for changes to the current turn in the database
        onValue(this.turnRef, (snapshot) => {
            const currentTurn = snapshot.val();
            // Determine if it's the player's turn
            this.isMyTurn = currentTurn === this.playerId;
            
            if (this.isMyTurn) {
                // Update the turn message to indicate it's the player's turn
                this.turnMessageElement.textContent = "YOUR TURN";
                this.turnMessageElement.style.background = 'linear-gradient(to bottom, #4ade80, #22c55e)';  // Modern green shade
                this.turnMessageElement.style.webkitBackgroundClip = 'text';
                this.turnMessageElement.style.backgroundClip = 'text';
                this.turnMessageElement.style.color = 'transparent';
                this.turnMessageElement.style.textShadow = '0 0 12px rgba(74, 222, 128, 0.4)';
                this.turnMessageElement.style.animation = 'pulse 2s infinite';
            } else {
                // Update the turn message to indicate it's the opponent's turn
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
        // Check if it's the player's turn
        if (!this.isMyTurn) {
            console.log("Not your turn!");
            return false;
        }

        // Create a unique key for the clicked position
        const posKey = `${position.x},${position.z}`;
        
        // Check if the square has already been clicked
        if (this.clickedSquares.has(posKey)) {
            console.log("Square already clicked!");
            return false;
        }

        // Add the position to the set of clicked squares
        this.clickedSquares.add(posKey);

        // Get the current game state from the database
        const gameState = (await get(this.gameStateRef)).val();
        
        // Determine the next player's turn
        const nextTurn = this.playerId === gameState.firstPlayer ? 
            gameState.secondPlayer : gameState.firstPlayer;
        
        // Update the turn in the database
        await set(this.turnRef, nextTurn);

        return true;
    }

    // Method to check if the player can perform a click action
    canClick() {
        return this.isMyTurn;
    }
}

// Export an instance of the TurnBasedManager class as the default export
export default new TurnBasedManager();
