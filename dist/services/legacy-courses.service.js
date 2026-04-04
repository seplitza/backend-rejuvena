"use strict";
/**
 * Legacy Courses Service
 * Proxy service for Azure API (old backend)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyCoursesService = exports.LegacyCoursesService = void 0;
exports.getMyOrders = getMyOrders;
exports.getAvailableCourses = getAvailableCourses;
exports.getDemoCourses = getDemoCourses;
exports.startMarathon = startMarathon;
exports.getDayExercises = getDayExercises;
exports.acceptMarathonTerms = acceptMarathonTerms;
exports.setExerciseStatus = setExerciseStatus;
exports.createOrder = createOrder;
const axios_1 = __importDefault(require("axios"));
const User_model_1 = __importDefault(require("../models/User.model"));
const AZURE_API_URL = 'https://new-facelift-service-b8cta5hpgcgqf8c7.eastus-01.azurewebsites.net/api';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes before actual expiry
class LegacyCoursesService {
    constructor() {
        this.azureClient = axios_1.default.create({
            baseURL: AZURE_API_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'UserLanguage': 'ru',
            },
        });
    }
    /**
     * Get or refresh Azure token for user
     */
    async getAzureToken(user) {
        // Check if token exists and is still valid
        if (user.azureToken && user.azureTokenExpiry) {
            const now = new Date();
            const expiry = new Date(user.azureTokenExpiry);
            if (expiry.getTime() - now.getTime() > TOKEN_EXPIRY_BUFFER) {
                console.log('✅ Using cached Azure token for user:', user.email);
                return user.azureToken;
            }
        }
        // Token expired or missing - need to login to Azure
        console.log('🔄 Azure token expired, logging in for user:', user.email);
        const azureEmail = user.azureEmail || user.email;
        const azurePassword = user.azurePassword || user.password; // Fallback to current password
        try {
            const response = await this.azureClient.post('/token/login', {
                email: azureEmail.toLowerCase(),
                password: azurePassword, // Plain password for Azure
            });
            const token = response.data.token || response.data.accessToken;
            if (!token) {
                throw new Error('No token received from Azure API');
            }
            // Save token to user document
            const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            user.azureToken = token;
            user.azureTokenExpiry = expiry;
            await user.save();
            console.log('✅ Azure token refreshed for user:', user.email);
            return token;
        }
        catch (error) {
            console.error('❌ Failed to login to Azure:', error.message);
            if (error.response) {
                console.error('Response:', error.response.data);
            }
            throw new Error('Failed to authenticate with legacy backend');
        }
    }
    /**
     * Get user's orders/courses from Azure
     */
    async getMyOrders(user, params) {
        const token = await this.getAzureToken(user);
        try {
            const response = await this.azureClient.get('/order/getuserorders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                params: params || {},
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to get orders from Azure:', error.message);
            throw new Error('Failed to fetch courses from legacy backend');
        }
    }
    /**
     * Get available marathons/courses (guest user)
     */
    async getAvailableCourses(languageCulture = 'ru-RU') {
        try {
            const response = await this.azureClient.get('/marathon/GetMarathonsGuestUser', {
                params: { languageCulture },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to get available courses from Azure:', error.message);
            throw new Error('Failed to fetch available courses');
        }
    }
    /**
     * Get demo courses
     */
    async getDemoCourses(languageCulture = 'ru-RU') {
        try {
            const response = await this.azureClient.get('/marathon/GetDemoCourseList', {
                params: { languageCulture },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to get demo courses from Azure:', error.message);
            throw new Error('Failed to fetch demo courses');
        }
    }
    /**
     * Start marathon (get marathon data)
     */
    async startMarathon(user, marathonId, timeZoneOffset = -180) {
        const token = await this.getAzureToken(user);
        try {
            const response = await this.azureClient.get('/usermarathon/startmarathon', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                params: {
                    marathonId,
                    timeZoneOffset,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to start marathon on Azure:', error.message);
            throw new Error('Failed to start marathon');
        }
    }
    /**
     * Get day exercises
     */
    async getDayExercises(user, marathonId, dayId, timeZoneOffset = -180) {
        const token = await this.getAzureToken(user);
        try {
            const response = await this.azureClient.get('/usermarathon/getdayexercise', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                params: {
                    marathonId,
                    dayId,
                    timeZoneOffset,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to get day exercises from Azure:', error.message);
            throw new Error('Failed to fetch day exercises');
        }
    }
    /**
     * Accept course/marathon terms
     */
    async acceptCourseTerms(user, marathonId) {
        const token = await this.getAzureToken(user);
        try {
            const response = await this.azureClient.post('/usermarathon/acceptcourserules', { marathonId }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to accept course terms on Azure:', error.message);
            throw new Error('Failed to accept course terms');
        }
    }
    /**
     * Set exercise status (completed, skipped, etc.)
     */
    async setExerciseStatus(user, marathonId, dayId, exerciseId, status) {
        const token = await this.getAzureToken(user);
        try {
            const response = await this.azureClient.post('/usermarathon/setuserexercisestatus', {
                marathonId,
                dayId,
                exerciseId,
                status,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to set exercise status on Azure:', error.message);
            throw new Error('Failed to update exercise status');
        }
    }
    /**
     * Create order
     */
    async createOrder(user, marathonId, couponCode) {
        const token = await this.getAzureToken(user);
        try {
            const response = await this.azureClient.post('/Order/CreateOrder', {
                marathonId,
                couponCode: couponCode || null,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to create order on Azure:', error.message);
            throw new Error('Failed to create order');
        }
    }
    /**
     * Get course extension description
     */
    async getCourseDetail(marathonId, languageCulture = 'ru-RU') {
        try {
            const response = await this.azureClient.get('/Marathon/ExtensionDescription', {
                params: {
                    marathonId,
                    languageCulture,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to get course detail from Azure:', error.message);
            throw new Error('Failed to fetch course details');
        }
    }
}
exports.LegacyCoursesService = LegacyCoursesService;
exports.legacyCoursesService = new LegacyCoursesService();
// Export wrapper functions for easier imports
async function getMyOrders(userId) {
    const user = await User_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    return exports.legacyCoursesService.getMyOrders(user);
}
async function getAvailableCourses(userId) {
    return exports.legacyCoursesService.getAvailableCourses('ru-RU');
}
async function getDemoCourses(userId) {
    return exports.legacyCoursesService.getDemoCourses('ru-RU');
}
async function startMarathon(userId, marathonId) {
    const user = await User_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    return exports.legacyCoursesService.startMarathon(user, marathonId);
}
async function getDayExercises(userId, marathonId, dayId) {
    const user = await User_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    return exports.legacyCoursesService.getDayExercises(user, marathonId, dayId.toString());
}
async function acceptMarathonTerms(userId, marathonId) {
    const user = await User_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    return exports.legacyCoursesService.acceptCourseTerms(user, marathonId);
}
async function setExerciseStatus(userId, marathonId, dayId, exerciseId, status) {
    const user = await User_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    return exports.legacyCoursesService.setExerciseStatus(user, marathonId, dayId.toString(), exerciseId.toString(), status);
}
async function createOrder(userId, marathonId) {
    const user = await User_model_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    return exports.legacyCoursesService.createOrder(user, marathonId);
}
