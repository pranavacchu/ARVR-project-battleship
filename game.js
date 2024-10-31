import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import ShipStore from './ShipStore.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
let enemyText;


// Scene, Camera, Renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

camera.position.set(-100, 200, 400);
camera.lookAt(0, 0, 0);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;  // Reduced from 0.05 for smoother movement
controls.screenSpacePanning = true;
controls.minDistance = 50;
controls.maxDistance = 800;    // Increased from 500 for more zoom out range
controls.maxPolarAngle = Math.PI / 2;
controls.rotateSpeed = 0.5; 

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-1, 1, 1);
scene.add(directionalLight);

// Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/waternormals.jpg',
        function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

// Sky
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
    azimuth: 180,
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

// Grid settings
const gridSize = 300; // Size of the larger grid
const divisions = 8;
const boxSize = gridSize / divisions;

// Raycaster and mouse setup for grid selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const gridSquares = [];

// Updated grid creation function
function createGrid(size, divisions, color) {
    const gridHelper = new THREE.GridHelper(size, divisions, color, color);
    gridHelper.position.y = 0.1;
    
    // Add a plane underneath the grid for better visibility
    const planeGeometry = new THREE.PlaneGeometry(size, size);
    const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
    });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.y = 0.05;

    // Create a group to hold both the grid and the plane
    const gridGroup = new THREE.Group();
    gridGroup.add(gridHelper);
    gridGroup.add(planeMesh);

    return gridGroup;
}


// Create grids with 8x8 divisions
const smallGrid = createGrid(400, 8, 0x000000);
smallGrid.position.set(150, 0, 0);  // Moved to the right

const largeGrid = createGrid(400, 8, 0x000000);
largeGrid.position.set(-330, 0, 0);  // Moved to the left

// Add grids to the scene
scene.add(smallGrid);
scene.add(largeGrid);

// Create grid squares for selection
function createGridSquares() {
    const gridSize = 400; // Match the new grid size
    const boxSize = gridSize / divisions;
    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const squareGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
            const squareMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const square = new THREE.Mesh(squareGeometry, squareMaterial);
            square.rotation.x = -Math.PI / 2;
            square.position.set(
                (i - divisions / 2 + 0.5) * boxSize - 330,
                0.2,
                (j - divisions / 2 + 0.5) * boxSize
            );
            square.visible = false;
            scene.add(square);
            gridSquares.push(square);
        }
    }
}

createGridSquares();

// Mouse move event handler
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Mouse click event handler
function onMouseClick(event) {
    if (event.button !== 0) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(gridSquares);
    if (intersects.length > 0) {
        const selectedSquare = intersects[0].object;
        selectedSquare.material.color.setHex(0xffffff);
        selectedSquare.material.opacity = 0.5;
        selectedSquare.visible = true;
    }
}

// Add event listeners
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);

// Create 3D text for "Enemy Coordinates"
const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
    const textGeometry = new TextGeometry('Enemy Coordinates', {
        font: font,
        size: 20,
        height: 2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.3,
        bevelSegments: 3
    });

    // Center the text geometry
    textGeometry.computeBoundingBox();
    const centerOffset = new THREE.Vector3();
    centerOffset.x = -(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
    textGeometry.translate(centerOffset.x, 0, 0);

    // Create material with emissive properties for better visibility
    const textMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x000000,
        emissive: 0x444444,
        side: THREE.DoubleSide,
        flatShading: true
    });

    // Create the text mesh
    enemyText = new THREE.Mesh(textGeometry, textMaterial);
    
    // Create a container for the text that will handle positioning
    const textContainer = new THREE.Group();
    textContainer.add(enemyText);
    
    // Initial position - higher above water
    textContainer.position.set(-350, 40, -230); // Increased y value to 40
    
    // Add container to scene
    scene.add(textContainer);
});
// Create Battleship logo
const logo = document.createElement('div');
logo.textContent = 'BATTLESHIP';
logo.style.position = 'absolute';
logo.style.top = '20px';
logo.style.right = '20px';
logo.style.color = 'white';
logo.style.fontFamily = 'Impact, Arial, sans-serif';
logo.style.fontSize = '48px';
logo.style.fontWeight = 'bold';
logo.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
logo.style.background = 'linear-gradient(to bottom, #000508, #0582a5)';
logo.style.webkitBackgroundClip = 'text';
logo.style.webkitTextFillColor = 'transparent';

// Add the logo to the document body
document.body.appendChild(logo);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    water.material.uniforms['time'].value += 1.0 / 60.0;
    controls.update();

    // Update text rotation if it exists
    if (enemyText) {
        // Get camera position
        const cameraPosition = camera.position;
        
        // Calculate angle to camera in XZ plane
        const angleToCamera = Math.atan2(
            cameraPosition.x - enemyText.parent.position.x,
            cameraPosition.z - enemyText.parent.position.z
        );

        // Update text parent rotation
        enemyText.parent.rotation.y = angleToCamera;
        
        // Maintain a constant upward tilt
        enemyText.rotation.x = -Math.PI / 8;
        
        // Ensure text maintains height above water
        enemyText.parent.position.y = 40;
    }

    // Rest of your existing animate code
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(gridSquares);
    
    gridSquares.forEach(square => {
        if (square.visible && square.material.color.getHex() !== 0xffffff) {
            square.material.opacity = 0.2;
            square.visible = false;
        }
    });
    
    if (intersects.length > 0) {
        const hoveredSquare = intersects[0].object;
        if (hoveredSquare.material.color.getHex() !== 0xffffff) {
            hoveredSquare.material.opacity = 0.5;
            hoveredSquare.visible = true;
        }
    }

    renderer.render(scene, camera);
}
// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
function loadStoredShips() {
    const loader = new GLTFLoader();
    const shipData = ShipStore.getShips();
    
    shipData.forEach(shipInfo => {
        loader.load(shipInfo.modelPath, (gltf) => {
            const ship = gltf.scene;
            
            // Set position
            ship.position.set(
                shipInfo.position.x + 150,  // Offset to match small grid position
                shipInfo.position.y,
                shipInfo.position.z
            );
            
            // Set rotation
            ship.rotation.set(
                shipInfo.rotation.x,
                shipInfo.rotation.y,
                shipInfo.rotation.z
            );
            
            // Set scale
            ship.scale.set(
                shipInfo.scale.x,
                shipInfo.scale.y,
                shipInfo.scale.z
            );
            
            scene.add(ship);
        });
    });
}
loadStoredShips();
// Ensure proper initial render
renderer.render(scene, camera);

// Start animation
animate();