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

        if self.request['request'] == 'create_game':
            self.create_game()
        elif self.request['request'] == 'move':
            self.move()

    def create_game(self):
        canvas = ''.join(random.SystemRandom().randint(0, 9) for _ in range (0, 5))
        canvases.append(canvas)
        users.append(self.client, {
            'canvas': canvas,
            'request_id': self.request['request_id']
        })

        self.send({'canvas': canvas, 'data': None})

    def join_game(self):
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
