import * as THREE from 'three';

class BurnEffect {
    constructor(scene) {
        this.scene = scene;
        this.fireTextures = [];
        this.smokeTextures = [];
        this.fireInstances = [];
        this.smokeInstances = [];
        this.clock = new THREE.Clock();
        
        // Enhanced configuration for more photorealistic fire and smoke
        this.config = {
            fire: {
                scale: { min: 30, max: 80 }, // Increased height for fire
                opacity: { min: 0.1, max: 0.4 },
                animationSpeed: 25,
                lifetime: Infinity,
                color: 0xff7700,
                layers: 60,
                startDelay: 1
            },
            smoke: {
                scale: { min: 50, max: 55 }, // Larger smoke clouds
                opacity: { min: 0.2, max: 0.4 }, // Slightly more visible smoke
                animationSpeed: 15,
                lifetime: Infinity,
                color: 0x444444, // Lighter base color for smoke
                layers: 1,
                startDelay: 1.2
            }
        };

        this.loadTextures();
    }

    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        
        // Load and configure fire textures
        const fireTexture = textureLoader.load('fire.png');
        this.configureTexture(fireTexture);
        this.createMaterialArray(fireTexture, this.fireTextures, this.config.fire);

        // Load and configure smoke textures
        const smokeTexture = textureLoader.load('smoke2.png');
        this.configureTexture(smokeTexture);
        this.createMaterialArray(smokeTexture, this.smokeTextures, this.config.smoke);
    }

    configureTexture(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1/8, 1/8);
        texture.needsUpdate = true;
    }

    createMaterialArray(texture, materialArray, config) {
        const gradientColors = config === this.config.fire ? 
            [0xff7700, 0xff9500, 0xffb700, 0xff5500, 0xff3d00] : // Fire gradient
            [0x666666, 0x777777, 0x888888, 0x999999]; // Whiter smoke gradient

        for (let i = 0; i < 64; i++) {
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: gradientColors[i % gradientColors.length],
                transparent: true,
                blending: config === this.config.fire ? THREE.AdditiveBlending : THREE.NormalBlending,
                depthWrite: false
            });
            material.map.offset.set((i % 8) / 8, 1 - Math.floor(i / 8) / 8);
            materialArray.push(material);
        }
    }

    addBurnEffect(position) {
        setTimeout(() => {
            // Create fire layers
            for (let i = 0; i < this.config.fire.layers; i++) {
                const angleOffset = (2 * Math.PI * i) / this.config.fire.layers;
                const radius = 5;
                
                const firePos = new THREE.Vector3(
                    position.x + Math.cos(angleOffset) * radius,
                    position.y+5, // Set fixed water-level position for fire
                    position.z + Math.sin(angleOffset) * radius
                );
                
                const fireSprite = this.createSprite(
                    this.fireTextures[i % this.fireTextures.length],
                    firePos,
                    this.config.fire.scale.min * (1 - i * 0.08), // Reduced scale reduction
                    this.config.fire.opacity.max * (1 - i * 0.08)
                );
                
                this.fireInstances.push(this.createEffectInstance(fireSprite, 'fire', angleOffset));
            }

            // Create smoke layers with higher starting position
            for (let i = 0; i < this.config.smoke.layers; i++) {
                const smokePos = new THREE.Vector3(
                    position.x + (Math.random() - 0.5) * 15,
                    position.y + 25 + (i * 5), // Higher starting position
                    position.z + (Math.random() - 0.5) * 15
                );
                
                const smokeSprite = this.createSprite(
                    this.smokeTextures[0],
                    smokePos,
                    this.config.smoke.scale.min * (1 + i * 0.25),
                    this.config.smoke.opacity.max * (1 - i * 0.15)
                );
                
                this.smokeInstances.push(this.createEffectInstance(smokeSprite, 'smoke'));
            }
        }, this.config.fire.startDelay * 1000);
    }

    createSprite(material, position, scale, opacity) {
        const sprite = new THREE.Sprite(material.clone());
        sprite.position.copy(position);
        sprite.scale.set(scale, scale * 1.5, 1); // Increased vertical scale
        sprite.material.opacity = opacity;
        this.scene.add(sprite);
        return sprite;
    }

    createEffectInstance(sprite, type, angleOffset = 0) {
        return {
            sprite: sprite,
            currentFrame: Math.floor(Math.random() * 64),
            age: 0,
            type: type,
            angleOffset: angleOffset,
            initialPosition: sprite.position.clone(),
            scalePhase: Math.random() * Math.PI * 2
        };
    }

    update(deltaTime) {
        // Update fire instances
        this.fireInstances.forEach(instance => {
            instance.currentFrame += deltaTime * this.config.fire.animationSpeed;
            if (instance.currentFrame >= this.fireTextures.length) {
                instance.currentFrame = 0;
            }

            instance.sprite.material = this.fireTextures[Math.floor(instance.currentFrame)].clone();
            instance.age += deltaTime;

            // Enhanced turbulent fire movement
            const turbulence = Math.sin(instance.age * 5) * 0.5;
            const radius = (3 + turbulence) * Math.sin(instance.age * 2.5);
            instance.sprite.position.x = instance.initialPosition.x + 
                Math.cos(instance.angleOffset + instance.age * 1.5) * radius;
            instance.sprite.position.z = instance.initialPosition.z + 
                Math.sin(instance.angleOffset + instance.age * 1.5) * radius;
            
            // Enhanced vertical oscillation
            instance.sprite.position.y = Math.min(
                instance.initialPosition.y, // Ensure it does not rise above initial water level
                instance.initialPosition.y + Math.sin(instance.age * 2) * 0.5); // Constant upward drift

            // Complex scale variation
            const scaleOscillation = 
                Math.sin(instance.age * 3 + instance.scalePhase) * 0.15 +
                Math.sin(instance.age * 5 + instance.scalePhase) * 0.1;
            const baseScale = this.config.fire.scale.min;
            const currentScale = baseScale * (1 + scaleOscillation);
            instance.sprite.scale.set(currentScale, currentScale * 1.8, 1); // Increased vertical scale

            // Dynamic opacity with flickering
            instance.sprite.material.opacity = 
                this.config.fire.opacity.min +
                (Math.sin(instance.age * 4) * 0.15) +
                (Math.sin(instance.age * 7) * 0.1);
        });

        // Update smoke instances
        this.smokeInstances.forEach(instance => {
            instance.currentFrame += deltaTime * this.config.smoke.animationSpeed;
            if (instance.currentFrame >= this.smokeTextures.length) {
                instance.currentFrame = 0;
            }

            instance.sprite.material = this.smokeTextures[Math.floor(instance.currentFrame)].clone();
            instance.age += deltaTime;

            // Enhanced smoke drift
            const windEffect = Math.sin(instance.age * 0.5) * 4;
            const spiralRadius = instance.age * 0.8;
            instance.sprite.position.x = instance.initialPosition.x + 
                Math.sin(instance.age * 0.8) * spiralRadius + windEffect;
            instance.sprite.position.z = instance.initialPosition.z + 
                Math.cos(instance.age * 0.8) * spiralRadius;
            
            // Enhanced upward movement
            instance.sprite.position.y = instance.initialPosition.y + 
                (instance.age * 3); // Increased vertical speed

            // Enhanced smoke expansion
            const expansionFactor = Math.min(1 + instance.age * 0.15, 2.5); // Larger maximum expansion
            const baseScale = this.config.smoke.scale.min;
            instance.sprite.scale.set(
                baseScale * expansionFactor,
                baseScale * expansionFactor * 1.3, // Taller smoke
                1
            );

            // Adjusted fading opacity
            instance.sprite.material.opacity = Math.max(
                this.config.smoke.opacity.min,
                this.config.smoke.opacity.max - (instance.age * 0.015) // Slower fade
            );
        });
    }

    clearBurnEffects() {
        this.clearInstances(this.fireInstances);
        this.clearInstances(this.smokeInstances);
        
        this.fireInstances = [];
        this.smokeInstances = [];
    }

    clearInstances(instances) {
        instances.forEach(instance => {
            this.scene.remove(instance.sprite);
            instance.sprite.material.dispose();
            instance.sprite.material.map?.dispose();
        });
    }
}

export default BurnEffect;