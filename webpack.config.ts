import { ConfigurationFactory } from 'webpack'
import path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'

const config: ConfigurationFactory = () => {
  return {
    mode: 'none',
    entry: {
      main:   path.join(__dirname, 'src', 'main.ts'),
      remote: path.join(__dirname, 'src', 'remote.ts'),
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
    },
    plugins: [
      //new CopyWebpackPlugin({patterns: [{ from: 'static', to: '.' }]})
    ]
  }
}

export default config
