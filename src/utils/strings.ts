export const getBothSideSubstring = (s: string, sideLength = 6) =>
  `${s.substring(0, sideLength)}..${s.substring(s.length - sideLength)}`;
