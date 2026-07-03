import { render } from './render.js';
const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
  console.log('Connected');
};

socket.onmessage = (event) => {
  const status = JSON.parse(event.data);
  console.log(status);
  render(status);
};

socket.onclose = () => {
  console.log('Disconnected');
};
