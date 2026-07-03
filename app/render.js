export const render = (status) => {
  const buffer = document.getElementById('buffer');
  buffer.textContent = JSON.stringify(status);
};
