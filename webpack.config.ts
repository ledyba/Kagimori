import { ConfigurationFactory } from 'webpack'
import path from 'path'
import CopyWebpackPlugin from 'copy-webpack-plugin'

const config: ConfigurationFactory = () => {
  return {
    mode: 'production',
    entry: {
      main:    path.join(__dirname, 'src', 'main.ts'),
      inspect: path.join(__dirname, 'src', 'inspect.ts')
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
