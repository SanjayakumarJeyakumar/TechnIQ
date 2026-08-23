/**
 * Catches errors from route handlers and returns a friendly, generic
 * message — raw error details (stack traces, DB error codes) are logged
 * server-side only and never sent to the client.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(`[${req.method} ${req.path}]`, err)

  const status = err.status || 500
  const message = status === 500
    ? 'Something went wrong. Please try again.'
    : err.message

  res.status(status).json({ error: message })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found.' })
}
