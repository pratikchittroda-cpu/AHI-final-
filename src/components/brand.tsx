import React from 'react';
import { Image, View } from 'react-native';

/**
 * The AHI mark: the lotus, drawn exactly as the original artwork, recoloured into the app's greens and with
 * the stamens cleared from its middle petal (assets/lotus.png, cut out with the paper-coloured gaps between
 * its petals kept). It is made for paper-toned grounds; on dark
 * grounds use `Logo light`, which sets it on a paper disc.
 * The same artwork is rendered into assets/icon.png, splash-icon.png, the Android icons and the favicon.
 */
export const LOTUS = require('../../assets/lotus.png');
/** The artwork's width / height. */
export const LOTUS_RATIO = 373 / 291;

/** The lotus fitted into a square box of `size`; `scale` < 1 leaves a margin around it. */
export function BrandMark({ size, scale = 1 }: { size: number; scale?: number }) {
  const w = size * scale;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={LOTUS} style={{ width: w, height: w / LOTUS_RATIO }} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}
