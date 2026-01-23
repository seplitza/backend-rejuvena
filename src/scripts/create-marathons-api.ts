import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const NEW_API_URL = process.env.NEW_API_URL || 'http://37.252.20.170:9527';
const NEW_ADMIN_EMAIL = 'seplitza@gmail.com';
const NEW_ADMIN_PASSWORD = '1234back';

// Marathons to create (excluding the one already existing)
const MARATHONS_TO_CREATE = [
  { azureId: '8ae4db8b-b256-462a-8918-7e7811243d64', title: 'Look younger', numberOfDays: 14, language: 'en' },
  { azureId: '49083563-a9fc-4c13-b6a4-fdc2e4158479', title: 'Зарядка', numberOfDays: 1, language: 'ru' },
  { azureId: 'e7ce939d-b84a-4816-b5bf-ed347646f943', title: 'средняя англ', numberOfDays: 7, language: 'en' },
  { azureId: '11e5f1f2-de4e-4833-a7e5-3089c40be78f', title: 'лоб', numberOfDays: 7, language: 'ru' },
  { azureId: 'fc62d140-17af-4c61-be90-63a6cc656a7b', title: 'шея англ', numberOfDays: 7, language: 'en' },
  { azureId: 'b9a10637-8b1e-478d-940c-4d239e53831e', title: 'губы', numberOfDays: 7, language: 'ru' },
  { azureId: '3c33c808-523c-4e60-b284-139e2a136544', title: 'лоб англ', numberOfDays: 7, language: 'en' },
  { azureId: 'b87370d5-4ce1-49b2-86f4-23deb9a99123', title: 'средняя', numberOfDays: 7, language: 'ru' },
  { azureId: 'b8775841-7b7d-43ca-b556-a9ce74d339cf', title: 'шея', numberOfDays: 7, language: 'ru' },
  { azureId: '4af5f89c-ba91-43c6-bdf5-9bc7d9d8e3a7', title: 'губы англ', numberOfDays: 7, language: 'en' },
];

interface MarathonMapping {
  azureId: string;
  title: string;
  numberOfDays: number;
  language: string;
  mongoId?: string;
}

async function authenticateNewAPI(): Promise<string> {
  console.log('🔐 Authenticating with new API...');
  
  const response = await axios.post(`${NEW_API_URL}/api/auth/login`, {
    email: NEW_ADMIN_EMAIL,
    password: NEW_ADMIN_PASSWORD,
  });

  console.log('✅ Authentication successful\n');
  return response.data.token;
}

async function createMarathon(token: string, marathonData: any): Promise<string> {
  const response = await axios.post(
    `${NEW_API_URL}/api/marathons/admin/create`,
    {
      title: marathonData.title,
      numberOfDays: marathonData.numberOfDays,
      language: marathonData.language,
      cost: 0,
      isPaid: false,
      isPublic: true,
      isDisplay: true,
      hasContest: false,
      startDate: new Date().toISOString(),
      welcomeMessage: `Добро пожаловать в марафон "${marathonData.title}"!`,
      courseDescription: `Курс "${marathonData.title}" - ${marathonData.numberOfDays} дней обучения`,
      rules: 'Следуйте ежедневным упражнениям для достижения лучших результатов.',
      tenure: marathonData.numberOfDays,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data.marathon._id;
}

async function main() {
  try {
    console.log('🚀 Creating Marathons via API');
    console.log('================================\n');
    console.log(`Total to create: ${MARATHONS_TO_CREATE.length} marathons\n`);

    // Step 1: Authenticate
    const token = await authenticateNewAPI();

    // Step 2: Create each marathon
    const results: MarathonMapping[] = [];
    
    for (let i = 0; i < MARATHONS_TO_CREATE.length; i++) {
      const marathon = MARATHONS_TO_CREATE[i];
      
      try {
        console.log(`[${i + 1}/${MARATHONS_TO_CREATE.length}] Creating: ${marathon.title} (${marathon.numberOfDays} days, ${marathon.language})...`);
        
        const mongoId = await createMarathon(token, marathon);
        
        results.push({
          ...marathon,
          mongoId,
        });
        
        console.log(`✅ Created! MongoDB ID: ${mongoId}\n`);
        
        // Small delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`❌ Failed to create ${marathon.title}:`, error.response?.data || error.message);
        results.push({
          ...marathon,
        });
      }
    }

    // Step 3: Display summary
    console.log('\n📊 Creation Summary');
    console.log('===================\n');
    
    const successful = results.filter((r) => r.mongoId);
    const failed = results.filter((r) => !r.mongoId);
    
    console.log(`✅ Successfully created: ${successful.length}/${MARATHONS_TO_CREATE.length}`);
    console.log(`❌ Failed: ${failed.length}\n`);

    if (successful.length > 0) {
      console.log('📋 Created Marathons:\n');
      successful.forEach((m, i) => {
        console.log(`${i + 1}. ${m.title} (${m.numberOfDays} days, ${m.language})`);
        console.log(`   Azure ID: ${m.azureId}`);
        console.log(`   Mongo ID: ${m.mongoId}\n`);
      });
    }

    // Step 4: Generate TypeScript mapping code
    console.log('\n📝 TypeScript mapping for migrate-marathons.ts:');
    console.log('================================================\n');
    console.log('const MARATHON_ID_MAPPING: Record<string, string> = {');
    console.log(`  '3842e63f-b125-447d-94a1-b1c93be38b4e': '696fab9cd2a8c56f62ebdb09', // Омолодись (14 days, ru) - EXISTING`);
    
    successful.forEach((m) => {
      console.log(`  '${m.azureId}': '${m.mongoId}', // ${m.title} (${m.numberOfDays} days, ${m.language})`);
    });
    
    console.log('};\n');

    // Step 5: Save to file for reference
    const outputPath = path.join(__dirname, '../../marathon-mappings.json');
    const outputData = {
      created: new Date().toISOString(),
      existing: {
        azureId: '3842e63f-b125-447d-94a1-b1c93be38b4e',
        title: 'Омолодись',
        mongoId: '696fab9cd2a8c56f62ebdb09',
        numberOfDays: 14,
        language: 'ru',
      },
      newlyCreated: successful,
      failed: failed,
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved mappings to: ${outputPath}\n`);

    if (failed.length > 0) {
      console.log('\n⚠️  Some marathons failed to create. Check the errors above.');
      process.exit(1);
    }

    console.log('✅ All marathons created successfully!\n');
    console.log('📌 Next steps:');
    console.log('   1. Copy the TypeScript mapping above');
    console.log('   2. Update MARATHON_ID_MAPPING in src/scripts/migrate-marathons.ts');
    console.log('   3. Run: npx ts-node src/scripts/migrate-marathons.ts list-marathons');
    console.log('   4. Run: npx ts-node src/scripts/migrate-marathons.ts download-only (test)');
    console.log('   5. Run: npx ts-node src/scripts/migrate-marathons.ts (full migration)\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
