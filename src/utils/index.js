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

const validUUID = (str) => {
  return str.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )
}

module.exports = {
  wrong,
  validate,
  validUUID,
}
