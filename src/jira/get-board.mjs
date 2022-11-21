#!/usr/bin/env zx
/**
 * JiraのボードIDを取得する。
 * 実行方法: `zx src/jira/get-board.mjs`
 *   オプション -k プロジェクトのキーを指定する（入力スキップ）
 * 説明: JiraのボードのIDを取得する。ボードIDを使って他のスクリプトで様々な情報が取得できる。
 * 前提: .envにJIRA接続設定をしておく。
 */

import 'zx/globals'
require('dotenv').config()
$.verbose = false

let projectKeyOrId = argv.k // -k option
if (!projectKeyOrId) {
  projectKeyOrId = await question(chalk.green('プロジェクトのキーを入力してください。'))
}
echo(chalk.green(`プロジェクトのキーは ${chalk.underline(projectKeyOrId)} `))

const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/board?projectKeyOrId=${projectKeyOrId}`
const response = await fetch(url, options)
const body = await response.json()

const board = body.values[0]

const msg = `# Project
id: ${board.location.projectId}
key: ${board.location.projectKey}
name: ${board.location.displayName}

# Board
id: ${board.id}
name: ${board.name}
`
echo(msg)

const nextActionMessage = `
${ chalk.blue('Next Action:') }
  ボードのIDが分かったことで、様々な情報取得スクリプトが利用できます。
  .env ファイルの'JIRA_BOARD_ID'にIDを設定することでスクリプトの${chalk.underline('入力スキップ')}になります。
  ex. JIRA_BOARD_ID=${board.id}`
echo(nextActionMessage)
