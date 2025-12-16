import { defineConfig, presetAttributify, presetIcons, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1,
      warn: true,
    }),
  ],
});
