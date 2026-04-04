"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena';
async function fixMarathonProgressIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected successfully\n');
        const db = mongoose_1.default.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }
        const collection = db.collection('marathonexerciseprogresses');
        // List current indexes
        console.log('Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });
        // Check if old index exists
        const oldIndexName = 'userId_1_marathonId_1_exerciseId_1';
        const hasOldIndex = indexes.some(idx => idx.name === oldIndexName);
        if (hasOldIndex) {
            console.log(`\nDropping old index: ${oldIndexName}`);
            await collection.dropIndex(oldIndexName);
            console.log('✓ Old index dropped');
        }
        else {
            console.log(`\n✓ Old index "${oldIndexName}" does not exist (already removed or never created)`);
        }
        // Check if new index exists
        const newIndexName = 'userId_1_marathonId_1_dayNumber_1_exerciseId_1';
        const hasNewIndex = indexes.some(idx => idx.name === newIndexName);
        if (!hasNewIndex) {
            console.log('\nCreating new index with dayNumber...');
            await collection.createIndex({ userId: 1, marathonId: 1, dayNumber: 1, exerciseId: 1 }, { unique: true, name: newIndexName });
            console.log('✓ New index created');
        }
        else {
            console.log('\n✓ New index already exists');
        }
        // List final indexes
        console.log('\nFinal indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });
        console.log('\n✓ Index migration completed successfully!');
    }
    catch (error) {
        console.error('Error during index migration:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}
fixMarathonProgressIndex();
