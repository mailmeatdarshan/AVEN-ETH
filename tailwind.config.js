import clientConfig from "./client/tailwind.config.js";

export default {
  ...clientConfig,
  content: ["./client/index.html", "./client/src/**/*.{js,jsx}"],
};
