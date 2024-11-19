// Importing core Three.js library
import * as THREE from 'three';

// Importing OrbitControls for camera manipulation
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Importing Water and Sky objects for scene environment
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Importing GLTFLoader for loading 3D models in glTF format
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Importing post-processing modules for visual effects
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Importing custom modules and assets
import ShipStore from './ShipStore.js';
import boxship3Url from './3boxship.glb?url';
import bluruDestroyerUrl from './blurudestroyer.glb?url';
import submarineUrl from './submarine.glb?url';
import bigShipUrl from './bigShip.glb?url';
import maritimeDroneUrl from './maritimedrone.glb?url';
import gameManager from './gameManager.js';

// Initialize the game manager and update the player's page
gameManager.initialize().then(() => {
  gameManager.updatePlayerPage('/main.js');
});

// Object to track occupied coordinates and previous position for ship placement
const occupiedCoordinates = {};
let previousPosition = null;

// Create the main scene
const scene = new THREE.Scene();

// Set up the camera with perspective projection
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  10000 // Far clipping plane
);

// Create the renderer and configure settings
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tone mapping for realistic lighting
renderer.toneMappingExposure = 0.5; // Exposure adjustment
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Type of shadow mapping
document.body.appendChild(renderer.domElement); // Add renderer to the DOM

// Variables for user interaction
let selectedShip = null; // Currently selected ship
let isDragging = false; // Flag for dragging state
let isRightMouseDown = false; // Flag for right mouse button state

// Create a raycaster and mouse vector for interaction detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Set up post-processing composer for visual effects
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add UnrealBloomPass for bloom/glow effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5, // Strength
  0.4, // Radius
  0.85 // Threshold
);
composer.addPass(bloomPass);

// Set initial camera position and orientation
camera.position.set(0, 200, 400);
camera.lookAt(0, 0, 0);

// Grid settings for ship placement area
const gridSize = 400; // Size of the grid
const divisions = 8; // Number of divisions in the grid
const boxSize = gridSize / divisions; // Size of each grid box

// Function to enhance materials of models for better visuals
function enhanceModelMaterials(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true; // Enable casting shadows
      child.receiveShadow = true; // Enable receiving shadows

      if (child.material) {
        child.material.side = THREE.FrontSide; // Render only the front side
        child.material.transparent = false; // Disable transparency
        child.material.opacity = 1.0; // Full opacity
        child.material.metalness = 0.8; // Metallic appearance
        child.material.roughness = 0.2; // Smooth surface
        child.material.envMapIntensity = 1.5; // Environment map intensity
      }
    }
  });
}

// Array to store all ships in the scene
const ships = [];

// Variables for ship models
let ship, submarine;

// Create a GLTFLoader instance for loading models
const loader = new GLTFLoader();

// Load the big ship model
loader.load(
  bigShipUrl, // URL of the big ship model
  function (gltf) {
    const bigship = gltf.scene;
    bigship.userData.modelPath = 'bigShip.glb'; // Store model path for later use

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 6; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(bigship);
    const bigshipWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / bigshipWidth;
    bigship.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position the big ship on the grid
    bigship.position.set(
      gridSize / 5 + boxSize * -3.1,
      1, // Slightly above the water
      gridSize / 15 + boxSize * 2
    );

    // Rotate the ship to align with the grid
    bigship.rotation.y = 0;
    bigship.userData.isShip = true; // Mark as ship for interaction
    enhanceModelMaterials(bigship); // Enhance materials
    ships.push(bigship); // Add to ships array
    scene.add(bigship); // Add to scene
    bigship.rotation.y += Math.PI / 2; // Adjust rotation

    // Mark the ship's position as occupied on the grid
    markPositionAsOccupied(bigship);
  },
  function (xhr) {
    console.log('bigship: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the bigship:', error);
  }
);

// Load the Bluru Destroyer model
loader.load(
  bluruDestroyerUrl, // URL of the Bluru Destroyer model
  function (gltf) {
    const bldestroyer = gltf.scene;
    bldestroyer.userData.modelPath = 'blurudestroyer.glb'; // Store model path

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 7.5; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(bldestroyer);
    const bldestWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / bldestWidth;
    bldestroyer.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position the destroyer on the grid
    bldestroyer.position.set(
      gridSize / 2 + boxSize * -6.5,
      1,
      -gridSize / 2 + boxSize * 2
    );

    // Rotate the ship to align with the grid
    bldestroyer.rotation.y = Math.PI / 2;
    bldestroyer.userData.isShip = true; // Mark as ship
    enhanceModelMaterials(bldestroyer); // Enhance materials
    ships.push(bldestroyer); // Add to ships array
    scene.add(bldestroyer); // Add to scene
    bldestroyer.rotation.y += Math.PI / 2; // Adjust rotation

    // Mark the ship's position as occupied on the grid
    markPositionAsOccupied(bldestroyer);
  },
  function (xhr) {
    console.log(
      'Bluru Destroyer: ' + (xhr.loaded / xhr.total) * 100 + '% loaded'
    );
  },
  function (error) {
    console.error('An error occurred loading the Bluru Destroyer:', error);
  }
);

// Set to keep track of occupied positions for collision detection
const occupiedPositions = new Set();

// Load the submarine model
loader.load(
  submarineUrl, // URL of the submarine model
  function (gltf) {
    const submarine = gltf.scene;
    submarine.userData.modelPath = 'submarine.glb'; // Store model path

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 8; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(submarine);
    const submarineWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / submarineWidth;
    submarine.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position the submarine on the grid
    submarine.position.set(
      -gridSize / 8 + boxSize * 2,
      1,
      -gridSize / 2 + boxSize / 2
    );

    // Rotate the submarine to align with the grid
    submarine.rotation.y = 0;
    submarine.userData.isShip = true; // Mark as ship
    enhanceModelMaterials(submarine); // Enhance materials
    ships.push(submarine); // Add to ships array
    scene.add(submarine); // Add to scene
    submarine.rotation.y += Math.PI / 2; // Adjust rotation

    // Mark the submarine's position as occupied on the grid
    markPositionAsOccupied(submarine);
  },
  function (xhr) {
    console.log('submarine: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the submarine:', error);
  }
);

// Load the Box Ship model
loader.load(
  boxship3Url, // URL of the 3-box ship model
  function (gltf) {
    const boxShip = gltf.scene;
    boxShip.userData.modelPath = '3boxship.glb'; // Store model path

    // Set scale to fit within three grid boxes
    const desiredWidth = boxSize * 3; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(boxShip);
    const boxShipWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / boxShipWidth;
    boxShip.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position the box ship on the grid
    boxShip.position.set(
      gridSize / 10 + boxSize * 1.7,
      1,
      gridSize / 7 + boxSize / 2
    );

    // Rotate the box ship to align with the grid
    boxShip.rotation.y = Math.PI / 2;
    boxShip.userData.isShip = true; // Mark as ship
    enhanceModelMaterials(boxShip); // Enhance materials
    ships.push(boxShip); // Add to ships array
    scene.add(boxShip); // Add to scene
    submarine.rotation.y += Math.PI / 2; // Adjust rotation

    // Mark the box ship's position as occupied on the grid
    markPositionAsOccupied(boxShip);
  },
  function (xhr) {
    console.log('3Box Ship: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the 3Box Ship:', error);
  }
);

// Load the Maritime Drone model
loader.load(
  maritimeDroneUrl, // URL of the maritime drone model
  function (gltf) {
    const maritimeDrone = gltf.scene;
    maritimeDrone.userData.modelPath = 'maritimedrone.glb'; // Store model path

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 4; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(maritimeDrone);
    const droneWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / droneWidth;
    maritimeDrone.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position the maritime drone on the grid
    const dronePosition = new THREE.Vector3(
      -gridSize / 6 + boxSize * 1.5,
      -5,
      -gridSize / 7 + boxSize / 1.5
    );

    // Snap the position to the grid
    const snappedPosition = snapToGrid(dronePosition);
    maritimeDrone.position.copy(snappedPosition);

    // Rotate the drone to align with the grid
    maritimeDrone.rotation.y = Math.PI / 2;
    maritimeDrone.userData.isShip = true; // Mark as ship
    enhanceModelMaterials(maritimeDrone); // Enhance materials

    // Add the maritime drone to the ships array
    ships.push(maritimeDrone);

    scene.add(maritimeDrone); // Add to scene

    // Mark the drone's position as occupied on the grid
    markPositionAsOccupied(maritimeDrone);
  },
  function (xhr) {
    console.log(
      'Maritime drone: ' + (xhr.loaded / xhr.total) * 100 + '% loaded'
    );
  },
  function (error) {
    console.error('An error occurred loading the maritime drone:', error);
  }
);

// Custom shaders for glow effect on the grid
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

// Initialize occupied positions after all ships are loaded
function initializeOccupiedPositions() {
  ships.forEach(ship => markPositionAsOccupied(ship));
}

// Call the function to initialize occupied positions
initializeOccupiedPositions();

// Function to check if a ship overlaps with any other ships
function checkShipOverlap(ship) {
  const shipBoundingBox = new THREE.Box3().setFromObject(ship);
  for (const otherShip of ships) {
    if (otherShip !== ship) {
      const otherBoundingBox = new THREE.Box3().setFromObject(otherShip);
      if (shipBoundingBox.intersectsBox(otherBoundingBox)) {
        return true; // Overlap detected
      }
    }
  }
  return false; // No overlap
}

// Function to create a custom grid with glowing lines
function createCustomGrid(size, divisions) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const step = size / divisions;

  // Generate grid lines
  for (let i = 0; i <= divisions; i++) {
    const line = i * step - size / 2;
    // Horizontal lines
    vertices.push(-size / 2, 0, line, size / 2, 0, line);
    // Vertical lines
    vertices.push(line, 0, -size / 2, line, 0, size / 2);
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  // Create shader material with custom glow effect
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x00ffff) }, // Glow color
      intensity: { value: 2.5 }, // Glow intensity
    },
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Create the grid as line segments
  const grid = new THREE.LineSegments(geometry, material);
  grid.position.y = 0.1; // Slightly above the ground
  scene.add(grid); // Add grid to the scene
  return grid;
}

// Create and add the custom grid to the scene
const customGrid = createCustomGrid(gridSize, divisions);

// Set up ambient light for general illumination
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

// Set up directional light to simulate sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-1, 1, 1);
directionalLight.castShadow = true; // Enable shadows
directionalLight.shadow.mapSize.width = 2048; // Shadow map size
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5; // Shadow camera settings
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Add point lights for additional dynamic lighting
const pointLight1 = new THREE.PointLight(0x3366ff, 1, 100);
pointLight1.position.set(20, 20, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff6633, 1, 100);
pointLight2.position.set(-20, 20, -20);
scene.add(pointLight2);

// Create water surface using Water object
const waterGeometry = new THREE.PlaneGeometry(10000, 10000); // Large plane for water
const water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  // Load normal map for water surface
  waterNormals: new THREE.TextureLoader().load(
    'https://threejs.org/examples/textures/waternormals.jpg',
    function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Repeat texture
    }
  ),
  sunDirection: new THREE.Vector3(), // Will be set later
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7, // Distortion of the water surface
  fog: scene.fog !== undefined, // Use scene fog if available
});

// Adjust water properties
water.material.uniforms.reflectivity = { value: 0.2 }; // Reduce reflectivity
water.rotation.x = -Math.PI / 2; // Rotate to be horizontal
water.position.y = 0; // Position at y = 0
scene.add(water); // Add water to the scene

// Create the sky background
const sky = new Sky();
sky.scale.setScalar(10000); // Scale sky to cover the scene
scene.add(sky);

// Configure sky shader uniforms for atmospheric effects
const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10; // Cloudiness
skyUniforms['rayleigh'].value = 2; // Amount of atmospheric scattering
skyUniforms['mieCoefficient'].value = 0.005; // Scattering coefficient
skyUniforms['mieDirectionalG'].value = 0.8; // Directional scattering

// Parameters for sun position in the sky
const parameters = {
  elevation: 2, // Elevation angle
  azimuth: 180, // Azimuth angle
};

// Initialize PMREMGenerator for environment map generation
const pmremGenerator = new THREE.PMREMGenerator(renderer);

// Function to update the sun's position and related environmental effects
function updateSun() {
  // Convert elevation and azimuth angles to spherical coordinates
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  // Calculate the sun's position in 3D space
  const sunPosition = new THREE.Vector3();
  sunPosition.setFromSphericalCoords(1, phi, theta);

  // Update the sun position in the sky shader
  sky.material.uniforms['sunPosition'].value.copy(sunPosition);

  // Update the sun direction in the water shader
  water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

  // Update the scene's environment for realistic lighting and reflections
  scene.environment = pmremGenerator.fromScene(sky).texture;
}

// Call the function to initialize the sun's position
updateSun();

// Modify the OrbitControls setup for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping for smooth motion
controls.dampingFactor = 0.05; // Damping factor for inertia
controls.screenSpacePanning = true; // Allow panning in screen space
controls.minDistance = 50; // Minimum zoom distance
controls.maxDistance = 500; // Maximum zoom distance
controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation to prevent flipping
let isRotating = false; // Flag to check if rotation is happening

// Set up mouse button controls for OrbitControls
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE, // Left-click to rotate
  MIDDLE: THREE.MOUSE.PAN,   // Middle-click to pan
  RIGHT: THREE.MOUSE.DOLLY,  // Right-click to zoom
};

// Function to snap a position to the nearest grid point
function snapToGrid(position) {
  const halfBoxSize = boxSize / 2;
  const halfGridSize = gridSize / 2;

  // Clamp the position within the grid bounds
  const clampedX = Math.max(-halfGridSize + halfBoxSize, Math.min(halfGridSize - halfBoxSize, position.x));
  const clampedZ = Math.max(-halfGridSize + halfBoxSize, Math.min(halfGridSize - halfBoxSize, position.z));

  // Snap the position to the nearest grid intersection
  return new THREE.Vector3(
    Math.round((clampedX - halfBoxSize) / boxSize) * boxSize + halfBoxSize,
    position.y,
    Math.round((clampedZ - halfBoxSize) / boxSize) * boxSize + halfBoxSize
  );
}

// Function to check if a ship is within the grid boundaries
function isWithinGridBounds(position, ship) {
  const halfGridSize = gridSize / 2;
  const bbox = new THREE.Box3().setFromObject(ship);
  const shipHalfWidth = (bbox.max.x - bbox.min.x) / 2;
  const shipHalfLength = (bbox.max.z - bbox.min.z) / 2;

  // Check if the ship's bounding box is entirely within the grid
  return (
    position.x - shipHalfWidth >= -halfGridSize &&
    position.x + shipHalfWidth <= halfGridSize &&
    position.z - shipHalfLength >= -halfGridSize &&
    position.z + shipHalfLength <= halfGridSize
  );
}

// Function to get the size of a ship in grid units
function getShipSize(ship) {
  const bbox = new THREE.Box3().setFromObject(ship);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  return {
    width: Math.round(size.x / boxSize), // Ship width in grid units
    length: Math.round(size.z / boxSize), // Ship length in grid units
    centerOffsetX: center.x - ship.position.x, // Offset from ship's position to center
    centerOffsetZ: center.z - ship.position.z,
  };
}

// Function to check if a grid position is already occupied
function isPositionOccupied(position, shipSize = 1) {
  const snappedPosition = snapToGrid(position);
  for (let i = 0; i < shipSize; i++) {
    const key = `${snappedPosition.x},${snappedPosition.z + i * boxSize}`;
    if (occupiedCoordinates[key] && occupiedCoordinates[key] !== selectedShip) {
      return true; // Position is occupied
    }
  }
  return false; // Position is free
}

// Function to mark a ship's position as occupied on the grid
function markPositionAsOccupied(ship) {
  const position = snapToGrid(ship.position);
  const shipSize = getShipSize(ship);
  for (let i = 0; i < shipSize.length; i++) {
    const key = `${position.x},${position.z + i * boxSize}`;
    occupiedCoordinates[key] = ship; // Mark the grid position as occupied by this ship
  }
}

// Function to remove a ship from the occupied positions tracking
function removeShipFromOccupiedPositions(ship) {
  const position = snapToGrid(ship.position);
  const shipSize = getShipSize(ship);
  for (let i = 0; i < shipSize.length; i++) {
    const key = `${position.x},${position.z + i * boxSize}`;
    delete occupiedCoordinates[key]; // Remove the grid position from occupied positions
  }
}

// Add event listeners for mouse and keyboard interactions
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener(
  'contextmenu',
  (event) => event.preventDefault(), // Prevent the context menu from appearing on right-click
  false
);
window.addEventListener('keydown', onKeyDown, false);

// Function to handle mouse down events
function onMouseDown(event) {
  if (event.button === 2) { // Right mouse button
    event.preventDefault();
    isRightMouseDown = true;

    // Convert mouse coordinates to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Set up raycaster based on mouse position and camera
    raycaster.setFromCamera(mouse, camera);

    // Find all intersected objects in the scene
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      let object = intersects[0].object;
      // Traverse up the hierarchy to find the ship object
      while (object.parent && !(object.userData && object.userData.isShip)) {
        object = object.parent;
      }
      if (object.userData && object.userData.isShip) {
        // If there was a previously selected ship, unhighlight it
        if (selectedShip) {
          unhighlightShip(selectedShip);
        }
        selectedShip = object; // Set the new selected ship
        previousPosition = selectedShip.position.clone(); // Store its original position
        removeShipFromOccupiedPositions(selectedShip); // Remove it from occupied positions
        highlightShip(selectedShip); // Highlight the selected ship
        isDragging = true; // Enable dragging mode
      }
    } else {
      // If clicking outside of any ship, unhighlight the previously selected ship
      if (selectedShip) {
        unhighlightShip(selectedShip);
        selectedShip = null;
      }
    }
  }
}

// Function to handle mouse move events
function onMouseMove(event) {
  if (isDragging && selectedShip && isRightMouseDown) {
    // Update mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(water);

    if (intersects.length > 0) {
      const newPosition = snapToGrid(intersects[0].point);

      // Check if the new position is within grid bounds and not occupied
      if (isWithinGridBounds(newPosition, selectedShip) && !isPositionOccupied(newPosition, getShipSize(selectedShip).length)) {
        // Remove the ship from its current occupied positions
        removeShipFromOccupiedPositions(selectedShip);

        // Update the ship's position
        selectedShip.position.set(newPosition.x, selectedShip.position.y, newPosition.z);

        // Mark the new position as occupied
        markPositionAsOccupied(selectedShip);
      }
    }
  }
}

// Function to handle key down events (e.g., rotating ships)
function onKeyDown(event) {
  if (event.code === 'Space' && selectedShip) {
    // Store the original rotation and position
    const originalRotation = selectedShip.rotation.y;
    const originalPosition = selectedShip.position.clone();

    // Rotate the ship by 90 degrees
    selectedShip.rotation.y -= Math.PI / 2;

    // Get the new bounding box after rotation
    const bbox = new THREE.Box3().setFromObject(selectedShip);
    const shipSize = {
      width: Math.round((bbox.max.x - bbox.min.x) / boxSize),
      length: Math.round((bbox.max.z - bbox.min.z) / boxSize),
    };

    // Check if the rotated ship is within bounds
    const isWithinBounds = isWithinGridBounds(selectedShip.position, selectedShip);

    // Check for collisions with other ships
    const hasCollision = checkShipOverlap(selectedShip);

    if (isWithinBounds && !hasCollision) {
      // If rotation is valid, update occupied positions
      removeShipFromOccupiedPositions(selectedShip);
      markPositionAsOccupied(selectedShip);
    } else {
      // If rotation is invalid, revert to original rotation and position
      selectedShip.rotation.y = originalRotation;
      selectedShip.position.copy(originalPosition);
      alert("Invalid rotation. The ship would go outside the grid or collide with another ship.");
    }
  }
}

// Function to handle mouse up events
function onMouseUp(event) {
  if (event.button === 2) { // Right mouse button
    isRightMouseDown = false;
    isDragging = false;
    if (selectedShip) {
      // Check for overlapping with other ships
      if (checkShipOverlap(selectedShip)) {
        alert("Invalid placement. Ships cannot overlap.");
        selectedShip.position.copy(previousPosition); // Revert to previous position
      }
      markPositionAsOccupied(selectedShip); // Mark position as occupied
      unhighlightShip(selectedShip); // Unhighlight the ship
      selectedShip = null;
      isRotating = false;
    }
  }
}

// Function to highlight the selected ship
function highlightShip(ship) {
  ship.traverse((child) => {
    if (child.isMesh) {
      child.userData.originalMaterial = child.material; // Store original material
      child.material = child.material.clone(); // Clone material to avoid affecting other objects
      child.material.emissive.setHex(0xffffff); // Set emissive color for highlighting
      child.material.emissiveIntensity = 0.3; // Set intensity of the highlight
    }
  });
}

// Function to unhighlight the ship
function unhighlightShip(ship) {
  ship.traverse((child) => {
    if (child.isMesh && child.userData.originalMaterial) {
      child.material.dispose(); // Dispose of the cloned material
      child.material = child.userData.originalMaterial; // Restore original material
    }
  });
}

// Update the animate function to include submarine movement and rendering
function animate() {
  requestAnimationFrame(animate);

  // Update water animation
  water.material.uniforms['time'].value += 1.0 / 60.0;
  controls.update(); // Update orbit controls

  // Ship movement animation
  if (ship) {
    ship.position.y = 1 + Math.sin(Date.now() * 0.0005) * 0.2;
    ship.rotation.x = Math.sin(Date.now() * 0.0003) * 0.02;
    ship.rotation.z = Math.sin(Date.now() * 0.0004) * 0.02;
  }

  // Submarine movement with different parameters
  if (submarine) {
    submarine.position.y = 1 + Math.sin(Date.now() * 0.0006) * 0.15; // Different frequency and amplitude
    submarine.rotation.x = Math.sin(Date.now() * 0.0004) * 0.015;
    submarine.rotation.z = Math.sin(Date.now() * 0.0005) * 0.015;
  }

  // Update custom grid's glow intensity over time
  const time = Date.now() * 0.001;
  customGrid.material.uniforms.intensity.value = 2.5 + Math.sin(time) * 0.5;

  // Render the scene using the composer for post-processing
  composer.render();
}

// Start the animation loop
animate();

// Handle window resizing to maintain aspect ratio and renderer size
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; // Update camera aspect ratio
  camera.updateProjectionMatrix(); // Update projection matrix
  renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer size
  composer.setSize(window.innerWidth, window.innerHeight); // Update composer size
});

// Function to create the overlay for instructions and controls
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none'; // Allow mouse events to pass through

  // Create instructions text
  const instructions = document.createElement('div');
  instructions.style.position = 'absolute';
  instructions.style.top = '20px';
  instructions.style.left = '20px';
  instructions.style.color = 'white';
  instructions.style.fontFamily = 'Arial, sans-serif';
  instructions.style.fontSize = '16px';
  instructions.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
  instructions.innerHTML =
    'CHANGE COORDINATES OF YOUR SHIP:<br>Right-Click to SELECT<br>Press Space Bar to ROTATE';

  // Create confirm button
  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'CONFIRM';
  confirmButton.style.position = 'absolute';
  confirmButton.style.bottom = '20px';
  confirmButton.style.right = '20px';
  confirmButton.style.padding = '10px 20px';
  confirmButton.style.background = 'linear-gradient(135deg, #0b5b71, #041e3d)'; // Blue to black gradient for button
  confirmButton.style.color = 'white';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '5px';
  confirmButton.style.fontSize = '16px';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.pointerEvents = 'auto'; // Enable pointer events for the button
  confirmButton.style.transition = 'all 0.3s ease'; // Smooth transition effect

  // Mouse over effect for the confirm button
  confirmButton.addEventListener('mouseover', () => {
    confirmButton.style.background =
      'linear-gradient(135deg, #0b8f71, #062e4d)'; // Change to lighter colors
    confirmButton.style.transform = 'scale(1.1)'; // Slightly increase the size
  });

  // Mouse out effect to revert the confirm button style
  confirmButton.addEventListener('mouseout', () => {
    confirmButton.style.background =
      'linear-gradient(135deg, #0b5b71, #041e3d)'; // Revert to original colors
    confirmButton.style.transform = 'scale(1)'; // Reset the size
  });

  // Create Battleship logo with a bold, professional font
  const logo = document.createElement('div');
  logo.textContent = 'BATTLESHIP';
  logo.style.position = 'absolute';
  logo.style.top = '20px';
  logo.style.right = '20px';
  logo.style.color = 'white';
  logo.style.fontFamily = 'Impact, Arial, sans-serif'; // Bold font
  logo.style.fontSize = '48px';
  logo.style.fontWeight = 'bold';
  logo.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  logo.style.background = 'linear-gradient(to bottom, #000508, #0582a5)'; // Gradient for logo
  logo.style.webkitBackgroundClip = 'text';
  logo.style.webkitTextFillColor = 'transparent';

  // Append elements to the overlay
  overlay.appendChild(instructions);
  overlay.appendChild(confirmButton);
  overlay.appendChild(logo);

  // Add the overlay to the document body
  document.body.appendChild(overlay);

  // Event listener for the confirm button click
  confirmButton.addEventListener('click', async () => {
    ShipStore.saveShips(ships); // Save the ship positions
    console.log('Confirm button clicked');

    // Disable the confirm button to prevent multiple clicks
    confirmButton.disabled = true;

    // Show waiting message
    showWaitingMessage();

    // Set player ready status
    await gameManager.setPlayerReady(true);

    // Listen for all players to be ready
    gameManager.onPlayersChange((gameData) => {
      if (areAllPlayersReady(gameData)) {
        // Remove waiting message
        const waitingMessage = document.getElementById('waitingMessage');
        if (waitingMessage) waitingMessage.remove();
        // All players are ready, navigate to the game page
        window.location.href = 'game2.html';
      }
    });
  });

  // Function to display a waiting message
  function showWaitingMessage() {
    const waitingMessage = document.createElement('div');
    waitingMessage.textContent = 'Waiting for other player...';
    waitingMessage.style.position = 'absolute';
    waitingMessage.style.top = '50%';
    waitingMessage.style.left = '50%';
    waitingMessage.style.transform = 'translate(-50%, -50%)';
    waitingMessage.style.color = 'white';
    waitingMessage.style.fontSize = '24px';
    waitingMessage.style.fontFamily = 'Arial, sans-serif';
    waitingMessage.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
    waitingMessage.id = 'waitingMessage';
    document.body.appendChild(waitingMessage);
  }

  // Function to check if all players are ready
  function areAllPlayersReady(gameData) {
    const playerEntries = Object.entries(gameData.players || {});
    if (playerEntries.length !== 2) return false; // Ensure there are exactly 2 players
    return playerEntries.every(([playerId, playerData]) => playerData.ready === true);
  }
}

// Function to get the positions and sizes of the ships
function getShipPositions() {
  return {
    bigship: {
      position: bigship.position.clone(),
      size: getShipSize(bigship),
    },
    bldestroyer: {
      position: bldestroyer.position.clone(),
      size: getShipSize(bldestroyer),
    },
    submarine: {
      position: submarine.position.clone(),
      size: getShipSize(submarine),
    },
    boxShip: {
      position: boxShip.position.clone(),
      size: getShipSize(boxShip),
    },
    maritimeDrone: {
      position: maritimeDrone.position.clone(),
      size: getShipSize(maritimeDrone),
    },
  };
}

// Call this function after setting up your Three.js scene
createOverlay();

// Ensure the renderer is correctly set up and added to the DOM
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Update window resize event listener to handle changes in window size
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; // Update camera aspect ratio
  camera.updateProjectionMatrix(); // Update projection matrix
  renderer.setSize(window.innerWidth, window.innerHeight); // Update renderer size
  composer.setSize(window.innerWidth, window.innerHeight); // Update composer size
});
