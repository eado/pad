import json
import random

users = []

canvases = []

class Responder:
    """
    Responds to client requests.

    Parameters
    ----------
    `client : dict`
        Client from WebSocket Server API
    `server : WebsocketServer`
        Server from WebSocket Server API
    `message : str`
        Client's message
    """
    request = None
    client = None
    server = None

    def __init__(self, client, server, message):
        # Try to convert string to python object
        try:
            self.request = json.loads(message)
        except json.JSONDecodeError:
            self.send({"error": "njf"})

        self.client = client
        self.server = server

        if self.request['request'] == 'create_canvas':
            self.create_canvas()
        elif self.request['request'] == 'send_to_canvas':
            self.send_to_canvas()
        elif self.request['request'] == 'join_canvas':
            self.join_canvas()

    def create_canvas(self):
        """Creates a canvas with a randomly generated canvas code."""
        # Generating canvas code
        canvas = ''.join(str(random.SystemRandom().randint(0, 9)) for _ in range (0, 5))
        canvases.append(canvas)

        # Generating user_id from # of users in canvas
        user_id = len([user for user in users if user['data']['canvas'] == canvas])

        users.append({'user': self.client, 'data': {
            'user_id': user_id,
            'canvas': canvas,
            'request_id': self.request['request_id'],
            'head': True
        }})

        self.send({'canvas': canvas, 'message': None})

    def join_canvas(self):
        """Joins a client to an existing canvas."""
        # If canvas not active error message
        if self.request['canvas'] not in canvases:
            self.send({'error': 'This code is not active.'})
            return

        # Finding the dimensions of the whole canvas
        def getMaxUser(user, dim):
            """
            Finds the maximum dimension of a device.

            Parameters
            ----------
            `user : dict`
                User dictionary
            `dim : str`
                Dimension string

            Returns
            -------
            `int`
                Largest dimension by device
            """
            return user['data'].get('start_pos', {}).get(dim, 0) + user['data'].get('size', {}).get(dim, 0) if user['data']['canvas'] == self.request['canvas'] else 0

        total_x = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'x')), 'x')
        total_y = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'y')), 'y')

        x, y = 0, 0

        # Tesselation algorithm
        # TODO: Improve tesselation algorithim
        if total_x < total_y:
            x = total_x
            y = 0
        else:
            x = 0
            y = total_y
    
        # Generating user_id from # of users in canvas
        user_id = len([user for user in users if user['data']['canvas'] == self.request['canvas']])

        users.append({'user': self.client, 'data': {
            'canvas': self.request['canvas'],
            'request_id': self.request['request_id'],
            'size' : self.request['size'],
            'start_pos': {
                'x': x,
                'y': y
            }
        }})

        # Recalculating dimension w/ new user
        total_x = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'x')), 'x')
        total_y = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'y')), 'y')

        # Send new client to all devices
        self.send_to_canvas({'header': 'new_client', 'size': self.request['size'], 
                             'start_pos': {'x': x, 'y': y}, 
                             'total_size': {'x': total_x, 'y': total_y}, 'user_id': user_id})

        self.send({'message': None, 'size': self.request['size'], 'start_pos': {'x': x, 'y': y}, 'user_id': user_id})

    def send_to_canvas(self, c_message=None):
        """
        Sends a message from one device to all devices in the canvas.
        
        Parameters
        ----------
        `c_message : dict`
            Overriding dict instead of from request
        """
        for user in users:
            if user['data']['canvas'] == self.request['canvas']:
                message = None
                if c_message:
                    message = c_message
                else:
                    message = self.request['message']
                send_message = {
                    'message': message,
                    'response_id': user['data']['request_id']
                }

                print(send_message)
                self.server.send_message(user['user'], json.dumps(send_message))

    def send(self, message):
        """
        Sends a message from one device to all devices in the canvas.
        
        Parameters
        ----------
        `message : dict`
            Message to be sent
        """
        message['response_id'] = self.request['request_id']
        string_message = json.dumps(message)
        self.server.send_message(self.client, string_message)
