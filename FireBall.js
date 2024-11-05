import * as THREE from 'three';

class FireBall {
    constructor(scene, targetPosition, boxSize) {
        this.scene = scene;
        this.targetPosition = targetPosition;
        this.boxSize = boxSize;
        this.particles = [];
        this.createMissileExplosion();
    }

    createMissileExplosion() {
        const missileGroup = new THREE.Group();
        this.scene.add(missileGroup);

        const missileGeometry = new THREE.ConeGeometry(2.5, 12, 32);
        const missileMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.2,
            envMapIntensity: 0.5
        });
        const missile = new THREE.Mesh(missileGeometry, missileMaterial);

        missile.position.set(
            this.targetPosition.x,
            400,
            this.targetPosition.z
        );
        missile.rotation.x = Math.PI;
        missileGroup.add(missile);

        const animateMissile = () => {
            const baseSpeed = 0.02;
            const acceleration = 0.002;
            const currentSpeed = baseSpeed + (acceleration * performance.now() / 1000);

            missile.position.y -= currentSpeed * 250;
            missile.rotation.z += 0.2;
            missile.rotation.x += 0.05;

            this.createSmokeTrail(missile.position);

            if (missile.position.y <= this.targetPosition.y + 1) {
                this.createParticleExplosion(missileGroup, missile);
                return;
            }

            requestAnimationFrame(animateMissile);
        };

        animateMissile();
    }

    createParticleExplosion(missileGroup, missile) {
        const explosionGroup = new THREE.Group();
        this.scene.add(explosionGroup);
        missileGroup.remove(missile);

        // Create multiple particle systems for different effects
        this.createFireballCore(explosionGroup);
        this.createSecondaryExplosions(explosionGroup);
        this.createDebrisParticles(explosionGroup);
        this.createSmokeCloud(explosionGroup);
        this.createSparkParticles(explosionGroup);
        this.createGroundDust(explosionGroup);

        let time = 0;
        const animateExplosion = () => {
            time += 0.016;

            // Update all particle systems
            this.updateParticleSystems(time);

            if (time < 3) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.cleanup(explosionGroup, missileGroup);
            }
        };

        animateExplosion();
    }

    createFireballCore(group) {
        const particleCount = 4000; // Doubled particle count
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * this.boxSize * 0.8; // Increased radius

            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            // Increased explosion velocities
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * (40 + Math.random() * 80);
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * (40 + Math.random() * 80);
            velocities[i * 3 + 2] = Math.cos(phi) * (40 + Math.random() * 80);

            // Increased particle sizes
            sizes[i] = 8 + Math.random() * 16;

            // Enhanced colors for more intensity
            const temp = Math.random();
            colors[i * 3] = 1;                    // Red (keep at 1)
            colors[i * 3 + 1] = 0.3 + temp * 0.2; // Green (reduced from 0.7 to create more red-orange)
            colors[i * 3 + 2] = temp * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            transparent: true,
            opacity: 1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'core',
            lifetime: 0
        });
    }

    createSecondaryExplosions(group) {
        // Create smaller secondary explosions
        const explosionCount = 5;
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

            for (let i = 0; i < particleCount; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;

                positions[i * 3] = this.targetPosition.x + offset.x;
                positions[i * 3 + 1] = this.targetPosition.y + offset.y;
                positions[i * 3 + 2] = this.targetPosition.z + offset.z;

                velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * (5 + Math.random() * 30);
                velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * (5 + Math.random() * 30);
                velocities[i * 3 + 2] = Math.cos(phi) * (5 + Math.random() * 30);

                const temp = Math.random();
                colors[i * 3] = 1;                    // Red (keep at 1)
                colors[i * 3 + 1] = 0.2 + temp * 0.2; // Green (reduced from 0.5 to create more red-orange)
                colors[i * 3 + 2] = temp * 0.02;
                sizes[i] = 1 + Math.random() * 3;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                size: 1,
                transparent: true,
                opacity: 1,
                vertexColors: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const particles = new THREE.Points(geometry, material);
            group.add(particles);

            this.particles.push({
                system: particles,
                velocities: velocities,
                type: 'secondary',
                lifetime: Math.random() * 0.2
            });
        }
    }

    createSmokeCloud(group) {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * this.boxSize * 0.3;

            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * (2 + Math.random() * 8);
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * (2 + Math.random() * 8) + 2;
            velocities[i * 3 + 2] = Math.cos(phi) * (2 + Math.random() * 8);

            sizes[i] = 3 + Math.random() * 6;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0x222222,
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'smoke',
            lifetime: 0
        });
    }

    createSparkParticles(group) {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            const speed = 15 + Math.random() * 50;
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            colors[i * 3] = 1;                    // Red (keep at 1)
            colors[i * 3 + 1] = 0.3 + Math.random() * 0.2; // Green (reduced from 0.6 to create more red-orange)
            colors[i * 3 + 2] = Math.random() * 0.1;

            sizes[i] = 2 + Math.random() * 4; // Doubled from (1 + Math.random() * 2)
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            transparent: true,
            opacity: 1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'sparks',
            lifetime: 0
        });
    }

    createDebrisParticles(group) {
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            const speed = 8 + Math.random() * 12;
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;

            sizes[i] = 1 + Math.random() * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0x444444,
            transparent: true,
            opacity: 1
        });

        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'debris',
            lifetime: 0
        });
    }

    createGroundDust(group) {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.boxSize;

            positions[i * 3] = this.targetPosition.x;
            positions[i * 3 + 1] = this.targetPosition.y;
            positions[i * 3 + 2] = this.targetPosition.z;

            velocities[i * 3] = Math.cos(angle) * (2 + Math.random() * 4);
            velocities[i * 3 + 1] = 1 + Math.random() * 2;
            velocities[i * 3 + 2] = Math.sin(angle) * (2 + Math.random() * 4);

            sizes[i] = 2 + Math.random() * 4;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            color: 0x662211,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        group.add(particles);

        this.particles.push({
            system: particles,
            velocities: velocities,
            type: 'dust',
            lifetime: 0
        });
    }

    createSmokeTrail(position) {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x + (Math.random() - 0.5);
            positions[i * 3 + 1] = position.y + (Math.random() - 0.5);
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            color: 0x662211,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        const smoke = new THREE.Points(geometry, material);
        this.scene.add(smoke);

        let opacity = 0.4;
        const animateSmoke = () => {
            opacity -= 0.01;
            material.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(smoke);
            } else {
                requestAnimationFrame(animateSmoke);
            }
        };

        animateSmoke();
    }

    updateParticleSystems(time) {
        for (let particle of this.particles) {
            particle.lifetime += 0.016;
            const positions = particle.system.geometry.attributes.position.array;
            const gravity = -9.8;
            const drag = 0.98;

            for (let i = 0; i < positions.length; i += 3) {
                // Apply velocity
                positions[i] += particle.velocities[i] * 0.016;
                positions[i + 1] += particle.velocities[i + 1] * 0.016;
                positions[i + 2] += particle.velocities[i + 2] * 0.016;

                // Apply gravity to Y velocity
                particle.velocities[i + 1] += gravity * 0.016;

                // Apply drag
                particle.velocities[i] *= drag;
                particle.velocities[i + 1] *= drag;
                particle.velocities[i + 2] *= drag;
            }

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

    cleanup(explosionGroup, missileGroup) {
        this.scene.remove(explosionGroup);
        this.scene.remove(missileGroup);
    }
}

export default FireBall;