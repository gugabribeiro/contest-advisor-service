const http = require('axios')

class ConnectorClient {
  constructor(connector) {
    this.connector = connector
  }

  problems() {
    return http.get(this.routes.problems()).then(({ data }) => data)
  }

  profile(user) {
    return http.get(this.routes.profile(user)).then(({ data }) => data)
  }

  submissions(user) {
    return http.get(this.routes.submissions(user)).then(({ data }) => data)
  }

  get routes() {
    return {
      problems: () => `${this.connector.url}/problems`,
      profile: (user) => `${this.connector.url}/users/${user}`,
      submissions: (user) => `${this.connector.url}/users/${user}/submissions`,
    }
  }
}

module.exports = ConnectorClient
