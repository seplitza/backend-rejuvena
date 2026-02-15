/**
 * Test email sending - sends a sample marathon start email
 */

import dotenv from 'dotenv';

// Load environment variables BEFORE importing services
dotenv.config();

import emailService from '../services/email.service';

async function testEmail() {
  console.log('📧 Testing marathon email sequence...\n');

  const testEmail = 'seplitza@gmail.com';
  const testMarathon = {
    title: 'ТЕСТ: Омоложение за 21 день',
    startDate: new Date(),
    numberOfDays: 21
  };

  // Test 1: Marathon Start Email
  console.log('1️⃣ Sending marathon start email...');
  const startResult = await emailService.sendMarathonStartEmail(
    testEmail,
    testMarathon.title,
    testMarathon.numberOfDays
  );
  console.log(startResult ? '✅ Start email sent\n' : '❌ Start email failed\n');

  // Test 2: Daily Reminder
  console.log('2️⃣ Sending daily reminder email (Day 5)...');
  const reminderResult = await emailService.sendMarathonDailyReminderEmail(
    testEmail,
    testMarathon.title,
    5,
    testMarathon.numberOfDays
  );
  console.log(reminderResult ? '✅ Daily reminder sent\n' : '❌ Daily reminder failed\n');

  // Test 3: Reminder before start
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  console.log('3️⃣ Sending pre-start reminder...');
  const preStartResult = await emailService.sendMarathonReminderEmail(
    testEmail,
    testMarathon.title,
    tomorrowDate
  );
  console.log(preStartResult ? '✅ Pre-start reminder sent\n' : '❌ Pre-start reminder failed\n');

  // Test 4: Completion email
  console.log('4️⃣ Sending completion email...');
  const completionResult = await emailService.sendMarathonCompletionEmail(
    testEmail,
    testMarathon.title,
    testMarathon.numberOfDays,
    testMarathon.numberOfDays // 100% completion
  );
  console.log(completionResult ? '✅ Completion email sent\n' : '❌ Completion email failed\n');

  console.log('📬 Email test completed! Check inbox: ' + testEmail);
}

testEmail().catch(console.error);
