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
        elif self.request['request'] == 'move':
            self.move()
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

        self.send({'canvas': canvas, 'data': None})

    def join_canvas(self):
        if self.request['canvas'] not in canvases:
            self.send({'error': 'This code is not active.'})
        
        users.append(self.client, {
            'canvas': self.request['canvas'],
            'request_id': self.request['request_id']
        })


        

    def move(self):
        for player, info in users:
            message = {'index': self.request['index'], 'x': self.request['x'], 'y': self.request['y'], 'response_id': info['request_id']}
            string_message = json.dumps(message)
            self.server.send_message(player, string_message)

    def send(self, message):
        message['response_id'] = self.request['request_id']
        string_message = json.dumps(message)
        self.server.send_message(self.client, string_message)
