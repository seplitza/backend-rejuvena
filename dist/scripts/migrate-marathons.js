"use strict";
/**
 * Migration script: Azure Old API -> New Backend API
 * Migrates all marathons with their learning days content
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTransformer = exports.NewAPIClient = exports.AzureAPIClient = exports.MarathonMigrator = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ============= CONFIGURATION =============
const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
const NEW_API = process.env.NEW_API_URL || 'http://localhost:9527';
const DATA_DIR = path.join(__dirname, '../../marathon-migration-data');
// Azure credentials (ADMIN)
const AZURE_USERNAME = 'admin@miyabi.com';
const AZURE_PASSWORD = 'QR+L&9aS';
// New admin credentials
const NEW_ADMIN_EMAIL = 'seplitza@gmail.com';
const NEW_ADMIN_PASSWORD = '1234back';
// ============= AZURE API CLIENT =============
class AzureAPIClient {
    constructor() {
        this.token = '';
        this.axiosInstance = axios_1.default.create({
            baseURL: AZURE_API,
            timeout: 30000,
        });
    }
    async authenticate() {
        console.log('🔐 Authenticating with Azure API...');
        const response = await this.axiosInstance.post('/api/token/auth', {
            username: AZURE_USERNAME,
            password: AZURE_PASSWORD,
            grant_type: 'password',
        });
        this.token = response.data.access_token;
        console.log('✅ Azure authentication successful');
    }
    async getMarathonStructure(marathonId) {
        console.log(`📥 Fetching marathon structure: ${marathonId}`);
        const response = await this.axiosInstance.get(`/api/usermarathon/startmarathon?marathonId=${marathonId}`, {
            headers: { Authorization: `Bearer ${this.token}` },
        });
        return response.data;
    }
    async getDayExercises(dayId) {
        console.log(`📥 Fetching day exercises: ${dayId}`);
        const response = await this.axiosInstance.get(`/api/usermarathon/getdayexercise?dayId=${dayId}`, {
            headers: { Authorization: `Bearer ${this.token}` },
        });
        return response.data;
    }
}
exports.AzureAPIClient = AzureAPIClient;
// ============= NEW API CLIENT =============
class NewAPIClient {
    constructor() {
        this.token = '';
        this.axiosInstance = axios_1.default.create({
            baseURL: NEW_API,
            timeout: 30000,
        });
    }
    async authenticate() {
        console.log('🔐 Authenticating with New API...');
        const response = await this.axiosInstance.post('/api/auth/login', {
            email: NEW_ADMIN_EMAIL,
            password: NEW_ADMIN_PASSWORD,
        });
        this.token = response.data.token;
        console.log('✅ New API authentication successful');
    }
    async getMarathons() {
        console.log('📥 Fetching marathons from new API...');
        const response = await this.axiosInstance.get('/api/admin/marathons', {
            headers: { Authorization: `Bearer ${this.token}` },
        });
        return response.data.marathons || response.data.data?.marathons || [];
    }
    async createMarathonDay(marathonId, dayNumber, dayData) {
        console.log(`📤 Creating day ${dayNumber} for marathon ${marathonId}`);
        await this.axiosInstance.post(`/api/marathons/admin/${marathonId}/days`, {
            dayNumber,
            ...dayData,
        }, {
            headers: { Authorization: `Bearer ${this.token}` },
        });
    }
    async updateMarathonDay(marathonId, dayId, dayData) {
        console.log(`📤 Updating day ${dayId} for marathon ${marathonId}`);
        await this.axiosInstance.put(`/api/marathons/admin/${marathonId}/days/${dayId}`, dayData, {
            headers: { Authorization: `Bearer ${this.token}` },
        });
    }
}
exports.NewAPIClient = NewAPIClient;
// ============= DATA TRANSFORMER =============
class DataTransformer {
    /**
     * Transform Azure marathon day to new API format
     */
    static transformDay(azureDay) {
        return {
            welcomeMessage: azureDay.description || '',
            exercises: this.transformCategories(azureDay.dayCategories),
        };
    }
    /**
     * Transform Azure categories to exercise list
     */
    static transformCategories(categories) {
        const exercises = [];
        for (const category of categories) {
            for (const exercise of category.exercises) {
                exercises.push({
                    categoryName: category.categoryName,
                    exerciseName: exercise.exerciseName,
                    exerciseDescription: exercise.exerciseDescription,
                    marathonExerciseName: exercise.marathonExerciseName,
                    order: exercise.order,
                    categoryOrder: category.order,
                    media: this.transformExerciseContents(exercise.exerciseContents),
                });
            }
        }
        // Sort by category order, then by exercise order
        exercises.sort((a, b) => {
            if (a.categoryOrder !== b.categoryOrder) {
                return a.categoryOrder - b.categoryOrder;
            }
            return a.order - b.order;
        });
        return exercises;
    }
    /**
     * Transform exercise contents (images/videos) to media format
     */
    static transformExerciseContents(contents) {
        return contents
            .sort((a, b) => a.order - b.order)
            .map(content => ({
            type: content.type,
            url: content.contentPath,
            order: content.order,
        }));
    }
}
exports.DataTransformer = DataTransformer;
// ============= FILE OPERATIONS =============
class FileStorage {
    static ensureDirectory() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            console.log(`📁 Created directory: ${DATA_DIR}`);
        }
    }
    static saveMarathonData(marathonId, marathonTitle, data) {
        this.ensureDirectory();
        const fileName = `${marathonId}_${marathonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        const filePath = path.join(DATA_DIR, fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`💾 Saved marathon data: ${fileName}`);
    }
    static loadMarathonData(marathonId) {
        this.ensureDirectory();
        const files = fs.readdirSync(DATA_DIR);
        const file = files.find(f => f.startsWith(marathonId));
        if (!file)
            return null;
        const filePath = path.join(DATA_DIR, file);
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
}
// ============= MIGRATION ORCHESTRATOR =============
class MarathonMigrator {
    constructor(downloadOnly = false) {
        this.azureClient = new AzureAPIClient();
        this.newClient = new NewAPIClient();
        this.downloadOnly = downloadOnly;
    }
    async initialize() {
        await this.azureClient.authenticate();
        // Only authenticate with new API if we're doing full migration
        if (!this.downloadOnly) {
            await this.newClient.authenticate();
        }
    }
    /**
     * Step 1: Download all marathon data from Azure
     */
    async downloadMarathon(marathonId, marathonTitle) {
        console.log(`\n🏃 Downloading marathon: ${marathonTitle} (${marathonId})`);
        // Get marathon structure
        const structure = await this.azureClient.getMarathonStructure(marathonId);
        if (!structure.marathonDays || structure.marathonDays.length === 0) {
            console.log(`⚠️  No marathon days found for: ${marathonTitle}`);
            return null;
        }
        const marathonData = {
            marathonId,
            title: structure.title,
            subTitle: structure.marathonSubTitle,
            days: [],
        };
        // Process each day (data is already in marathonDays array)
        for (const day of structure.marathonDays) {
            console.log(`  📖 Processing Day ${day.day}...`);
            if (day.dayCategories && day.dayCategories.length > 0) {
                marathonData.days.push({
                    dayNumber: day.day,
                    dayId: day.id,
                    description: day.description,
                    rawData: {
                        description: day.description,
                        dayCategories: day.dayCategories,
                    },
                    transformedData: DataTransformer.transformDay({
                        description: day.description,
                        dayCategories: day.dayCategories,
                    }),
                });
            }
            else {
                console.log(`  ⚠️  Day ${day.day} has no categories, skipping...`);
            }
        }
        // Save to file
        FileStorage.saveMarathonData(marathonId, marathonTitle, marathonData);
        console.log(`✅ Downloaded ${marathonData.days.length} days for ${marathonTitle}`);
        return marathonData;
    }
    /**
     * Step 2: Upload marathon data to new API
     */
    async uploadMarathon(sourceMarathonId, targetMarathonId) {
        console.log(`\n📤 Uploading marathon data to new API...`);
        // Load saved data
        const marathonData = FileStorage.loadMarathonData(sourceMarathonId);
        if (!marathonData) {
            throw new Error(`No saved data found for marathon: ${sourceMarathonId}`);
        }
        console.log(`📦 Loaded data for: ${marathonData.title}`);
        console.log(`   Days to upload: ${marathonData.learningDays.length}`);
        // Upload each day
        for (const day of marathonData.learningDays) {
            console.log(`  📤 Uploading Day ${day.dayNumber}...`);
            try {
                await this.newClient.createMarathonDay(targetMarathonId, day.dayNumber, day.transformedData);
                console.log(`  ✅ Day ${day.dayNumber} uploaded successfully`);
            }
            catch (error) {
                console.error(`  ❌ Failed to upload Day ${day.dayNumber}:`, error.message);
                // Continue with other days
            }
            // Be nice to the API
            await this.sleep(500);
        }
        console.log(`✅ Upload complete for marathon: ${marathonData.title}`);
    }
    /**
     * Full migration: download from Azure + upload to new API
     */
    async migrateMarathon(azureMarathonId, marathonTitle, newMarathonId) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔄 MIGRATING: ${marathonTitle}`);
        console.log(`   From: Azure ${azureMarathonId}`);
        console.log(`   To: New API ${newMarathonId}`);
        console.log(`${'='.repeat(80)}`);
        try {
            // Step 1: Download from Azure
            await this.downloadMarathon(azureMarathonId, marathonTitle);
            // Step 2: Upload to new API
            await this.uploadMarathon(azureMarathonId, newMarathonId);
            console.log(`\n✅ Migration complete for: ${marathonTitle}`);
        }
        catch (error) {
            console.error(`\n❌ Migration failed for ${marathonTitle}:`, error.message);
            throw error;
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.MarathonMigrator = MarathonMigrator;
// ============= MARATHON MAPPINGS =============
/**
 * List of all Azure courses (from old backend) to migrate
 * Each entry: [azureMarathonId, marathonTitle, numberOfDays]
 *
 * Total: 11 courses, 85 days
 * - 2 courses × 14 days = 28 days (Омолодись, Look younger)
 * - 1 course × 1 day = 1 day (Зарядка)
 * - 8 courses × 7 days = 56 days (все остальные)
 */
const AZURE_MARATHONS = [
    ['3842e63f-b125-447d-94a1-b1c93be38b4e', 'Омолодись', 14], // 14 дней обучения
    ['8ae4db8b-b256-462a-8918-7e7811243d64', 'Look younger', 14], // 14 дней обучения
    ['49083563-a9fc-4c13-b6a4-fdc2e4158479', 'Зарядка', 1], // 1 день обучения
    ['e7ce939d-b84a-4816-b5bf-ed347646f943', 'средняя англ', 7], // 7 дней
    ['11e5f1f2-de4e-4833-a7e5-3089c40be78f', 'лоб', 7], // 7 дней
    ['fc62d140-17af-4c61-be90-63a6cc656a7b', 'шея англ', 7], // 7 дней
    ['b9a10637-8b1e-478d-940c-4d239e53831e', 'губы', 7], // 7 дней
    ['3c33c808-523c-4e60-b284-139e2a136544', 'лоб англ', 7], // 7 дней
    ['b87370d5-4ce1-49b2-86f4-23deb9a99123', 'средняя', 7], // 7 дней
    ['b8775841-7b7d-43ca-b556-a9ce74d339cf', 'шея', 7], // 7 дней
    ['4af5f89c-ba91-43c6-bdf5-9bc7d9d8e3a7', 'губы англ', 7], // 7 дней
];
/**
 * Mapping: Azure Marathon ID -> New API Marathon ID
 *
 * ✅ All 11 marathons created and mapped!
 */
const MARATHON_ID_MAPPING = {
    '3842e63f-b125-447d-94a1-b1c93be38b4e': '696fab9cd2a8c56f62ebdb09', // Омолодись (14 days, ru)
    '8ae4db8b-b256-462a-8918-7e7811243d64': '69733e6cf22ce2297694b8a3', // Look younger (14 days, en)
    '49083563-a9fc-4c13-b6a4-fdc2e4158479': '69733e6df22ce2297694b8a5', // Зарядка (1 day, ru)
    'e7ce939d-b84a-4816-b5bf-ed347646f943': '69733e6ef22ce2297694b8a7', // средняя англ (7 days, en)
    '11e5f1f2-de4e-4833-a7e5-3089c40be78f': '69733e6ff22ce2297694b8a9', // лоб (7 days, ru)
    'fc62d140-17af-4c61-be90-63a6cc656a7b': '69733e77f22ce2297694b8ab', // шея англ (7 days, en)
    'b9a10637-8b1e-478d-940c-4d239e53831e': '69733e78f22ce2297694b8ad', // губы (7 days, ru)
    '3c33c808-523c-4e60-b284-139e2a136544': '69733e79f22ce2297694b8af', // лоб англ (7 days, en)
    'b87370d5-4ce1-49b2-86f4-23deb9a99123': '69733e7ef22ce2297694b8b1', // средняя (7 days, ru)
    'b8775841-7b7d-43ca-b556-a9ce74d339cf': '69733e7ff22ce2297694b8b3', // шея (7 days, ru)
    '4af5f89c-ba91-43c6-bdf5-9bc7d9d8e3a7': '69733e7ff22ce2297694b8b5', // губы англ (7 days, en)
};
// ============= MAIN EXECUTION =============
async function main() {
    console.log('🚀 Marathon Migration Tool');
    console.log('===========================\n');
    const migrator = new MarathonMigrator();
    try {
        // Initialize API clients
        await migrator.initialize();
        // Migrate all configured marathons
        for (const [azureId, title, _] of AZURE_MARATHONS) {
            const newId = MARATHON_ID_MAPPING[azureId];
            if (!newId) {
                console.log(`⚠️  Skipping ${title}: No new marathon ID mapped`);
                continue;
            }
            await migrator.migrateMarathon(azureId, title, newId);
            // Wait between marathons
            console.log('\n⏳ Waiting 2 seconds before next marathon...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        console.log('\n🎉 All migrations completed!');
        console.log('\n📊 Summary:');
        console.log(`   Total marathons: ${AZURE_MARATHONS.length}`);
        console.log(`   Mapped: ${Object.keys(MARATHON_ID_MAPPING).length}`);
        console.log(`   Data saved to: ${DATA_DIR}`);
    }
    catch (error) {
        console.error('\n💥 Migration failed:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}
// Run if executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    if (command === 'download-only') {
        // Only download from Azure, don't upload
        console.log('📥 Download-only mode\n');
        (async () => {
            const migrator = new MarathonMigrator(true); // Pass downloadOnly flag
            await migrator.initialize();
            for (const [azureId, title, _] of AZURE_MARATHONS) {
                await migrator.downloadMarathon(azureId, title);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            console.log('\n✅ All downloads complete!');
        })();
    }
    else if (command === 'list-marathons') {
        // List available marathons
        console.log('📋 Available Azure Marathons:\n');
        AZURE_MARATHONS.forEach(([id, title, days], index) => {
            const mapped = MARATHON_ID_MAPPING[id];
            console.log(`${index + 1}. ${title} (${days} days)`);
            console.log(`   Azure ID: ${id}`);
            console.log(`   New ID: ${mapped || '❌ NOT MAPPED'}\n`);
        });
    }
    else {
        // Default: full migration
        main();
    }
}
