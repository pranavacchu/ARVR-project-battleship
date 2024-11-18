import { ref, onValue, set } from "firebase/database"; 
import { database } from './firebaseConfig.js';

class ScoreTracker {
    constructor() {
        this.destroyedShips = 0;
        this.totalShips = 5;
        this.scoreElement = null;
        this.shipStatuses = new Map();
        this.initializeScoreDisplay();
    }

    initializeScoreDisplay() {
        // Create the main container
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'score-container';
        
        // Create ship icon
        const shipIcon = document.createElement('div');
        shipIcon.className = 'ship-icon';
        shipIcon.innerHTML = `
            <svg viewBox="0 0 64 64" width="32" height="32">
                <path d="M2 32h6l2-6h6l2 6h8l2-6h6l2 6h8l2-6h6l2 6h6v6h-6l-2 6h-6l-2-6h-8l-2 6h-6l-2-6h-8l-2 6h-6l-2-6H2v-6z" fill="#004E89"/>
            </svg>
        `;

        // Create the score text container
        this.scoreElement = document.createElement('div');
        this.scoreElement.className = 'score-text';
        this.updateScoreDisplay();

        // Assemble the container
        scoreContainer.appendChild(shipIcon);
        scoreContainer.appendChild(this.scoreElement);
        document.body.appendChild(scoreContainer);

        // Add the CSS
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');

            .score-container {
                position: fixed;
                top: 20px;
                left: 20px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
                z-index: 1000;
            }

            .ship-icon {
                color: #004E89;
                display: flex;
                align-items: center;
                animation: iconPulse 2s ease-in-out infinite;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                margin-top: 3px;
            }

            @keyframes iconPulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.1); opacity: 1; }
            }

            .score-text {
                font-family: 'Orbitron', sans-serif;
                font-size: 18px;
                font-weight: 1200;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                background: linear-gradient(135deg, #002855 0%, #004E89 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                animation: textFloat 4s ease-in-out infinite;
                display: flex;
                flex-direction: column;
                line-height: 1.4;
            }

            @keyframes textFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
            }

            @media (max-width: 768px) {
                .score-container {
                    top: 10px;
                    left: 10px;
                }

                .score-text {
                    font-size: 16px;
                }

                .ship-icon svg {
                    width: 24px;
                    height: 24px;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    updateScoreDisplay() {
        if (this.scoreElement) {
            this.scoreElement.innerHTML = `Enemy Ships Destroyed: ${this.destroyedShips}<br>Remaining: ${this.totalShips - this.destroyedShips}`;
        }
    }

    incrementDestroyedShips() {
        this.destroyedShips++;
        this.updateScoreDisplay();
        const scoresRef = ref(database, `game/scores/${this.playerId}`);
        set(scoresRef, {
            destroyedShips: this.destroyedShips
        });
    }

    checkShipDestroyed(ship) {
        const shipId = ship.uuid;
        if (!this.shipStatuses.has(shipId)) {
            this.shipStatuses.set(shipId, true);
            this.incrementDestroyedShips();
            return true;
        }
        return false;
    }
}

export default new ScoreTracker();
