"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDev = void 0;
var octokit_1 = require("octokit");
var common_1 = require("../../common");
var assignDev = function (actionInputs, assignee, repoName, issueNumber) { return __awaiter(void 0, void 0, void 0, function () {
    var sliceOctokit, projectManangerView, projectId, issueId, issueOSSData, itemId, projectAllFields, currentStatus, statusField, statusInProgressOption;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                common_1.logger.logInputs('open-source assign-dev', { repoName: repoName, issueNumber: issueNumber, assignee: assignee });
                sliceOctokit = new octokit_1.Octokit({
                    auth: actionInputs.sliceRepo.userToken,
                });
                projectManangerView = (0, common_1.getProjectManagerViewInfo)(actionInputs.openSourceManagerProjectView);
                repoName = repoName.replace(new RegExp("^" + projectManangerView.org + "/", 'i'), '');
                return [4 /*yield*/, (0, common_1.getProjectV2)(sliceOctokit, projectManangerView.org, projectManangerView.projectNumber)];
            case 1:
                projectId = (_b.sent()).projectId;
                return [4 /*yield*/, (0, common_1.getIssue)(sliceOctokit, projectManangerView.org, repoName, issueNumber)];
            case 2:
                issueId = (_b.sent()).issueId;
                return [4 /*yield*/, (0, common_1.getIssueOSSData)(sliceOctokit, issueId)];
            case 3:
                issueOSSData = _b.sent();
                if (!!issueOSSData) return [3 /*break*/, 5];
                return [4 /*yield*/, common_1.error.throwWithGithubComment(sliceOctokit, issueId, "Couldn't find OSS data comment of this issue")];
            case 4:
                _b.sent();
                _b.label = 5;
            case 5:
                itemId = issueOSSData.itemId;
                return [4 /*yield*/, (0, common_1.getProjectFields)(sliceOctokit, projectId)];
            case 6:
                projectAllFields = _b.sent();
                return [4 /*yield*/, (0, common_1.getCurrentIssueStatusOfProjectItem)(sliceOctokit, itemId)];
            case 7:
                currentStatus = _b.sent();
                statusField = projectAllFields.find(function (x) { return x.name === common_1.OPEN_SOURCE_FIELDS.Status; });
                statusInProgressOption = (_a = statusField.options) === null || _a === void 0 ? void 0 : _a.find(function (x) { return x.name === common_1.OPEN_SOURCE_STATUS_OPTIONS.InProgress; });
                if (!(currentStatus !== common_1.OPEN_SOURCE_STATUS_OPTIONS.IssueApproved)) return [3 /*break*/, 9];
                return [4 /*yield*/, common_1.error.throwWithGithubComment(sliceOctokit, issueId, "Issue status has to be `" + common_1.OPEN_SOURCE_STATUS_OPTIONS.IssueApproved + "` to execute this job")];
            case 8:
                _b.sent();
                _b.label = 9;
            case 9:
                common_1.logger.logWriteLine('OpenSource', "Updating 'Status=In progress'...");
                return [4 /*yield*/, (0, common_1.updateIssueFieldValue)(sliceOctokit, projectId, itemId, statusField.id, 'SingleSelect', statusInProgressOption === null || statusInProgressOption === void 0 ? void 0 : statusInProgressOption.id)];
            case 10:
                _b.sent();
                common_1.logger.logExtendLastLine("Done!");
                return [2 /*return*/];
        }
    });
}); };
exports.assignDev = assignDev;
//# sourceMappingURL=assign-dev.js.map