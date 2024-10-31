import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import ShipStore from './ShipStore.js';

const occupiedCoordinates = {};
let previousPosition = null;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

let selectedShip = null;
let isDragging = false;
let isRightMouseDown = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,
  0.4,
  0.85
);
composer.addPass(bloomPass);

camera.position.set(0, 200, 400);
camera.lookAt(0, 0, 0);

// Grid settings
const gridSize = 400;
const divisions = 8;
const boxSize = gridSize / divisions;

// Function to enhance model materials
function enhanceModelMaterials(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (child.material) {
        child.material.side = THREE.FrontSide;
        child.material.transparent = false;
        child.material.opacity = 1.0;
        child.material.metalness = 0.8;
        child.material.roughness = 0.2;
        child.material.envMapIntensity = 1.5;
      }
    }
  });
}
const ships = [];
// Load Ship Models
let ship, submarine;
const loader = new GLTFLoader();

loader.load(
  'bigShip2.glb',
  function (gltf) {
    const bigship = gltf.scene;
    bigship.userData.modelPath = 'bigShip2.glb';
    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 6; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(bigship);
    const bigshipWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / bigshipWidth;

    bigship.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    bigship.position.set(
      gridSize / 5 + boxSize * -3.1,
      1,
      gridSize / 15 + boxSize * 2
    );

    // Rotate the maritime drone to be perpendicular
    bigship.rotation.y = 0;
    bigship.userData.isShip = true; // Add this line
    enhanceModelMaterials(bigship);
    ships.push(bigship);
    scene.add(bigship);
    bigship.rotation.y += Math.PI / 2;

    markPositionAsOccupied(bigship);
  },
  function (xhr) {
    console.log('bigship: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the bigship:', error);
  }
);

loader.load(
  'blurudestroyer.glb',
  function (gltf) {
    const bldestroyer = gltf.scene;
    bldestroyer.userData.modelPath = 'blurudestroyer.glb';
    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 7.5; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(bldestroyer);
    const bldestWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / bldestWidth;

    bldestroyer.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    bldestroyer.position.set(
      gridSize / 2 + boxSize * -6.5,
      1,
      -gridSize / 2 + boxSize * 2
    );

    // Rotate the maritime drone to be perpendicular
    bldestroyer.rotation.y = Math.PI / 2;
    bldestroyer.userData.isShip = true; // Add this line
    enhanceModelMaterials(bldestroyer);
    ships.push(bldestroyer);
    scene.add(bldestroyer);

    bldestroyer.rotation.y += Math.PI / 2;
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

const occupiedPositions = new Set();
loader.load(
  'submarine.glb',
  function (gltf) {
    const submarine = gltf.scene;
    submarine.userData.modelPath = 'submarine.glb';
    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 8; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(submarine);
    const submarineWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / submarineWidth;

    submarine.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    submarine.position.set(
      -gridSize / 8 + boxSize * 2,
      1,
      -gridSize / 2 + boxSize / 2
    );

    // Rotate the maritime drone to be perpendicular
    submarine.rotation.y = 0;
    submarine.userData.isShip = true;
    enhanceModelMaterials(submarine);
    ships.push(submarine);
    scene.add(submarine);
    submarine.rotation.y += Math.PI / 2;

    markPositionAsOccupied(submarine);
  },
  function (xhr) {
    console.log('submarine: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the submarine:', error);
  }
);

loader.load(
  '3boxship.glb', // Path to the new GLB file
  function (gltf) {
    const boxShip = gltf.scene;
    boxShip.userData.modelPath = '3boxship.glb';
    // Set scale to fit within three grid boxes
    const desiredWidth = boxSize * 3; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(boxShip);
    const boxShipWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / boxShipWidth;

    boxShip.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    boxShip.position.set(
      gridSize / 10 + boxSize * 1.7,
      1,
      gridSize / 7 + boxSize / 2
    );

    // Rotate the maritime drone to be perpendicular
    boxShip.rotation.y = Math.PI / 2;
    boxShip.userData.isShip = true;
    enhanceModelMaterials(boxShip);
    ships.push(boxShip);
    scene.add(boxShip);
    submarine.rotation.y += Math.PI / 2;

    markPositionAsOccupied(boxShip);
  },
  function (xhr) {
    console.log('3Box Ship: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the 3Box Ship:', error);
  }
);

// Load Maritime Drone
loader.load(
  'maritimedrone.glb',
  function (gltf) {
    const maritimeDrone = gltf.scene;
    maritimeDrone.userData.modelPath = 'maritimedrone.glb';
    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 4; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(maritimeDrone);
    const droneWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / droneWidth;

    maritimeDrone.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    const dronePosition = new THREE.Vector3(
      -gridSize / 6 + boxSize * 1.5,
      -5,
      -gridSize / 7 + boxSize / 1.5
    );

    // Snap the position to the grid
    const snappedPosition = snapToGrid(dronePosition);
    maritimeDrone.position.copy(snappedPosition);

    maritimeDrone.rotation.y = Math.PI / 2;
    maritimeDrone.userData.isShip = true;
    enhanceModelMaterials(maritimeDrone);

    // Add the maritime drone to the ships array
    ships.push(maritimeDrone);

    scene.add(maritimeDrone);

    // Mark the position as occupied
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

function initializeOccupiedPositions() {
  ships.forEach(ship => markPositionAsOccupied(ship));
}

// Call this function after loading all ships
initializeOccupiedPositions();

function checkShipOverlap(ship) {
  const shipBoundingBox = new THREE.Box3().setFromObject(ship);
  for (const otherShip of ships) {
    if (otherShip !== ship) {
      const otherBoundingBox = new THREE.Box3().setFromObject(otherShip);
      if (shipBoundingBox.intersectsBox(otherBoundingBox)) {
        return true;
      }
    }
  }
  return false;
}

// Create a custom grid
function createCustomGrid(size, divisions) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const step = size / divisions;

  for (let i = 0; i <= divisions; i++) {
    const line = i * step - size / 2;
    vertices.push(-size / 2, 0, line, size / 2, 0, line);
    vertices.push(line, 0, -size / 2, line, 0, size / 2);
  }

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x00ffff) },
      intensity: { value: 2.5 },
    },
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const grid = new THREE.LineSegments(geometry, material);
  grid.position.y = 0.1; // Slightly above water level
  scene.add(grid);
  return grid;
}

const customGrid = createCustomGrid(gridSize, divisions);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-1, 1, 1);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

// Add point lights for more dramatic lighting
const pointLight1 = new THREE.PointLight(0x3366ff, 1, 100);
pointLight1.position.set(20, 20, 20);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xff6633, 1, 100);
pointLight2.position.set(-20, 20, -20);
scene.add(pointLight2);

// Create Water
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

water.material.uniforms.reflectivity = { value: 0.2 }; // Reduced reflectivity
water.rotation.x = -Math.PI / 2;
water.position.y = 0;
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

// Modify the OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2;
let isRotating = false;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.DOLLY,
};

function snapToGrid(position) {
  const halfBoxSize = boxSize / 2;
  const halfGridSize = gridSize / 2;

  // Clamp the position within the grid bounds
  const clampedX = Math.max(-halfGridSize + halfBoxSize, Math.min(halfGridSize - halfBoxSize, position.x));
  const clampedZ = Math.max(-halfGridSize + halfBoxSize, Math.min(halfGridSize - halfBoxSize, position.z));

  return new THREE.Vector3(
    Math.round((clampedX - halfBoxSize) / boxSize) * boxSize + halfBoxSize,
    position.y,
    Math.round((clampedZ - halfBoxSize) / boxSize) * boxSize + halfBoxSize
  );
}

// Function to check if position is within grid bounds
function isWithinGridBounds(position, ship) {
  const halfGridSize = gridSize / 2;
  const bbox = new THREE.Box3().setFromObject(ship);
  const shipHalfWidth = (bbox.max.x - bbox.min.x) / 2;
  const shipHalfLength = (bbox.max.z - bbox.min.z) / 2;

  return (
    position.x - shipHalfWidth >= -halfGridSize &&
    position.x + shipHalfWidth <= halfGridSize &&
    position.z - shipHalfLength >= -halfGridSize &&
    position.z + shipHalfLength <= halfGridSize
  );
}
function getShipSize(ship) {
  const bbox = new THREE.Box3().setFromObject(ship);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  return {
    width: Math.round(size.x / boxSize),
    length: Math.round(size.z / boxSize),
    centerOffsetX: center.x - ship.position.x,
    centerOffsetZ: center.z - ship.position.z
  };
}

// Function to check if a position is occupied
function isPositionOccupied(position, shipSize = 1) {
  const snappedPosition = snapToGrid(position);
  for (let i = 0; i < shipSize; i++) {
    const key = `${snappedPosition.x},${snappedPosition.z + i * boxSize}`;
    if (occupiedCoordinates[key] && occupiedCoordinates[key] !== selectedShip) {
      return true;
    }
  }
  return false;
}

// Function to mark a position as occupied
function markPositionAsOccupied(ship) {
  const position = snapToGrid(ship.position);
  const shipSize = getShipSize(ship);
  for (let i = 0; i < shipSize.length; i++) {
    const key = `${position.x},${position.z + i * boxSize}`;
    occupiedCoordinates[key] = ship;
  }
}

// Function to remove a ship from occupied positions
function removeShipFromOccupiedPositions(ship) {
  const position = snapToGrid(ship.position);
  const shipSize = getShipSize(ship);
  for (let i = 0; i < shipSize.length; i++) {
    const key = `${position.x},${position.z + i * boxSize}`;
    delete occupiedCoordinates[key];
  }
}
// Add these event listeners after setting up OrbitControls
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener(
  'contextmenu',
  (event) => event.preventDefault(),
  false
);
window.addEventListener('keydown', onKeyDown, false);



function onMouseDown(event) {
  if (event.button === 2) { // Right mouse button
    event.preventDefault();
    isRightMouseDown = true;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object.parent && !(object.userData && object.userData.isShip)) {
        object = object.parent;
      }
      if (object.userData && object.userData.isShip) {
        // If there was a previously selected ship, unhighlight it
        if (selectedShip) {
          unhighlightShip(selectedShip);
        }
        selectedShip = object;
        previousPosition = selectedShip.position.clone();
        removeShipFromOccupiedPositions(selectedShip);
        highlightShip(selectedShip);
        isDragging = true;
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

function onMouseMove(event) {
  if (isDragging && selectedShip && isRightMouseDown) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(water);

    if (intersects.length > 0) {
      const newPosition = snapToGrid(intersects[0].point);

      // Check if the new position is within grid bounds
      if (isWithinGridBounds(newPosition, selectedShip) && !isPositionOccupied(newPosition, getShipSize(selectedShip).length)) {
        // Remove the ship from its current position
        removeShipFromOccupiedPositions(selectedShip);

        // Update the ship's position
        selectedShip.position.set(newPosition.x, selectedShip.position.y, newPosition.z);

        // Mark the new position as occupied
        markPositionAsOccupied(selectedShip);
      }
    }
  }
}



function onKeyDown(event) {
  if (event.code === 'Space' && selectedShip) {
    // Store the original rotation and position
    const originalRotation = selectedShip.rotation.y;
    const originalPosition = selectedShip.position.clone();

    // Temporarily rotate the ship
    selectedShip.rotation.y -= Math.PI / 2;

    // Get the new bounding box after rotation
    const bbox = new THREE.Box3().setFromObject(selectedShip);
    const shipSize = {
      width: Math.round((bbox.max.x - bbox.min.x) / boxSize),
      length: Math.round((bbox.max.z - bbox.min.z) / boxSize)
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
      // If rotation is not valid, revert to original rotation and position
      selectedShip.rotation.y = originalRotation;
      selectedShip.position.copy(originalPosition);
      alert("Invalid rotation. The ship would go outside the grid or collide with another ship.");
    }
  }
}


function onMouseUp(event) {
  if (event.button === 2) { // Right mouse button
    isRightMouseDown = false;
    isDragging = false;
    if (selectedShip) {
      if (checkShipOverlap(selectedShip)) {
        alert("Invalid placement. Ships cannot overlap.");
        selectedShip.position.copy(previousPosition);
      }
      markPositionAsOccupied(selectedShip);
      unhighlightShip(selectedShip); // Ensure the ship is unhighlighted
      selectedShip = null;
      isRotating = false;
    }
  }
}

// Add these functions for highlighting and unhighlighting ships
function highlightShip(ship) {
  ship.traverse((child) => {
    if (child.isMesh) {
      child.userData.originalMaterial = child.material;
      child.material = child.material.clone();
      child.material.emissive.setHex(0xffffff); // Light white color
      child.material.emissiveIntensity = 0.3; // Reduced intensity for a softer glow
    }
  });
}

function unhighlightShip(ship) {
  ship.traverse((child) => {
    if (child.isMesh && child.userData.originalMaterial) {
      child.material.dispose();
      child.material = child.userData.originalMaterial;
    }
  });
}

// Update the animate function to include submarine movement
function animate() {
  requestAnimationFrame(animate);

  water.material.uniforms['time'].value += 1.0 / 60.0;
  controls.update();

  // Ship movement
  if (ship) {
    ship.position.y = 1 + Math.sin(Date.now() * 0.0005) * 0.2;
    ship.rotation.x = Math.sin(Date.now() * 0.0003) * 0.02;
    ship.rotation.z = Math.sin(Date.now() * 0.0004) * 0.02;
  }

  // Submarine movement - slightly different pattern
  if (submarine) {
    submarine.position.y = 1 + Math.sin(Date.now() * 0.0006) * 0.15; // Different frequency and amplitude
    submarine.rotation.x = Math.sin(Date.now() * 0.0004) * 0.015;
    submarine.rotation.z = Math.sin(Date.now() * 0.0005) * 0.015;
  }

  const time = Date.now() * 0.001;
  customGrid.material.uniforms.intensity.value = 2.5 + Math.sin(time) * 0.5;

  composer.render();
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
//Dynamic HTML

// Function to create the overlay
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';

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
  confirmButton.style.pointerEvents = 'auto';
  confirmButton.style.transition = 'all 0.3s ease'; // Smooth transition effect

  confirmButton.addEventListener('mouseover', () => {
    confirmButton.style.background =
      'linear-gradient(135deg, #0b8f71, #062e4d)'; // Change to lighter colors
    confirmButton.style.transform = 'scale(1.1)'; // Slightly increase the size
  });

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
  logo.style.fontFamily = 'Impact, Arial, sans-serif'; // Updated bold font
  logo.style.fontSize = '48px';
  logo.style.fontWeight = 'bold';
  logo.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  logo.style.background = 'linear-gradient(to bottom, #000508, #0582a5)'; // Gradient for logo
  logo.style.webkitBackgroundClip = 'text';
  logo.style.webkitTextFillColor = 'transparent';

  overlay.appendChild(instructions);
  overlay.appendChild(confirmButton);
  overlay.appendChild(logo);

  document.body.appendChild(overlay);

  confirmButton.addEventListener('click', () => {
    ShipStore.saveShips(ships);
    console.log('Confirm button clicked');
    window.location.href = 'game2.html';
  });
}
function getShipPositions() {
  return {
    bigship: {
      position: bigship.position.clone(),
      size: getShipSize(bigship)
    },
    bldestroyer: {
      position: bldestroyer.position.clone(),
      size: getShipSize(bldestroyer)
    },
    submarine: {
      position: submarine.position.clone(),
      size: getShipSize(submarine)
    },
    boxShip: {
      position: boxShip.position.clone(),
      size: getShipSize(boxShip)
    },
    maritimeDrone: {
      position: maritimeDrone.position.clone(),
      size: getShipSize(maritimeDrone)
    }
  };
}
// Call this function after setting up your Three.js scene
createOverlay();

// Modify your existing renderer setup
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Update your window resize event listener
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
