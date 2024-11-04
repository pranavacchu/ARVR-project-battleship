import * as THREE from 'three';

class FireBall {
    constructor(scene, targetPosition, boxSize) {
        this.scene = scene;
        this.targetPosition = targetPosition;
        this.boxSize = boxSize;
        this.createMissileExplosion();
    }

    createMissileExplosion() {
        const missileGroup = new THREE.Group();
        this.scene.add(missileGroup);

        // Enhanced missile geometry and material
        const missileGeometry = new THREE.ConeGeometry(2.5, 12, 32); // Larger size
        const missileMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.2,
            envMapIntensity: 0.5,
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        const missile = new THREE.Mesh(missileGeometry, missileMaterial);
        
        // Starting position with more dramatic launch
        missile.position.set(
            this.targetPosition.x, 
            400, // Higher starting point
            this.targetPosition.z
        );
        missile.rotation.x = Math.PI;
        missileGroup.add(missile);

        // Enhanced missile trajectory and descent
        const animateMissile = () => {
            // Faster descent with acceleration
            const baseSpeed = 0.02;
            const acceleration = 0.002;
            const currentSpeed = baseSpeed + (acceleration * performance.now() / 1000);
            
            missile.position.y -= currentSpeed * 250;

            // More dynamic rotation
            missile.rotation.z += 0.2;
            missile.rotation.x += 0.05;

            // Add smoke trail
            this.createSmokeTrail(missile.position);

            if (missile.position.y <= this.targetPosition.y + 1) {
                // Trigger advanced explosion
                this.createAdvancedExplosion(missileGroup, missile);
                return;
            }

            requestAnimationFrame(animateMissile);
        };

        animateMissile();
    }

    createSmokeTrail(position) {
        const smokeTrailGeometry = new THREE.BufferGeometry();
        const smokeTrailCount = 20;
        const smokePosArray = new Float32Array(smokeTrailCount * 3);

        for (let i = 0; i < smokeTrailCount; i++) {
            smokePosArray[i * 3] = position.x + (Math.random() - 0.5);
            smokePosArray[i * 3 + 1] = position.y + (Math.random() - 0.5);
            smokePosArray[i * 3 + 2] = position.z + (Math.random() - 0.5);
        }

        smokeTrailGeometry.setAttribute('position', new THREE.BufferAttribute(smokePosArray, 3));

        const smokeTrailMaterial = new THREE.PointsMaterial({
            color: 0x555555,
            size: 0.3,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });

        const smokeTrail = new THREE.Points(smokeTrailGeometry, smokeTrailMaterial);
        this.scene.add(smokeTrail);

        // Fade out and remove smoke trail
        let opacity = 0.4;
        const animateSmokeTrail = () => {
            opacity -= 0.01;
            smokeTrailMaterial.opacity = opacity;

            if (opacity <= 0) {
                this.scene.remove(smokeTrail);
            } else {
                requestAnimationFrame(animateSmokeTrail);
            }
        };

        animateSmokeTrail();
    }

    createAdvancedExplosion(missileGroup, missile) {
        const explosionGroup = new THREE.Group();
        this.scene.add(explosionGroup);

        // Remove missile from scene
        missileGroup.remove(missile);

        // Enhanced sparks with more dynamic behavior
        const sparksGeometry = new THREE.BufferGeometry();
        const sparksCount = 300; // More sparks
        const positionArray = new Float32Array(sparksCount * 3);
        const velocityArray = new Float32Array(sparksCount * 3);

        // More complex spark generation
        for (let i = 0; i < sparksCount; i++) {
            positionArray[i * 3] = this.targetPosition.x;
            positionArray[i * 3 + 1] = this.targetPosition.y;
            positionArray[i * 3 + 2] = this.targetPosition.z;

            // More spread and unpredictability
            const angle = Math.random() * Math.PI * 2;
            const magnitude = Math.random() * 10;
            velocityArray[i * 3] = Math.cos(angle) * magnitude;
            velocityArray[i * 3 + 1] = Math.abs(Math.sin(angle)) * 6;
            velocityArray[i * 3 + 2] = Math.sin(angle) * magnitude;
        }

        sparksGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
        
        const sparksMaterial = new THREE.PointsMaterial({
            color: 0xffcc00,
            size: 1.0, // Larger sparks
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const sparkSystem = new THREE.Points(sparksGeometry, sparksMaterial);
        explosionGroup.add(sparkSystem);

        // More layered and complex explosion spheres
        const explosionGeometries = [
            new THREE.SphereGeometry(this.boxSize, 32, 32),
            new THREE.SphereGeometry(this.boxSize * 0.8, 24, 24),
            new THREE.SphereGeometry(this.boxSize * 0.6, 16, 16)
        ];

        const explosionMaterials = [
            new THREE.MeshPhongMaterial({
                color: 0xff4500,
                emissive: 0xff6347,
                emissiveIntensity: 2.5,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            }),
            new THREE.MeshPhongMaterial({
                color: 0xffaa00,
                emissive: 0xffa500,
                emissiveIntensity: 2,
                transparent: true,
                opacity: 0.8
            }),
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 1.5,
                transparent: true,
                opacity: 0.5
            })
        ];

        const explosionSpheres = explosionGeometries.map((geometry, index) => {
            const sphere = new THREE.Mesh(geometry, explosionMaterials[index]);
            sphere.position.copy(this.targetPosition);
            explosionGroup.add(sphere);
            return sphere;
        });

        // Enhanced smoke system with more variation
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeCount = 150;
        const smokePosArray = new Float32Array(smokeCount * 3);
        const smokeScaleArray = new Float32Array(smokeCount);
        const smokeDriftArray = new Float32Array(smokeCount * 3);

        for (let i = 0; i < smokeCount; i++) {
            // More random distribution
            const radius = Math.random() * this.boxSize;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            smokePosArray[i * 3] = this.targetPosition.x + radius * Math.sin(phi) * Math.cos(theta);
            smokePosArray[i * 3 + 1] = this.targetPosition.y + radius * Math.sin(phi) * Math.sin(theta);
            smokePosArray[i * 3 + 2] = this.targetPosition.z + radius * Math.cos(phi);
            
            smokeScaleArray[i] = Math.random() * 1.5;
            
            // Drift vectors for more natural movement
            smokeDriftArray[i * 3] = (Math.random() - 0.5) * 0.5;
            smokeDriftArray[i * 3 + 1] = Math.random() * 0.3;
            smokeDriftArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePosArray, 3));
        smokeGeometry.setAttribute('scale', new THREE.BufferAttribute(smokeScaleArray, 1));
        smokeGeometry.setAttribute('drift', new THREE.BufferAttribute(smokeDriftArray, 3));

        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x222222,
            size: 1.5,
            transparent: true,
            opacity: 0.5,
            blending: THREE.NormalBlending
        });

        const smokeSystem = new THREE.Points(smokeGeometry, smokeMaterial);
        explosionGroup.add(smokeSystem);

        // More advanced and complex explosion animation
        let animationProgress = 0;
        const animateExplosion = () => {
            animationProgress += 0.015;

            // Spark animation with more complex physics
            const sparksPosition = sparksGeometry.getAttribute('position');
            for (let i = 0; i < sparksCount; i++) {
                sparksPosition.array[i * 3] += velocityArray[i * 3] * (1 + animationProgress);
                sparksPosition.array[i * 3 + 1] += (velocityArray[i * 3 + 1] * (1 + animationProgress)) - (9.8 * animationProgress * 0.3);
                sparksPosition.array[i * 3 + 2] += velocityArray[i * 3 + 2] * (1 + animationProgress);
            }
            sparksPosition.needsUpdate = true;
            sparksMaterial.opacity = Math.max(1 - animationProgress * 1.5, 0);

            // Explosion spheres with more dynamic scaling
            explosionSpheres.forEach((sphere, index) => {
                const scale = 1 + animationProgress * (3 - index * 0.7);
                sphere.scale.set(scale, scale, scale);
                sphere.material.opacity = Math.max(1 - animationProgress * (1.5 + index * 0.4), 0);
            });

            // Enhanced smoke animation with drift
            const smokePosition = smokeGeometry.getAttribute('position');
            const smokeScale = smokeGeometry.getAttribute('scale');
            const smokeDrift = smokeGeometry.getAttribute('drift');
            for (let i = 0; i < smokeCount; i++) {
                smokePosition.array[i * 3] += smokeDrift.array[i * 3] * animationProgress;
                smokePosition.array[i * 3 + 1] += 0.7 * animationProgress;
                smokePosition.array[i * 3 + 2] += smokeDrift.array[i * 3 + 2] * animationProgress;
                smokeScale.array[i] *= 1.07;
            }
            smokePosition.needsUpdate = true;
            smokeScale.needsUpdate = true;
            smokeSystem.material.opacity = Math.max(0.5 - animationProgress * 0.8, 0);

            if (animationProgress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.cleanup(explosionGroup, missileGroup);
            }
        };

        animateExplosion();
    }

    cleanup(explosionGroup, missileGroup) {
        // Efficient group removal
        this.scene.remove(explosionGroup);
        this.scene.remove(missileGroup);
    }
}

export default FireBall;