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
        canvas = ''.join(str(random.SystemRandom().randint(0, 9))
                         for _ in range(0, 5))
        canvases.append(canvas)

        # Generating user_id from # of users in canvas
        user_id = len(
            [user for user in users if user['data']['canvas'] == canvas])

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
        def getMaxDim(user, dim):
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
            return (user['data'].get('start_pos', {}).get(dim, 0) +
                    user['data'].get('size', {}).get(dim, 0)
                    if user['data']['canvas'] == self.request['canvas']
                    else 0)

        total_x = getMaxDim(
            max(users, key=lambda user: getMaxDim(user, 'x')), 'x')
        total_y = getMaxDim(
            max(users, key=lambda user: getMaxDim(user, 'y')), 'y')

        def part_of_canvas(user):
            if user['data']['canvas'] == self.request['canvas'] and not user['data'].get('head'):
                return user
            else:
                return None

        def check_pos(x_i, y_i):
            available = True
            for user in filter(part_of_canvas, users):
                if not ((x_i >= (user['data']['start_pos']['x'] + user['data']['size']['x'])) or # Check new position is not within x bounds of device  
                    (y_i >= (user['data']['start_pos']['y'] + user['data']['size']['y']))): # Not within y bounds
                    available = False

            return available

        def change_to_total(pos):
            x_change = self.request['size']['x'] + pos[0] - total_x
            y_change = self.request['size']['y'] + pos[1] - total_y

            if x_change < 0:
                x_change = 0
            if y_change < 0:
                y_change = 0

            return x_change + y_change

        # Tesselation algorithm — Took much longer than it should have!
        def find_optimal_pos():
            pot_p = []

            for user in filter(part_of_canvas, users):
                x_i, y_i = user['data']['start_pos']['x'], user['data']['start_pos']['y'] + user['data']['size']['y']
                x_t, y_t = user['data']['size']['x'] + user['data']['start_pos']['x'], user['data']['start_pos']['y']

                i_o = check_pos(x_i, y_i)
                t_o = check_pos(x_t, y_t)

                if not i_o:
                    if t_o:
                        pot_p.append((x_t, y_t))

                if not t_o:
                    if i_o:
                        pot_p.append((x_i, y_i))

                if not (i_o and t_o):
                    continue

                pot_p.append((x_t, y_t))
                pot_p.append((x_i, y_i))

            all_change = True
            for pos in pot_p:
                if change_to_total(pos) <= 0:
                    all_change = False
            
            if all_change:
                if total_x < total_y:
                    return total_x, 0
                else:
                    return 0, total_y

            if len(pot_p) > 0:
                return min(pot_p, key=change_to_total)
                
            return 0, 0
        
        # Fallback if no spot available
        x, y = find_optimal_pos()

        # Generating user_id from # of users in canvas
        user_id = len([user for user in users if user['data']
                       ['canvas'] == self.request['canvas']])

        users.append({'user': self.client, 'data': {
            'canvas': self.request['canvas'],
            'request_id': self.request['request_id'],
            'size': self.request['size'],
            'start_pos': {
                'x': x,
                'y': y
            }
        }})

        # Recalculating dimension w/ new user
        total_x = getMaxDim(
            max(users, key=lambda user: getMaxDim(user, 'x')), 'x')
        total_y = getMaxDim(
            max(users, key=lambda user: getMaxDim(user, 'y')), 'y')

        # Send new client to all devices
        self.send_to_canvas({'header': 'new_client', 'size': self.request['size'],
                             'start_pos': {'x': x, 'y': y},
                             'total_size': {'x': total_x, 'y': total_y}, 'user_id': user_id})

        self.send({'message': None, 'size': self.request['size'], 'start_pos': {
                  'x': x, 'y': y}, 'user_id': user_id})

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

                self.server.send_message(
                    user['user'], json.dumps(send_message))

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
