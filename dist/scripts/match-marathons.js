"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
const AZURE_USERNAME = 'seplitza@gmail.com';
const AZURE_PASSWORD = '1234';
const PROVIDED_IDS = [
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
        // Step 2: Get all marathons from API
        console.log('📥 Fetching all marathons from API...\n');
        const marathonsResponse = await axios_1.default.get(`${AZURE_API}/api/usermarathon/getmarathons`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const allMarathons = marathonsResponse.data;
        console.log(`📋 API returned ${allMarathons.length} marathons\n`);
        // Step 3: Match with provided IDs
        const results = [];
        for (const provided of PROVIDED_IDS) {
            const found = allMarathons.find((m) => m.id === provided.id);
            if (found) {
                results.push({
                    id: found.id,
                    title: found.title || provided.title,
                    subtitle: found.subTitle,
                    days: found.days,
                    isPaid: found.isPaid,
                    isPublic: found.isPublic,
                    isDisplay: found.isDisplay,
                });
                console.log(`✅ ${provided.title}: ${found.days} days (${found.subTitle || 'no subtitle'})`);
            }
            else {
                results.push({
                    id: provided.id,
                    title: provided.title,
                    days: 14, // Default assumption for marathons
                    notFound: true,
                });
                console.log(`⚠️  ${provided.title}: Not found in API, assuming 14 days`);
            }
        }
        // Step 4: Generate TypeScript array
        console.log('\n\n📝 TypeScript configuration for migrate-marathons.ts:\n');
        console.log('const AZURE_MARATHONS = [');
        results.forEach((m) => {
            const comment = m.notFound ? ' // NOT IN API - assuming 14 days' : ` // ${m.subtitle || ''}`;
            console.log(`  ['${m.id}', '${m.title}', ${m.days}],${comment}`);
        });
        console.log('] as const;\n');
        console.log('\n📊 Summary:');
        console.log(`Total marathons: ${results.length}`);
        console.log(`Found in API: ${results.filter((m) => !m.notFound).length}`);
        console.log(`Assumed (not in API): ${results.filter((m) => m.notFound).length}`);
        console.log(`Total days to migrate: ${results.reduce((sum, m) => sum + (m.days || 0), 0)}`);
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}
main();
