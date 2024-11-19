// Import the entire Three.js library
import * as THREE from 'three';

// Define the FireBall class
class FireBall {
    // Constructor for the FireBall class
    constructor(scene, targetPosition, boxSize) {
        this.scene = scene;                   // Reference to the Three.js scene
        this.targetPosition = targetPosition; // The position where the explosion will occur
        this.boxSize = boxSize;               // Size parameter for scaling effects
        this.particles = [];                  // Array to hold particle systems
        this.createMissileExplosion();        // Initiate the missile explosion effect
    }

    // Method to create the missile descent and explosion sequence
    createMissileExplosion() {
        // Create a group to hold the missile
        const missileGroup = new THREE.Group();
        this.scene.add(missileGroup);

        // Create the missile geometry and material
        const missileGeometry = new THREE.ConeGeometry(2.5, 12, 32);
        const missileMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.2,
            envMapIntensity: 0.5
        });
        const missile = new THREE.Mesh(missileGeometry, missileMaterial);

        // Position the missile above the target position
        missile.position.set(
            this.targetPosition.x,
            400, // Starting height of the missile
            this.targetPosition.z
        );
        missile.rotation.x = Math.PI; // Rotate the missile to point downwards
        missileGroup.add(missile);

        // Function to animate the missile's descent
        const animateMissile = () => {
            const baseSpeed = 0.02;       // Base speed of the missile
            const acceleration = 0.002;   // Acceleration over time
            const currentSpeed = baseSpeed + (acceleration * performance.now() / 1000);

            // Move the missile downward
            missile.position.y -= currentSpeed * 250;
            // Rotate the missile for visual effect
            missile.rotation.z += 0.2;
            missile.rotation.x += 0.05;

            // Create a smoke trail behind the missile
            this.createSmokeTrail(missile.position);

            // Check if the missile has reached the target position
            if (missile.position.y <= this.targetPosition.y + 1) {
                // Create the explosion effect
                this.createParticleExplosion(missileGroup, missile);
                return;
            }

            // Continue animating the missile
            requestAnimationFrame(animateMissile);
        };

        // Start the missile animation
        animateMissile();
    }

    // Method to create the explosion particle effects
    createParticleExplosion(missileGroup, missile) {
        const explosionGroup = new THREE.Group();
        this.scene.add(explosionGroup);
        missileGroup.remove(missile); // Remove the missile from the scene

        // Create multiple particle systems for different effects
        this.createFireballCore(explosionGroup);     // Main fireball
        this.createSecondaryExplosions(explosionGroup); // Secondary explosions
        this.createDebrisParticles(explosionGroup);  // Debris particles
        this.createSmokeCloud(explosionGroup);       // Smoke cloud
        this.createSparkParticles(explosionGroup);   // Sparks
        this.createGroundDust(explosionGroup);       // Ground dust

        let time = 0;
        // Function to animate the explosion over time
        const animateExplosion = () => {
            time += 0.016; // Increment time

            // Update all particle systems
            this.updateParticleSystems(time);

            if (time < 3) {
                // Continue animating if under 3 seconds
                requestAnimationFrame(animateExplosion);
            } else {
                // Clean up the explosion particles
                this.cleanup(explosionGroup, missileGroup);
            }
        };

        // Start the explosion animation
        animateExplosion();
    }

    // Method to create the main fireball core of the explosion
    createFireballCore(group) {
        const particleCount = 4000; // Number of particles
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3); // Positions of particles
        const velocities = new Float32Array(particleCount * 3); // Velocities of particles
        const colors = new Float32Array(particleCount * 3); // Colors of particles
        const sizes = new Float32Array(particleCount); // Sizes of particles

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2; // Random angle
            const phi = Math.random() * Math.PI;
            const r = Math.random() * this.boxSize * 0.8; // Random radius

            // Set initial positions at the target position
            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            // Set velocities for explosive effect
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * (40 + Math.random() * 80);
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * (40 + Math.random() * 80);
            velocities[i * 3 + 2] = Math.cos(phi) * (40 + Math.random() * 80);

            // Set particle sizes
            sizes[i] = 8 + Math.random() * 16;

            // Set particle colors for a fiery look
            const temp = Math.random();
            colors[i * 3] = 1;                    // Red channel
            colors[i * 3 + 1] = 0.3 + temp * 0.2; // Green channel
            colors[i * 3 + 2] = temp * 0.1;       // Blue channel
        }

        // Set attributes for geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create material for the particles
        const material = new THREE.PointsMaterial({
            size: 1,
            transparent: true,
            opacity: 1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Create the particle system and add to group
        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        // Add to particles array for updating
        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'core',
            lifetime: 0
        });
    }

    // Method to create secondary explosion effects
    createSecondaryExplosions(group) {
        const explosionCount = 5; // Number of secondary explosions
        for (let j = 0; j < explosionCount; j++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * this.boxSize * 2,
                (Math.random() - 0.5) * this.boxSize * 2,
                (Math.random() - 0.5) * this.boxSize * 2
            );

            const particleCount = 500;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const velocities = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);

            // Initialize particles
            for (let i = 0; i < particleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;

                // Set positions with offset
                positions[i * 3] = this.targetPosition.x + offset.x;
                positions[i * 3 + 1] = this.targetPosition.y + offset.y;
                positions[i * 3 + 2] = this.targetPosition.z + offset.z;

                // Set velocities
                velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * (5 + Math.random() * 30);
                velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * (5 + Math.random() * 30);
                velocities[i * 3 + 2] = Math.cos(phi) * (5 + Math.random() * 30);

                // Set colors
                const temp = Math.random();
                colors[i * 3] = 1;                    // Red channel
                colors[i * 3 + 1] = 0.2 + temp * 0.2; // Green channel
                colors[i * 3 + 2] = temp * 0.02;      // Blue channel
                sizes[i] = 1 + Math.random() * 3;
            }

            // Set attributes for geometry
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            // Create material for particles
            const material = new THREE.PointsMaterial({
                size: 1,
                transparent: true,
                opacity: 1,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            // Create particle system and add to group
            const particles = new THREE.Points(geometry, material);
            group.add(particles);

            // Add to particles array
            this.particles.push({
                system: particles,
                velocities: velocities,
                type: 'secondary',
                lifetime: Math.random() * 0.2
            });
        }
    }

    // Method to create a smoke cloud effect
    createSmokeCloud(group) {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * this.boxSize * 0.3;

            // Set initial positions
            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            // Set velocities
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * (2 + Math.random() * 8);
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * (2 + Math.random() * 8) + 2;
            velocities[i * 3 + 2] = Math.cos(phi) * (2 + Math.random() * 8);

            sizes[i] = 3 + Math.random() * 6;
        }

        // Set attributes for geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create material for smoke particles
        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0x222222,
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        });

        // Create particle system and add to group
        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        // Add to particles array
        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'smoke',
            lifetime: 0
        });
    }

    // Method to create spark particles
    createSparkParticles(group) {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            // Set initial positions
            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            // Set velocities
            const speed = 15 + Math.random() * 50;
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            // Set colors
            colors[i * 3] = 1;                                  // Red channel
            colors[i * 3 + 1] = 0.3 + Math.random() * 0.2;      // Green channel
            colors[i * 3 + 2] = Math.random() * 0.1;            // Blue channel

            sizes[i] = 2 + Math.random() * 4; // Increased size
        }

        // Set attributes for geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create material for sparks
        const material = new THREE.PointsMaterial({
            size: 1,
            transparent: true,
            opacity: 1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        // Create particle system and add to group
        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        // Add to particles array
        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'sparks',
            lifetime: 0
        });
    }

    // Method to create debris particles
    createDebrisParticles(group) {
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            // Set initial positions
            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            // Set velocities
            const speed = 8 + Math.random() * 12;
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            sizes[i] = 1 + Math.random() * 2;
        }

        // Set attributes for geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create material for debris particles
        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0x444444,
            transparent: true,
            opacity: 1
        });

        // Create particle system and add to group
        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        // Add to particles array
        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'debris',
            lifetime: 0
        });
    }

    // Method to create ground dust effect
    createGroundDust(group) {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.boxSize;

            // Set initial positions
            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            // Set velocities
            velocities[i * 3] = Math.cos(angle) * (2 + Math.random() * 4);
            velocities[i * 3 + 1] = 1 + Math.random() * 2;
            velocities[i * 3 + 2] = Math.sin(angle) * (2 + Math.random() * 4);

            sizes[i] = 2 + Math.random() * 4;
        }

        // Set attributes for geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create material for ground dust
        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0x662211,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });

        // Create particle system and add to group
        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        // Add to particles array
        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'dust',
            lifetime: 0
        });
    }

    // Method to create a smoke trail behind the missile
    createSmokeTrail(position) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5);
            positions[i * 3 + 1] = position.y + (Math.random() - 0.5);
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5);
        }

        // Set attribute for positions
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create material for smoke trail
        const material = new THREE.PointsMaterial({
            size: 0.3,
            color: 0x662211,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        // Create particle system and add to scene
        const smoke = new THREE.Points(geometry, material);
        this.scene.add(smoke);

        let opacity = 0.4;
        // Function to animate the smoke fading out
        const animateSmoke = () => {
            opacity -= 0.01;
            material.opacity = opacity;

            if (opacity <= 0) {
                // Remove smoke from scene
                this.scene.remove(smoke);
            } else {
                requestAnimationFrame(animateSmoke);
            }
        };

        // Start smoke animation
        animateSmoke();
    }

    // Method to update all particle systems
    updateParticleSystems(time) {
        for (let particle of this.particles) {
            particle.lifetime += 0.016; // Increment lifetime
            const positions = particle.system.geometry.attributes.position.array;
            const gravity = -9.8; // Gravity acceleration
            const drag = 0.98;    // Drag coefficient

            // Update positions and velocities
            for (let i = 0; i < positions.length; i += 3) {
                // Apply velocities
                positions[i] += particle.velocities[i] * 0.016;
                positions[i + 1] += particle.velocities[i + 1] * 0.016;
                positions[i + 2] += particle.velocities[i + 2] * 0.016;

                // Apply gravity
                particle.velocities[i + 1] += gravity * 0.016;

                // Apply drag
                particle.velocities[i] *= drag;
                particle.velocities[i + 1] *= drag;
                particle.velocities[i + 2] *= drag;
            }

            // Notify Three.js that positions have been updated
            particle.system.geometry.attributes.position.needsUpdate = true;

            // Update opacity based on particle type and lifetime
            switch (particle.type) {
                case 'core':
                    particle.system.material.opacity = Math.max(0, 1 - particle.lifetime * 2);
                    break;
                case 'secondary':
                    particle.system.material.opacity = Math.max(0, 1 - particle.lifetime * 1.5);
                    break;
                case 'smoke':
                    particle.system.material.opacity = Math.max(0, 0.2 - particle.lifetime * 0.1);
                    break;
                case 'sparks':
                    particle.system.material.opacity = Math.max(0, 1 - particle.lifetime * 1.2);
                    break;
                case 'debris':
                    particle.system.material.opacity = Math.max(0, 1 - particle.lifetime * 0.8);
                    break;
                case 'dust':
                    particle.system.material.opacity = Math.max(0, 0.3 - particle.lifetime * 0.15);
                    break;
            }
        }
    }

    // Method to clean up particle systems after explosion
    cleanup(explosionGroup, missileGroup) {
        this.scene.remove(explosionGroup); // Remove explosion particles
        this.scene.remove(missileGroup);   // Remove missile group
    }
}

// Export the FireBall class as the default export
export default FireBall;
