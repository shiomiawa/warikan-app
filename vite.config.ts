import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages のサブパス (https://ユーザー名.github.io/warikan-app/) に合わせる
export default defineConfig({
  base: '/warikan-app/',
  plugins: [react()],
});
