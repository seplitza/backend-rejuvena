import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// MongoDB connection URI - connecting via SSH tunnel to production
const MONGODB_URI = 'mongodb://localhost:27018/rejuvena';

// Exercise Schema
const exerciseSchema = new mongoose.Schema({
  title: String,
  content: String,
  carouselMedia: [
    new mongoose.Schema({
      url: String,
      type: String,
      filename: String,
      order: Number,
    }, { _id: true })
  ],
  order: Number,
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  category: String,
  isPublished: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  duration: String,
  price: Number,
}, { timestamps: true });

const Exercise = mongoose.model('Exercise', exerciseSchema);

const tagSchema = new mongoose.Schema({
  name: String,
  isVisible: { type: Boolean, default: true },
});

const Tag = mongoose.model('Tag', tagSchema);

interface ExerciseContent {
  type: string;
  contentPath: string;
  videoServer?: string;
}

interface CourseExercise {
  id: string;
  exerciseName: string;
  exerciseDescription: string;
  exerciseVideoUrl: string | null;
  exerciseContents: ExerciseContent[];
  order: number;
}

interface DayCategory {
  categoryName: string;
  imagePath: string;
  order: number;
  exercises: CourseExercise[];
}

interface CourseData {
  marathonId: string;
  title: string;
  marathonDay: {
    dayCategories: DayCategory[];
  };
}

async function importNewExercises() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read course data
    const courseDataPath = path.join(__dirname, 'midface-course-data.json');
    const courseData: CourseData = JSON.parse(fs.readFileSync(courseDataPath, 'utf-8'));

    console.log(`Course: ${courseData.title}`);

    // Get EN tag
    const enTag = await Tag.findOne({ name: 'EN' });
    if (!enTag) {
      console.error('EN tag not found!');
      process.exit(1);
    }
    console.log(`EN tag ID: ${enTag._id}`);

    // Get all existing EN exercises
    const existingExercises = await Exercise.find({ tags: enTag._id });
    const existingExerciseNames = new Set(existingExercises.map(e => e.title?.trim().toLowerCase()).filter(Boolean));
    console.log(`\nExisting EN exercises: ${existingExercises.length}`);

    // Collect all exercises from course
    const allCourseExercises: Array<{ exercise: CourseExercise; categoryName: string }> = [];
    for (const dayCategory of courseData.marathonDay.dayCategories) {
      for (const exercise of dayCategory.exercises) {
        allCourseExercises.push({
          exercise,
          categoryName: dayCategory.categoryName,
        });
      }
    }

    console.log(`\nTotal exercises in course: ${allCourseExercises.length}`);

    // Find new exercises
    const newExercises = allCourseExercises.filter(({ exercise }) => {
      const exerciseName = exercise.exerciseName.trim().toLowerCase();
      return !existingExerciseNames.has(exerciseName);
    });

    console.log(`\nNew exercises to import: ${newExercises.length}`);
    if (newExercises.length === 0) {
      console.log('No new exercises to import!');
      await mongoose.disconnect();
      return;
    }

    console.log('\nNew exercises:');
    newExercises.forEach(({ exercise, categoryName }) => {
      console.log(`  - ${exercise.exerciseName} (${categoryName})`);
    });

    // Ask for confirmation
    console.log('\n⚠️  Ready to import these exercises to PRODUCTION database!');
    console.log('Press Ctrl+C to cancel or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Import new exercises
    let importedCount = 0;
    for (const { exercise, categoryName } of newExercises) {
      try {
        // Build carouselMedia array from exercise contents
        const carouselMedia = [];
        let order = 1;
        for (const content of exercise.exerciseContents) {
          if (content.type === 'image' || content.type === 'video') {
            carouselMedia.push({
              url: content.contentPath,
              type: content.type,
              filename: content.contentPath.split('/').pop() || '',
              order: order++,
            });
          }
        }

        // Create exercise
        const newExercise = await Exercise.create({
          title: exercise.exerciseName,
          content: exercise.exerciseDescription,
          carouselMedia: carouselMedia,
          order: exercise.order,
          tags: [enTag._id],
          category: categoryName, // Category is just a string
          isPublished: false, // Not published by default
          isPremium: false,
          duration: '',
          price: 0,
        });

        console.log(`✓ Imported: ${exercise.exerciseName}`);
        importedCount++;
      } catch (error) {
        console.error(`✗ Failed to import ${exercise.exerciseName}:`, error);
      }
    }

    console.log(`\n✅ Successfully imported ${importedCount} new exercises!`);
    console.log('Note: All exercises are created with isPublished: false');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importNewExercises();
