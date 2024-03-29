const { flatRoutes } = require("remix-flat-routes");

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  // ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  ignoredRouteFiles: ["**/*"],
  serverModuleFormat: "cjs",
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  routes: async (defineRoutes) => {
    return flatRoutes("routes", defineRoutes, {
      ignoredRouteFiles: [
        ".*",
        "**/*.css",
        "**/*.test.{js,jsx,ts,tsx}",
        "**/__*.*",
      ],
    });
  },

  tailwind: true,
  postcss: true,

  serverDependenciesToBundle: [
    "lowlight",
    "higlight.js",
    "devlop",
    /^lowlight*/,
    /^lowlight.*/,
    /^highlight.js*/,
    /^highlight.*/,
    /^rehype.*/,
    /^remark.*/,
    /^unified.*/,
  ],
};
