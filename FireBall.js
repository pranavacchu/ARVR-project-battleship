import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

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

        // Missile geometry and material
        const missileGeometry = new THREE.ConeGeometry(2.5, 12, 32);
        const missileMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.2,
            envMapIntensity: 0.5,
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        const missile = new THREE.Mesh(missileGeometry, missileMaterial);
        missile.position.set(this.targetPosition.x, 400, this.targetPosition.z);
        missile.rotation.x = Math.PI;
        missileGroup.add(missile);

        // Missile trajectory and descent
        const animateMissile = () => {
            const baseSpeed = 0.02;
            const acceleration = 0.002;
            const currentSpeed = baseSpeed + (acceleration * performance.now() / 1000);
            missile.position.y -= currentSpeed * 250;
            missile.rotation.z += 0.2;
            missile.rotation.x += 0.05;
            this.createSmokeTrail(missile.position);

            if (missile.position.y <= this.targetPosition.y + 1) {
                this.createProfessionalExplosion(missileGroup, missile);
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

    createProfessionalExplosion(missileGroup, missile) {
        const explosionGroup = new THREE.Group();
        this.scene.add(explosionGroup);

        missileGroup.remove(missile);

        // Explosion sparks
        const sparksGeometry = new THREE.BufferGeometry();
        const sparksCount = 800;
        const positionArray = new Float32Array(sparksCount * 3);
        const velocityArray = new Float32Array(sparksCount * 3);

        for (let i = 0; i < sparksCount; i++) {
            positionArray[i * 3] = this.targetPosition.x;
            positionArray[i * 3 + 1] = this.targetPosition.y;
            positionArray[i * 3 + 2] = this.targetPosition.z;

            const angle = Math.random() * Math.PI * 2;
            const magnitude = Math.random() * 20;
            velocityArray[i * 3] = Math.cos(angle) * magnitude;
            velocityArray[i * 3 + 1] = Math.abs(Math.sin(angle)) * 10;
            velocityArray[i * 3 + 2] = Math.sin(angle) * magnitude;
        }

        sparksGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

        const sparksMaterial = new THREE.PointsMaterial({
            color: 0xffcc00,
            size: 1.8,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const sparkSystem = new THREE.Points(sparksGeometry, sparksMaterial);
        explosionGroup.add(sparkSystem);

        // Explosion spheres
        const explosionGeometries = [
            new THREE.SphereGeometry(this.boxSize * 1.2, 32, 32),
            new THREE.SphereGeometry(this.boxSize, 24, 24),
            new THREE.SphereGeometry(this.boxSize * 0.8, 16, 16)
        ];

        const explosionMaterials = [
            new THREE.MeshPhongMaterial({
                color: 0xff4500,
                emissive: 0xff6347,
                emissiveIntensity: 3,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            }),
            new THREE.MeshPhongMaterial({
                color: 0xffaa00,
                emissive: 0xffa500,
                emissiveIntensity: 2.5,
                transparent: true,
                opacity: 0.8
            }),
            new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 2,
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

        // Ash particles
        const ashGeometry = new THREE.BufferGeometry();
        const ashCount = 300;
        const ashPosArray = new Float32Array(ashCount * 3);
        const ashVelocityArray = new Float32Array(ashCount * 3);
        const ashScaleArray = new Float32Array(ashCount);

        for (let i = 0; i < ashCount; i++) {
            const radius = Math.random() * this.boxSize * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            ashPosArray[i * 3] = this.targetPosition.x + radius * Math.sin(phi) * Math.cos(theta);
            ashPosArray[i * 3 + 1] = this.targetPosition.y + radius * Math.sin(phi) * Math.sin(theta);
            ashPosArray[i * 3 + 2] = this.targetPosition.z + radius * Math.cos(phi);

            ashVelocityArray[i * 3] = (Math.random() - 0.5) * 2.5;
            ashVelocityArray[i * 3 + 1] = Math.random() * 2;
            ashVelocityArray[i * 3 + 2] = (Math.random() - 0.5) * 2.5;

            ashScaleArray[i] = Math.random() * 0.6 + 0.4;
        }

        ashGeometry.setAttribute('position', new THREE.BufferAttribute(ashPosArray, 3));
        ashGeometry.setAttribute('velocity', new THREE.BufferAttribute(ashVelocityArray, 3));
        ashGeometry.setAttribute('scale', new THREE.BufferAttribute(ashScaleArray, 1));

        const ashMaterial = new THREE.PointsMaterial({
            color: 0x555555,
            size: 1.2,
            transparent: true,
            opacity: 0.8,
            blending: THREE.NormalBlending
        });

        const ashSystem = new THREE.Points(ashGeometry, ashMaterial);
        explosionGroup.add(ashSystem);

        // Lighting and post-processing
        const pointLight = new THREE.PointLight(0xffaa00, 4, 100);
        pointLight.position.copy(this.targetPosition);
        this.scene.add(pointLight);

        const effectComposer = new EffectComposer(this.scene.renderer);
        effectComposer.addPass(new RenderPass(this.scene, this.scene.camera));

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.scene.width, this.scene.height),
            1.8,
            0.6,
            1
        );
        bloomPass.threshold = 0.1;
        bloomPass.strength = 2.5;
        bloomPass.radius = 1.2;
        effectComposer.addPass(bloomPass);

        let animationProgress = 0;
        const animateExplosion = () => {
            animationProgress += 0.015;

            // Spark animation
            const sparksPosition = sparksGeometry.getAttribute('position');
            for (let i = 0; i < sparksCount; i++) {
                sparksPosition.array[i * 3] += velocityArray[i * 3] * (1 + animationProgress);
                sparksPosition.array[i * 3 + 1] += (velocityArray[i * 3 + 1] * (1 + animationProgress)) - (9.8 * animationProgress * 0.4);
                sparksPosition.array[i * 3 + 2] += velocityArray[i * 3 + 2] * (1 + animationProgress);
            }
            sparksPosition.needsUpdate = true;
            sparksMaterial.opacity = Math.max(1 - animationProgress * 1.8, 0);

            // Explosion spheres
            explosionSpheres.forEach((sphere, index) => {
                const scale = 1 + animationProgress * (3.5 - index * 0.8);
                sphere.scale.set(scale, scale, scale);
                sphere.material.opacity = Math.max(1 - animationProgress * (1.8 + index * 0.5), 0);
            });

            // Ash particles
            const ashPosition = ashGeometry.getAttribute('position');
            const ashVelocity = ashGeometry.getAttribute('velocity');
            const ashScale = ashGeometry.getAttribute('scale');
            for (let i = 0; i < ashCount; i++) {
                ashPosition.array[i * 3] += ashVelocity.array[i * 3] * animationProgress;
                ashPosition.array[i * 3 + 1] += ashVelocity.array[i * 3 + 1] * animationProgress - (9.8 * animationProgress * 0.3);
                ashPosition.array[i * 3 + 2] += ashVelocity.array[i * 3 + 2] * animationProgress;
                ashScale.array[i] *= 1.07;
            }
            ashPosition.needsUpdate = true;
            ashScale.needsUpdate = true;
            ashMaterial.opacity = Math.max(0.8 - animationProgress * 0.8, 0);

            pointLight.intensity = Math.max(4 - animationProgress * 3, 0);
            effectComposer.render();

            if (animationProgress < 1) {
                requestAnimationFrame(animateExplosion);
            } else {
                this.cleanup(explosionGroup, missileGroup, 3000);
            }
        };

        animateExplosion();
    }

    cleanup(explosionGroup, missileGroup, delay = 0) {
        setTimeout(() => {
            this.scene.remove(explosionGroup);
            this.scene.remove(missileGroup);
        }, delay);
    }
}

export default FireBall;