const path = require("path");

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: {
    "waveform-playlist": "./app.js",
  },
  output: {
    path: __dirname + "/dist/waveform-playlist/js",
    publicPath: "/waveform-playlist/js/",
    filename: "[name].js",
    library: {
      name: "WaveformPlaylist",
      type: "var",
    },
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [["@babel/plugin-transform-runtime"]],
          },
        },
      },
      {
        test: /\.worker\.js$/,
        use: { loader: "worker-loader" },
      },
    ],
  },
};
