"use client";

import { MotionConfig } from "motion/react";

/** Une seule fois pour toute l'app : si le téléphone demande moins d'animations, Motion saute les rebonds et glissades. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
