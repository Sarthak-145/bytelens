import http from 'http';
import { WebSocketServer } from 'ws';
import { setStatusEmitter } from './debug.js';
import fs from 'fs/promises';

// global file path => console.log(import.meta.url);

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    try {
      const html = await fs.readFile(
        new URL('./app/index.html', import.meta.url)
      );
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(500);
      res.end('Internal server error');
    }
  } else if (req.url === '/app.js') {
    //send js file
  } else if (req.url == '/style.css') {
    //send css file
  } else {
    //send 404
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Frontend connected\n');

  ws.on('close', () => {
    console.log('Frintend disconnected');
  });
});

setStatusEmitter((status) => {
  const json = JSON.stringify(status);

  wss.clients.forEach((client) => {
    client.send(json);
  });
});

server.listen(8080);
