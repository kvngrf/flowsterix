import { AbsoluteFill, Sequence } from 'remotion'
import { IntroScene } from './IntroScene'
import { ProblemScene } from './ProblemScene'
import { SpotlightDemoScene } from './SpotlightDemoScene'
import { FeaturesScene } from './FeaturesScene'
import { CTAScene } from './CTAScene'
import { SCENE_TIMING } from '../utils/animations'
import { DEFAULT_THEME } from '../styles/themes'

export const MarketingVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: DEFAULT_THEME.background }}>
      {/* Intro: 0-3s */}
      <Sequence from={SCENE_TIMING.intro.start} durationInFrames={SCENE_TIMING.intro.duration}>
        <IntroScene />
      </Sequence>

      {/* Problem: 3-6s */}
      <Sequence from={SCENE_TIMING.problem.start} durationInFrames={SCENE_TIMING.problem.duration}>
        <ProblemScene />
      </Sequence>

      {/* Spotlight Demo: 6-16s */}
      <Sequence from={SCENE_TIMING.spotlightDemo.start} durationInFrames={SCENE_TIMING.spotlightDemo.duration}>
        <SpotlightDemoScene />
      </Sequence>

      {/* Features: 16-24s */}
      <Sequence from={SCENE_TIMING.features.start} durationInFrames={SCENE_TIMING.features.duration}>
        <FeaturesScene />
      </Sequence>

      {/* CTA: 24-30s */}
      <Sequence from={SCENE_TIMING.cta.start} durationInFrames={SCENE_TIMING.cta.duration}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  )
}
