import http from 'http';
import { WebSocketServer } from 'ws';
import { setStatusEmitter } from './debug.js';
import fs from 'fs/promises';
import { parser } from './parser/parser.js';

// global file path => console.log(import.meta.url);

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/') {
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
  } else if (req.method === 'POST' && req.url === '/parse') {
    try {
      const body = await parseBody(req);
      const data = JSON.parse(body);
      console.log('the body recieved from client: ', data);
      if (data.request) console.log('Request obj from data: ', data.request);
      // chop the request value, from request, from buffer
      const rawRequest = Buffer.from(data.request, 'utf-8');

      //call the manual parser
      const parsedRequest = parser(rawRequest);
      console.log('parsed request: ', parsedRequest);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(parsedRequest, null, 2));
    } catch (err) {
      res.writeHead(500);
      res.end('Internal server error', err);
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

const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
};

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('websocket is on, client is connected\n');

  ws.on('close', () => {
    console.log('websocket is off\n');
  });
});

setStatusEmitter((status) => {
  const json = JSON.stringify(status);

  wss.clients.forEach((client) => {
    client.send(json);
  });
});

server.listen(8080);
