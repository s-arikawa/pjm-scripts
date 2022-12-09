
const paginated_fetch_issues = (url, params, startAt = 0, previousResponse = []) => {
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
        return paginated_fetch_issues(url, params, startAt, response);
      }
      return response;
    });
}

export { paginated_fetch_issues }