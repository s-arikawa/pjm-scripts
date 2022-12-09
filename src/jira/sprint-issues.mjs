#!/usr/bin/env zx

/**
 * Jiraのスプリントに紐付く課題のサマリーを出力する。
 * 実行方法: `zx src/jira/sprint-issues.mjs | pbcopy`
 * 説明: `pbcopy`コマンドでクリップボードにサマリー文字列(markdown)が保存されるので、Confluenceページにペーストすると良い感じにしてくれる。
 * 前提: .envにJIRA接続設定をしておく。
 */

import 'zx/globals'
import { paginated_fetch_issues } from './jira-functions.mjs'

$.verbose = false
require('dotenv').config()

const getIssuesForSprint = async (sprint_id) => {
  const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/sprint/${sprint_id}/issue`
  const params = {
    fields: "summary, assignee, issuetype, status",
    maxResults: 1000,
  }
  const issues = await paginated_fetch_issues(url, params)
  return issues
}

const getActiveSprints = async (boardId) => {
  const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/board/${boardId}/sprint`
  const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
  const params = { maxResults: 1000, state: 'active' }
  const query = new URLSearchParams(params)

  const response = await fetch(`${url}?${query}`, options)
  const body = await response.json()

  const sprints = body.values[0]
  return sprints
}


// # Main Logic - START

const boardId = process.env.JIRA_BOARD_ID

// アクティブなスプリントIDを決める
const activeSprint = await getActiveSprints(boardId)

// スプリントに紐付く課題の一覧を取得する
const issues = await getIssuesForSprint(activeSprint.id)

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
