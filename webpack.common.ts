import { Configuration } from 'webpack'
import path from 'path'

const config: Configuration = {
  mode: 'none',
  entry: {
    main:   path.join(__dirname, 'src', 'main.ts'),
    config: path.join(__dirname, 'src', 'config.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /.ts$/,
        use: 'ts-loader',
        exclude: '/node_modules/'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};

export default config
