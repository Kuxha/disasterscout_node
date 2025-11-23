import { MongoClient, Db, Collection } from 'mongodb';

let db: Db;
let client: MongoClient;

const DB_NAME = process.env.MONGO_DB_NAME || 'disaster_db';

export async function connectDB(uri: string): Promise<void> {
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`Connected to MongoDB: ${DB_NAME}`);

        const incidentsCollection = db.collection('incidents');

        // Check and create 2dsphere index
        const indexes = await incidentsCollection.indexes();
        const hasGeoIndex = indexes.some(index => index.key && index.key.location === '2dsphere');

        if (!hasGeoIndex) {
            await incidentsCollection.createIndex({ location: '2dsphere' });
            console.log('Created 2dsphere index on incidents collection');
        }

    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1);
    }
}

export function getIncidentsCollection(): Collection {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db.collection('incidents');
}
