from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import logging

app = FastAPI()

# Mount the Vite.js frontend
app.mount("/", StaticFiles(directory="dist", html=True), name="frontend")

# Store connected clients
connected_clients = []

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.get("/")
async def get_index():
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Battleship Game</title>
        <script type="module" src="/main.js"></script>
    </head>
    <body>
        <div id="app"></div>
    </body>
    </html>
    """)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    logging.info(f"New client connected: {websocket.client.host}:{websocket.client.port}")

    # Notify all clients when two players are connected
    if len(connected_clients) == 2:
        for client in connected_clients:
            await client.send_text("Two players have been connected.")
        logging.info("Two players have been connected.")

    try:
        async for message in websocket:
            # Echo the received message back to all connected clients
            for client in connected_clients:
                await client.send_text(message)
    finally:
        # Remove the client from the list of connected clients
        connected_clients.remove(websocket)
        logging.info(f"Client disconnected: {websocket.client.host}:{websocket.client.port}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
