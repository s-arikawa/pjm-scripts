#!/usr/bin/env zx

/**
 * Jiraのスプリントに紐付く課題のサマリーを出力する。
 * 実行方法: `zx src/jira/sprint-issues.mjs | pbcopy`
 * 説明: `pbcopy`コマンドでクリップボードにサマリー文字列(markdown)が保存されるので、Confluenceページにペーストすると良い感じにしてくれる。
 * 前提: .envにJIRA接続設定をしておく。
 *
 * オプション: `-s` 対象のスプリントIDを指定する。指定が無い場合は、実行時にActiveなスプリントを対象とする。
 *           `zx src/jira/sprint-issues.mjs -s 963`
 *           スプリントIDは、get-sprint-id.mjsを使うと簡単に確認可能。
 */

import 'zx/globals'
import {getIssuesForSprint, getSprintsFromBoard} from './jira-functions.mjs'

$.verbose = false
require('dotenv').config()

const getActiveSprints = async (boardId) => {
  const sprints = getSprintsFromBoard(boardId, { state: 'active' })
  return sprints[0] // active は1件のみのはず
}


// # Main Logic - START

const boardId = process.env.JIRA_BOARD_ID

// 取得したいスプリントのIDをコマンドオプションで指定できる。
let targetSprintId = argv.s // -s option

if (!targetSprintId) {
  // コマンドオプションで指定が無い場合は、アクティブなスプリントIDを取得して使用する
  const activeSprint = await getActiveSprints(boardId)
  targetSprintId = activeSprint.id
}

// スプリントに紐付く課題の一覧を取得する
const issues = await getIssuesForSprint(targetSprintId)

// 課題の一覧をサマリーする
const summary = issues
  .sort((a, b) => a.id - b.id) // sort id asc
  .map(i => {
    return {
      key: i.key,
      summary: i.fields.summary,
      assignee: i.fields.assignee?.displayName,
      issueType: i.fields.issuetype.name,
      status: i.fields.status.name,
    }
  })

// URL format: https://${JIRA-HOST}/browse/${key}
summary.forEach(s => {
  const msg =
    `### ${s.summary}
https://${process.env.JIRA_HOST}/browse/${s.key}
担当者: ${s.assignee ?? 'なし'}

---
`
  echo(msg)
})
