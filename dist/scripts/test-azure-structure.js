"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
async function test() {
    // Auth
    const authRes = await axios_1.default.post(`${AZURE_API}/api/token/auth`, {
        username: 'seplitza@gmail.com',
        password: '1234',
        grant_type: 'password',
    });
    const token = authRes.data.access_token;
    console.log('✅ Authenticated\n');
    // Get marathon structure
    const marathonRes = await axios_1.default.get(`${AZURE_API}/api/usermarathon/startmarathon?marathonId=3842e63f-b125-447d-94a1-b1c93be38b4e`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Marathon structure keys:', Object.keys(marathonRes.data));
    console.log('Marathon days (list) count:', marathonRes.data.marathonDays?.length);
    console.log('Practice days count:', marathonRes.data.practiceDays?.length);
    console.log('Has current marathonDay?', !!marathonRes.data.marathonDay);
    if (marathonRes.data.marathonDays && marathonRes.data.marathonDays[0]) {
        const day1 = marathonRes.data.marathonDays[0];
        console.log('\n📖 First marathon day from list:');
        console.log('Keys:', Object.keys(day1));
        console.log('Day:', day1.day);
        console.log('ID:', day1.id);
        console.log('Description:', day1.description?.substring(0, 100));
        console.log('Has dayCategories?', !!day1.dayCategories);
        console.log('DayCategories length:', day1.dayCategories?.length);
        console.log('Has exercises?', !!day1.exercises);
        console.log('Exercises length:', day1.exercises?.length);
        // Try to get full day data
        console.log('\n🔍 Fetching full day data...');
        try {
            const dayRes = await axios_1.default.get(`${AZURE_API}/api/usermarathon/getdayexercise?dayId=${day1.id}`, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ Day exercise data received');
            console.log('Keys:', Object.keys(dayRes.data));
            if (dayRes.data.marathonDay) {
                console.log('MarathonDay keys:', Object.keys(dayRes.data.marathonDay));
                console.log('DayCategories count:', dayRes.data.marathonDay.dayCategories?.length);
            }
        }
        catch (err) {
            console.log('❌ Failed to get day exercises:', err.response?.data || err.message);
        }
    }
    if (marathonRes.data.marathonDay) {
        const currentDay = marathonRes.data.marathonDay;
        console.log('\n📖 Current marathonDay structure:');
        console.log('Keys:', Object.keys(currentDay));
        console.log('Description:', currentDay.description?.substring(0, 100));
        console.log('DayCategories count:', currentDay.dayCategories?.length);
        if (currentDay.dayCategories && currentDay.dayCategories[0]) {
            const cat = currentDay.dayCategories[0];
            console.log('\nFirst category:', cat.categoryName);
            console.log('Exercises count:', cat.exercises?.length);
            if (cat.exercises && cat.exercises[0]) {
                console.log('\nFirst exercise keys:', Object.keys(cat.exercises[0]));
                console.log('Has exerciseContents?', !!cat.exercises[0].exerciseContents);
                console.log('ExerciseContents count:', cat.exercises[0].exerciseContents?.length);
            }
        }
    }
}
test().catch(console.error);
