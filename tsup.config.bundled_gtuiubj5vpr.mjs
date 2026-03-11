// tsup.config.ts
import { defineConfig } from "tsup";
var tsup_config_default = defineConfig([
  {
    entry: { "bin/lazycommit": "bin/lazycommit.ts" },
    format: ["esm"],
    target: "node18",
    sourcemap: true,
    clean: true,
    splitting: false,
    banner: {
      js: "#!/usr/bin/env node"
    }
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node18",
    dts: true,
    sourcemap: true,
    splitting: false
  }
]);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL3Nlc3Npb25zL2FkbWlyaW5nLWNvbmZpZGVudC1sb3ZlbGFjZS9tbnQvb3V0cHV0cy9sYXp5Y29tbWl0L3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9zZXNzaW9ucy9hZG1pcmluZy1jb25maWRlbnQtbG92ZWxhY2UvbW50L291dHB1dHMvbGF6eWNvbW1pdFwiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vc2Vzc2lvbnMvYWRtaXJpbmctY29uZmlkZW50LWxvdmVsYWNlL21udC9vdXRwdXRzL2xhenljb21taXQvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoW1xuICB7XG4gICAgZW50cnk6IHsgXCJiaW4vbGF6eWNvbW1pdFwiOiBcImJpbi9sYXp5Y29tbWl0LnRzXCIgfSxcbiAgICBmb3JtYXQ6IFtcImVzbVwiXSxcbiAgICB0YXJnZXQ6IFwibm9kZTE4XCIsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIGNsZWFuOiB0cnVlLFxuICAgIHNwbGl0dGluZzogZmFsc2UsXG4gICAgYmFubmVyOiB7XG4gICAgICBqczogXCIjIS91c3IvYmluL2VudiBub2RlXCIsXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIGVudHJ5OiB7IGluZGV4OiBcInNyYy9pbmRleC50c1wiIH0sXG4gICAgZm9ybWF0OiBbXCJlc21cIl0sXG4gICAgdGFyZ2V0OiBcIm5vZGUxOFwiLFxuICAgIGR0czogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgc3BsaXR0aW5nOiBmYWxzZSxcbiAgfSxcbl0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVSxTQUFTLG9CQUFvQjtBQUUvVixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQjtBQUFBLElBQ0UsT0FBTyxFQUFFLGtCQUFrQixvQkFBb0I7QUFBQSxJQUMvQyxRQUFRLENBQUMsS0FBSztBQUFBLElBQ2QsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsT0FBTztBQUFBLElBQ1AsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLE1BQ04sSUFBSTtBQUFBLElBQ047QUFBQSxFQUNGO0FBQUEsRUFDQTtBQUFBLElBQ0UsT0FBTyxFQUFFLE9BQU8sZUFBZTtBQUFBLElBQy9CLFFBQVEsQ0FBQyxLQUFLO0FBQUEsSUFDZCxRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxXQUFXO0FBQUEsRUFDYjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
