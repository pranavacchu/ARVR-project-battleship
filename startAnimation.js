import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Scene, Camera, Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.4;  // Darker exposure for stormy look
document.getElementById('scene-container').appendChild(renderer.domElement);

// Camera position
camera.position.set(0, 50, 150);  // Move camera further to capture larger waves

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2;

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);  // Soft ambient light for stormy atmosphere
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);  // Simulate sunlight breaking through clouds
directionalLight.position.set(-1, 1, 1);
scene.add(directionalLight);

// Water setup (darker water with bigger waves)
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x0a0a0a,  // Darker water for stormy effect
    distortionScale: 10.0,  // Larger distortion for bigger waves
    fog: scene.fog !== undefined,
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Sky setup (cloudy and stormy)
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 50;  // Increase turbidity for more dense clouds
skyUniforms['rayleigh'].value = 0.5;  // Less scattering for a darker stormy sky
skyUniforms['mieCoefficient'].value = 0.1;  // Increase for a more diffused look
skyUniforms['mieDirectionalG'].value = 0.9;  // High value for more light scattering

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const parameters = {
    elevation: 1,  // Low sun to enhance stormy effect
    azimuth: 200
};

// Update sun position based on sky parameters
function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
}

updateSun();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    water.material.uniforms['time'].value += 1.0 / 50.0;  // Slower, more intense waves
    controls.update();

    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
