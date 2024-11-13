import { TextureLoader, SpriteMaterial, Sprite, RepeatWrapping, AdditiveBlending, Group, Vector3, Color, NormalBlending } from 'three';

class FireEffect {
    constructor(scene) {
        this.scene = scene;
        this.fireGroups = [];

        // Enhanced animation parameters
        this.fireConfig = {
            tilesHoriz: 8,  // Match your fire.png sprite sheet
            tilesVert: 8,   // Match your fire.png sprite sheet
            displayDuration: 25, // Faster animation for more fluid movement
            scale: { min: 0.2, max: 0.4 },
            heightOffset: { min: 0.5, max: 3 },
            opacity: { min: 0.4, max: 1.0 },
            colors: [
                new Color(0xff4400), // Bright orange-red
                new Color(0xff8800), // Orange
                new Color(0xffaa00)  // Yellow-orange
            ]
        };

        this.smokeConfig = {
            tilesHoriz: 8,  // Match your smoke.png sprite sheet
            tilesVert: 8,   // Match your smoke.png sprite sheet
            displayDuration: 45,
            scale: { min: 0.3, max: 0.5 },
            heightOffset: { min: 2, max: 5 },
            opacity: { min: 0.1, max: 0.3 }
        };

        this.textureLoader = new TextureLoader();
        
        // Load textures with proper wrapping
        this.fireTexture = this.textureLoader.load('fire.png', (texture) => {
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.repeat.set(1/8, 1/8);  // 8x8 sprite sheet
        });
        
        this.smokeTexture = this.textureLoader.load('smoke.png', (texture) => {
            texture.wrapS = texture.wrapT = RepeatWrapping;
            texture.repeat.set(1/8, 1/8);  // 8x8 sprite sheet
        });
    }

    createParticle(config, texture, position, isSmoke = false) {
        const material = new SpriteMaterial({
            map: texture,
            transparent: true,
            blending: isSmoke ? NormalBlending : AdditiveBlending,
            opacity: Math.random() * (config.opacity.max - config.opacity.min) + config.opacity.min,
            depthWrite: false
        });

        const sprite = new Sprite(material);
        const scale = Math.random() * (config.scale.max - config.scale.min) + config.scale.min;
        sprite.scale.set(scale, scale, 1);

        const heightOffset = Math.random() * (config.heightOffset.max - config.heightOffset.min) + config.heightOffset.min;
        sprite.position.copy(position);
        sprite.position.y += heightOffset;

        // Animation properties
        sprite.userData = {
            initialY: sprite.position.y,
            age: 0,
            lifetime: Math.random() * 1.2 + 0.8,
            currentTile: Math.floor(Math.random() * (config.tilesHoriz * config.tilesVert)),
            displayTime: 0,
            velocity: new Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.3 + 0.2,
                (Math.random() - 0.5) * 0.1
            ),
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            config: config,
            isSmoke: isSmoke,
            initialColor: isSmoke ? null : this.fireConfig.colors[
                Math.floor(Math.random() * this.fireConfig.colors.length)
            ]
        };

        if (!isSmoke) {
            material.color.copy(sprite.userData.initialColor);
        }

        return sprite;
    }

    addFireEffectAtPosition(position, gridSize = 400, divisions = 8) {
        const group = new Group();
        const boxSize = gridSize / divisions;

        // Create more particles for denser effect
        for (let i = 0; i < 12; i++) {
            const radius = Math.random() * (boxSize * 0.3);
            const angle = Math.random() * Math.PI * 2;
            
            const offset = new Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            const particlePos = position.clone().add(offset);
            
            // Add fire particles
            if (i < 8) {
                const fire = this.createParticle(this.fireConfig, this.fireTexture, particlePos);
                group.add(fire);
            }
            
            // Add smoke particles
            if (i < 6) {
                const smoke = this.createParticle(this.smokeConfig, this.smokeTexture, particlePos, true);
                group.add(smoke);
            }
        }

        this.scene.add(group);
        this.fireGroups.push(group);
    }

    update(delta) {
        this.fireGroups.forEach((group, groupIndex) => {
            let removeGroup = true;

            group.children.forEach((sprite) => {
                const userData = sprite.userData;
                userData.age += delta;

                if (userData.age < userData.lifetime) {
                    removeGroup = false;

                    // Update sprite animation frame
                    userData.displayTime += delta * 1000;
                    if (userData.displayTime > userData.config.displayDuration) {
                        userData.displayTime = 0;
                        userData.currentTile = (userData.currentTile + 1) % (userData.config.tilesHoriz * userData.config.tilesVert);

                        const col = userData.currentTile % userData.config.tilesHoriz;
                        const row = Math.floor(userData.currentTile / userData.config.tilesHoriz);
                        
                        sprite.material.map.offset.x = col / userData.config.tilesHoriz;
                        sprite.material.map.offset.y = 1 - ((row + 1) / userData.config.tilesVert);
                    }

                    // Update position
                    sprite.position.add(userData.velocity.clone().multiplyScalar(delta));
                    sprite.rotation.z += userData.rotationSpeed;

                    // Fade out based on lifetime
                    const lifeRatio = userData.age / userData.lifetime;
                    sprite.material.opacity = userData.isSmoke ?
                        lerp(userData.config.opacity.max, userData.config.opacity.min, lifeRatio) :
                        lerp(userData.config.opacity.max, 0, Math.pow(lifeRatio, 0.5));

                    // Scale adjustment
                    const scaleAdjust = userData.isSmoke ? 
                        1 + lifeRatio * 0.5 : // Smoke expands
                        1 - lifeRatio * 0.3;  // Fire shrinks
                    sprite.scale.multiplyScalar(scaleAdjust);
                }
            });

            if (removeGroup) {
                this.clearFireGroup(group);
                this.fireGroups.splice(groupIndex, 1);
            }
        });
    }

    clearFireGroup(group) {
        group.children.forEach(sprite => {
            sprite.material.map.dispose();
            sprite.material.dispose();
        });
        this.scene.remove(group);
    }

    clearFireEffects() {
        this.fireGroups.forEach(group => this.clearFireGroup(group));
        this.fireGroups = [];
    }
}

// Utility function
function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

export default FireEffect;