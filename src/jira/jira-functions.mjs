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
  const params = {
    fields: "summary, assignee, issuetype, status",
    maxResults: 1000,
  }
  const issues = await paginatedFetchIssues(url, params)
  return issues
}

export {paginatedFetchIssues, getSprintsFromBoard, getIssuesForSprint}