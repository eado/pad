import sys

from threading import Thread
from websocket_server import WebsocketServer

from responder import Responder, users 


# WebSocket Server API callbacks
def message_received(client, server, message):
    """
    Starts a new thread on each new message.

    Parameters
    ----------
    `client : dict`
        Client from WebSocket Server API
    `server : WebsocketServer`
        Server from WebSocket Server API
    `message : str`
        Client's message
    """
    p = Thread(target=start_responder, args=(client, server, message))
    p.daemon = True
    p.start()

def start_responder(client, server, message):
    """
    Creates a new responder instance.

    Parameters
    ----------
    `client : dict`
        Client from WebSocket Server API
    `server : WebsocketServer`
        Server from WebSocket Server API
    `message : str`
        Client's message
    """
    Responder(client, server, message)
 
def start_server():
    """Starts the WebSocket server."""
    server = WebsocketServer(9001, host='0.0.0.0')
    server.set_fn_message_received(message_received)
    server.set_fn_client_left(client_left)
    print("Started")
    server.run_forever()

def client_left(client, server):
    """
    Removes client from users list when client leaves.
    
    Parameters
    ----------
    `client : dict`
        Client from WebSocket Server API
    `server : WebsocketServer`
        Server from WebSocket Server API
    """

    for user in users:
        if user['user'] == client:
            users.remove(user)


# Start server if not an import
if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)