# Battleship 3D Simulation
# Overview :
  This project is a 3D simulation of the classic Battleship game, built using Three.js and Vite. 

*Setup Instructions:*
  install node.js if you haven't already.
  Install three.js and a build tool, Vite, using a terminal in your project folder.
  # three.js
  npm install --save three

  # vite
  npm install --save-dev vite

1)Fork the repository on GitHub.
2)Clone your forked repository to your local machine:
  git clone https://github.com/pranavacchu/ARVR-project-battleship.git
3)Navigate to the project directory:
  cd <directory name>
4)Install dependencies:
  npm install
5)Start the development server:
  npm run dev
6)Open your browser and navigate to the URL provided by Vite (usually http://localhost:5173). 

*Usage Guide*
Ship Selection: Right-click on a ship to select it. The selected ship will be highlighted. 
Ship Movement: While holding the right mouse button, move the mouse to drag the selected ship across the grid.
Ship Rotation: Right-click and press the Spacebar simultaneously to rotate the selected ship by 90 degrees clockwise.
Deselection: Left-click anywhere outside a ship to deselect the currently selected ship.

Placement Rules:
Ships cannot overlap with each other.
Ships must be placed entirely within the grid.
An alert will appear if you attempt an invalid placement.

Camera Controls:
Left-click and drag to rotate the camera view.
Use the mouse wheel to zoom in and out.
Middle-click and drag to pan the camera.
