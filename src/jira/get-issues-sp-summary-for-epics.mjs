#!/usr/bin/env zx
/**
 * JiraのボードIDを取得する。
 * 実行方法: `zx src/jira/get-board.mjs`
 *   オプション -k プロジェクトのキーを指定する（入力スキップ）
 * 説明: JiraのボードのIDを取得する。ボードIDを使って他のスクリプトで様々な情報が取得できる。
 * 前提: .envにJIRA接続設定をしておく。
 */

import 'zx/globals'
import {getAllEpics, getIssuesForEpic, paginatedFetchIssues} from './jira-functions.mjs'

require('dotenv').config()
$.verbose = false

let boardId = process.env.JIRA_BOARD_ID
if (!boardId) {
  boardId = argv.b // -b option
}
if (!boardId) {
  boardId = await question(chalk.green('ボードのIDを入力してください。'))
}
echo(chalk.green(`ボードのIDは ${chalk.underline(boardId)} `))

// エピック一覧取得
const epics = await getAllEpics(boardId)
// エピックごとにissues課題一覧の取得
await Promise.all(epics.map(epic => {
  return getIssuesForEpic(epic.key).then(issues => epic.issues = issues)
}))

// サマリー出力
epics.forEach(epic => {
  // 総SPの算出
  const spAll = epic.issues.map(i => i.fields.customfield_13255 ?? 0).reduce((a, b) => a + b, 0)

  const spDoneAll = epic.issues.filter(i => i.fields.status.statusCategory.key === 'done')
    .map(i => i.fields.customfield_13255 ?? 0)
    .reduce((a, b) => a + b, 0)

  // TODO パーセント表記
  const sa = spDoneAll / spAll
  const percent = Math.round(sa * 100) / 100 * 100;
  echo`${epic.key} ${epic.name} | 総数 ${spAll} ( - ) ／消化済数 ${spDoneAll}（ - ）／残数 ${spAll - spDoneAll}（ - ） | ( ${percent} % )`
})

// status - name = 完了
//        - statusCategory - key = done