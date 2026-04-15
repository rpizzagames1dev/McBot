const mineflayer = require('mineflayer')
const express = require('express')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))

let bot
let state = {
  running: false,
  step: 'idle'
}

// ===== PANEL WWW =====
app.get('/', (req, res) => {
  res.send(`
    <h1>🤖 Bot Panel</h1>
    <p>Status: ${state.step}</p>

    <form method="POST" action="/start">
      <button>START SEQUENCE</button>
    </form>

    <form method="POST" action="/stop">
      <button>STOP</button>
    </form>
  `)
})

// START
app.post('/start', (req, res) => {
  state.running = true
  state.step = 'starting'

  startBotSequence()

  res.redirect('/')
})

// STOP
app.post('/stop', (req, res) => {
  state.running = false
  state.step = 'stopped'

  if (bot) bot.quit()

  res.redirect('/')
})

app.listen(PORT, () => {
  console.log('🌐 Panel działa')
})

// ===== BOT =====
function createBot() {
  bot = mineflayer.createBot({
    host: 'sztabki.gg',
    username: 'BossDawidek12',
    version: false,
    auth: 'offline'
  })

  bot.on('error', console.log)

  bot.on('end', () => {
    console.log('🔄 reconnect...')
    setTimeout(() => {
      if (state.running) createBot()
    }, 5000)
  })
}

// ===== SEKWENCJA =====
async function startBotSequence() {
  createBot()

  bot.once('spawn', async () => {
    state.step = 'logged in'

    await sleep(3000)

    bot.chat('/zaloguj haslo123')

    await sleep(3000)

    state.step = 'opening compass'

    const compass = bot.inventory.items().find(i =>
      i.name.includes('compass')
    )

    if (!compass) return console.log('Brak kompasu')

    await bot.equip(compass, 'hand')
    bot.activateItem()

    state.step = 'menu opened'

    await sleep(2000)

    const window = bot.currentWindow
    if (!window) return console.log('Brak GUI')

    const oneblock = window.slots.find(s =>
      s?.displayName?.toLowerCase().includes('oneblock')
    )

    if (oneblock) {
      await bot.clickWindow(oneblock.slot, 0, 0)
      state.step = 'oneblock selected'
    }

    await sleep(2000)

    bot.chat('/tpa dawidex3')
    state.step = 'tp sent'
  })
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}
