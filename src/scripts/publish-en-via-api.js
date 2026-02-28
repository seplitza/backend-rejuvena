// Update EN exercises via API
const API_URL = 'https://backend.seplitza.ru/api';

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Нужны креды админа
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.token;
}

async function getAllExercises(token) {
  const response = await fetch(`${API_URL}/exercises`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get exercises: ${response.statusText}`);
  }
  
  return response.json();
}

async function updateExercise(exerciseId, data, token) {
  const response = await fetch(`${API_URL}/exercises/${exerciseId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update exercise ${exerciseId}: ${response.statusText}`);
  }
  
  return response.json();
}

async function main() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Logged in\n');

    console.log('📥 Loading exercises...');
    const exercises = await getAllExercises(token);
    console.log(`✅ Loaded ${exercises.length} exercises\n`);

    // Find EN exercises that are not published
    const enUnpublished = exercises.filter(ex => 
      ex.tags.some(tag => tag.name === 'EN') && !ex.isPublished
    );

    console.log(`📋 Found ${enUnpublished.length} unpublished EN exercises\n`);

    if (enUnpublished.length === 0) {
      console.log('✅ All EN exercises already published!');
      return;
    }

    // Publish each one
    let updated = 0;
    for (const ex of enUnpublished) {
      try {
        await updateExercise(ex._id, { ...ex, isPublished: true }, token);
        console.log(`✅ Published: ${ex.title}`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to publish ${ex.title}:`, error.message);
      }
    }

    console.log(`\n✅ Published ${updated} out of ${enUnpublished.length} exercises`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
