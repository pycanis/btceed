export const truncateMiddleString = (s: string, sideLength = 6) =>
  `${s.substring(0, sideLength)}..${s.substring(s.length - sideLength)}`;

export const truncateString = (s: string, length = 13) => (s.length > length ? `${s.substring(0, length)}..` : s);
