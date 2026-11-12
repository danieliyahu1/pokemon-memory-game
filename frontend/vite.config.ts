import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
      // The browser opens the websocket on its own origin; without this the dev
      // server answers the handshake and the game never leaves the lobby.
      '/socket.io': {
        target: 'http://localhost:7000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
