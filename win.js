import { database } from './firebaseConfig.js';
import { ref, set, onValue, get } from "firebase/database";

class WinCondition {
    constructor() {
        this.TOTAL_HIT_SQUARES = 17;
        this.messageContainer = null;
        this.initialized = false;
        this.gameOver = false;
    }

    initialize(playerId) {
        if (this.initialized) return;

        this.playerId = playerId;
        this.gameStateRef = ref(database, 'game/state');
        this.hitsRef = ref(database, `game/hits/${this.playerId}`);

        this.createMessageContainer();
        this.initializeHitCounter();
        this.listenToHits();

        this.initialized = true;
    }

    createMessageContainer() {
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.position = 'fixed';
        this.messageContainer.style.top = '50%';
        this.messageContainer.style.left = '50%';
        this.messageContainer.style.transform = 'translate(-50%, -50%)';
        this.messageContainer.style.padding = '4rem 8rem';
        this.messageContainer.style.borderRadius = '20px';
        this.messageContainer.style.color = '#E8F0F8';
        this.messageContainer.style.fontFamily = '"Industry", "Orbitron", "Roboto", sans-serif';
        this.messageContainer.style.fontSize = '4rem';
        this.messageContainer.style.fontWeight = '900';
        this.messageContainer.style.textAlign = 'center';
        this.messageContainer.style.zIndex = '1000';
        this.messageContainer.style.display = 'none';
        this.messageContainer.style.letterSpacing = '4px';
        this.messageContainer.style.backdropFilter = 'blur(15px)';
        this.messageContainer.style.WebkitBackdropFilter = 'blur(15px)';
        this.messageContainer.style.boxShadow = '0 8px 32px rgba(0, 24, 48, 0.5)';
        this.messageContainer.style.border = '1px solid rgba(120, 200, 255, 0.15)';
        this.messageContainer.style.textTransform = 'uppercase';

        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');

            @keyframes fadeIn {
                from { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.95);
                }
                to { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1);
                }
            }
    
            @keyframes battleshipGradient {
                0% {
                    background: linear-gradient(135deg, 
                        rgba(32, 147, 184, 0.95), 
                        rgba(0, 32, 64, 0.95)
                    );
                    box-shadow: 0 8px 32px rgba(0, 48, 96, 0.4);
                }
                50% {
                    background: linear-gradient(135deg, 
                        rgba(48, 164, 200, 0.95), 
                        rgba(8, 48, 88, 0.95)
                    );
                    box-shadow: 0 8px 32px rgba(0, 64, 128, 0.5);
                }
                100% {
                    background: linear-gradient(135deg, 
                        rgba(32, 147, 184, 0.95), 
                        rgba(0, 32, 64, 0.95)
                    );
                    box-shadow: 0 8px 32px rgba(0, 48, 96, 0.4);
                }
            }
    
            @keyframes textGlow {
                0% { 
                    text-shadow: 0 0 20px rgba(120, 200, 255, 0.8),
                                0 4px 8px rgba(0, 0, 0, 0.4);
                }
                50% { 
                    text-shadow: 0 0 30px rgba(120, 200, 255, 1),
                                0 0 50px rgba(32, 147, 184, 0.6),
                                0 4px 8px rgba(0, 0, 0, 0.4);
                }
                100% { 
                    text-shadow: 0 0 20px rgba(120, 200, 255, 0.8),
                                0 4px 8px rgba(0, 0, 0, 0.4);
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.messageContainer);
    }

    async initializeHitCounter() {
        const snapshot = await get(this.hitsRef);
        if (!snapshot.exists()) {
            await set(this.hitsRef, 0);
        }
    }

    listenToHits() {
        onValue(ref(database, 'game/hits'), (snapshot) => {
            const hitsData = snapshot.val() || {};

            const winningPlayer = Object.entries(hitsData).find(([_, hits]) => hits >= this.TOTAL_HIT_SQUARES);

            if (winningPlayer) {
                this.showEndGameMessage(winningPlayer[0] === this.playerId);
            }
        });
    }

    async incrementHits() {
        const snapshot = await get(this.hitsRef);
        const currentHits = snapshot.val() || 0;
        await set(this.hitsRef, currentHits + 1);

        if (currentHits + 1 >= this.TOTAL_HIT_SQUARES) {
            this.showEndGameMessage(true);
            return true;
        }
        return false;
    }

    showEndGameMessage(isWinner) {
        if (this.gameOver) return; // Add this line to prevent multiple calls
        this.gameOver = true; // Add this line to set the flag
        this.messageContainer.style.display = 'block';
        this.messageContainer.style.animation = 'fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards';

        if (isWinner) {
            this.messageContainer.textContent = 'MISSION ACCOMPLISHED';
            this.messageContainer.style.animation = `
                fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards,
                battleshipGradient 4s ease-in-out infinite,
                textGlow 3s ease-in-out infinite
            `;
        } else {
            this.messageContainer.textContent = 'MISSION FAILED';
            this.messageContainer.style.animation = `
                fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards,
                battleshipGradient 4s ease-in-out infinite,
                textGlow 3s ease-in-out infinite
            `;
        }
    }
}

const winCondition = new WinCondition();
export default winCondition;