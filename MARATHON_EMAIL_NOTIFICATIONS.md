# Marathon Email Notifications - Implementation Guide

## 📧 Implemented Email Types

### 1. Enrollment Confirmation
**Trigger:** User enrolls in marathon (free or paid)  
**When:** Immediately after enrollment  
**Template:** Welcome message with start date and payment status

**Content:**
- Marathon title
- Start date
- Payment status (Free/Paid)
- Information about day unlocking

---

### 2. Reminder Before Start (T-1 Day)
**Trigger:** Marathon starts tomorrow  
**When:** Daily cron job at 9:00 AM  
**Template:** Preparation reminder

**Content:**
- Marathon title
- Start date (tomorrow)
- What to expect
- Tips for participation

---

### 3. Marathon Start Notification
**Trigger:** Marathon starts today  
**When:** Daily cron job at 9:00 AM  
**Template:** Exciting start announcement

**Content:**
- Marathon title
- Number of days
- Call-to-action button to Day 1
- Motivational message

---

### 4. Daily Reminders
**Trigger:** New day is available  
**When:** Daily cron job at 9:00 AM  
**Template:** Daily progress update

**Content:**
- Marathon title
- Current day number (X/Y)
- Progress bar visualization
- Call-to-action to open today's exercises

**Logic:**
- Only sent to users who haven't completed the day yet
- Automatically calculates current day based on start date
- Skips users who already completed exercises

---

### 5. Marathon Completion
**Trigger:** Marathon ends today  
**When:** Daily cron job at 9:00 AM  
**Template:** Congratulations or summary

**Content:**
- Marathon title
- Completion percentage
- Number of completed days (X/Y)
- Different message for 100% vs partial completion
- Link to other marathons

---

## 🔧 Technical Implementation

### Email Service Methods

Located in: `src/services/email.service.ts`

```typescript
// Enrollment confirmation
await emailService.sendMarathonEnrollmentEmail(
  email: string,
  marathonTitle: string,
  startDate: Date,
  isPaid: boolean
);

// Reminder before start
await emailService.sendMarathonReminderEmail(
  email: string,
  marathonTitle: string,
  startDate: Date
);

// Marathon start
await emailService.sendMarathonStartEmail(
  email: string,
  marathonTitle: string,
  numberOfDays: number
);

// Daily reminder
await emailService.sendMarathonDailyReminderEmail(
  email: string,
  marathonTitle: string,
  dayNumber: number,
  totalDays: number
);

// Completion
await emailService.sendMarathonCompletionEmail(
  email: string,
  marathonTitle: string,
  totalDays: number,
  completedDays: number
);
```

---

## ⚙️ Automated Notification Script

**File:** `src/scripts/send-marathon-notifications.ts`

**Functions:**
1. `sendStartReminderEmails()` - Sends reminders 1 day before start
2. `sendStartDayEmails()` - Sends notifications on start day
3. `sendDailyReminders()` - Sends daily reminders for active marathons
4. `sendCompletionEmails()` - Sends completion emails on last day

**Run manually:**
```bash
npm run send-notifications
```

---

## 🕐 Cron Job Setup

### PM2 Configuration

Added to `ecosystem.config.json`:

```json
{
  "name": "marathon-notifier",
  "script": "npm",
  "args": "run send-notifications",
  "cron_restart": "0 9 * * *",
  "autorestart": false
}
```

**Schedule:** Every day at 9:00 AM Moscow time

### Production Deployment

```bash
# On server
cd /var/www/rejuvena-backend
git pull
npm run build
pm2 restart ecosystem.config.json --update-env
```

**Check cron job:**
```bash
pm2 list
pm2 logs marathon-notifier
```

---

## 📊 Notification Flow Diagram

```
Day -1 (Before Start)
  ├─ sendStartReminderEmails()
  └─ → "Marathon starts tomorrow" email to all enrolled users

Day 0 (Start Day)
  ├─ sendStartDayEmails()
  ├─ → "Marathon started!" email
  └─ sendDailyReminders()
      └─ → "Day 1 is available" email

Day 1-N (Active Marathon)
  └─ sendDailyReminders()
      └─ → "Day X/Y is available" (only to users who haven't completed)

Last Day (Completion)
  └─ sendCompletionEmails()
      └─ → Congratulations email with completion stats
```

---

## 🎯 Integration Points

### 1. Free Marathon Enrollment
**File:** `src/routes/marathon.routes.ts`  
**Endpoint:** `POST /api/marathons/:id/enroll`

```typescript
// After creating enrollment
const user = await User.findById(userId);
if (user?.email) {
  await emailService.sendMarathonEnrollmentEmail(
    user.email,
    marathon.title,
    marathon.startDate,
    false // free
  );
}
```

### 2. Paid Marathon Enrollment
**File:** `src/routes/payment.routes.ts`  
**Function:** `activateMarathon()`

```typescript
// After payment confirmation
const user = await User.findById(userId);
const marathon = await Marathon.findById(marathonId);

if (user?.email && marathon) {
  await emailService.sendMarathonEnrollmentEmail(
    user.email,
    marathon.title,
    marathon.startDate,
    true // paid
  );
}
```

---

## 🧪 Testing

### Manual Testing

**Test enrollment email:**
```bash
# Enroll in free marathon
curl -X POST http://localhost:9527/api/marathons/:id/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check email inbox
```

**Test notification script:**
```bash
# Run locally
npm run send-notifications

# Check console output for sent emails
```

### Test Email Accounts

Use real email addresses in development to verify:
- Email delivery
- Template rendering
- Link functionality
- Responsive design

---

## 📝 Email Provider Configuration

**Provider:** Resend (resend.com)  
**Free Tier:** 100 emails/day forever  
**Required ENV variables:**

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@rejuvena.com
```

**Setup steps:**
1. Register at https://resend.com
2. Create API key
3. Add to production `.env` file
4. Verify domain (optional, recommended for production)

**Check configuration:**
```bash
# In server logs, should see:
✅ Resend email service initialized
```

---

## 🔍 Monitoring & Debugging

### Check Sent Emails

**Resend Dashboard:**
- Go to https://resend.com/emails
- View delivery status
- Check bounce/complaint rates

**Server Logs:**
```bash
# PM2 logs
pm2 logs marathon-notifier --lines 100

# Search for specific email
pm2 logs marathon-notifier | grep "user@example.com"
```

**Console Output:**
```
✅ Marathon enrollment email sent to user@example.com (ID: abc123)
✅ Marathon start email sent to user@example.com (ID: def456)
```

### Common Issues

**1. Emails not sending**
- Check `RESEND_API_KEY` is set in `.env`
- Verify API key is valid in Resend dashboard
- Check server logs for error messages

**2. Emails in spam**
- Verify domain with SPF/DKIM records
- Use domain email instead of `onboarding@resend.dev`
- Check Resend reputation score

**3. Cron job not running**
- Check PM2 process: `pm2 list`
- Verify cron schedule: `pm2 describe marathon-notifier`
- Check timezone settings on server

---

## 📈 Metrics & Analytics

### MongoDB Queries

**Check enrollment email stats:**
```javascript
// Count enrollments by day
db.marathonEnrollments.aggregate([
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" } },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: -1 } },
  { $limit: 7 }
]);
```

**Upcoming marathon starts:**
```javascript
// Marathons starting in next 7 days
const sevenDaysFromNow = new Date();
sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

db.marathons.find({
  startDate: {
    $gte: new Date(),
    $lte: sevenDaysFromNow
  },
  isPublic: true
}).pretty();
```

**Completion rates:**
```javascript
// Marathon completion stats
db.marathonEnrollments.aggregate([
  {
    $lookup: {
      from: "marathons",
      localField: "marathonId",
      foreignField: "_id",
      as: "marathon"
    }
  },
  { $unwind: "$marathon" },
  {
    $project: {
      marathonTitle: "$marathon.title",
      totalDays: "$marathon.numberOfDays",
      completedDays: { $size: { $ifNull: ["$completedDays", []] } },
      completionRate: {
        $multiply: [
          { $divide: [
            { $size: { $ifNull: ["$completedDays", []] } },
            "$marathon.numberOfDays"
          ]},
          100
        ]
      }
    }
  }
]);
```

---

## 🚀 Production Deployment Checklist

- [x] Email service configured in `email.service.ts`
- [x] Marathon notification methods implemented
- [x] Integration in enrollment endpoints
- [x] Integration in payment activation
- [x] Cron script created
- [x] PM2 ecosystem updated
- [x] npm script added
- [ ] Production ENV variables set (`RESEND_API_KEY`, `EMAIL_FROM`)
- [ ] PM2 process deployed and running
- [ ] Test emails verified in production
- [ ] Domain verified in Resend (optional)
- [ ] Monitoring dashboard set up
- [ ] Email templates reviewed and approved

---

## 📚 Related Files

```
src/
├── services/
│   └── email.service.ts              # Email sending logic (5 new methods)
├── routes/
│   ├── marathon.routes.ts            # Free enrollment integration
│   └── payment.routes.ts             # Paid enrollment integration
└── scripts/
    └── send-marathon-notifications.ts # Cron job script

ecosystem.config.json                  # PM2 cron configuration
package.json                           # npm script added
```

---

## 🎨 Email Design

All emails use:
- Responsive HTML design
- Mobile-friendly layout
- Brand colors (purple gradient: #667eea → #764ba2)
- Call-to-action buttons
- Progress visualizations
- Emoji for engagement
- Clear typography

**Frontend link:**
All emails link to: `https://seplitza.github.io/rejuvena/marathons`

---

## ✅ Phase 5 Complete!

**Email notifications system fully implemented:**
- ✅ 5 email templates
- ✅ Automated cron job
- ✅ Enrollment integration (free + paid)
- ✅ PM2 scheduling configured
- ✅ Testing ready
- ✅ Production deployment guide

**Next steps:**
1. Set production ENV variables
2. Deploy to server
3. Test with real marathons
4. Monitor email delivery rates
