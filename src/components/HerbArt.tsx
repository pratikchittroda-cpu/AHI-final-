import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { C } from '../theme';

/** Line-drawn herb sprig (the V5 "herb garden" illustrations). */
export function HerbArt({ leaves = 6, spread = 1, size = 140, color = C.forest }: { leaves?: number; spread?: number; size?: number; color?: string }) {
  const items = Array.from({ length: leaves }, (_, i) => {
    const y = 130 - i * (90 / leaves);
    const side = i % 2 === 0 ? -1 : 1;
    const len = (46 - i * 4) * spread;
    const ang = ((side < 0 ? 205 : -25) + side * i * 4) * (Math.PI / 180);
    const ex = 70 + len * Math.cos(ang);
    const ey = y + len * Math.sin(ang);
    const nx = -Math.sin(ang) * len * 0.3;
    const ny = Math.cos(ang) * len * 0.3;
    const mx = (70 + ex) / 2;
    const my = (y + ey) / 2;
    return {
      d: `M70 ${y} Q ${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} Q ${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} 70 ${y}`,
      v: `M70 ${y} L ${ex.toFixed(1)} ${ey.toFixed(1)}`,
    };
  });
  return (
    <Svg width={size} height={size * 1.07} viewBox="0 0 140 150">
      <Path d="M70 146 C70 110 68 70 70 20" stroke={color} strokeWidth={1.4} fill="none" />
      {items.map((l, i) => (
        <React.Fragment key={i}>
          <Path d={l.d} fill="none" stroke={color} strokeWidth={1.3} />
          <Path d={l.v} fill="none" stroke={color} strokeWidth={0.7} />
        </React.Fragment>
      ))}
    </Svg>
  );
}
