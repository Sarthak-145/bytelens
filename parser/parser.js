export const parser = (buffer) => {
  let state = 'HEADER';
  let contentLength = 0;
  let request = null;

  // getting full request anyway, can parse it in one go
  if (state === 'HEADER') {
    const HEADER_DELIMITER = Buffer.from('\r\n\r\n');
    const headerEndIndex = buffer.indexOf(HEADER_DELIMITER);
    if (headerEndIndex === -1) return; //return if header is incomplete

    console.log('Got the full header!!');

    //here we've got the full header now
    const headerBuffer = buffer.slice(0, headerEndIndex); //bytes
    const headerData = headerBuffer.toString('utf-8');
    //log the complete header

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
      return request; //return the request object if no body is present
    }
    state = 'BODY';
  }

  if (state === 'BODY') {
    // this will always work cause we are getting full request anyway!?
    if (contentLength > buffer.length) return; //whole body is yet to come

    const body = buffer.slice(0, contentLength);
    buffer = buffer.slice(contentLength);
    const bodyData = body.toString('utf-8');
    console.log('Request object after parsing is: \n', request);
    console.log('BODY after parsing: ', bodyData);

    //test if req is working in this scope
    return {
      ...request,
      body: body.toString('utf8'),
    };
  }
};
