let timer: NodeJS.Timeout | undefined = undefined;

export const debounce = (cb: () => void, delayMs = 300) => {
  clearTimeout(timer);

  timer = setTimeout(() => {
    cb();
  }, delayMs);
};
