const validate = (fields, entity) => {
  return fields.reduce(
    (previous, field) => {
      const value = entity[field]
      if (value !== null && value !== undefined) {
        return previous
      }
      return {
        value: false,
        missing: [...previous.missing, field],
      }
    },
    {
      value: true,
      missing: [],
    }
  )
}

const wrong = {
  message: 'Something went wrong',
}

module.exports = {
  wrong,
  validate,
}
