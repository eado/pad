import json
import random

users = []

canvases = []

class Responder:
    request = None
    client = None
    server = None

    def __init__(self, client, server, message):
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
        canvas = ''.join(str(random.SystemRandom().randint(0, 9)) for _ in range (0, 5))
        canvases.append(canvas)

        user_id = len([user for user in users if user['data']['canvas'] == canvas])

        users.append({'user': self.client, 'data': {
            'user_id': user_id,
            'canvas': canvas,
            'request_id': self.request['request_id'],
            'head': True
        }})

        self.send({'canvas': canvas, 'message': None})

    def join_canvas(self):
        if self.request['canvas'] not in canvases:
            self.send({'error': 'This code is not active.'})
            return

        def getMaxUser(user, dim):
            return user['data'].get('start_pos', {}).get(dim, 0) + user['data'].get('size', {}).get(dim, 0)

        total_x = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'x')), 'x')
        total_y = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'y')), 'y')

        x, y = 0, 0

        if total_x >= total_y:
            x = total_x
            y = 0
        else:
            x = 0
            y = total_y
    
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

        total_x = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'x')), 'x')
        total_y = getMaxUser(max(users, key=lambda user: getMaxUser(user, 'y')), 'y')

        self.send_to_canvas({'header': 'new_client', 'size': self.request['size'], 
                             'start_pos': {'x': x, 'y': y}, 
                             'total_size': {'x': total_x, 'y': total_y}, 'user_id': user_id})

        self.send({'message': None, 'size': self.request['size'], 'start_pos': {'x': x, 'y': y}, 'user_id': user_id})

    def send_to_canvas(self, c_message=None):
        for user in users:
            if user['data']['canvas'] == self.request['canvas']:
                message = None
                if c_message:
                    message = c_message
                else:
                    message = {
                        'message': self.request['message']
                    }
                send_message = {
                    'message': message,
                    'response_id': user['data']['request_id']
                }

                print(send_message)
                self.server.send_message(user['user'], json.dumps(send_message))

    def send(self, message):
        message['response_id'] = self.request['request_id']
        string_message = json.dumps(message)
        self.server.send_message(self.client, string_message)
