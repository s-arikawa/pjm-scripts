#!/usr/bin/env zx

/**
 * Jiraのスプリントに紐付く課題のサマリーを出力する。
 * 実行方法: `zx src/jira/sprint-issues.mjs | pbcopy`
 * 説明: `pbcopy`コマンドでクリップボードにサマリー文字列(markdown)が保存されるので、Confluenceページにペーストすると良い感じにしてくれる。
 * 前提: .envにJIRA接続設定をしておく。
 */

$.verbose = false
require('dotenv').config()

const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } };
const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/sprint/920/issue` // TODO sprint id を指定する方法
const response = await fetch(`${url}?fields=summary%2C%20assignee%2C%20issuetype%2C%20status&maxResults=1000`, options)
const body = await response.json()

const summary = body.issues.map(i => {
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
  console.log(msg)
})
