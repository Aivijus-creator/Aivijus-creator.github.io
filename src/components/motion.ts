/**
 * Motion is always on: the site ignores the system "reduce motion" setting, because phones turn it on
 * (often through power saving) and the court animations are how the site explains a rotation.
 * Every component asks this hook instead of framer-motion's useReducedMotion.
 */
export const useReducedMotion = (): boolean => false;
