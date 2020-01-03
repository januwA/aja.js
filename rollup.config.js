import resolve from "rollup-plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import sourceMaps from "rollup-plugin-sourcemaps";

export default {
  input: "./src/main.ts",
  output: {
    name: "Aja",
    file: "dist/dist/aja.umd.js",
    format: "umd",
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      exclude: "node_modules/**",
      "rootDir": "./src",
      typescript: require("typescript"),
      declaration: true
    }),
    sourceMaps()
  ]
};
