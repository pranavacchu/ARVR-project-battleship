// FireEffect.js
import { TextureLoader, SpriteMaterial, Sprite, RepeatWrapping, AdditiveBlending } from 'three';

class FireEffect {
    constructor(scene) {
        this.scene = scene;
        this.fireEffects = [];
        
        // Improved fire animation parameters
        this.tilesHoriz = 8;  // Increased for smoother animation
        this.tilesVert = 8;   
        this.numberOfTiles = this.tilesHoriz * this.tilesVert;
        this.tileDisplayDuration = 50; // Faster animation
        
        // Load improved fire texture
        this.textureLoader = new TextureLoader();
        this.fireTexture = this.textureLoader.load('fire.png'); // Use a proper fire sprite sheet
        this.fireTexture.wrapS = this.fireTexture.wrapT = RepeatWrapping;
        this.fireTexture.repeat.set(1 / this.tilesHoriz, 1 / this.tilesVert);
    }

    addFireEffectAtPosition(position, gridSize = 400, divisions = 8) {
        const boxSize = gridSize / divisions;
        
        // Create multiple fire sprites for a more realistic effect
        const numberOfSprites = 3;
        for (let i = 0; i < numberOfSprites; i++) {
            const material = new SpriteMaterial({ 
                map: this.fireTexture, 
                transparent: true,
                blending: AdditiveBlending, // Creates a glowing effect
                opacity: 0.7
            });
            
            material.map.repeat.set(1 / this.tilesHoriz, 1 / this.tilesVert);
            material.map.offset.set(0, 1 - 1 / this.tilesVert);
            
            const sprite = new Sprite(material);
            
            // Randomize position slightly within the grid square
            const offsetX = (Math.random() - 0.5) * (boxSize * 0.3);
            const offsetZ = (Math.random() - 0.5) * (boxSize * 0.3);
            
            sprite.position.set(
                position.x + offsetX,
                position.y + (i * 2), // Stack fires vertically
                position.z + offsetZ
            );
            
            // Randomize scale for more natural look
            const baseScale = boxSize * 0.4; // Smaller than grid square
            const randomScale = baseScale * (0.8 + Math.random() * 0.4);
            sprite.scale.set(randomScale, randomScale * 1.5, 1);
            
            // Initialize animation parameters with random offset
            sprite.userData = {
                currentTile: Math.floor(Math.random() * this.numberOfTiles),
                currentDisplayTime: 0,
                originalY: sprite.position.y,
                amplitude: 0.2, // For floating animation
                frequency: 1 + Math.random() * 0.5 // For floating animation
            };
            
            this.scene.add(sprite);
            this.fireEffects.push(sprite);
        }
    }

    update(delta) {
        this.fireEffects.forEach((effect, index) => {
            // Update sprite animation
            effect.userData.currentDisplayTime += delta * 1000;
            
            while (effect.userData.currentDisplayTime > this.tileDisplayDuration) {
                effect.userData.currentDisplayTime -= this.tileDisplayDuration;
                effect.userData.currentTile++;
                
                if (effect.userData.currentTile === this.numberOfTiles) {
                    effect.userData.currentTile = 0;
                }
                
                const currentColumn = effect.userData.currentTile % this.tilesHoriz;
                const currentRow = Math.floor(effect.userData.currentTile / this.tilesHoriz);
                
                effect.material.map.offset.x = currentColumn / this.tilesHoriz;
                effect.material.map.offset.y = 1 - (currentRow + 1) / this.tilesVert;
            }
            
            // Add floating animation
            const time = Date.now() * 0.001;
            effect.position.y = effect.userData.originalY + 
                              Math.sin(time * effect.userData.frequency) * 
                              effect.userData.amplitude;
            
            // Pulse the opacity
            effect.material.opacity = 0.7 + Math.sin(time * 2) * 0.3;
        });
    }

    clearFireEffects() {
        this.fireEffects.forEach(effect => {
            this.scene.remove(effect);
            if (effect.material.map) effect.material.map.dispose();
            if (effect.material) effect.material.dispose();
            if (effect.geometry) effect.geometry.dispose();
        });
        this.fireEffects = [];
    }
}

export default FireEffect;