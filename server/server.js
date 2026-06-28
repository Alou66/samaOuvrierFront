const jsonServer = require('json-server')
const path = require('path')

const app = jsonServer.create()
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()

// CORS — autorise le frontend Vercel (et localhost pour le dev)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(middlewares)
app.use(router)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Sama-Ouvrier API running on port ${PORT}`)
})
