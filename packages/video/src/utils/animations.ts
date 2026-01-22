import { SpringConfig } from 'remotion'

// Apple-style ultra snappy spring
export const APPLE_SPRING: SpringConfig = {
  damping: 14,
  stiffness: 500,
  mass: 0.4,
}

// For text reveals
export const TEXT_SPRING: SpringConfig = {
  damping: 18,
  stiffness: 450,
  mass: 0.3,
}

export const FPS = 30

// Shorter, punchier timing (30 seconds total)
export const SCENE_TIMING = {
  intro: { start: 0, duration: 90 },        // 0-3s
  problem: { start: 90, duration: 90 },     // 3-6s
  spotlightDemo: { start: 180, duration: 300 }, // 6-16s
  features: { start: 480, duration: 240 },  // 16-24s
  cta: { start: 720, duration: 180 },       // 24-30s
}

export const TOTAL_FRAMES = 900 // 30 seconds
