let emitter = () => {};

export const emitStatus = (status) => {
  emitter(status);
};

export const setStatusEmitter = (fn) => {
  emitter(fn);
};
