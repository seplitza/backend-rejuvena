"use strict";
/**
 * Скрипт для удаления пользователей без ФИО
 *
 * Удаляет:
 * 1. Пользователей с firstName = "Клиент" и пустым lastName
 * 2. Пользователей с пустыми firstName и lastName
 * 3. Связанные заказы (опционально)
 *
 * Использование:
 * ts-node scripts/cleanup-invalid-users.ts [--delete-orders]
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var User_model_1 = __importDefault(require("../src/models/User.model"));
var Order_model_1 = __importDefault(require("../src/models/Order.model"));
var MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rejuvena';
function cleanup() {
    return __awaiter(this, void 0, void 0, function () {
        var deleteOrders, invalidUsers, userIds, orders, deleteOrdersResult, deleteUsersResult, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, 9, 11]);
                    return [4 /*yield*/, mongoose_1.default.connect(MONGO_URI)];
                case 1:
                    _a.sent();
                    console.log('✅ Connected to MongoDB');
                    deleteOrders = process.argv.includes('--delete-orders');
                    return [4 /*yield*/, User_model_1.default.find({
                            $or: [
                                { firstName: 'Клиент', $or: [{ lastName: '' }, { lastName: { $exists: false } }] },
                                { firstName: { $in: ['', null] }, lastName: { $in: ['', null] } },
                                { firstName: { $exists: false }, lastName: { $exists: false } }
                            ]
                        })];
                case 2:
                    invalidUsers = _a.sent();
                    console.log("\n\uD83D\uDCCB \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 \u0431\u0435\u0437 \u0424\u0418\u041E: ".concat(invalidUsers.length));
                    if (invalidUsers.length === 0) {
                        console.log('✅ Нет пользователей для удаления');
                        process.exit(0);
                    }
                    // Выводим примеры
                    console.log('\n📝 Примеры найденных пользователей:');
                    invalidUsers.slice(0, 5).forEach(function (user) {
                        console.log("  - ".concat(user.firstName || '(пусто)', " ").concat(user.lastName || '(пусто)', " (").concat(user.email, ")"));
                    });
                    if (invalidUsers.length > 5) {
                        console.log("  ... \u0438 \u0435\u0449\u0435 ".concat(invalidUsers.length - 5));
                    }
                    userIds = invalidUsers.map(function (u) { return u._id; });
                    return [4 /*yield*/, Order_model_1.default.find({ userId: { $in: userIds } })];
                case 3:
                    orders = _a.sent();
                    console.log("\n\uD83D\uDCE6 \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0437\u0430\u043A\u0430\u0437\u043E\u0432 \u044D\u0442\u0438\u0445 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439: ".concat(orders.length));
                    if (orders.length > 0) {
                        console.log('\n📝 Примеры заказов:');
                        orders.slice(0, 5).forEach(function (order) {
                            console.log("  - ".concat(order.orderNumber, " (").concat(order.total, " \u20BD)"));
                        });
                        if (orders.length > 5) {
                            console.log("  ... \u0438 \u0435\u0449\u0435 ".concat(orders.length - 5));
                        }
                    }
                    // Подтверждение
                    console.log('\n⚠️  ВНИМАНИЕ! Будут удалены:');
                    console.log("   - ".concat(invalidUsers.length, " \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"));
                    if (deleteOrders) {
                        console.log("   - ".concat(orders.length, " \u0437\u0430\u043A\u0430\u0437\u043E\u0432"));
                    }
                    else {
                        console.log("   - \u0417\u0430\u043A\u0430\u0437\u044B \u041D\u0415 \u0431\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043B\u0435\u043D\u044B (\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 --delete-orders \u0434\u043B\u044F \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F)");
                    }
                    console.log('\n⏳ Начинаю удаление через 3 секунды... (Ctrl+C для отмены)');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 4:
                    _a.sent();
                    if (!(deleteOrders && orders.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, Order_model_1.default.deleteMany({ userId: { $in: userIds } })];
                case 5:
                    deleteOrdersResult = _a.sent();
                    console.log("\u2705 \u0423\u0434\u0430\u043B\u0435\u043D\u043E \u0437\u0430\u043A\u0430\u0437\u043E\u0432: ".concat(deleteOrdersResult.deletedCount));
                    _a.label = 6;
                case 6: return [4 /*yield*/, User_model_1.default.deleteMany({ _id: { $in: userIds } })];
                case 7:
                    deleteUsersResult = _a.sent();
                    console.log("\u2705 \u0423\u0434\u0430\u043B\u0435\u043D\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439: ".concat(deleteUsersResult.deletedCount));
                    console.log('\n✨ Очистка завершена!');
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _a.sent();
                    console.error('❌ Ошибка:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 10:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
cleanup();
