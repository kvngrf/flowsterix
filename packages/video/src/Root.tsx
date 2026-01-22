import { Composition } from 'remotion'
import { MarketingVideo } from './scenes/MarketingVideo'

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MarketingVideo"
        component={MarketingVideo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
