#!/usr/bin/env zx

/**
 * Jiraのスプリントの一覧を出力する。
 * 実行方法: `zx src/jira/get-sprint-id.mjs`
 * 前提: .envにJIRA接続設定をしておく。
 */

import 'zx/globals'
import {getSprintsFromBoard} from './jira-functions.mjs'
import dayjs from "dayjs";

$.verbose = false
require('dotenv').config()


// # Main Logic - START

const boardId = process.env.JIRA_BOARD_ID

const sprints = await getSprintsFromBoard(boardId)

sprints.forEach((sprint) => {
  const startDate = dayjs(sprint.startDate).format('YYYY-MM-DD')
  const endDate = dayjs(sprint.endDate).format('YYYY-MM-DD')
  const completeDate = dayjs(sprint.completeDate).format('YYYY-MM-DD')

  echo(`${sprint.id}: ${sprint.name} | start - end : ${startDate} - ${endDate} | completed : ${completeDate}`)
})
