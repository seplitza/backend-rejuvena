"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exercise_model_1 = __importDefault(require("../models/Exercise.model"));
dotenv_1.default.config();
// Old API Configuration
const OLD_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
const MARATHON_ID = '3842e63f-b125-447d-94a1-b1c93be38b4e';
const DAY_ID = 'cd0f536a-f2ac-4494-a0e3-159a2504317d';
// You need to provide your auth token here
const AUTH_TOKEN = process.env.OLD_API_TOKEN || '';
if (!AUTH_TOKEN) {
    console.error('❌ OLD_API_TOKEN not found in .env file');
    console.log('Please add: OLD_API_TOKEN=your_token_here');
    process.exit(1);
}
// Create axios instance for old API
const oldApi = axios_1.default.create({
    baseURL: OLD_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'UserLanguage': 'en',
    },
});
// Mapping between exercise names
const EXERCISE_NAME_MAP = {
    'Базовая растяжка шеи': 'Базовая растяжка шеи',
    'Вращения головой': 'Вращения головой',
    'Растяжка передней поверхности шеи': 'Растяжка передней поверхности шеи',
    'На заднюю поверхность шеи': 'На заднюю поверхность шеи',
    'На боковую поверхность шеи': 'На боковую поверхность шеи',
    'На мышцы трапеции': 'На мышцы трапеции',
    'Раскрытие плечевых 1': 'Раскрытие плечевых 1',
    'Раскрытие плечевых 2': 'Раскрытие плечевых 2',
    'Стоечка у стены': 'Стоечка у стены',
    'На валике': 'На валике',
};
async function loadExercisesFromOldAPI() {
    try {
        const timeZoneOffset = -new Date().getTimezoneOffset();
        console.log('🔄 Starting marathon...');
        await oldApi.get('/usermarathon/startmarathon', {
            params: {
                marathonId: MARATHON_ID,
                timeZoneOffset,
            },
        });
        console.log('📥 Loading exercises from old API...');
        const response = await oldApi.get('/usermarathon/getdayexercise', {
            params: {
                marathonId: MARATHON_ID,
                dayId: DAY_ID,
                timeZoneOffset,
            },
        });
        console.log(`✅ Loaded ${response.data.exercises?.length || 0} exercises from old API`);
        return response.data.exercises || [];
    }
    catch (error) {
        console.error('❌ Failed to load from old API:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        throw error;
    }
}
function convertExerciseContentToHTML(exerciseContents) {
    if (!exerciseContents || exerciseContents.length === 0) {
        return '';
    }
    let html = '';
    for (const content of exerciseContents.sort((a, b) => a.orderBy - b.orderBy)) {
        if (content.type === 'text') {
            html += `<p>${content.contentPath}</p>\n`;
        }
        else if (content.type === 'video') {
            html += `<p><strong>Видео:</strong></p>\n<p><a href="${content.contentPath}" target="_blank">Смотреть видео</a></p>\n`;
        }
        else if (content.type === 'image') {
            html += `<p><img src="${content.contentPath}" alt="Упражнение" style="max-width: 100%; height: auto;" /></p>\n`;
        }
        if (content.hint) {
            html += `<p><em>${content.hint}</em></p>\n`;
        }
    }
    return html;
}
function extractMediaForCarousel(exerciseContents) {
    if (!exerciseContents || exerciseContents.length === 0) {
        return [];
    }
    const media = [];
    let order = 0;
    for (const content of exerciseContents.sort((a, b) => a.orderBy - b.orderBy)) {
        if (content.type === 'image' || content.type === 'video') {
            media.push({
                url: content.contentPath,
                type: content.type,
                filename: content.contentPath.split('/').pop() || 'media',
                order: order++,
            });
        }
    }
    return media;
}
async function updateExercises() {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rejuvena');
        console.log('✅ Connected to MongoDB');
        // Load exercises from old API
        const oldExercises = await loadExercisesFromOldAPI();
        let updated = 0;
        let skipped = 0;
        let notFound = 0;
        for (const oldExercise of oldExercises) {
            const exerciseName = oldExercise.exerciseName || oldExercise.marathonExerciseName;
            // Find exercise in our database
            const dbExercise = await Exercise_model_1.default.findOne({ title: exerciseName });
            if (!dbExercise) {
                console.log(`⚠️  Exercise not found in DB: ${exerciseName}`);
                notFound++;
                continue;
            }
            // Check if exercise already has content
            if (dbExercise.content && dbExercise.content !== `<p>${dbExercise.description}</p>`) {
                console.log(`⏭️  Skipped (already has content): ${exerciseName}`);
                skipped++;
                continue;
            }
            // Update with data from old API
            const htmlContent = convertExerciseContentToHTML(oldExercise.exerciseContents);
            const carouselMedia = extractMediaForCarousel(oldExercise.exerciseContents);
            // Use description from old API if it's more detailed
            const newDescription = oldExercise.description && oldExercise.description.length > dbExercise.description.length
                ? oldExercise.description.replace(/<[^>]*>/g, '') // Strip HTML tags for description
                : dbExercise.description;
            dbExercise.description = newDescription;
            dbExercise.content = htmlContent || `<p>${newDescription}</p>`;
            dbExercise.carouselMedia = carouselMedia;
            await dbExercise.save();
            console.log(`✅ Updated: ${exerciseName}`);
            console.log(`   - Content: ${htmlContent ? 'Yes' : 'No'}`);
            console.log(`   - Media: ${carouselMedia.length} items`);
            updated++;
        }
        console.log('\n📊 Update Results:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ⚠️  Not found: ${notFound}`);
        console.log(`   📝 Total: ${oldExercises.length}`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Update error:', error);
        process.exit(1);
    }
}
updateExercises();
