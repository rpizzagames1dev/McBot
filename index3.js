const mineflayer = require('mineflayer')
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))

let bot
let running = false
let logs = []

function log(msg) {
  console.log(msg)
  logs.push(msg)
  if (logs.length > 100) logs.shift()
  io.emit('log', msg)
}

// ================= PANEL =================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Admin Bot Panel</title>
<style>
body { font-family: Arial; background:#0f0f0f; color:white; text-align:center; }
button { padding:10px; margin:5px; cursor:pointer; }
#logs { background:#111; height:300px; overflow:auto; text-align:left; padding:10px; }
.card { background:#1c1c1c; padding:20px; margin:20px; border-radius:10px; }
</style>
</head>
<body>

<h1>🤖 Bot Admin Panel</h1>

<div class="card">
  <button onclick="fetch('/start', {method:'POST'})">🟢 START SEQUENCE</button>
  <button onclick="fetch('/stop', {method:'POST'})">🔴 STOP</button>
</div>

<div class="card">
  <h3>📜 LOGI</h3>
  <div id="logs"></div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io()
const logsDiv = document.getElementById('logs')

socket.on('log', (msg) => {
  const el = document.createElement('div')
  el.innerText = msg
  logsDiv.appendChild(el)
  logsDiv.scrollTop = logsDiv.scrollHeight
})
</script>

</body>
</html>
  `)
})

// ================= START / STOP =================
app.post('/start', (req, res) => {
  if (running) return res.sendStatus(200)

  running = true
  log('🚀 START SEQUENCE')

  startBot()
  res.sendStatus(200)
})

app.post('/stop', (req, res) => {
  running = false
  log('🛑 STOP')

  if (bot) bot.quit()
  res.sendStatus(200)
})

// ================= BOT =================
function startBot() {
  bot = mineflayer.createBot({
    host: 'sztabki.gg',
    username: 'BossDawidek12',
    version: false,
    auth: 'offline'
  })

  bot.on('login', () => log('🔑 Login...'))

  bot.once('spawn', async () => {
    log('✅ Spawned')

    await sleep(3000)

    try {
      bot.chat(`/zaloguj ${process.env.PASSWORD || 'haslo123'}`)
      log('🔐 Login sent')

      await sleep(3000)

      await doCompassSequence()
    } catch (e) {
      log('❌ spawn error: ' + e.message)
    }
  })

  bot.on('end', () => {
    log('🔄 Disconnected')
    if (running) setTimeout(startBot, 5000)
  })

  bot.on('error', err => log('❌ ERROR: ' + err.message))
  bot.on('kicked', reason => log('❌ KICK: ' + reason))
}

// ================= SAFE SEQUENCE =================
async function doCompassSequence() {
  try {
    log('🧭 Looking for compass...')

    const compass = bot.inventory.items().find(i =>
      i.name.includes('compass')
    )

    if (!compass) {
      log('❌ No compass')
      return
    }

    await bot.equip(compass, 'hand')
    log('🧭 Equipped')

    await sleep(1200)

    bot.activateItem()
    log('📜 GUI open')

    await sleep(2500)

    const window = bot.currentWindow

    if (!window) {
      log('❌ No GUI (skip)')
      return
    }

    const oneblock = window.slots.find(s =>
      s?.displayName?.toLowerCase().includes('oneblock')
    )

    if (!oneblock) {
      log('❌ No oneblock')
      return
    }

    await bot.clickWindow(oneblock.slot, 0, 0)
    log('✅ Oneblock selected')

    await sleep(2000)

    bot.chat('/tpa dawidex3')
    log('📩 TPA sent')

  } catch (err) {
    log('❌ SEQ ERROR: ' + err.message)
  }
}

// ================= UTIL =================
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ================= START SERVER =================
server.listen(PORT, () => {
  log('🌐 Panel online on port ' + PORT)
})
