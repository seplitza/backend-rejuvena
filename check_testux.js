const user = db.users.findOne({email: 'testux@test.com'});

if (!user) {
  print('❌ User not found');
} else {
  print('=== USER INFO ===');
  print('User ID:', user._id);
  print('Email:', user.email);
  
  print('');
  print('=== PAYMENTS ===');
  const payments = db.payments.find({userId: user._id}).sort({createdAt: -1}).toArray();
  print('Total payments:', payments.length);
  
  payments.forEach((p, i) => {
    print('');
    print('Payment', i+1, ':', p._id);
    print('  Order:', p.orderNumber);
    print('  Amount:', p.amount/100, '₽');
    print('  Status:', p.status);
    print('  Created:', p.createdAt);
    print('  Marathon:', p.metadata?.marathonName || 'N/A');
    print('  Type:', p.metadata?.type || 'undefined');
    print('  MarathonId:', p.metadata?.marathonId || 'undefined');
  });
  
  print('');
  print('=== ENROLLMENTS ===');
  const enrollments = db.marathonenrollments.find({userId: user._id}).toArray();
  print('Total enrollments:', enrollments.length);
  
  enrollments.forEach(e => {
    const m = db.marathons.findOne({_id: e.marathonId});
    print('  ✅', m.title, '| Paid:', e.isPaid, '| Status:', e.status);
  });
}
