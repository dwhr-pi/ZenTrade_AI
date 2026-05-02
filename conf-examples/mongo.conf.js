var c = module.exports = {}

// Klassischer Zenbot-Betrieb mit MongoDB.
c.db = {}
c.db.type = 'mongo'

// Mongo-Einstellungen bleiben im regulaeren c.mongo-Block.
// Wenn conf.js oder Umgebungsvariablen bereits andere Werte setzen,
// koennen diese Vorlage und die Hauptkonfiguration gemeinsam genutzt werden.
c.mongo = {}
c.mongo.db = process.env.ZENBOT_MONGODB_DATABASE || 'zenbot4'
c.mongo.connectionString = process.env.ZENBOT_MONGODB_CONNECTION_STRING || null
c.mongo.host = process.env.ZENBOT_MONGODB_HOST || 'localhost'
c.mongo.port = process.env.ZENBOT_MONGODB_PORT || 27017
c.mongo.username = process.env.ZENBOT_MONGO_USERNAME || null
c.mongo.password = process.env.ZENBOT_MONGO_PASSWORD || null
c.mongo.replicaSet = process.env.ZENBOT_MONGO_REPLICASET || null
c.mongo.authMechanism = process.env.ZENBOT_MONGO_AUTH_MECHANISM || null
