// Fix marathon exercise progress index
// Drop old index and create new one with dayNumber

db = db.getSiblingDB('rejuvena');

print('Current indexes:');
db.marathonexerciseprogresses.getIndexes().forEach(idx => {
  print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});

print('\nDropping old index: userId_1_marathonId_1_exerciseId_1');
try {
  const result = db.marathonexerciseprogresses.dropIndex('userId_1_marathonId_1_exerciseId_1');
  print(`Success: ${JSON.stringify(result)}`);
} catch (e) {
  print(`Error or already dropped: ${e.message}`);
}

print('\nCreating new index with dayNumber...');
try {
  const result = db.marathonexerciseprogresses.createIndex(
    { userId: 1, marathonId: 1, dayNumber: 1, exerciseId: 1 },
    { unique: true }
  );
  print(`Success: ${result}`);
} catch (e) {
  print(`Error or already exists: ${e.message}`);
}

print('\nFinal indexes:');
db.marathonexerciseprogresses.getIndexes().forEach(idx => {
  print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});
