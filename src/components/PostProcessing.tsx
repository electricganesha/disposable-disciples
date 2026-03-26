import {
  EffectComposer,
  TiltShift,
  Noise,
  Vignette,
} from "@react-three/postprocessing";

export const PostProcessing = () => {
  return (
    <EffectComposer>
      <TiltShift blur={0.3} />
      <Noise opacity={0.05} />
      <Vignette eskil={false} offset={0.05} darkness={0.8} />
    </EffectComposer>
  );
};
