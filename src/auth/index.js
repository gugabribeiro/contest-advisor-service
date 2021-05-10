const firebase = require('firebase-admin')
const { StatusCodes } = require('http-status-codes')

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const authenticated = async (req, res, next) => {
  const { authorization } = req.headers

  if (!authorization || !authorization.startsWith('Bearer')) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Unauthorized' })
  }

  const [_, token] = authorization.split('Bearer ')

  try {
    const { email } = await firebase.auth().verifyIdToken(token)
    res.locals = {
      ...res.locals,
      email,
    }

    return next()
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Unauthorized' })
  }
}

module.exports = {
  authenticated,
  firebaseConfig,
}
