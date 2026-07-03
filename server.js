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
    try {
      const js = await fs.readFile(new URL('./app/app.js', import.meta.url));
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (err) {
      res.writeHead(500);
      res.end('Internal server error');
    }
  } else if (req.url === '/render.js') {
    try {
      const js = await fs.readFile(new URL('./app/render.js', import.meta.url));
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } catch (err) {
      res.writeHead(500);
      res.end('Internal server error');
    }
  } else if (req.url == '/style.css') {
    //send css file
  } else {
    res.writeHead(404);
    res.end("The page you are looking for doesn't exist");
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
