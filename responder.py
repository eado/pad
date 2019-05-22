import json
import random

users = []
data = {}

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
        users.append({'user': self.client, 'data': {
            'canvas': canvas,
            'request_id': self.request['request_id'],
            'head': True
        }})

        self.send({'canvas': canvas})

    def join_canvas(self):
        if self.request['canvas'] not in canvases:
            self.send({'error': 'This code is not active.'})
        
        total_x, total_y = 0, 0

        x, y = 0, 0

        for user in users:
            if user['data']['canvas'] == self.request['canvas']:
                total_x += user['data']['size']['x']
                total_y += user['data']['size']['y']

        if total_x >= total_y:
            x = total_x
            y = 0
        else:
            x = 0
            y = total_y

        users.append({'user': self.client, 'data': {
            'canvas': self.request['canvas'],
            'request_id': self.request['request_id'],
            'size' : self.request['size'],
            'start_pos': {
                'x': x,
                'y': y
            }
        }})

    def send_to_canvas(self):
        for user in users:
            if user['data']['canvas'] == self.request['canvas']:
                message = {
                    'response_id': user['data']['request_id'],
                    'message': self.request['message']
                }
                self.server.send_message(user['user'], message)

    def send(self, message):
        message['response_id'] = self.request['request_id']
        string_message = json.dumps(message)
        self.server.send_message(self.client, string_message)
