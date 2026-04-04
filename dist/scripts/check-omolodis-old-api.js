"use strict";
/**
 * Check Омолодись marathon days from old Azure API
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
const USERNAME = 'seplitza@gmail.com';
const PASSWORD = '1234';
const OMOLODIS_ID = '8e2d0f4f-6be1-4d21-844c-ab5ca85f924d'; // ID из мобильного приложения
async function checkOmolodisOldAPI() {
    try {
        console.log('🔐 Authenticating with Azure API...\n');
        // Step 1: Authenticate
        const authResponse = await axios_1.default.post(`${AZURE_API}/api/token/auth`, {
            username: USERNAME,
            password: PASSWORD,
            grant_type: 'password',
        });
        const token = authResponse.data.access_token;
        console.log('✅ Authentication successful\n');
        // Step 2: Get marathon data via startmarathon
        console.log('📥 Fetching Омолодись marathon from startmarathon...\n');
        const marathonResponse = await axios_1.default.get(`${AZURE_API}/api/usermarathon/startmarathon`, {
            params: {
                marathonId: OMOLODIS_ID,
                timeZoneOffset: -180
            },
            headers: {
                Authorization: `Bearer ${token}`,
                UserLanguage: 'ru'
            },
        });
        const marathon = marathonResponse.data;
        console.log(`📋 Marathon: ${marathon.title}`);
        console.log(`   Subtitle: ${marathon.subTitle}`);
        console.log(`   Marathon Days: ${marathon.marathonDays?.length || 0}`);
        console.log(`   Great Extension Days: ${marathon.greatExtensionDays?.length || 0}\n`);
        // Show marathon days (1-14)
        console.log('📅 MARATHON DAYS (Learning):');
        console.log('='.repeat(80));
        if (marathon.marathonDays && marathon.marathonDays.length > 0) {
            marathon.marathonDays.forEach((day, index) => {
                console.log(`Day ${day.day || index + 1}:`);
                console.log(`  ID: ${day.id || day.dayId}`);
                console.log(`  Name: ${day.dayName || 'N/A'}`);
                console.log(`  Description: ${day.dayDescription?.substring(0, 100) || 'N/A'}...`);
                console.log('');
            });
        }
        else {
            console.log('  (none)');
        }
        // Show great extension days (15+)
        console.log('\n📅 GREAT EXTENSION DAYS (Practice):');
        console.log('='.repeat(80));
        if (marathon.greatExtensionDays && marathon.greatExtensionDays.length > 0) {
            marathon.greatExtensionDays.forEach((day, index) => {
                console.log(`Day ${day.day || (15 + index)}:`);
                console.log(`  ID: ${day.id || day.dayId}`);
                console.log(`  Name: ${day.dayName || 'N/A'}`);
                console.log(`  Description: ${day.dayDescription?.substring(0, 100) || 'N/A'}...`);
                console.log('');
            });
        }
        else {
            console.log('  (none)\n');
        }
        console.log('='.repeat(80));
        console.log(`\n✅ Total days available: ${(marathon.marathonDays?.length || 0) + (marathon.greatExtensionDays?.length || 0)}`);
    }
    catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}
checkOmolodisOldAPI();
