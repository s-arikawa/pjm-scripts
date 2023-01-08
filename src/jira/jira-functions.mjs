const paginatedFetchIssues = (url, params, startAt = 0, previousResponse = []) => {
  const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
  params.startAt = startAt
  const query = new URLSearchParams(params)
  return fetch(`${url}?${query}`, options)
    .then(response => response.json())
    .then(jsonResponse => jsonResponse.issues)
    .then(newResponse => {
      const response = [...previousResponse, ...newResponse]; // Combine the two arrays
      if (newResponse.length !== 0) {
        startAt += newResponse.length
        return paginatedFetchIssues(url, params, startAt, response);
      }
      return response;
    });
}


const getSprintsFromBoard = async (boardId, params = {}) => {
  const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/board/${boardId}/sprint`
  const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
  params.maxResults = 1000
  const query = new URLSearchParams(params)

  const response = await fetch(`${url}?${query}`, options)
  const body = await response.json()

  const sprints = body.values
  return sprints
}

const getIssuesForSprint = async (sprint_id) => {
  const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/sprint/${sprint_id}/issue`
  // customfield_13255 = Story point estimate
  const params = {
    fields: "summary, assignee, issuetype, status, parent, sprint, closedSprints, customfield_13255",
    maxResults: 1000,
  }
  const issues = await paginatedFetchIssues(url, params)
  return issues
}

// エピックの一覧を取得する
const getAllEpics = async (boardId) => {
  const options = { method: 'GET', headers: { Authorization: process.env.JIRA_API_TOKEN } }
  const url = `https://${process.env.JIRA_HOST}/rest/agile/1.0/board/${boardId}/epic`
  const response = await fetch(url, options)
  const body = await response.json()

  return body.values.map(epic => {
    return {
      id: epic.id,
      key: epic.key,
      name: epic.summary,
      url: `https://${process.env.JIRA_HOST}/browse/${epic.key}`
    }
  })
}

// エピックに紐付くIssue 課題を取得する
const getIssuesForEpic = async (epicKey) => {
  const url = `https://${process.env.JIRA_HOST}/rest/api/2/search`
  const params = {
    maxResults: 100,
    jql: `parent = ${epicKey} ORDER BY created DESC`,
    fields: "summary, assignee, issuetype, status, customfield_13255" // customfield_13255 = Story point estimate
  }
  const issues = await paginatedFetchIssues(url, params)
  return issues
}

export {paginatedFetchIssues, getSprintsFromBoard, getIssuesForSprint, getAllEpics, getIssuesForEpic}