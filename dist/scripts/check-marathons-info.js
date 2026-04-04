"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
const AZURE_USERNAME = 'seplitza@gmail.com';
const AZURE_PASSWORD = '1234';
const MARATHON_IDS = [
    { id: '3842e63f-b125-447d-94a1-b1c93be38b4e', title: 'Омолодись' },
    { id: '49083563-a9fc-4c13-b6a4-fdc2e4158479', title: 'Зарядка' },
    { id: 'e7ce939d-b84a-4816-b5bf-ed347646f943', title: 'средняя англ' },
    { id: '11e5f1f2-de4e-4833-a7e5-3089c40be78f', title: 'лоб' },
    { id: 'fc62d140-17af-4c61-be90-63a6cc656a7b', title: 'шея англ' },
    { id: 'b9a10637-8b1e-478d-940c-4d239e53831e', title: 'губы' },
    { id: '3c33c808-523c-4e60-b284-139e2a136544', title: 'лоб англ' },
    { id: 'b87370d5-4ce1-49b2-86f4-23deb9a99123', title: 'средняя' },
    { id: 'b8775841-7b7d-43ca-b556-a9ce74d339cf', title: 'шея' },
    { id: '4af5f89c-ba91-43c6-bdf5-9bc7d9d8e3a7', title: 'губы англ' },
    { id: '8ae4db8b-b256-462a-8918-7e7811243d64', title: 'омолодись англ' },
];
async function main() {
    try {
        // Step 1: Authenticate
        console.log('🔐 Authenticating with Azure API...\n');
        const authResponse = await axios_1.default.post(`${AZURE_API}/api/token/auth`, {
            username: AZURE_USERNAME,
            password: AZURE_PASSWORD,
            grant_type: 'password',
        });
        const token = authResponse.data.access_token;
        console.log('✅ Authentication successful\n');
        // Step 2: Get info for each marathon
        console.log('📥 Fetching marathon details...\n');
        const results = [];
        for (const marathon of MARATHON_IDS) {
            try {
                const response = await axios_1.default.get(`${AZURE_API}/api/usermarathon/startmarathon?marathonId=${marathon.id}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = response.data;
                const learningDays = data.learningDays?.length || 0;
                const practiceDays = data.practiceDays?.length || 0;
                const totalDays = learningDays + practiceDays;
                results.push({
                    id: marathon.id,
                    title: marathon.title,
                    subtitle: data.marathonSubTitle,
                    learningDays,
                    practiceDays,
                    totalDays,
                });
                console.log(`✅ ${marathon.title}: ${learningDays} learning + ${practiceDays} practice = ${totalDays} total days`);
            }
            catch (error) {
                console.log(`❌ ${marathon.title}: Error - ${error.message}`);
                results.push({
                    id: marathon.id,
                    title: marathon.title,
                    error: error.message,
                });
            }
        }
        // Step 3: Generate TypeScript array
        console.log('\n\n📝 TypeScript configuration for migrate-marathons.ts:\n');
        console.log('const AZURE_MARATHONS = [');
        results
            .filter((m) => m.totalDays && m.totalDays > 0)
            .forEach((m) => {
            console.log(`  ['${m.id}', '${m.title}', ${m.totalDays}], // ${m.learningDays} learning + ${m.practiceDays} practice`);
        });
        console.log('] as const;\n');
        console.log('\n📊 Summary:');
        console.log(`Total marathons: ${results.length}`);
        console.log(`With days: ${results.filter((m) => m.totalDays).length}`);
        console.log(`Total days to migrate: ${results.reduce((sum, m) => sum + (m.totalDays || 0), 0)}`);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
main();
