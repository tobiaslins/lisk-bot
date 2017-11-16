import { MongoClient } from 'mongodb'

let db

export const connect = async () => {
  console.log('Connecting to db')
  db = await MongoClient.connect(process.env.MONGO_URL)
  console.log('Connected')
  return db
}

export default db
