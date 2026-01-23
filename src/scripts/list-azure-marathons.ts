/**
 * Helper script to list all available marathons from Azure API
 * Run: npx ts-node src/scripts/list-azure-marathons.ts
 */

import axios from 'axios';

const AZURE_API = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net';
const USERNAME = 'seplitza@gmail.com';
const PASSWORD = '1234';

async function listAzureMarathons() {
  try {
    console.log('🔐 Authenticating with Azure API...\n');
    
    // Step 1: Authenticate
    const authResponse = await axios.post(`${AZURE_API}/api/token/auth`, {
      username: USERNAME,
      password: PASSWORD,
      grant_type: 'password',
    });

    const token = authResponse.data.access_token;
    console.log('✅ Authentication successful\n');

    // Step 2: Get user marathons list
    console.log('📥 Fetching marathons list...\n');
    
    const marathonsResponse = await axios.get(`${AZURE_API}/api/usermarathon/getmarathons`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const marathons = marathonsResponse.data;
    console.log(`📋 Found ${marathons.length} marathons:\n`);
    
    marathons.forEach((marathon: any, index: number) => {
      console.log(`${index + 1}. ${marathon.title} (${marathon.subTitle || 'no subtitle'})`);
      console.log(`   ID: ${marathon.id}`);
      console.log(`   Days: ${marathon.days}`);
      console.log(`   Public: ${marathon.isPublic ? 'Yes' : 'No'}`);
      console.log(`   Display: ${marathon.isDisplay ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log('\n📝 TypeScript array for migrate-marathons.ts:\n');
    console.log('const AZURE_MARATHONS = [');
    marathons
      .filter((m: any) => m.isDisplay && m.days > 0) // Only displayed marathons with days
      .forEach((marathon: any) => {
        console.log(`  ['${marathon.id}', '${marathon.title}', ${marathon.days}],`);
      });
    console.log('] as const;\n');

    // Step 3: Try known marathon to show structure
    console.log('\n\n📖 Example: Fetching "Омолодись" marathon...\n');
    
    const exampleMarathon = await axios.get(
      `${AZURE_API}/api/usermarathon/startmarathon?marathonId=3842e63f-b125-447d-94a1-b1c93be38b4e`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = exampleMarathon.data;
    console.log('Title:', data.title);
    console.log('Subtitle:', data.subTitle);
    console.log('Learning Days:', data.marathonDays?.length || 0);
    console.log('Practice Days:', data.practiceDays?.length || 0);
    console.log('\nMarathon Days:');
    
    if (data.marathonDays) {
      data.marathonDays.forEach((day: any, index: number) => {
        console.log(`  Day ${day.day}: ${day.dayDate} (ID: ${day.id})`);
      });
    }

    console.log('\n\n✅ Script completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Get IDs for all 10 marathons using the browser method above');
    console.log('   2. Update AZURE_MARATHONS array in migrate-marathons.ts');
    console.log('   3. Create corresponding marathons in new admin panel');
    console.log('   4. Update MARATHON_ID_MAPPING');
    console.log('   5. Run: npx ts-node src/scripts/migrate-marathons.ts download-only');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

listAzureMarathons();
