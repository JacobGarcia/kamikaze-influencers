const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet') // Basic protection
const compression = require('compression')
const path = require('path')
const app = express()

const API = require(path.resolve('routers/v1/api.js'))
// const config = require(path.resolve('/config/config.js'))

function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) return false
  return compression.filter(req, res)
}

app.use(compression({ filter: shouldCompress }))

var PORT = process.env.PORT || 8080

app.use(helmet())

app.use('/static', express.static(path.resolve('static'), {
  maxAge: 1296000000
}))
app.use('/dist', express.static(path.resolve('dist'), {
  maxAge: 648000000
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/v1', API) //Add api routes

app.use('*', (req, res) => {
    res.sendFile(path.resolve('src/index.html'))
})

app.listen(PORT, () => {
  console.log(`Influencers server listening [${process.env.NODE_ENV}] on port ${PORT}! `)
})
