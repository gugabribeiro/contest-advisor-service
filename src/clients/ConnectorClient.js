const http = require('axios')

class ConnectorClient {
  constructor(connector) {
    this.connector = connector
  }

  redirect(problemId) {
    return http
      .get(this.routes.redirect(problemId))
      .then(({ data: { url } }) => url)
  }

  problems() {
    return http.get(this.routes.problems())
  }

  profile(user) {
    return http.get(this.routes.profile(user))
  }

  submissions(user) {
    return http.get(this.routes.submissions(user))
  }

  get routes() {
    return {
      redirect: (problemId) =>
        `${this.connector.url}/problems/${problemId}/redirect`,
      problems: () => `${this.connector.url}/problems`,
      profile: (user) => `${this.connector.url}/user/${user}`,
      submissions: (user) => `${this.connector.url}/user/${user}/submissions`,
    }
  }
}

module.exports = ConnectorClient
