"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
const ADMIN_USERNAME = 'admin@miyabi.com';
const ADMIN_PASSWORD = 'QR+L&9aS';
async function testAdminEndpoints() {
    try {
        // Step 1: Authenticate as admin
        console.log('🔐 Authenticating as admin...\n');
        const authResponse = await axios_1.default.post(`${AZURE_API}/api/token/auth`, {
            username: ADMIN_USERNAME,
            password: ADMIN_PASSWORD,
            grant_type: 'password',
        });
        const token = authResponse.data.access_token;
        const role = authResponse.data.role;
        console.log(`✅ Authenticated as: ${authResponse.data.username}`);
        console.log(`   Role: ${role}\n`);
        // Step 2: Try different admin endpoints
        const testEndpoints = [
            '/api/admin/marathons',
            '/api/admin/usermarathon',
            '/api/admin/courses',
            '/api/marathon/getall',
            '/api/usermarathon/getallmarathons',
            '/api/admin/marathon/getall',
        ];
        for (const endpoint of testEndpoints) {
            try {
                console.log(`Testing: ${endpoint}`);
                const response = await axios_1.default.get(`${AZURE_API}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`✅ SUCCESS! Status: ${response.status}`);
                console.log(`   Data length: ${JSON.stringify(response.data).length} bytes`);
                console.log(`   Sample:`, JSON.stringify(response.data).slice(0, 200));
                console.log('');
            }
            catch (error) {
                console.log(`❌ ${error.response?.status || 'ERROR'}: ${error.message}`);
                console.log('');
            }
        }
        // Step 3: Try to enroll in a marathon as admin
        console.log('\n📝 Trying to enroll in marathon as admin...');
        try {
            const enrollResponse = await axios_1.default.post(`${AZURE_API}/api/usermarathon/enroll`, { marathonId: '3842e63f-b125-447d-94a1-b1c93be38b4e' }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ Enrollment successful!');
            console.log('   Response:', enrollResponse.data);
        }
        catch (error) {
            console.log(`❌ Enrollment failed: ${error.response?.status} - ${error.response?.data || error.message}`);
        }
        // Step 4: Try startmarathon after enrollment
        console.log('\n🏃 Trying startmarathon after enrollment...');
        try {
            const marathonResponse = await axios_1.default.get(`${AZURE_API}/api/usermarathon/startmarathon?marathonId=3842e63f-b125-447d-94a1-b1c93be38b4e`, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ Marathon data retrieved!');
            console.log('   Has marathonDays:', !!marathonResponse.data.marathonDays);
            console.log('   Days count:', marathonResponse.data.marathonDays?.length || 0);
            if (marathonResponse.data.marathonDays?.length > 0) {
                const firstDay = marathonResponse.data.marathonDays[0];
                console.log('   First day has dayCategories:', !!firstDay.dayCategories);
                if (firstDay.dayCategories) {
                    console.log('   Categories count:', firstDay.dayCategories.length);
                }
            }
        }
        catch (error) {
            console.log(`❌ Failed: ${error.response?.status} - ${error.message}`);
        }
    }
    catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}
testAdminEndpoints();
