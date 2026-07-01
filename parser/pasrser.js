import net from 'net';
import handleRequest from './handlerequest.js';

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);
  // state to handle multirequests
  let state = 'HEADER';
  let contentLength = 0;
  let request = null;
  const MAX_HEADER_SIZE = 8 * 1024;
  const MAX_BODY_SIZE = 1024 * 1024;
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    console.log('this chunk is:', chunk.toString());

    while (true) {
      if (state === 'HEADER') {
        if (buffer.length > MAX_HEADER_SIZE) {
          //format should be like this -> protocol, status code and then message
          //optionally can add headers, but I'll not for now.
          socket.end('HTTP/1.1 431 Request Header Fields Too Large\r\n\r\n');
          socket.destroy(); //optional end() also does the job, this is hard kill
          return;
        }

        //here header ends (at headerEndIndex)
        const HEADER_DELIMITER = Buffer.from('\r\n\r\n');
        const headerEndIndex = buffer.indexOf(HEADER_DELIMITER);
        if (headerEndIndex === -1) return; //return if header is incomplete

        console.log('Got the full header!!');

        //here we've got the full header now
        const headerBuffer = buffer.slice(0, headerEndIndex); //bytes
        const headerData = headerBuffer.toString('utf-8');
        //log the complete header
        // console.log('Header: \n', headerData);

        //now remove header from the buffer
        buffer = buffer.slice(headerEndIndex + 4); //+4 cause of those four \r\n\r\n

        //split line by line
        const lines = headerData.split('\r\n');
        //method, path and protocol are in first line always
        const [method, path, protocol] = lines[0].split(' ');
        //req object
        request = {
          method,
          path,
          protocol,
          headers: {},
        };

        //rest of the lines
        for (let i = 1; i < lines.length; i++) {
          const KeyendIndex = lines[i].indexOf(':');
          if (KeyendIndex === -1) continue;
          const key = lines[i].slice(0, KeyendIndex).trim().toLowerCase();
          const value = lines[i].slice(KeyendIndex + 1).trim();

          request.headers[key] = value;
        }
        contentLength = Number(request.headers['content-length']) || 0;

        //don't enter body if contentlength is zero.
        if (contentLength === 0) {
          handleRequest(socket, request, Buffer.alloc(0));
          request = null;
          state = 'HEADER';
          continue;
        }

        //this is global now (for current socket)
        // console.log('Request object: \n', request);

        //cap the body size
        if (contentLength > MAX_BODY_SIZE) {
          socket.end('HTTP/1.1 413 Payload Too Large\r\n\r\n');
          socket.destroy();
          return;
        }
        state = 'BODY';
      }

      if (state === 'BODY') {
        if (contentLength > buffer.length) return; //whole body is yet to come

        body = buffer.slice(0, contentLength);
        buffer = buffer.slice(contentLength);
        const bodyData = body.toString('utf-8');
        console.log('Request object after parsing is: \n', request);
        console.log('BODY after parsing: ', bodyData);

        handleRequest(socket, request, body);

        //test if req is working in this scope
        request = null;
        state = 'HEADER';
        body = Buffer.alloc(0);
        contentLength = 0;
      }
    }
  });

  socket.on('end', () => {
    console.log('Client hang up\n\n');
  });
  socket.on('error', (err) => {
    console.log('socket error: ', err.message);
  });
});

server.listen(3000);
