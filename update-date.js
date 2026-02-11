#!/usr/bin/env node

const { exec } = require('child_process');

const cmd = `ssh root@37.252.20.170 "mongosh mongodb://localhost:27017/rejuvena --quiet --eval \\"db.landings.updateOne({slug: 'omolodis-stage-7-2280'}, {\\\\$set: {'marathonsSection.basic.startDate': new Date('2026-02-16T05:00:00.000Z')}}); db.landings.findOne({slug: 'omolodis-stage-7-2280'}, {slug: 1, title: 1, 'marathonsSection.basic.startDate': 1})\\"" 2>&1`;

console.log('Updating marathon date on production...');

exec(cmd, { timeout: 15000 }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  console.log('Result:', stdout);
  
  // Check if update was successful
  if (stdout.includes('startDate') && stdout.includes('2026-02-16')) {
    console.log('\n✅ Successfully updated marathon start date to February 16, 2026 08:00 MSK');
  } else if (stdout.includes('modifiedCount')) {
    console.log('\n✅ Update command executed');
  }
});
