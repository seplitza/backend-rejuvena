import axios from 'axios';

const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';

async function test() {
  const authRes = await axios.post(`${AZURE_API}/api/token/auth`, {
    username: 'seplitza@gmail.com',
    password: '1234',
    grant_type: 'password',
  });
  
  const token = authRes.data.access_token;
  console.log('✅ Authenticated\n');
  
  const marathonId = '3842e63f-b125-447d-94a1-b1c93be38b4e';
  const dayId = '34aaacf0-23a1-48f1-95b1-8f164ec56dd3';
  
  // Step 0: Try to enroll in marathon
  console.log('0️⃣ Trying to enroll in marathon...');
  try {
    const enrollRes = await axios.post(
      `${AZURE_API}/api/usermarathon/enrollmarathon`,
      { marathonId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Enrolled successfully!\n');
  } catch (err: any) {
    console.log(`⚠️  Enroll: ${err.response?.status} ${err.response?.data || err.message}\n`);
  }
  
  // Try to activate day first
  console.log('1️⃣ Trying to activate day...');
  try {
    const activateRes = await axios.post(
      `${AZURE_API}/api/usermarathon/activateday`,
      { dayId, marathonId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Day activated!\n');
  } catch (err: any) {
    console.log(`⚠️  Activate failed: ${err.response?.status} ${err.response?.data || err.message}\n`);
  }
  
  // Now try to get day exercises
  console.log('2️⃣ Getting day exercises...');
  try {
    const dayRes = await axios.get(
      `${AZURE_API}/api/usermarathon/getdayexercise?dayId=${dayId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Success!');
    console.log('Keys:', Object.keys(dayRes.data));
    if (dayRes.data.marathonDay) {
      console.log('MarathonDay keys:', Object.keys(dayRes.data.marathonDay));
      console.log('DayCategories count:', dayRes.data.marathonDay.dayCategories?.length);
      
      if (dayRes.data.marathonDay.dayCategories && dayRes.data.marathonDay.dayCategories[0]) {
        const cat = dayRes.data.marathonDay.dayCategories[0];
        console.log('\nFirst category:', cat.categoryName);
        console.log('Exercises count:', cat.exercises?.length);
      }
    }
  } catch (err: any) {
    console.log(`❌ Failed: ${err.response?.status} ${err.response?.data || err.message}`);
  }
}

test();
