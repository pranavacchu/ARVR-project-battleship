import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.shadowMap.enabled = false;
renderer.sortObjects = true;
document.body.appendChild(renderer.domElement);

// Set camera position
camera.position.set(0, 50, 100);
camera.lookAt(0, 0, 0);

// Custom shader for glowing effect
const glowVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  void main() {
    float brightness = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(glowColor * intensity * brightness, 1.0);
  }
`;

// Create a custom grid that's thicker and glows
function createCustomGrid(size, divisions) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const step = size / divisions;

    for (let i = 0; i <= divisions; i++) {
        const line = i * step - size / 2;
        vertices.push(-size / 2, 0, line, size / 2, 0, line);
        vertices.push(line, 0, -size / 2, line, 0, size / 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            glowColor: { value: new THREE.Color(0x00ffff) },
            intensity: { value: 2.5 }
        },
        vertexShader: glowVertexShader,
        fragmentShader: glowFragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false
    });

    const grid = new THREE.LineSegments(geometry, material);
    grid.position.y = 1;
    grid.renderOrder = 2;
    grid.receiveShadow = false;
    grid.castShadow = false;

    return grid;
}

const customGrid = createCustomGrid(80, 8);
scene.add(customGrid);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(-1, 1, 1);
directionalLight.castShadow = false;
scene.add(directionalLight);

// Create Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
});

// Completely disable reflections and make water opaque
water.material.uniforms.reflectivity = { value: 0 };
water.material.uniforms.opacity = { value: 1.0 };
water.rotation.x = -Math.PI / 2;
water.material.transparent = false;
scene.add(water);

// Add Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
    elevation: 2,
    azimuth: 180
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);

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

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2;

// Configure mouse buttons
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.DOLLY
};

// Render loop
function animate() {
    requestAnimationFrame(animate);
    water.material.uniforms['time'].value += 1.0 / 60.0;
    controls.update();

    // Update grid glow intensity
    const time = Date.now() * 0.001;
    customGrid.material.uniforms.intensity.value = 2.5 + Math.sin(time) * 0.5;

    // Clear depth buffer before rendering
    renderer.clearDepth();
    
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});