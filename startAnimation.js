import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Scene, Camera, Renderer setup
const scene = new THREE.Scene();

// Create a Perspective Camera with a field of view of 75 degrees,
// aspect ratio based on the window size, near plane at 0.1, and far plane at 10000
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

// Create a WebGL renderer with antialiasing enabled for smoother edges
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Set the size of the rendering window to match the browser window
renderer.setSize(window.innerWidth, window.innerHeight);

// Set tone mapping and exposure for a darker, stormy visual effect
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.4;  // Darker exposure for stormy look

// Append the renderer's canvas element to the DOM within 'scene-container'
document.getElementById('scene-container').appendChild(renderer.domElement);

// Camera position
// Position the camera to capture a wider view suitable for larger waves
camera.position.set(0, 50, 150);  // Move camera further to capture larger waves

// Orbit Controls
// Enable user interaction with the scene (e.g., zoom, rotate)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;            // Enable smooth damping (inertia)
controls.dampingFactor = 0.05;            // Damping factor for inertia
controls.screenSpacePanning = false;      // Disable panning in screen space
controls.minDistance = 50;                // Set minimum zoom distance
controls.maxDistance = 500;               // Set maximum zoom distance
controls.maxPolarAngle = Math.PI / 2;     // Limit vertical rotation to prevent flipping

// Lighting
// Add soft ambient light for a stormy atmosphere
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);  // Soft ambient light for stormy atmosphere
scene.add(ambientLight);

// Add directional light to simulate sunlight breaking through clouds
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);  // Simulate sunlight breaking through clouds
directionalLight.position.set(-1, 1, 1);  // Position the light source
scene.add(directionalLight);

// Water setup (darker water with bigger waves)
// Create a large plane geometry to represent the water surface
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

// Create the water object with specified properties for a stormy effect
const water = new Water(waterGeometry, {
    textureWidth: 512,  // Width of the water normal texture
    textureHeight: 512, // Height of the water normal texture
    waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Repeat the texture to cover the plane
    }),
    sunDirection: new THREE.Vector3(),    // Direction of the simulated sun
    sunColor: 0xffffff,                   // Color of the sun
    waterColor: 0x0a0a0a,                 // Darker water color for stormy effect
    distortionScale: 10.0,                // Larger distortion for bigger waves
    fog: scene.fog !== undefined,         // Enable fog if it's defined in the scene
});

// Rotate the water plane to be horizontal
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Sky setup (cloudy and stormy)
// Create a sky object and scale it to cover the scene
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

// Access the sky material's uniforms to adjust atmospheric parameters
const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 50;          // Increase turbidity for more dense clouds
skyUniforms['rayleigh'].value = 0.5;          // Reduce scattering for a darker stormy sky
skyUniforms['mieCoefficient'].value = 0.1;    // Increase for a more diffused look
skyUniforms['mieDirectionalG'].value = 0.9;   // High value for more light scattering

// Create a PMREM (Pre-filtered Mipmapped Radiance Environment Map) generator for environment mapping
const pmremGenerator = new THREE.PMREMGenerator(renderer);

// Set parameters for sun position
const parameters = {
    elevation: 1,   // Low sun elevation to enhance stormy effect
    azimuth: 200    // Sun azimuth angle
};

// Update sun position based on sky parameters
function updateSun() {
    // Convert elevation and azimuth angles to spherical coordinates
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    // Calculate sun position vector
    const sunPosition = new THREE.Vector3();
    sunPosition.setFromSphericalCoords(1, phi, theta);

    // Update the sun position in the sky shader
    sky.material.uniforms['sunPosition'].value.copy(sunPosition);

    // Update the sun direction in the water shader
    water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

    // Update the environment map for realistic reflections
    scene.environment = pmremGenerator.fromScene(sky).texture;
}

// Call the function to apply the sun position updates
updateSun();

// Animation loop
function animate() {
    requestAnimationFrame(animate);  // Request the next frame

    // Update the water time uniform to animate the waves
    water.material.uniforms['time'].value += 1.0 / 50.0;  // Slower, more intense waves

    controls.update();               // Update the orbit controls
    renderer.render(scene, camera);  // Render the scene from the perspective of the camera
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;  // Update camera aspect ratio
    camera.updateProjectionMatrix();                         // Update projection matrix
    renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer size
});

// Start animation
animate();
