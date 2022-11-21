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

let boardId = process.env.JIRA_BOARD_ID
if (!boardId) {
  boardId = argv.b // -b option
}
if (!boardId) {
  boardId = await question(chalk.green('ボードのIDを入力してください。'))
}
echo(chalk.green(`ボードのIDは ${chalk.underline(boardId)} `))

// エピックの一覧を取得する
const getAllEpics = async (boardId) => {
  const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
  const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/board/${boardId}/epic`
  const response = await fetch(url, options)
  const body = await response.json()

  return body.values.map(epic => {
    return {
      key: epic.key,
      name: epic.summary,
      url: `https://${process.env.JIRA_HOST}/browse/${epic.key}`
    }
  })
}

function paginated_fetch_issues(url, params, startAt = 0, previousResponse = []) {
  const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
  params.startAt = startAt
  const query = new URLSearchParams(params)
  return fetch(`${url}?${query}`, options)
    .then(response => {
      return response.json()
    })
    .then(jsonResponse => jsonResponse.issues)
    .then(newResponse => {
      const response = [...previousResponse, ...newResponse]; // Combine the two arrays
      if (newResponse.length !== 0) {
        startAt += newResponse.length
        return paginated_fetch_issues(url, params, startAt, response);
      }
      return response;
    });
}

// エピックに紐付くIssue 課題を取得する
const getIssuesForEpic = async (epicKey) => {
  const url = `https://${process.env.JIRA_HOST}/rest/api/2/search`
  const params = {
    maxResults: 100,
    jql: `parent = ${epicKey} ORDER BY created DESC`,
    fields: "summary, assignee, issuetype, status, customfield_13255" // customfield_13255 = Story point estimate
  }
  const issues = await paginated_fetch_issues(url, params)
  return issues
}

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

  echo`${epic.key} ${epic.name} | ${spDoneAll}/${spAll}`
})

// status - name = 完了
//        - statusCategory - key = done