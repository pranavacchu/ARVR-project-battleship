import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import ShipStore from './ShipStore.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import FireBall from './FireBall.js';
import gameManager from './gameManager.js';
import EnemyShips from './EnemyShips.js';
import turnManager from './1v1.js';
import winCondition from './win.js';
import attackTracker from './AttackTracker.js';

// Declare variables for enemy ships manager and enemy text
let enemyShipsManager;
let enemyText;

// Initialize game manager and set up the game
gameManager.initialize().then(async () => {
  // Update the player's page to '/game.js'
  gameManager.updatePlayerPage('/game.js');

  // Load player's stored ships onto the scene
  await loadStoredShips();

  // Initialize turn manager with the player's ID
  await turnManager.initialize(gameManager.playerId);

  // Initialize win condition with the player's ID
  await winCondition.initialize(gameManager.playerId);

  // Create a new instance of EnemyShips and store it in the global variable
  enemyShipsManager = new EnemyShips(scene, gameManager.playerId);

  // Load the enemy ships onto the scene
  await enemyShipsManager.loadEnemyShips();

  // Initialize attack tracker after grid squares are created
  attackTracker.initialize(gameManager.playerId, gridSquares);
});

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();

// Create a perspective camera with FOV 75, aspect ratio based on window size, near and far clipping planes
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

// Create the WebGL renderer with antialiasing enabled
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Set the size of the renderer to match the window size
renderer.setSize(window.innerWidth, window.innerHeight);

// Configure tone mapping and exposure for realistic lighting
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

// Add the renderer's canvas element to the HTML document body
document.body.appendChild(renderer.domElement);

// Set the initial position of the camera and point it towards the center of the scene
camera.position.set(200, 200, 500);
camera.lookAt(0, 0, 0);

// Set up orbit controls to allow user interaction with the scene
const controls = new OrbitControls(camera, renderer.domElement);

// Enable damping (inertia) for smooth camera movement
controls.enableDamping = true;
controls.dampingFactor = 0.05; // Reduced from 0.05 for smoother movement

// Allow panning in screen space
controls.screenSpacePanning = true;

// Set minimum and maximum distances for zooming
controls.minDistance = 50;
controls.maxDistance = 800; // Increased from 500 for more zoom out range

// Limit vertical rotation to prevent flipping
controls.maxPolarAngle = Math.PI / 2;

// Set rotation speed of the camera
controls.rotateSpeed = 0.5;

// Add ambient light to the scene for general illumination
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

// Add a directional light to simulate sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-1, 1, 1);
scene.add(directionalLight);

// Create a plane geometry for the water surface
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

// Create the water object with properties
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  // Load water normal textures for waves effect
  waterNormals: new THREE.TextureLoader().load(
    'https://threejs.org/examples/textures/waternormals.jpg',
    function (texture) {
      // Set texture wrapping to repeat
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  ),
  sunDirection: new THREE.Vector3(), // Will be set later
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: scene.fog !== undefined, // Use scene's fog if available
});

// Rotate the water to be horizontal
water.rotation.x = -Math.PI / 2;

// Add the water to the scene
scene.add(water);

// Create the sky object
const sky = new Sky();

// Scale the sky to cover the entire scene
sky.scale.setScalar(10000);

// Add the sky to the scene
scene.add(sky);

// Access the sky material uniforms to adjust atmospheric parameters
const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;           // Cloudiness
skyUniforms['rayleigh'].value = 2;             // Amount of atmospheric scattering
skyUniforms['mieCoefficient'].value = 0.005;   // Scattering coefficient
skyUniforms['mieDirectionalG'].value = 0.8;    // Directional scattering

// Parameters for sun position
const parameters = {
  elevation: 2,   // Elevation angle
  azimuth: 180,   // Azimuth angle
};

// Create a PMREMGenerator for environment mapping
const pmremGenerator = new THREE.PMREMGenerator(renderer);

// Function to update the sun position based on parameters
function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  const sunPosition = new THREE.Vector3();
  sunPosition.setFromSphericalCoords(1, phi, theta);

  // Update sun position in sky shader
  sky.material.uniforms['sunPosition'].value.copy(sunPosition);

  // Update sun direction in water shader
  water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

  // Update scene environment for realistic reflections
  scene.environment = pmremGenerator.fromScene(sky).texture;
}

// Initialize sun position
updateSun();

// Define grid settings
const gridSize = 300; // Size of the larger grid
const divisions = 8;  // Number of divisions in the grid
const boxSize = gridSize / divisions; // Size of each box in the grid

// Set up raycaster and mouse vector for detecting mouse interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Array to store grid square meshes
const gridSquares = [];

// Function to create a grid with a helper and an underlying plane for visibility
function createGrid(size, divisions, color) {
  // Create the grid helper
  const gridHelper = new THREE.GridHelper(size, divisions, color, color);
  gridHelper.position.y = 0.1; // Slightly above the ground to avoid z-fighting

  // Create a plane geometry to go under the grid
  const planeGeometry = new THREE.PlaneGeometry(size, size);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  });
  const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  planeMesh.position.y = 0.05; // Slightly below the grid

  // Group the grid and plane together
  const gridGroup = new THREE.Group();
  gridGroup.add(gridHelper);
  gridGroup.add(planeMesh);

  return gridGroup;
}

// Create two grids for the game: one for the player and one for the enemy

// Create the player's grid (right side)
const smallGrid = createGrid(400, 8, 0x000000);
smallGrid.position.set(150, 0, 0); // Position the grid to the right

// Create the enemy's grid (left side)
const largeGrid = createGrid(400, 8, 0x000000);
largeGrid.position.set(-330, 0, 0); // Position the grid to the left

// Add both grids to the scene
scene.add(smallGrid);
scene.add(largeGrid);

// Function to create selectable grid squares for both grids
function createGridSquares() {
  const gridSize = 400; // Match the new grid size used in grids
  const boxSize = gridSize / divisions; // Calculate the size of each square

  // Define offsets for the enemy and player grids
  const gridOffsets = [-330, 150]; // Left grid (enemy), right grid (player)

  // Loop over both grids
  gridOffsets.forEach(offsetX => {
    // Loop over grid divisions to create squares
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        // Create a plane geometry for the square
        const squareGeometry = new THREE.PlaneGeometry(boxSize, boxSize);
        const squareMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
        });
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        square.position.set(
          (i - divisions / 2 + 0.5) * boxSize + offsetX,
          0.2,
          (j - divisions / 2 + 0.5) * boxSize
        );
        square.visible = false; // Hide the square initially

        // Add a custom property to identify which grid this square belongs to
        square.userData.gridType = offsetX === -330 ? 'enemy' : 'player';

        // Add the square to the scene and the gridSquares array
        scene.add(square);
        gridSquares.push(square);
      }
    }
  });
}

// Create the grid squares
createGridSquares();

// Event handler for mouse movement to update mouse coordinates
function onMouseMove(event) {
  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Event handler for mouse click events
async function onMouseClick(event) {
  // Only proceed if the left mouse button was clicked
  if (event.button !== 0) return;

  // Update mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Set up raycaster based on mouse position and camera
  raycaster.setFromCamera(mouse, camera);

  // Find intersected objects with the grid squares
  const intersects = raycaster.intersectObjects(gridSquares);

  if (intersects.length > 0) {
    const selectedSquare = intersects[0].object;

    // Prevent clicks on the player's grid (right grid)
    if (selectedSquare.userData.gridType === 'player') {
      return;
    }

    // Check if the player can make a move (e.g., it's their turn)
    const canMakeMove = await turnManager.handleSquareClick(selectedSquare.position);

    if (canMakeMove) {
      // Check if the selected position has an enemy ship
      const isHit = enemyShipsManager.isShipAtPosition(selectedSquare.position);

      // Record the attack in the attack tracker
      await attackTracker.recordAttack(selectedSquare.position, isHit);

      // Update the square's appearance based on hit or miss
      selectedSquare.material.color.setHex(isHit ? 0xff0000 : 0xffffff); // Red for hit, white for miss
      selectedSquare.material.opacity = 0.5;
      selectedSquare.visible = true;

      if (isHit) {
        // Create a fireball effect at the hit position
        const fireball = new FireBall(scene, selectedSquare.position, boxSize);

        // Handle the hit on the enemy ship
        enemyShipsManager.handleHit(selectedSquare.position);

        // Increment the hit count for win condition checking
        await winCondition.incrementHits();

        // Reveal the hit ship's parts
        enemyShipsManager.enemyShips.forEach(ship => {
          if (enemyShipsManager.isShipAtPosition(selectedSquare.position)) {
            ship.traverse((child) => {
              if (child.isMesh && child.position.distanceTo(selectedSquare.position) < boxSize) {
                child.visible = true;
              }
            });
          }
        });
      }
    }
  }
}

// Add event listeners for mouse movement and clicks
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);

// Load font and create 3D text for "Enemy Coordinates"
const loader = new FontLoader();
loader.load(
  'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
  function (font) {
    // Create the text geometry
    const textGeometry = new TextGeometry('Enemy Coordinates', {
      font: font,
      size: 20,
      height: 2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.3,
      bevelSegments: 3,
    });

    // Center the text geometry
    textGeometry.computeBoundingBox();
    const centerOffset = new THREE.Vector3();
    centerOffset.x =
      -(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
    textGeometry.translate(centerOffset.x, 0, 0);

    // Create material with emissive properties for better visibility
    const textMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x444444,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Create the text mesh
    enemyText = new THREE.Mesh(textGeometry, textMaterial);

    // Create a container for the text that will handle positioning
    const textContainer = new THREE.Group();
    textContainer.add(enemyText);

    // Set the initial position of the text container above the enemy grid
    textContainer.position.set(-350, 40, -230); // Increased y value to 40

    // Add the text container to the scene
    scene.add(textContainer);
  }
);

// Create a div element for the "BATTLESHIP" logo
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

// Add the logo to the HTML document body
document.body.appendChild(logo);

// Animation loop function
function animate() {
  // Request the next frame of the animation
  requestAnimationFrame(animate);

  // Update the water time uniform for animated water effect
  water.material.uniforms['time'].value += 1.0 / 60.0;

  // Update the orbit controls
  controls.update();

  // Update enemy ships if the manager exists
  if (enemyShipsManager) {
    enemyShipsManager.update();
  }

  // Update the rotation of the enemy text to always face the camera
  if (enemyText) {
    // Get camera position
    const cameraPosition = camera.position;

    // Calculate angle to camera in XZ plane
    const angleToCamera = Math.atan2(
      cameraPosition.x - enemyText.parent.position.x,
      cameraPosition.z - enemyText.parent.position.z
    );

    // Rotate the text container to face the camera
    enemyText.parent.rotation.y = angleToCamera;

    // Set a slight upward tilt for the text
    enemyText.rotation.x = -Math.PI / 8;

    // Keep the text at a consistent height above the water
    enemyText.parent.position.y = 40;
  }

  // Update raycaster for mouse interaction
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(gridSquares);

  // Hide all non-selected grid squares (except those marked as hit or miss)
  gridSquares.forEach((square) => {
    if (
      square.visible &&
      square.material.color.getHex() !== 0xffffff &&
      square.material.color.getHex() !== 0xff0000
    ) {
      square.material.opacity = 0.2;
      square.visible = false;
    }
  });

  // Highlight the grid square under the mouse cursor
  if (intersects.length > 0) {
    const hoveredSquare = intersects[0].object;
    if (
      hoveredSquare.userData.gridType !== 'player' && // Ensure it's not the player's grid
      hoveredSquare.material.color.getHex() !== 0xff0000 && // Not already hit
      hoveredSquare.material.color.getHex() !== 0xffffff && // Not already missed
      turnManager.canClick() // It's the player's turn
    ) {
      hoveredSquare.material.opacity = 0.5;
      hoveredSquare.visible = true;
    }
  }

  // Render the scene from the perspective of the camera
  renderer.render(scene, camera);
}

// Event listener to handle window resize events
window.addEventListener('resize', () => {
  // Update camera aspect ratio and projection matrix
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer size to match new window size
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Function to load stored ships from ShipStore and add them to the scene
async function loadStoredShips() {
  const loader = new GLTFLoader();
  const shipData = await ShipStore.getShips();

  shipData.forEach((shipInfo) => {
    // Load each ship model
    loader.load(shipInfo.modelPath, (gltf) => {
      const ship = gltf.scene;

      // Set the ship's position (offset to match the player's grid position)
      ship.position.set(
        shipInfo.position.x + 150, // Offset to match small grid position
        shipInfo.position.y,
        shipInfo.position.z
      );

      // Set the ship's rotation
      ship.rotation.set(
        shipInfo.rotation.x,
        shipInfo.rotation.y,
        shipInfo.rotation.z
      );

      // Set the ship's scale
      ship.scale.set(shipInfo.scale.x, shipInfo.scale.y, shipInfo.scale.z);

      // Add the ship to the scene
      scene.add(ship);
    });
  });
}

// Load the stored ships onto the scene
loadStoredShips();

// Render the scene once to ensure proper initial display
renderer.render(scene, camera);

// Start the animation loop
animate();
