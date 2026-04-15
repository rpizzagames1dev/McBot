const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const express = require('express')

// === KEEP-ALIVE ===
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('✅ Bot działa 24/7!')
})

app.listen(PORT, () => {
  console.log(`🌐 Keep-alive na porcie ${PORT}`)
})

// ================== KONFIGURACJA ==================
const botConfig = {
  host: 'sztabki.gg',
  username: 'BossDawidek12',
  version: false, // 🔥 AUTO wykrywanie wersji (lepsze!)
  auth: 'offline'
}

const PASSWORD = process.env.PASSWORD || 'Masełko123'

let bot
let autoAttack = false
let currentTarget = null

function getEntityName(entity) {
  if (!entity) return 'nieznany'
  return entity.username || entity.displayName || entity.name || 'mob'
}

function findBestTarget() {
  if (!bot?.entity) return null

  let best = null
  let bestScore = Infinity

  for (const entity of Object.values(bot.entities)) {
    if (!entity?.position || entity === bot.entity) continue

    const dist = bot.entity.position.distanceTo(entity.position)
    if (dist > 30) continue

    let score = dist
    const nameLower = getEntityName(entity).toLowerCase()

    if (entity.type === 'player' && entity.username !== bot.username) {
      score -= 150
    } else if (entity.type === 'mob') {
      const ignored = ['armor_stand', 'item', 'xp_orb', 'arrow']
      if (ignored.some(i => nameLower.includes(i))) continue

      score -= 60
      if (nameLower.includes('blaze')) score -= 120
    } else continue

    if (score < bestScore) {
      bestScore = score
      best = entity
    }
  }

  return best
}

function startBot() {
  console.log('🔥 Bot startuje...')

  bot = mineflayer.createBot(botConfig)
  bot.loadPlugin(pathfinder)

  bot.on('error', err => {
    console.log('❌ ERROR:', err)
  })

  bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    defaultMove.canDig = false
    bot.pathfinder.setMovements(defaultMove)

    console.log('✅ Bot zalogowany!')
  })

  bot.on('message', (jsonMsg) => {
    const msg = jsonMsg.toString().trim()
    if (msg) console.log(`[CZAT] ${msg}`)

    if (msg.includes('zarejestruj')) {
      bot.chat(`/zarejestruj ${PASSWORD} ${PASSWORD}`)
    }
    if (msg.includes('zaloguj')) {
      bot.chat(`/zaloguj ${PASSWORD}`)
    }

    if (msg.toLowerCase() === 'auto') {
      autoAttack = !autoAttack
      currentTarget = null
      bot.chat(autoAttack ? '⚔️ AUTO ON' : '🛑 AUTO OFF')
    }
  })

  // Auto eat
  setInterval(() => {
    if (bot.food && bot.food < 15) {
      const food = bot.inventory.items().find(i =>
        /apple|bread|steak|porkchop|chicken|mutton/.test(i.name)
      )
      if (food) {
        bot.equip(food, 'hand').then(() => bot.consume())
      }
    }
  }, 10000)

  // Anti-AFK
  setInterval(() => {
    if (bot.entity && Math.random() < 0.3) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 300)
    }
  }, 45000)

  // Auto attack
  setInterval(() => {
    if (!autoAttack || !bot?.entity) return

    if (!currentTarget || !currentTarget.isValid ||
        bot.entity.position.distanceTo(currentTarget.position) > 32) {
      currentTarget = findBestTarget()
    }

    if (!currentTarget) return

    const dist = bot.entity.position.distanceTo(currentTarget.position)

    if (dist > 4.5) {
      bot.pathfinder.setGoal(new goals.GoalFollow(currentTarget, 3.8), true)
    } else {
      bot.pathfinder.setGoal(null)
    }

    bot.lookAt(currentTarget.position.offset(0, currentTarget.height * 0.7, 0))

    const now = Date.now()
    if (!bot._lastAttack || now - bot._lastAttack > 500) {
      bot.attack(currentTarget)
      bot._lastAttack = now
      console.log(`⚔️ Atak`)
    }
  }, 150)

  bot.on('end', () => {
    console.log('🔄 Restart za 10s...')
    setTimeout(startBot, 10000)
  })
}

startBot()
