const payment = db.payments.findOne({orderNumber: 'MARATHON-1769939042791-8236F48F'});
const user = db.users.findOne({_id: payment.userId});
const marathon = db.marathons.findOne({_id: ObjectId(payment.metadata.marathonId)});

print('Payment:', payment.orderNumber);
print('User:', user.email);
print('Marathon:', marathon.title);
print('Start date:', marathon.startDate);
print('Tenure:', marathon.tenure);

const expiresAt = new Date(marathon.startDate);
expiresAt.setDate(expiresAt.getDate() + marathon.tenure);

const result = db.marathonenrollments.insertOne({
  userId: payment.userId,
  marathonId: ObjectId(payment.metadata.marathonId),
  paymentId: payment._id,
  status: 'active',
  startDate: marathon.startDate,
  expiresAt: expiresAt,
  currentDay: 1,
  lastAccessedDay: 0,
  completedDays: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

const currentExpiry = user.photoDiaryExpiresAt || new Date();
const newExpiry = new Date(currentExpiry);
newExpiry.setDate(newExpiry.getDate() + 90);

db.users.updateOne(
  {_id: user._id},
  {$set: {photoDiaryExpiresAt: newExpiry, updatedAt: new Date()}}
);

print('✅ Enrollment created:', result.insertedId);
print('✅ Photo diary:', currentExpiry.toISOString().slice(0,10), '->', newExpiry.toISOString().slice(0,10));
