// スプリントごとの課題一覧を取得する

import 'zx/globals'
import _ from "lodash"
import {getSprintsFromBoard, getIssuesForSprint, getAllEpics, getIssuesForEpic} from "./jira-functions.mjs";
import dayjs from "dayjs";

$.verbose = false
require('dotenv').config()

// # Main Logic - START

const boardId = process.env.JIRA_BOARD_ID

// スプリントの一覧を取得
const sprints = await getSprintsFromBoard(boardId)

// 最新の６スプリントを対象にする
const targetSprints = sprints.slice(-6)

// スプリントに紐付く課題の一覧を取得する
await Promise.all(targetSprints.map(sprint => {
  return getIssuesForSprint(sprint.id).then(issues => sprint.issues = issues)
}))

targetSprints.forEach(sprint => {
  echo(_.repeat('=', 110))

  // スプリントの情報を出力
  const startDate = dayjs(sprint.startDate).format('YYYY-MM-DD')
  const endDate = dayjs(sprint.endDate).format('YYYY-MM-DD')
  const completeDate = dayjs(sprint.completeDate).format('YYYY-MM-DD')
  echo(`${sprint.id}: ${sprint.name} | start - end : ${startDate} - ${endDate} | completed : ${completeDate} | state : ${sprint.state}`)

  // 件数
  const count = sprint.issues.length
  // SP コミット
  const commitSp = _.sumBy(sprint.issues, (i) => i.fields.customfield_13255)
  // SP 完了 status.name = "完了" or "CANCEL"
  // sprint もしくは closedSprints の最も新しいスプリントが key と一致する場合
  const filteredIssues = _(sprint.issues).filter((i) => {
      const currentSprintId = i.fields.sprint?.id
      const newestCompletedSprintId = _.max(_.map(i.fields?.closedSprints, 'id'))
      return _.includes([currentSprintId, newestCompletedSprintId], sprint.id)
    }
  )
  const doneSp = filteredIssues.filter((i) => _.includes(["完了"], i.fields.status.name)).sumBy((i) => i.fields.customfield_13255)
  const cancelSp = filteredIssues.filter((i) => _.includes(["CANCEL"], i.fields.status.name)).sumBy((i) => i.fields.customfield_13255)
  const allDoneSp = filteredIssues.filter((i) => _.includes(["完了", "CANCEL"], i.fields.status.name)).sumBy((i) => i.fields.customfield_13255)
  const allDoneCount = filteredIssues.filter((i) => _.includes(["完了", "CANCEL"], i.fields.status.name)).size()
  echo(`${_.padStart(`完了課題数: ${allDoneCount}`, 11)} | 課題数: ${_.padEnd(count, 3)} | コミットSP: ${_.padEnd(commitSp, 3)} | 完了SP: ${_.padEnd(allDoneSp, 3)}(${doneSp}, ${cancelSp})`)
  echo(_.repeat('-', 110))
  // 課題を親Epicでグルーピングする
  const epicGroupIssues = _.groupBy(sprint.issues, (issue) => issue.fields?.parent?.fields?.summary ?? "no Epic")
  // エピックごとの課題件数、コミットSP、完了SPを出力
  _.forIn(epicGroupIssues, (val, key) => {
    const epicSummary = summary(sprint.id, val)
    echo(`${_.padEnd(key, 16)} | 課題数: ${_.padEnd(epicSummary.count, 3)} | コミットSP: ${_.padEnd(epicSummary.commitSp, 3)} | 完了SP: ${_.padEnd(epicSummary.doneSp, 3)}`)
  })

  echo('')
})

function summary(sprintId, issues) {
  // 件数
  const count = issues.length
  // SP コミット
  const commitSp = _.sumBy(issues, (i) => i.fields.customfield_13255)
  // SP 完了 status.name = "完了" or "CANCEL"
  // sprint もしくは closedSprints の最も新しいスプリントが key と一致する場合
  const doneSp = _(issues).filter((i) => {
      const currentSprintId = i.fields.sprint?.id
      const newestCompletedSprintId = _.max(_.map(i.fields?.closedSprints, 'id'))
      return _.includes([currentSprintId, newestCompletedSprintId], sprintId)
    }
  ).filter((i) => _.includes(["完了", "CANCEL"], i.fields.status.name)).sumBy((i) => i.fields.customfield_13255)

  return { count, commitSp, doneSp }
}

