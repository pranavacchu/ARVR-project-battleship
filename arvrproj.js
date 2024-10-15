  import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// Scene, Camera, Renderer setup remains the same
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
// Add these variables at the top of your file, after other declarations
let selectedShip = null;
let isDragging = false;
let isRightMouseDown = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


// Post-processing setup remains the same
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

// Load Ship Models
let ship, submarine;
const loader = new GLTFLoader();

loader.load(
  'bigShip.glb',
  function (gltf) {
    const bigship = gltf.scene;

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 6; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(bigship);
    const bigshipWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / bigshipWidth;

    bigship.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    bigship.position.set(
      gridSize / 10 + boxSize * -3.3,
      1,
      -gridSize / 5 + boxSize * 2
    );

    // Rotate the maritime drone to be perpendicular
    bigship.rotation.y = 0;
    bigship.userData.isShip = true; // Add this line
    enhanceModelMaterials(bigship);
    scene.add(bigship);
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

loader.load(
  'blurudestroyer.glb',
  function (gltf) {
    const bldestroyer = gltf.scene;

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 7.5; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(bldestroyer);
    const bldestWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / bldestWidth;

    bldestroyer.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    bldestroyer.position.set(
      gridSize / 3.5 + boxSize * -1.4,
      1,
      -gridSize / 15 + boxSize * 2
    );

    // Rotate the maritime drone to be perpendicular
    bldestroyer.rotation.y = Math.PI / 2;
    bldestroyer.userData.isShip = true; // Add this line
    enhanceModelMaterials(bldestroyer);
    scene.add(bldestroyer);
  },
  function (xhr) {
    console.log(
      'Bluru Destroyer: ' + (xhr.loaded / xhr.total) * 100 + '% loaded'
    );
  },
  function (error) {
    console.error('An error occurred loading the maritime drone:', error);
  }
);

loader.load(
  'submarine.glb',
  function (gltf) {
    const submarine = gltf.scene;

    // Set scale to fit within two grid boxes
    const desiredWidth = (boxSize * 2) / 6; // Adjusted to occupy 2 grid boxes
    const bbox = new THREE.Box3().setFromObject(submarine);
    const submarineWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / submarineWidth;

    submarine.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position submarine in the grid
    submarine.position.set(
      gridSize / 20 + boxSize * 1.2,
      1,
      -gridSize / 5 + boxSize / 2
    );

    submarine.rotation.y = 0;
    submarine.userData.isShip = true;
    enhanceModelMaterials(submarine);
    scene.add(submarine);
  },
  function (xhr) {
    console.log('Submarine: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the submarine:', error);
  }
);


// Load Maritime Drone
loader.load(
  'maritimedrone.glb',
  function (gltf) {
    const maritimeDrone = gltf.scene;

    // Set scale to fit within three grid boxes
    const desiredWidth = (boxSize * 3) / 4; // Occupy 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(maritimeDrone);
    const droneWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / droneWidth;

    maritimeDrone.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position maritime drone in the first row, perpendicular to other ships
    maritimeDrone.position.set(
      -gridSize / 2 + boxSize * 1.5,
      1,
      -gridSize / 2 + boxSize / 2
    );

    // Rotate the maritime drone to be perpendicular
    maritimeDrone.rotation.y = Math.PI / 2;
    maritimeDrone.userData.isShip = true;
    enhanceModelMaterials(maritimeDrone);
    scene.add(maritimeDrone);
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

loader.load(
  '3boxship.glb', // Path to the new GLB file
  function (gltf) {
    const boxShip = gltf.scene;

    // Set scale to fit within three grid boxes
    const desiredWidth = boxSize * 3; // Occupy exactly 3 grid boxes
    const bbox = new THREE.Box3().setFromObject(boxShip);
    const boxShipWidth = bbox.max.x - bbox.min.x;
    const scaleFactor = desiredWidth / boxShipWidth;

    boxShip.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position the new ship model on the grid (centered in 3 grid spaces)
    const centerOffset = (boxSize * 1.5); // Half of 3 boxes for centering
    boxShip.position.set(
      centerOffset, // Adjust X position to center in 3 grid boxes
      1.5, // Adjust Y position as needed
      centerOffset // Adjust Z position as needed
    );

    // Rotate the ship if necessary
    boxShip.rotation.y = Math.PI / 2;
    boxShip.userData.isShip = true;

    // Enhance materials
    enhanceModelMaterials(boxShip);

    // Add the ship to the scene
    scene.add(boxShip);
  },
  function (xhr) {
    console.log('3Box Ship: ' + (xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  function (error) {
    console.error('An error occurred loading the 3Box Ship:', error);
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
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.DOLLY
};

// Add these event listeners after setting up OrbitControls
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault(), false);

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
        selectedShip = object;
        highlightShip(selectedShip);
        isDragging = true;
      }
    } else {
      selectedShip = null;
    }
  }
}

function onMouseMove(event) {
  if (isDragging && selectedShip && isRightMouseDown) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(water);

    if (intersects.length > 0) {
      const newPosition = intersects[0].point;
      // Constrain movement within the grid
      newPosition.x = Math.max(-gridSize / 2, Math.min(gridSize / 2, newPosition.x));
      newPosition.z = Math.max(-gridSize / 2, Math.min(gridSize / 2, newPosition.z));
      selectedShip.position.set(newPosition.x, selectedShip.position.y, newPosition.z);
    }
  }
}

function onMouseUp(event) {
  if (event.button === 2) { // Right mouse button
    isRightMouseDown = false;
    isDragging = false;
    if (selectedShip) {
      unhighlightShip(selectedShip);
      selectedShip = null;
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
