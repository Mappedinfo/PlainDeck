#!/usr/bin/env node
import packageMetadata from '../package.json' with { type: 'json' }
import { runStdioServer } from './index.js'

const args = process.argv.slice(2)
if (args.includes('--version') || args.includes('-v')) {
  process.stdout.write(`${packageMetadata.version}\n`)
  process.exit(0)
}
if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(`plaindeck-mcp ${packageMetadata.version}

PlainDeck MCP server — agent-native slide decks over the Model Context Protocol.

Usage:
  plaindeck-mcp            启动 stdio MCP server（供 dsh / Claude / Codex 等客户端连接）
  plaindeck-mcp --version  输出版本号
  plaindeck-mcp --help     显示本帮助

DeepSeek Harness 接入：
  npm install --global plaindeck-mcp
  dsh web --patch "$PWD/packages/plaindeck-mcp/plaindeck.cordis.yml"
`)
  process.exit(0)
}

await runStdioServer()
