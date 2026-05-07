/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [solidPlugin(), tailwindcss()],
  
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:9090",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/ws": {
        target: "ws://127.0.0.1:9090",
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, ""),
      },
    },
  },

  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // SolidJS 核心
          if (id.includes("solid-js") || id.includes("@solidjs/router")) {
            return "solid-core";
          }
          
          // DnD Kit
          if (id.includes("@dnd-kit")) {
            return "dnd-kit";
          }
          
          // Lucide icons
          if (id.includes("lucide-solid")) {
            return "icons";
          }
          
          // Vendor libraries
          if (id.includes("node_modules")) {
            if (id.includes("yaml")) return "yaml";
            if (id.includes("zod")) return "zod";
            return "vendor";
          }
        },
        
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split("/").pop() 
            : "chunk";
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || "";
          
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(info)) {
            return "assets/images/[name]-[hash][extname]";
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(info)) {
            return "assets/fonts/[name]-[hash][extname]";
          }
          
          if (/\.css$/i.test(info)) {
            return "assets/css/[name]-[hash][extname]";
          }
          
          return "assets/[name]-[hash][extname]";
        },
      },
      
      onwarn(warning, warn) {
        // 忽略特定警告
        if (warning.code === "UNRESOLVED_IMPORT") return;
        if (warning.code === "CIRCULAR_DEPENDENCY") return;
        warn(warning);
      },
    },
    
    sourcemap: false,
    reportCompressedSize: true,
    
    // 性能优化
    chunkSizeWarningLimit: 1000,
    
    // CSS 优化
    cssMinify: true,
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: [
      "solid-js",
      "@solidjs/router",
      "lucide-solid",
    ],
    exclude: [
      "@dnd-kit/core",
      "@dnd-kit/sortable",
    ],
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/**",
      ],
    },
  },
});
