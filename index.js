const express = require('express')
const asyncHandler = require('express-async-handler')
const morganBody = require('morgan-body')

const session = require('express-session')
const redis = require("ioredis");
const RedisStore = require("connect-redis")(session);

const Axios = require('axios')

const VF_API_KEY = process.env.VF_API_KEY
const FRONTEND_URL = process.env.FRONTEND_URL
const MAX_AGE = process.env.MAX_AGE || 3600
const PORT = process.env.PORT || 3000
const emojiRegex = /:[^:\s]*(?:::[^:\s]*)*:/g

function stripEmojis (text) {
  return text.replace(emojiRegex, '').trim()
}

const axios = Axios.create({
  baseURL: 'https://general-runtime.voiceflow.com/',
  timeout: 2000,
  headers: { authorization: `${VF_API_KEY}` }
})

const sess = {
  name: 'state',
  secret: 'secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: MAX_AGE * 1000, // sec
    sameSite: 'none',
    secure: true,
    httpOnly: true,
    store: new RedisStore({
      url: process.env.REDIS_URL,
      client: redis.createClient({
          url: process.env.REDIS_URL
      })
  })
  }
}

const app = express()
morganBody(app)
app.set('port', (process.env.PORT || 3000))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('trust proxy', 1) // trust first proxy
app.use(session(sess))
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', `${FRONTEND_URL}`)
  res.header('Access-Control-Allow-Method', 'GET, POST, HEAD, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept')
  res.header('Access-Control-Allow-Credentials', true)
  next()
})

app.post('/chat', asyncHandler(async (req, res) => {
  console.log(`sessionID: ${req.sessionID}, maxAge: ${req.session.cookie.maxAge}, state: ${JSON.stringify(req.session.state)}`)

  const vfreq = { action: {}, state: {} }

  const userInput = req.body.text
  const callback = req.body.callback

  const isState = Object.prototype.hasOwnProperty.call(req.session, 'state')
  if (!isState) {
    const axres = await axios.get('/interact/state')
    vfreq.state = axres.data
  } else {
    vfreq.state = req.session.state
  }

  if (typeof (userInput) === 'string') {
    const userInputText = stripEmojis(userInput)
    vfreq.action = { type: 'text', payload: userInputText }
  } else {
    vfreq.action = userInput
  }

  console.log('===== REQUSET TO VF =====')
  console.log(JSON.stringify(vfreq, null, 2))
  const vfres = await axios.post('/interact', vfreq)
  req.session.state = vfres.data.state

  console.log('===== RESPONSE FROM VF =====')
  console.log(JSON.stringify(vfres.data, null, 2))

  const response = { output: [] }
  const msg = response.output

  const opts = []
  for (const trace of vfres.data.trace) {
    switch (trace.type) {
      case 'text':
        msg.push({
          type: 'text',
          value: trace.payload.message
        })
        break
      case 'visual':
        msg.push({
          type: 'image',
          value: trace.payload.image
        })
        break
      case 'youtube':
        msg.push({
          type: 'window',
          title: 'youtube movie',
          html: '<div style="position: relative; width: 100%; padding-top: 56.25%;background:black;overflow: hidden"><iframe style="position: absolute;top: 0;right: 0;width: 100% !important;height: 100% !important;" width="400" height="300"  src="https://www.youtube.com/embed/' + trace.payload + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>',
          mobileUrl: 'https://www.youtube.com/embed/' + trace.payload,
          left: 60,
          top: 60,
          width: 400,
          height: 250,
          addYOffset: true,
          overflow: 'hidden',
          backgroundColor: 'black',
          delayMs: 10
        })
        break
      case 'choice':
        for (const button of trace.payload.buttons) {
          opts.push({
            label: button.name,
            value: button.request
          })
        }
        msg.push({
          type: 'option',
          options: opts
        })
        break
      //case 'end':
      //  msg.push({
      //    type: 'text',
      //    value: 'Thank you!'
      //  })
      //  req.session.destroy()
      //  break
    }
  }

  if (callback) {
    const responseText = callback + '(' + JSON.stringify(response) + ')'
    res.set('Content-Type', 'application/javascript')
    res.send(responseText)
  } else {
    res.json(response)
  }
}))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send({ error: 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
