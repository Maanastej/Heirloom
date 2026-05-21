"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DecisionDNA;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var AuthContext_1 = require("@/contexts/AuthContext");
var client_1 = require("@/integrations/supabase/client");
var use_toast_1 = require("@/hooks/use-toast");
var mcqQuestions = [
    {
        id: 1,
        dimension: "risk",
        question: "Personal Growth vs Comfort: When offered a new challenge that could change your future, you...",
        options: [
            { text: "Keep your current path and protect the stability you already have.", score: 1 },
            { text: "Cautiously pursue the opportunity while keeping a backup plan ready.", score: 3 },
            { text: "Embrace the challenge fully; growth requires leaving comfort behind.", score: 5 }
        ]
    },
    {
        id: 2,
        dimension: "trust",
        question: "Trusted Advice: A person you care about asks for a risky favor. Your instinct is to...",
        options: [
            { text: "Politely decline until you know their intentions more clearly.", score: 1 },
            { text: "Agree with safeguards, checks, and shared accountability.", score: 3 },
            { text: "Help them immediately based on your relationship and goodwill.", score: 5 }
        ]
    },
    {
        id: 3,
        dimension: "horizon",
        question: "Long-Term Planning: Would you sacrifice a happy present for a stronger family legacy decades from now?",
        options: [
            { text: "No. Today’s wellbeing is too important to trade for a distant promise.", score: 1 },
            { text: "Only if the future gain is nearly certain.", score: 3 },
            { text: "Yes. Legacy and meaning are worth current sacrifice.", score: 5 }
        ]
    },
    {
        id: 4,
        dimension: "adversity",
        question: "Stress Response: When a sudden setback hits, your first move is to...",
        options: [
            { text: "Pause, gather emotional support, and then decide.", score: 1 },
            { text: "Assess carefully and act in small deliberate steps.", score: 3 },
            { text: "Move quickly with clear direction and control the damage.", score: 5 }
        ]
    },
    {
        id: 5,
        dimension: "ethics",
        question: "Values vs Outcome: If bending a rule helps someone you love, you...",
        options: [
            { text: "Keep the rule; fairness and trust depend on consistency.", score: 1 },
            { text: "Make a narrow exception while preserving the principle publicly.", score: 3 },
            { text: "Prioritize people and compassion over the rule.", score: 5 }
        ]
    },
    {
        id: 6,
        dimension: "risk",
        question: "Health Decision: A promising new treatment has unknown long-term effects. You...",
        options: [
            { text: "Wait for more evidence before taking it.", score: 1 },
            { text: "Try it if the benefits justify careful monitoring.", score: 3 },
            { text: "Take it quickly if it offers the best chance for healing.", score: 5 }
        ]
    },
    {
        id: 7,
        dimension: "trust",
        question: "Team Delegation: You are asked to delegate a sensitive mission. You...",
        options: [
            { text: "Keep control until trust is proven.", score: 1 },
            { text: "Delegate with clear checks and review points.", score: 3 },
            { text: "Give autonomy and trust them to deliver.", score: 5 }
        ]
    },
    {
        id: 8,
        dimension: "horizon",
        question: "Legacy Investment: Would you invest in a slow-building tradition that pays off decades later?",
        options: [
            { text: "No, that future is too uncertain.", score: 1 },
            { text: "Yes, if it aligns with a strong long-term plan.", score: 3 },
            { text: "Yes, tradition and durability are the top priority.", score: 5 }
        ]
    },
    {
        id: 9,
        dimension: "adversity",
        question: "Public Pressure: If criticism is growing, you...",
        options: [
            { text: "Respond gently and wait for emotions to cool.", score: 1 },
            { text: "Acknowledge concerns and correct course deliberately.", score: 3 },
            { text: "Act decisively to regain control and restore direction.", score: 5 }
        ]
    },
    {
        id: 10,
        dimension: "ethics",
        question: "Transparency: When a difficult truth may hurt people, you...",
        options: [
            { text: "Keep it quiet to protect them.", score: 1 },
            { text: "Share the truth carefully with those who must know.", score: 3 },
            { text: "Be fully honest even if it causes discomfort.", score: 5 }
        ]
    },
    {
        id: 11,
        dimension: "risk",
        question: "Career Tradeoff: A meaningful purpose requires giving up stability. You...",
        options: [
            { text: "Choose safety and avoid the unknown.", score: 1 },
            { text: "Take the opportunity only with fallback planning.", score: 3 },
            { text: "Pursue the purpose fully despite the uncertainty.", score: 5 }
        ]
    },
    {
        id: 12,
        dimension: "trust",
        question: "Confidential Request: Someone asks you to keep a risky plan private. You...",
        options: [
            { text: "Decline until you understand their true motives.", score: 1 },
            { text: "Agree with boundaries and regular check-ins.", score: 3 },
            { text: "Honor it unless it clearly endangers others.", score: 5 }
        ]
    },
    {
        id: 13,
        dimension: "horizon",
        question: "Education vs Earnings: Would you fund long-term training over immediate income?",
        options: [
            { text: "No, personal and financial stability come first.", score: 1 },
            { text: "Yes, if the future payoff is likely.", score: 3 },
            { text: "Yes. A stronger future is worth today’s sacrifice.", score: 5 }
        ]
    },
    {
        id: 14,
        dimension: "adversity",
        question: "Recovery Style: After failure, do you...",
        options: [
            { text: "Step back and reflect before taking action.", score: 1 },
            { text: "Adjust carefully and proceed steadily.", score: 3 },
            { text: "Launch a rapid recovery and regain momentum.", score: 5 }
        ]
    },
    {
        id: 15,
        dimension: "ethics",
        question: "Favoritism: If someone close asks for special treatment, you...",
        options: [
            { text: "Respect the rules and treat everyone equally.", score: 1 },
            { text: "Consider context while keeping the core principle.", score: 3 },
            { text: "Grant it to preserve trust and harmony.", score: 5 }
        ]
    },
    {
        id: 16,
        dimension: "risk",
        question: "Opportunity Horizon: A rare chance to scale influence appears, but it could stretch your resources. You...",
        options: [
            { text: "Protect your safety net and say no.", score: 1 },
            { text: "Pursue it carefully while preserving reserves.", score: 3 },
            { text: "Seize it boldly and accept the pressure.", score: 5 }
        ]
    },
    {
        id: 17,
        dimension: "trust",
        question: "Partner Vetting: Before working with a new collaborator, you...",
        options: [
            { text: "Require proof and wait until trust is earned.", score: 1 },
            { text: "Start small with oversight and clear roles.", score: 3 },
            { text: "Begin with shared purpose and build trust by doing.", score: 5 }
        ]
    },
    {
        id: 18,
        dimension: "horizon",
        question: "Legacy Choice: Do you establish a new tradition that may outlive you?",
        options: [
            { text: "No, keep things as they are.", score: 1 },
            { text: "Yes, if it fits the family’s long-term values.", score: 3 },
            { text: "Yes, lasting traditions are worth bold change.", score: 5 }
        ]
    },
    {
        id: 19,
        dimension: "adversity",
        question: "Crisis Decision: When chaos arrives, you...",
        options: [
            { text: "Seek support and recover together.", score: 1 },
            { text: "Stabilize the core and then move forward.", score: 3 },
            { text: "Take immediate control and reset the direction.", score: 5 }
        ]
    },
    {
        id: 20,
        dimension: "ethics",
        question: "Principle vs Win: If winning requires a morally grey choice, you...",
        options: [
            { text: "Refuse and protect your integrity.", score: 1 },
            { text: "Use strict boundaries to minimize harm.", score: 3 },
            { text: "Accept it if it creates a greater good.", score: 5 }
        ]
    }
];
var validationCases = [
    {
        id: 1,
        question: "A trusted mentor suggests taking a health risk for a long-term breakthrough. Do you...",
        optionA: "Decline until the treatment is well-proven.",
        optionB: "Proceed with the treatment if it offers a meaningful future benefit.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.risk - 3) * 0.14 + (scores.horizon - 3) * 0.09, 0.05), 0.95); }
    },
    {
        id: 2,
        question: "A close friend asks you to keep a delicate secret. Do you...",
        optionA: "Protect the secret and honor your relationship.",
        optionB: "Share the truth with someone who should know.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.trust - 3) * 0.16 - (scores.ethics - 3) * 0.08, 0.05), 0.95); }
    },
    {
        id: 3,
        question: "A long-term legacy project will limit your freedom today. Do you...",
        optionA: "Avoid it to preserve your current life quality.",
        optionB: "Commit to the sacrifice because the future value matters.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.horizon - 3) * 0.18 - (scores.adversity - 3) * 0.08, 0.05), 0.95); }
    },
    {
        id: 4,
        question: "If a public mistake threatens your reputation, do you...",
        optionA: "Manage the optics quietly while minimizing damage.",
        optionB: "Address it openly and take responsibility.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.ethics - 3) * 0.15 - (scores.trust - 3) * 0.07, 0.05), 0.95); }
    },
    {
        id: 5,
        question: "Paying for expanded education delays your immediate earnings. Do you...",
        optionA: "Keep earning now and postpone the training.",
        optionB: "Invest now if the long-term return looks strong.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.horizon - 3) * 0.15 - (scores.risk - 3) * 0.06, 0.05), 0.95); }
    },
    {
        id: 6,
        question: "A colleague asks for an exception to an important rule. Do you...",
        optionA: "Respect the standard and refuse the exception.",
        optionB: "Make a compassionate exception in this case.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 - (scores.ethics - 3) * 0.16 + (scores.trust - 3) * 0.1, 0.05), 0.95); }
    },
    {
        id: 7,
        question: "An uncertain breakthrough could change your industry, but it may fail. Do you...",
        optionA: "Wait for clearer evidence before you commit.",
        optionB: "Back it now to capture transformational upside.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.risk - 3) * 0.18 + (scores.adversity - 3) * 0.08, 0.05), 0.95); }
    },
    {
        id: 8,
        question: "You can mentor a gifted person who is not yet fully trustworthy. Do you...",
        optionA: "Keep them close until trust is built.",
        optionB: "Trust them with responsibility and watch them grow.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.trust - 3) * 0.15 - (scores.risk - 3) * 0.06, 0.05), 0.95); }
    },
    {
        id: 9,
        question: "Your child wants a risky passion project instead of a safe career. Do you...",
        optionA: "Encourage security and postpone the risk.",
        optionB: "Support their long-term purpose even if it is uncertain.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.horizon - 3) * 0.14 - (scores.adversity - 3) * 0.05, 0.05), 0.95); }
    },
    {
        id: 10,
        question: "An historic tradition is under threat. Would you...",
        optionA: "Protect what exists and avoid big change.",
        optionB: "Reinvent it for the future, even if it disrupts the past.",
        getAIProbability: function (scores) { return Math.min(Math.max(0.5 + (scores.ethics - 3) * 0.13 + (scores.horizon - 3) * 0.1, 0.05), 0.95); }
    }
];
function DecisionDNA() {
    var _this = this;
    var _a;
    var user = (0, AuthContext_1.useAuth)().user;
    var toast = (0, use_toast_1.useToast)().toast;
    var _b = (0, react_1.useState)("list"), step = _b[0], setStep = _b[1];
    var _c = (0, react_1.useState)([]), profiles = _c[0], setProfiles = _c[1];
    var _d = (0, react_1.useState)(null), activeProfileId = _d[0], setActiveProfileId = _d[1];
    var _e = (0, react_1.useState)(true), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)(false), hasTrainedSelf = _f[0], setHasTrainedSelf = _f[1];
    var _g = (0, react_1.useState)([]), decisionLogs = _g[0], setDecisionLogs = _g[1];
    var _h = (0, react_1.useState)({}), draftMCQAnswers = _h[0], setDraftMCQAnswers = _h[1];
    var _j = (0, react_1.useState)({
        values: "",
        rules: "",
        experiences: ""
    }), draftAnswers = _j[0], setDraftAnswers = _j[1];
    var aggregateDimensionScore = function (dimension) {
        var answers = mcqQuestions
            .filter(function (q) { return q.dimension === dimension; })
            .map(function (q) { return draftMCQAnswers[q.id]; })
            .filter(function (score) { return typeof score === "number"; });
        if (answers.length === 0)
            return 3;
        var average = answers.reduce(function (sum, score) { return sum + score; }, 0) / answers.length;
        return Math.round(average);
    };
    var _k = (0, react_1.useState)(""), question = _k[0], setQuestion = _k[1];
    var _l = (0, react_1.useState)([]), chatHistory = _l[0], setChatHistory = _l[1];
    var _m = (0, react_1.useState)(false), isTyping = _m[0], setIsTyping = _m[1];
    var _o = (0, react_1.useState)(null), calibrationResults = _o[0], setCalibrationResults = _o[1];
    var _p = (0, react_1.useState)(false), showCalibrateModal = _p[0], setShowCalibrateModal = _p[1];
    var _q = (0, react_1.useState)({}), calibrationAnswers = _q[0], setCalibrationAnswers = _q[1];
    var formatMetricValue = function (value) {
        var num = typeof value === "number" ? value : Number(value);
        return Number.isFinite(num) ? num.toFixed(2) : "N/A";
    };
    (0, react_1.useEffect)(function () {
        loadDNAProfiles();
        loadDecisionLogs();
    }, [user]);
    (0, react_1.useEffect)(function () {
        if (activeProfileId) {
            var cachedResult = localStorage.getItem("heirloom_calibration_".concat(activeProfileId));
            if (cachedResult) {
                var parsed = JSON.parse(cachedResult);
                setCalibrationResults({
                    f1: Number(parsed === null || parsed === void 0 ? void 0 : parsed.f1),
                    auc: Number(parsed === null || parsed === void 0 ? void 0 : parsed.auc),
                    precision: Number(parsed === null || parsed === void 0 ? void 0 : parsed.precision),
                    recall: Number(parsed === null || parsed === void 0 ? void 0 : parsed.recall),
                    accuracy: Number(parsed === null || parsed === void 0 ? void 0 : parsed.accuracy),
                    kappa: Number(parsed === null || parsed === void 0 ? void 0 : parsed.kappa),
                    mae: Number(parsed === null || parsed === void 0 ? void 0 : parsed.mae),
                    cosineSimilarity: Number(parsed === null || parsed === void 0 ? void 0 : parsed.cosineSimilarity),
                });
            }
            else {
                setCalibrationResults(null);
            }
            setCalibrationAnswers({});
        }
    }, [activeProfileId]);
    var handleSubmitCalibration = function () {
        if (!activeProfileId)
            return;
        var activeProfile = profiles.find(function (p) { return p.id === activeProfileId; });
        if (!activeProfile)
            return;
        var tp = 0, fp = 0, tn = 0, fn = 0;
        var totalAbsDiff = 0;
        var Y = [];
        var YHat = [];
        validationCases.forEach(function (c) {
            var y = calibrationAnswers[c.id] || 0;
            var p = c.getAIProbability(activeProfile.scores);
            var yHat = p >= 0.5 ? 1 : 0;
            Y.push(y);
            YHat.push(yHat);
            totalAbsDiff += Math.abs(y - p);
            if (y === 1 && yHat === 1)
                tp++;
            else if (y === 0 && yHat === 1)
                fp++;
            else if (y === 0 && yHat === 0)
                tn++;
            else if (y === 1 && yHat === 0)
                fn++;
        });
        var accuracy = (tp + tn) / validationCases.length;
        var pe = (((tp + fp) * (tp + fn)) + ((tn + fn) * (tn + fp))) / (Math.pow(validationCases.length, 2));
        var kappa = pe < 1 ? (accuracy - pe) / (1 - pe) : 1;
        var mae = totalAbsDiff / validationCases.length;
        var dotProduct = Y.reduce(function (sum, y, i) { return sum + y * YHat[i]; }, 0);
        var magY = Math.sqrt(Y.reduce(function (sum, y) { return sum + Math.pow(y, 2); }, 0));
        var magYHat = Math.sqrt(YHat.reduce(function (sum, yh) { return sum + Math.pow(yh, 2); }, 0));
        var cosineSimilarity = (magY * magYHat) > 0 ? dotProduct / (magY * magYHat) : 0;
        var results = {
            f1: 0, auc: 0, precision: 0, recall: 0,
            accuracy: accuracy,
            kappa: kappa,
            mae: mae,
            cosineSimilarity: cosineSimilarity
        };
        setCalibrationResults(results);
        localStorage.setItem("heirloom_calibration_".concat(activeProfileId), JSON.stringify(results));
        setShowCalibrateModal(false);
    };
    var loadDNAProfiles = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error, mapped, e_1, cached, parsed, activeFamilyList, currentUserName, seedProfiles;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setLoading(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    if (!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, client_1.supabase
                            .from("dna_profiles")
                            .select("*")
                            .order("created_at", { ascending: false })];
                case 2:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (data && data.length > 0) {
                        mapped = data.map(function (d) { return ({
                            id: d.id,
                            name: d.name,
                            relationship: d.relationship,
                            scores: {
                                risk: d.risk_score || 3,
                                trust: d.trust_score || 3,
                                horizon: d.horizon_score || 3,
                                adversity: d.adversity_score || 3,
                                ethics: d.ethics_score || 3,
                            },
                            answers: {
                                values: d.core_values,
                                rules: d.decision_rules,
                                experiences: d.life_experiences
                            },
                            archetype: calculateArchetype(d.risk_score || 3, d.trust_score || 3, d.horizon_score || 3, d.adversity_score || 3, d.ethics_score || 3),
                            isSelf: d.created_by === user.id
                        }); });
                        setProfiles(mapped);
                        setHasTrainedSelf(mapped.some(function (p) { return p.isSelf; }));
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    _c.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    e_1 = _c.sent();
                    console.log("Supabase dna tables not available yet. Loading local storage mock data.");
                    return [3 /*break*/, 5];
                case 5:
                    cached = localStorage.getItem("heirloom_dna_profiles");
                    if (cached) {
                        parsed = JSON.parse(cached);
                        setProfiles(parsed);
                        setHasTrainedSelf(parsed.some(function (p) { return p.isSelf; }));
                    }
                    else {
                        activeFamilyList = JSON.parse(localStorage.getItem("heirloom_family_members") || "[]");
                        currentUserName = ((_b = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _b === void 0 ? void 0 : _b.full_name) || "Arthur Sterling";
                        seedProfiles = [];
                        // Let's seed Grandpa Richard as a family model that already exists!
                        seedProfiles.push({
                            id: "grandpa-1",
                            name: "Grandpa Richard",
                            relationship: "Grandfather",
                            scores: { risk: 2, trust: 4, horizon: 5, adversity: 3, ethics: 5 },
                            answers: {
                                values: "Hard work, faith, integrity, and absolute devotion to family legacy.",
                                rules: "Always save 30% of what you make, never go to sleep angry at your kin, and back up your words with consistent actions.",
                                experiences: "Rebuilding our family farm after a critical drought in 1982 taught me that local communities and family trust are the only assets that never lose valuation."
                            },
                            archetype: "The Compassionate Guardian"
                        });
                        // Let's seed Matriarch Eleanor Sterling as well
                        seedProfiles.push({
                            id: "eleanor-1",
                            name: "Eleanor Sterling",
                            relationship: "Matriarch",
                            scores: { risk: 3, trust: 3, horizon: 4, adversity: 5, ethics: 4 },
                            answers: {
                                values: "Intellect, constant curiosity, relational harmony, and elegance.",
                                rules: "Learn something new every single day, never trade long-term respect for immediate wealth.",
                                experiences: "Leading the city heritage preservation society in 1995 proved that historical preservation anchors families to a common foundation."
                            },
                            archetype: "The Legacy Builder"
                        });
                        setProfiles(seedProfiles);
                        localStorage.setItem("heirloom_dna_profiles", JSON.stringify(seedProfiles));
                        setHasTrainedSelf(false);
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var calculateArchetype = function (r, t, h, a, e) {
        if (r >= 4 && t <= 2)
            return "The Guarded Trailblazer";
        if (h >= 4 && e >= 4)
            return "The Legacy Builder";
        if (r <= 2 && e >= 4)
            return "The Compassionate Guardian";
        if (r >= 4 && h >= 4)
            return "The Strategic Pioneer";
        if (a >= 4 && t <= 2)
            return "The Stoic Defender";
        return "The Pragmatic Counselor";
    };
    var cosineSimilarity = function (a, b) {
        if (!a.length || !b.length || a.length !== b.length)
            return 0;
        var dot = a.reduce(function (sum, value, idx) { return sum + value * b[idx]; }, 0);
        var magA = Math.sqrt(a.reduce(function (sum, value) { return sum + value * value; }, 0));
        var magB = Math.sqrt(b.reduce(function (sum, value) { return sum + value * value; }, 0));
        return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
    };
    var summarizeProfile = function (profile) {
        return "Name: ".concat(profile.name, ". Relationship: ").concat(profile.relationship, ". Scores: Risk ").concat(profile.scores.risk, "/5, Trust ").concat(profile.scores.trust, "/5, Horizon ").concat(profile.scores.horizon, "/5, Adversity ").concat(profile.scores.adversity, "/5, Ethics ").concat(profile.scores.ethics, "/5. Core values: ").concat(profile.answers.values, ". Decision rules: ").concat(profile.answers.rules, ". Life experience: ").concat(profile.answers.experiences, ".");
    };
    var generateEmbedding = function (input) { return __awaiter(_this, void 0, void 0, function () {
        var groqApiKey, response, data, err_1;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
                    if (!groqApiKey || !input.trim())
                        return [2 /*return*/, null];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("https://api.groq.com/openai/v1/embeddings", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer ".concat(groqApiKey)
                            },
                            body: JSON.stringify({
                                model: "text-embedding-3-large",
                                input: input
                            })
                        })];
                case 2:
                    response = _d.sent();
                    if (!response.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _d.sent();
                    return [2 /*return*/, (_c = (_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.embedding) !== null && _c !== void 0 ? _c : null];
                case 4:
                    err_1 = _d.sent();
                    console.error("Embedding generation failed:", err_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var getTopSimilarDecisions = function (profile, logs) {
        if (!profile.embedding || !logs.length)
            return [];
        return logs
            .map(function (log) { return (__assign(__assign({}, log), { similarity: log.log_embedding ? cosineSimilarity(profile.embedding, log.log_embedding) : 0 })); })
            .sort(function (a, b) { var _a, _b; return ((_a = b.similarity) !== null && _a !== void 0 ? _a : 0) - ((_b = a.similarity) !== null && _b !== void 0 ? _b : 0); })
            .slice(0, 3);
    };
    var handleMCQSelect = function (questionId, score) {
        setDraftMCQAnswers(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[questionId] = score, _a)));
        });
    };
    var startNewAI = function () {
        setDraftMCQAnswers({});
        setDraftAnswers({ values: "", rules: "", experiences: "" });
        setStep("mcq");
    };
    var finishMCQ = function () {
        var unanswered = mcqQuestions.filter(function (q) { return draftMCQAnswers[q.id] === undefined; });
        if (unanswered.length > 0) {
            toast({
                title: "Incomplete Diagnostic",
                description: "Please answer all questions before proceeding. Unanswered questions: ".concat(unanswered.map(function (q) { return q.id; }).join(", "), "."),
                variant: "destructive"
            });
            return;
        }
        setStep("values");
    };
    var handleNextFromValues = function () {
        if (!draftAnswers.values.trim()) {
            toast({
                title: "Input Required",
                description: "Please share some details about your core values to proceed.",
                variant: "destructive"
            });
            return;
        }
        setStep("rules");
    };
    var handleNextFromRules = function () {
        if (!draftAnswers.rules.trim()) {
            toast({
                title: "Input Required",
                description: "Please share some details about your strict decision rules to proceed.",
                variant: "destructive"
            });
            return;
        }
        setStep("experiences");
    };
    var handleFinishFromExperiences = function () {
        if (!draftAnswers.experiences.trim()) {
            toast({
                title: "Input Required",
                description: "Please share some details about your life experiences to proceed.",
                variant: "destructive"
            });
            return;
        }
        finishTest();
    };
    var finishTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var risk, trust, horizon, adversity, ethics, currentUserName, currentUserRole, simulatedProfile, prof, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setStep("training");
                    risk = aggregateDimensionScore("risk");
                    trust = aggregateDimensionScore("trust");
                    horizon = aggregateDimensionScore("horizon");
                    adversity = aggregateDimensionScore("adversity");
                    ethics = aggregateDimensionScore("ethics");
                    currentUserName = ((_a = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _a === void 0 ? void 0 : _a.full_name) || "Arthur Sterling";
                    currentUserRole = ((_b = user === null || user === void 0 ? void 0 : user.user_metadata) === null || _b === void 0 ? void 0 : _b.relationship) || "Founder";
                    simulatedProfile = {
                        id: "dna-" + Date.now(),
                        name: currentUserName,
                        relationship: currentUserRole + " (Self)",
                        scores: { risk: risk, trust: trust, horizon: horizon, adversity: adversity, ethics: ethics },
                        answers: draftAnswers,
                        archetype: calculateArchetype(risk, trust, horizon, adversity, ethics),
                        isSelf: true
                    };
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 5, , 6]);
                    if (!user) return [3 /*break*/, 4];
                    return [4 /*yield*/, client_1.supabase
                            .from("profiles")
                            .select("family_id, relationship")
                            .eq("user_id", user.id)
                            .maybeSingle()];
                case 2:
                    prof = (_c.sent()).data;
                    if (!(prof === null || prof === void 0 ? void 0 : prof.family_id)) return [3 /*break*/, 4];
                    return [4 /*yield*/, client_1.supabase.from("dna_profiles").insert({
                            family_id: prof.family_id,
                            created_by: user.id,
                            name: currentUserName,
                            relationship: prof.relationship || "Family Member",
                            risk_score: risk,
                            trust_score: trust,
                            horizon_score: horizon,
                            adversity_score: adversity,
                            ethics_score: ethics,
                            core_values: draftAnswers.values,
                            decision_rules: draftAnswers.rules,
                            life_experiences: draftAnswers.experiences
                        })];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_2 = _c.sent();
                    return [3 /*break*/, 6];
                case 6:
                    setTimeout(function () {
                        var updated = __spreadArray([simulatedProfile], profiles, true);
                        setProfiles(updated);
                        localStorage.setItem("heirloom_dna_profiles", JSON.stringify(updated));
                        setHasTrainedSelf(true);
                        setActiveProfileId(simulatedProfile.id);
                        setStep("chat");
                        setChatHistory([
                            {
                                role: "ai",
                                content: "Greetings. I am your personal simulated Decision DNA model. Ask me any life or career question, and I will analyze it using your cognitive scorecard.",
                            }
                        ]);
                        toast({
                            title: "Model Synthesized!",
                            description: "Your personal Decision DNA advisor is now live and shared with your family vault.",
                        });
                    }, 4500);
                    return [2 /*return*/];
            }
        });
    }); };
    var openChat = function (profileId) {
        var prof = profiles.find(function (p) { return p.id === profileId; });
        if (!prof)
            return;
        setActiveProfileId(profileId);
        setStep("chat");
        setChatHistory([
            {
                role: "ai",
                content: "Greetings. I am the Decision DNA model for ".concat(prof.name, " (").concat(prof.relationship, "). Ask me any life or career question, and I will analyze it through my cognitive worldview matrix."),
            }
        ]);
    };
    var deleteAIProfile = function (profileId) { return __awaiter(_this, void 0, void 0, function () {
        var profileToDelete, remaining, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    profileToDelete = profiles.find(function (p) { return p.id === profileId; });
                    if (!profileToDelete)
                        return [2 /*return*/];
                    remaining = profiles.filter(function (p) { return p.id !== profileId; });
                    setProfiles(remaining);
                    setHasTrainedSelf(remaining.some(function (p) { return p.isSelf; }));
                    localStorage.setItem("heirloom_dna_profiles", JSON.stringify(remaining));
                    localStorage.removeItem("heirloom_calibration_".concat(profileId));
                    if (activeProfileId === profileId) {
                        setActiveProfileId(null);
                        setStep("list");
                        setChatHistory([]);
                        setCalibrationResults(null);
                        setCalibrationAnswers({});
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    if (!user) return [3 /*break*/, 3];
                    return [4 /*yield*/, client_1.supabase.from("dna_profiles").delete().eq("id", profileId)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    err_3 = _a.sent();
                    console.error("Failed to delete AI profile from Supabase:", err_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var deleteAndRebuildAI = function (profileId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, deleteAIProfile(profileId)];
                case 1:
                    _a.sent();
                    startNewAI();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleAsk = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var userQ, activeProfile, riskVal, ethicsVal, horizonVal, riskReasoning, ethicalReasoning, horizonReasoning, steps, memorySnippet, groqApiKey, systemPrompt, response, data, responseContent_1, err_4;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    e.preventDefault();
                    if (!question.trim() || !activeProfileId)
                        return [2 /*return*/];
                    userQ = question;
                    setChatHistory(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ role: "user", content: userQ }], false); });
                    setQuestion("");
                    setIsTyping(true);
                    activeProfile = profiles.find(function (p) { return p.id === activeProfileId; });
                    if (!activeProfile)
                        return [2 /*return*/];
                    riskVal = activeProfile.scores.risk;
                    ethicsVal = activeProfile.scores.ethics;
                    horizonVal = activeProfile.scores.horizon;
                    riskReasoning = "";
                    if (riskVal <= 2) {
                        riskReasoning = "Evaluating through stability preference (".concat(riskVal, "/5): Taking high-stakes risks threatens our structural security. We should prioritize long-term consolidation.");
                    }
                    else if (riskVal >= 4) {
                        riskReasoning = "Evaluating through trailblazing preference (".concat(riskVal, "/5): Risk is the primary generator of legacy. Remaining completely safe is a slow decay. We must adapt and step forward.");
                    }
                    else {
                        riskReasoning = "Evaluating through balanced risk metric (".concat(riskVal, "/5): We should seek to balance the growth opportunity with a reliable safety buffer.");
                    }
                    ethicalReasoning = "";
                    if (ethicsVal >= 4) {
                        ethicalReasoning = "Filtering through relationship anchors (".concat(ethicsVal, "/5): In any legacy choice, people and core family loyalty represent our primary duty. Compassion overrides strict parameters.");
                    }
                    else {
                        ethicalReasoning = "Filtering through rules anchors (".concat(ethicsVal, "/5): Institutional strength relies on consistent alignment with absolute laws and structural agreements. Compromise degrades authority.");
                    }
                    horizonReasoning = "Reflecting on the legacy horizon (".concat(horizonVal, "/5): Legacy is built on choices that project 20 to 30 years out, completely discounting immediate convenience or short-term noise.");
                    steps = [riskReasoning, ethicalReasoning, horizonReasoning];
                    memorySnippet = activeProfile.answers.experiences;
                    groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
                    if (!groqApiKey) return [3 /*break*/, 6];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 5, , 6]);
                    systemPrompt = "You are emulating the Decision DNA simulated persona of ".concat(activeProfile.name, " (").concat(activeProfile.relationship, "), whose cognitive archetype is \"").concat(activeProfile.archetype, "\".\n\nYour decision profile parameters are:\n- Risk Preference: ").concat(activeProfile.scores.risk, "/5\n- Trust/Alliance Focus: ").concat(activeProfile.scores.trust, "/5\n- Horizon (Long-term vision): ").concat(activeProfile.scores.horizon, "/5\n- Adversity Resilience: ").concat(activeProfile.scores.adversity, "/5\n- Ethical Anchor: ").concat(activeProfile.scores.ethics, "/5\n\nCore Values you guide your life by:\n\"").concat(activeProfile.answers.values, "\"\n\nStrict Decision Rules you enforce:\n\"").concat(activeProfile.answers.rules, "\"\n\nKey Life Experience / Memory Lesson you reference:\n\"").concat(activeProfile.answers.experiences, "\"\n\nInstructions for your behavior (Strict Hallucination Control):\n1. Speak in a natural, wise, conversational, and direct tone. Never sound like a generic AI assistant. Address the user's query immediately without standard AI preamble (e.g., \"As an AI...\" or \"Based on your scores...\").\n2. Your advice MUST be grounded in your values, rules, and scores. Do NOT hallucinate rules or values that contradict your blueprint. If the user asks you to violate one of your strict rules, you must reject it explicitly.\n3. Reference your life experience / memory lesson only if it is naturally relevant to the dilemma.\n4. Maintain consistency with prior conversational turns (use the provided chat history).\n5. Provide clear, actionable guidance. Keep your response concise (2-3 paragraphs max) and format it beautifully.");
                    return [4 /*yield*/, fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer ".concat(groqApiKey)
                            },
                            body: JSON.stringify({
                                model: "llama3-70b-8192",
                                messages: __spreadArray(__spreadArray([
                                    { role: "system", content: systemPrompt }
                                ], chatHistory.map(function (msg) { return ({
                                    role: msg.role === "user" ? "user" : "assistant",
                                    content: msg.content
                                }); }), true), [
                                    { role: "user", content: userQ }
                                ], false),
                                temperature: 0.2, // Low temperature for high fidelity / hallucination control
                                max_tokens: 800
                            })
                        })];
                case 2:
                    response = _d.sent();
                    if (!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _d.sent();
                    responseContent_1 = ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "";
                    if (responseContent_1.trim()) {
                        setChatHistory(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                            {
                                role: "ai",
                                content: responseContent_1,
                                steps: steps,
                                memory: memorySnippet
                            }
                        ], false); });
                        setIsTyping(false);
                        return [2 /*return*/]; // Successful Groq integration!
                    }
                    _d.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_4 = _d.sent();
                    console.error("Groq API Call Failed: ", err_4);
                    return [3 /*break*/, 6];
                case 6:
                    // Fallback Dynamic Simulation Generator (Local Heuristic Engine)
                    setTimeout(function () {
                        var q = userQ.toLowerCase();
                        var category = "general";
                        if (q.includes("money") || q.includes("financial") || q.includes("draining") || q.includes("struggling") || q.includes("capital") || q.includes("debt") || q.includes("sell") || q.includes("buy") || q.includes("poor") || q.includes("cost")) {
                            category = "financial";
                        }
                        else if (q.includes("family") || q.includes("betray") || q.includes("relationship") || q.includes("wife") || q.includes("husband") || q.includes("son") || q.includes("daughter") || q.includes("brother") || q.includes("sister") || q.includes("friend") || q.includes("kin")) {
                            category = "relationship";
                        }
                        else if (q.includes("betray") || q.includes("honour") || q.includes("integrity") || q.includes("ethics") || q.includes("rules") || q.includes("lie") || q.includes("cheat") || q.includes("legal") || q.includes("stolen")) {
                            category = "moral";
                        }
                        else if (q.includes("career") || q.includes("job") || q.includes("work") || q.includes("business") || q.includes("company") || q.includes("startup") || q.includes("employ")) {
                            category = "career";
                        }
                        var isFamilyVsCompany = (q.includes("family") && q.includes("company")) || q.includes("betray") || (q.includes("sell") && q.includes("family"));
                        var intro = "";
                        if (activeProfile.isSelf) {
                            if (isFamilyVsCompany) {
                                intro = "Analyzing this high-stakes tension between family preservation and corporate survival against your cognitive framework:";
                            }
                            else if (category === "financial") {
                                intro = "Processing your financial concerns against your decision scorecard:";
                            }
                            else if (category === "relationship") {
                                intro = "Evaluating this interpersonal family dilemma through your behavioral blueprint:";
                            }
                            else if (category === "moral") {
                                intro = "Testing this ethical crossroads against your core rules and values:";
                            }
                            else if (category === "career") {
                                intro = "Mapping this career choice to your legacy trajectory:";
                            }
                            else {
                                intro = "Reflecting on this dilemma using your synthesized Decision DNA:";
                            }
                        }
                        else {
                            if (isFamilyVsCompany) {
                                intro = "When you ask me about choosing between the family and the company, it goes straight to the foundation of what we've built. Here is how I, ".concat(activeProfile.name, ", evaluate this conflict:");
                            }
                            else if (category === "financial") {
                                intro = "I understand how heavy it feels when accounts are draining and the family is struggling. Under financial pressure, we must look at the bigger picture. Here is my perspective:";
                            }
                            else if (category === "relationship") {
                                intro = "Family relationships and trust are the ultimate bedrock. When they are tested, we need clear guidance. Here is how I see this:";
                            }
                            else if (category === "moral") {
                                intro = "This is a test of honor and integrity. In my life, I've found that character is the one asset you can never afford to lose. Here is how I think you should approach this:";
                            }
                            else if (category === "career") {
                                intro = "A career decision or business choice should align with a lifetime trajectory. Here is my counsel based on my experiences:";
                            }
                            else {
                                intro = "That is an important question. Let's look at this together through the values and rules I used to navigate my own life:";
                            }
                        }
                        var archetypeTone = "";
                        switch (activeProfile.archetype) {
                            case "The Legacy Builder":
                                archetypeTone = "We must play the long game. Multi-generational legacy is built by taking short-term hits boldly to protect the long-term vision. Financial assets are easily replaced, but once family honour, trust, or the integrity of our name is compromised, the foundation of the house decays permanently. Absolute integrity and multi-decade impact override fast returns.";
                                break;
                            case "The Compassionate Guardian":
                                archetypeTone = "Prioritize people and relationships above all else. A company is just a tool, but the family is the reason we build in the first place. I would rather see a business dissolve entirely than witness our kin split by betrayal or resentment. Focus on protecting the core, holding the family close, and rebuilding together.";
                                break;
                            case "The Guarded Trailblazer":
                                archetypeTone = "We must look at this with cold, clear eyes. Risk is necessary, but blind trust is dangerous. Maintain guarded boundaries and ensure every alliance is structured legally. If a business or arrangement is dragging the family down, prune it strategically to protect our core assets, but do so with ironclad protection.";
                                break;
                            case "The Strategic Pioneer":
                                archetypeTone = "Every crisis is an opportunity for a calculated pivot. We cannot let emotional sentimentality lock us into a sinking model. Detach from the immediate panic, analyze the coordinates, and take a bold, calculated leap. The goal is long-term strategic leverage and survival.";
                                break;
                            case "The Stoic Defender":
                                archetypeTone = "In moments of severe adversity, we detach from emotional noise and act systematically. Enforce strict discipline: cut burn rates immediately, secure the perimeter, and abide strictly by the rules. We do not make compromises out of panic, and we never allow betrayal to compromise our operational security.";
                                break;
                            case "The Pragmatic Counselor":
                            default:
                                archetypeTone = "We need a balanced, practical path forward. Avoid getting trapped in binary extremes (like total sacrifice vs total betrayal). We must seek a structured compromise\u2014restructure the liabilities, draw clear lines of responsibility, and proceed with cautious, calculated steps.";
                                break;
                        }
                        var valStr = activeProfile.answers.values.trim();
                        var valuesRef = valStr
                            ? "Looking at my core values\u2014which are centered around \"".concat(valStr, "\"\u2014this choice must align with that standard.")
                            : "We must stay anchored to our core values, ensuring no temporary crisis makes us drift from our true north.";
                        var ruleStr = activeProfile.answers.rules.trim();
                        var rulesRef = ruleStr
                            ? "Remember the rules I live by: \"".concat(ruleStr, "\". In moments of high stress, these strict boundaries are not optional; they are the shields that prevent us from making catastrophic errors.")
                            : "In moments of crisis, we must abide by consistent rules. We never make permanent structural decisions under temporary emotional duress.";
                        var expStr = activeProfile.answers.experiences.trim();
                        var experienceRef = "";
                        if (expStr) {
                            experienceRef = "This reminds me deeply of the life lesson earned from: \"".concat(expStr, "\". That experience proved that when the storm hits, the only assets that remain standing are our character and our core alliances.");
                        }
                        else {
                            experienceRef = "History shows us that every challenge we survive is an opportunity to calibrate our digital twin and harden our resolve for the generations to follow.";
                        }
                        var finalRec = "";
                        if (isFamilyVsCompany) {
                            if (activeProfile.archetype === "The Compassionate Guardian" || activeProfile.archetype === "The Legacy Builder") {
                                finalRec = "**My Deep Recommendation:** Choose the family. Restructure, sell, or even walk away from the company if you must, but protect family unity and honor. Assets are replaceable; family trust is not.";
                            }
                            else {
                                finalRec = "**My Deep Recommendation:** Act strategically. Protect the family's core financial survival. If the company cannot be salvaged without bankrupting the family, prune or liquidate it systematically before it drags everyone down.";
                            }
                        }
                        else if (category === "financial") {
                            finalRec = "**My Deep Recommendation:** Stop the bleeding immediately. Cut non-essential outlays and draw up a transparent recovery plan. Rely on strict contract audits and backups, and do not make high-risk plays out of panic.";
                        }
                        else if (category === "moral") {
                            finalRec = "**My Deep Recommendation:** Stand firm. Do not trade long-term respect for immediate relief. Choose the path of absolute honor, even if it is the harder road today.";
                        }
                        else {
                            finalRec = "**My Deep Recommendation:** Take a step back to detach from the immediate pressure. Map out a structured contingency, protect your key relationships, and then move forward step-by-step.";
                        }
                        var responseContent = "**".concat(intro, "**\n\n").concat(archetypeTone, "\n\n**Applying Our Core Framework:**\n*   **Values Alignment:** ").concat(valuesRef, "\n*   **Decision Rules:** ").concat(rulesRef, "\n*   **Hard-won Experience:** ").concat(experienceRef, "\n\n---\n\n").concat(finalRec);
                        setChatHistory(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                            {
                                role: "ai",
                                content: responseContent,
                                steps: steps,
                                memory: memorySnippet
                            }
                        ], false); });
                        setIsTyping(false);
                    }, 2000);
                    return [2 /*return*/];
            }
        });
    }); };
    var renderWorldviewMap = function (scores) {
        var size = 180;
        var center = size / 2;
        var maxVal = 5;
        var rScale = (center - 20) / maxVal;
        var angles = [0, 72, 144, 216, 288];
        var getCoordinates = function (score, angleDeg) {
            var angleRad = (angleDeg - 90) * (Math.PI / 180);
            var x = center + score * rScale * Math.cos(angleRad);
            var y = center + score * rScale * Math.sin(angleRad);
            return { x: x, y: y };
        };
        var backgroundRings = [1, 2, 3, 4, 5].map(function (r) {
            var points = angles.map(function (a) {
                var _a = getCoordinates(r, a), x = _a.x, y = _a.y;
                return "".concat(x, ",").concat(y);
            }).join(" ");
            return <polygon key={r} points={points} className="fill-none stroke-border stroke-1"/>;
        });
        var axisLines = angles.map(function (a, i) {
            var outer = getCoordinates(maxVal, a);
            return <line key={i} x1={center} y1={center} x2={outer.x} y2={outer.y} className="stroke-border stroke-1"/>;
        });
        var scorePoints = [
            getCoordinates(scores.risk, angles[0]),
            getCoordinates(scores.trust, angles[1]),
            getCoordinates(scores.horizon, angles[2]),
            getCoordinates(scores.adversity, angles[3]),
            getCoordinates(scores.ethics, angles[4])
        ];
        var polyPoints = scorePoints.map(function (p) { return "".concat(p.x, ",").concat(p.y); }).join(" ");
        return (<svg width={size} height={size} className="mx-auto select-none overflow-visible">
        {backgroundRings}
        {axisLines}
        <polygon points={polyPoints} className="fill-bronze/20 stroke-bronze stroke-2 transition-all duration-500 animate-scale-in"/>
        {scorePoints.map(function (p, i) { return (<circle key={i} cx={p.x} cy={p.y} r="4" className="fill-navy stroke-bronze stroke-1.5"/>); })}
        <text x={getCoordinates(5.8, angles[0]).x} y={getCoordinates(5.8, angles[0]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Risk</text>
        <text x={getCoordinates(5.8, angles[1]).x} y={getCoordinates(5.8, angles[1]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Trust</text>
        <text x={getCoordinates(5.8, angles[2]).x} y={getCoordinates(5.8, angles[2]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Horizon</text>
        <text x={getCoordinates(5.8, angles[3]).x} y={getCoordinates(5.8, angles[3]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Adversity</text>
        <text x={getCoordinates(5.8, angles[4]).x} y={getCoordinates(5.8, angles[4]).y} className="text-[9px] font-semibold fill-muted-foreground text-center" textAnchor="middle">Ethics</text>
      </svg>);
    };
    if (loading) {
        return (<div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-t-2 border-bronze rounded-full animate-spin"/>
      </div>);
    }
    // Resolve currently active profile for rendering checks
    var activeProfile = (_a = profiles.find(function (p) { return p.id === activeProfileId; })) !== null && _a !== void 0 ? _a : null;
    return (<div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-serif text-foreground mb-2 flex items-center gap-2">
            <lucide_react_1.Brain className="w-6 h-6 text-bronze"/>
            Decision DNA Vault
          </h2>
          <p className="text-muted-foreground text-sm">
            Consult the simulated advisors of your entire family tree. Complete your assessment to publish your own.
          </p>
        </div>
        {step !== "list" && (<button_1.Button variant="outline" onClick={function () { return setStep("list"); }}>Back to Advisors</button_1.Button>)}
      </div>

      {step === "list" && (<div className="space-y-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Create Your Own Personal AI Advisor (If not trained yet) */}
            {!hasTrainedSelf && (<div onClick={startNewAI} className="border-2 border-dashed border-bronze/30 bg-bronze/[0.02] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-bronze/[0.05] transition-all h-[280px] shadow-elegant group">
                <div className="w-12 h-12 bg-bronze/10 rounded-full flex items-center justify-center mb-4 border border-bronze/20 group-hover:scale-105 transition-transform">
                  <lucide_react_1.Sparkles className="w-6 h-6 text-bronze animate-pulse"/>
                </div>
                <h3 className="font-serif text-base text-foreground font-semibold">Train Your Personal AI Profile</h3>
                <p className="text-xs text-muted-foreground mt-2 max-w-[220px]">
                  Map your own decision footprint so other family members can consult you.
                </p>
              </div>)}

            {/* List All Family Advisors */}
            {profiles.map(function (p) { return (<div key={p.id} className={"bg-card border rounded-xl p-6 flex flex-col justify-between h-[280px] shadow-elegant overflow-hidden relative ".concat(p.isSelf ? "border-bronze/30 bg-bronze/[0.01]" : "border-border")}>
                
                {/* SVG Visual footprint in background */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.08] pointer-events-none">
                  {renderWorldviewMap(p.scores)}
                </div>

                <div>
                  <div className="flex justify-between items-start">
                    <div className={"w-12 h-12 rounded-full flex items-center justify-center border ".concat(p.isSelf ? "bg-bronze/10 border-bronze/20 text-bronze" : "bg-navy border-cream/10 text-cream")}>
                      {p.isSelf ? <lucide_react_1.Sparkles className="w-6 h-6"/> : <lucide_react_1.Brain className="w-6 h-6"/>}
                    </div>
                    {p.isSelf && (<span className="text-[9px] bg-bronze/10 text-bronze border border-bronze/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        My Model
                      </span>)}
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-serif text-lg text-foreground font-semibold leading-tight">{p.name}</h3>
                    <p className="text-xs text-bronze font-medium mt-0.5">{p.relationship}</p>
                    <p className="text-xs text-muted-foreground mt-2.5 font-semibold bg-muted inline-block px-2.5 py-0.5 rounded border border-border">
                      {p.archetype}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button_1.Button variant={p.isSelf ? "outline" : "hero"} className="w-full h-10 shadow-card" onClick={function () { return openChat(p.id); }}>
                    <lucide_react_1.MessageSquare className="w-4 h-4 mr-2"/> Consult Advisor
                  </button_1.Button>
                  {p.isSelf && (<button_1.Button variant="outline" className="w-full h-10 shadow-card text-[11px]" onClick={function () {
                        if (!window.confirm("Delete this advisor and build a new one?"))
                            return;
                        deleteAndRebuildAI(p.id);
                    }}>
                      Delete & Build New Advisor
                    </button_1.Button>)}
                </div>
              </div>); })}
          </div>
        </div>)}

      {step === "mcq" && (<div className="bg-card border border-border rounded-xl p-6 lg:p-10 max-w-2xl mx-auto space-y-8 shadow-elegant">
          <div className="text-center">
            <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-2">Part 1 &bull; Personal Diagnostics</span>
            <h3 className="text-2xl font-serif text-foreground font-semibold">Your Decision Blueprint</h3>
            <p className="text-muted-foreground text-xs mt-2">Select the choice that best matches how you instinctively make high-stakes decisions.</p>
          </div>

          <div className="space-y-10">
            {mcqQuestions.map(function (q, idx) { return (<div key={q.id} className="space-y-4 border-b border-border pb-6 last:border-b-0 last:pb-0">
                <h4 className="font-medium text-foreground text-sm leading-relaxed">
                  <span className="text-bronze font-bold mr-2">{idx + 1}.</span>
                  {q.question}
                </h4>
                <div className="space-y-3">
                  {q.options.map(function (opt, i) { return (<button key={i} type="button" onClick={function () { return handleMCQSelect(q.id, opt.score); }} className={"w-full text-left p-4 rounded-lg border text-xs transition-all flex items-start gap-3.5 leading-relaxed ".concat(draftMCQAnswers[q.id] === opt.score
                        ? "bg-bronze/10 border-bronze text-foreground"
                        : "bg-background border-border text-muted-foreground hover:border-bronze/50")}>
                      <div className={"w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ".concat(draftMCQAnswers[q.id] === opt.score ? "border-bronze" : "border-muted-foreground")}>
                        {draftMCQAnswers[q.id] === opt.score && <div className="w-2 h-2 rounded-full bg-bronze"/>}
                      </div>
                      <span>{opt.text}</span>
                    </button>); })}
                </div>
              </div>); })}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Answered {Object.keys(draftMCQAnswers).length} of {mcqQuestions.length}</span>
            <button_1.Button variant="hero" onClick={finishMCQ} className="h-10 px-6">
              Next: Deep Interview <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
            </button_1.Button>
          </div>
        </div>)}

      {(step === "values" || step === "rules" || step === "experiences") && (<div className="bg-card border border-border rounded-xl p-6 lg:p-10 max-w-2xl mx-auto space-y-6 shadow-elegant">
          <div className="flex items-center gap-3 mb-6">
            <div className={"h-1.5 flex-1 rounded-full ".concat(step === "values" || step === "rules" || step === "experiences" ? "bg-bronze" : "bg-muted")}/>
            <div className={"h-1.5 flex-1 rounded-full ".concat(step === "rules" || step === "experiences" ? "bg-bronze" : "bg-muted")}/>
            <div className={"h-1.5 flex-1 rounded-full ".concat(step === "experiences" ? "bg-bronze" : "bg-muted")}/>
          </div>

          <div>
            <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-1">Part 2 &bull; Core Worldview</span>
            <h3 className="text-xl font-serif text-foreground font-semibold capitalize">
              {step === "values" ? "Core Values" : step === "rules" ? "Decision Rules" : "Life Experiences"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              {step === "values" ? "What values or philosophical codes guide your life decision-making?" :
                step === "rules" ? "What strict rules or boundaries do you live by and always enforce?" :
                    "Describe a massive life challenge you survived and the vital lesson you learned from it."}
            </p>
          </div>

          <textarea className="w-full h-44 bg-background border border-border rounded-lg p-4 text-xs text-foreground focus:ring-1 focus:ring-bronze outline-none resize-none leading-relaxed" placeholder={step === "values" ? "e.g. Integrity first, protect our family unity, prioritize long-term education..." :
                step === "rules" ? "e.g. Always save 20% of income, never make structural decisions in anger, rely on contract audit..." :
                    "e.g. Building our company through the recession of 2008 proved that agility and cash conservation are the only shields..."} value={draftAnswers[step]} onChange={function (e) {
            var _a;
            return setDraftAnswers(__assign(__assign({}, draftAnswers), (_a = {}, _a[step] = e.target.value, _a)));
        }}/>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            {step === "values" && <button_1.Button variant="outline" onClick={function () { return setStep("mcq"); }}>Back</button_1.Button>}
            {step === "rules" && <button_1.Button variant="outline" onClick={function () { return setStep("values"); }}>Back</button_1.Button>}
            {step === "experiences" && <button_1.Button variant="outline" onClick={function () { return setStep("rules"); }}>Back</button_1.Button>}

            {step === "values" && (<button_1.Button variant="hero" onClick={handleNextFromValues}>
                Next <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
              </button_1.Button>)}
            {step === "rules" && (<button_1.Button variant="hero" onClick={handleNextFromRules}>
                Next <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
              </button_1.Button>)}
            {step === "experiences" && (<button_1.Button variant="hero" onClick={handleFinishFromExperiences}>
                Synthesize Advisor <lucide_react_1.Brain className="w-4 h-4 ml-2"/>
              </button_1.Button>)}
          </div>
        </div>)}

      {step === "training" && (<div className="bg-card border border-border rounded-xl p-16 text-center max-w-md mx-auto mt-12 space-y-6 shadow-elegant">
          <lucide_react_1.Loader2 className="w-12 h-12 text-bronze animate-spin mx-auto"/>
          <h3 className="text-lg font-serif text-foreground font-semibold">Synthesizing Worldview DNA...</h3>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-[280px] mx-auto">
            Configuring prompts, scores, and life histories to construct your personal simulated persona.
          </p>
        </div>)}

      {step === "chat" && activeProfile && (<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Left Column: Cognitive Diagnostic & Worldview details */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-elegant space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-1">Advisor Insights</span>
                <h3 className="text-lg font-serif text-foreground font-semibold">{activeProfile.name}</h3>
                <p className="text-xs text-muted-foreground">{activeProfile.relationship}</p>
              </div>

              {/* Dynamic SVG Radar Map */}
              <div className="py-2 border-y border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block text-center mb-4">Worldview Polygon</span>
                {renderWorldviewMap(activeProfile.scores)}
              </div>

              {/* Cognitive Score breakdown */}
              <div className="space-y-3">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Cognitive Matrix</span>
                <div className="bg-muted p-3.5 rounded-lg border border-border">
                  <span className="text-xs font-bold text-foreground block">{activeProfile.archetype}</span>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                    Worldview model derived from risk, trust, horizon, adversity, and ethical anchor metrics.
                  </p>
                </div>
              </div>

              {/* Model Replication Fidelity */}
              {activeProfile && activeProfile.isSelf && (<div className="space-y-3 pt-4 border-t border-border">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Model Replication Fidelity</span>
                  
                  {calibrationResults ? (<div className="bg-muted p-3.5 rounded-lg border border-border space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-muted-foreground">Fidelity Rating:</span>
                        <span className="text-xs font-bold text-emerald-600">
                          {Number.isFinite(calibrationResults.f1) ? "".concat(Math.round(calibrationResults.f1 * 100), "% Match") : '--'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">F1-Score</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.f1)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">ROC-AUC</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.auc)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Precision</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.precision)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Recall</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.recall)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Kappa</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.kappa)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">MAE</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.mae)}</span>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                          <span className="text-muted-foreground block font-medium">Cosine Similarity</span>
                          <span className="font-bold text-foreground block mt-0.5">{formatMetricValue(calibrationResults.cosineSimilarity)}</span>
                        </div>
                      </div>

                      <button_1.Button type="button" variant="outline" size="xs" className="w-full text-[9px] h-7 font-semibold" onClick={function () { return setShowCalibrateModal(true); }}>
                        Recalibrate Digital Twin
                      </button_1.Button>
                    </div>) : (<div className="bg-muted p-3.5 rounded-lg border border-border text-center space-y-2">
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Verify the accuracy of your simulated persona against actual scenario choices.
                      </p>
                      <button_1.Button type="button" variant="hero" size="sm" className="w-full text-[10px] h-8 font-semibold" onClick={function () { return setShowCalibrateModal(true); }}>
                        Verify & Calibrate
                      </button_1.Button>
                    </div>)}
                </div>)}
            </div>

            <button_1.Button variant="outline" size="sm" onClick={function () { return setStep("list"); }} className="w-full">
              <lucide_react_1.ChevronRight className="w-4 h-4 mr-2 rotate-180"/> Change Advisor
            </button_1.Button>
          </div>

          {/* Right Column: Conversational Console */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-elegant" style={{ height: "560px" }}>
            <div className="bg-navy px-6 py-4 border-b border-cream/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-bronze/10 rounded-full flex items-center justify-center border border-bronze/20">
                  <lucide_react_1.Brain className="w-4 h-4 text-bronze"/>
                </div>
                <div>
                  <h3 className="font-serif text-cream text-sm font-semibold">{activeProfile.name} Simulation</h3>
                  <p className="text-[10px] text-cream/60">RAP Simulator Active & Shared</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
              {chatHistory.map(function (msg, i) { return (<div key={i} className={"flex gap-3.5 max-w-[85%] ".concat(msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                  <div className={"w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ".concat(msg.role === "user" ? "bg-navy border-cream/10 text-cream" : "bg-bronze/10 border-bronze/30 text-bronze")}>
                    {msg.role === "user" ? <lucide_react_1.User className="w-4 h-4"/> : <lucide_react_1.Brain className="w-4 h-4"/>}
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className={"p-4 rounded-xl text-xs leading-relaxed ".concat(msg.role === "user"
                    ? "bg-navy text-cream rounded-tr-none border border-cream/10"
                    : "bg-card border border-border text-foreground rounded-tl-none")}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Show Reasoning Process steps if available */}
                    {msg.role === "ai" && msg.steps && (<div className="space-y-2 animate-fade-in pl-1">
                        <span className="text-[9px] font-bold text-bronze uppercase flex items-center gap-1.5">
                          <lucide_react_1.Activity className="w-3 h-3"/> Cognitive Reasoning Trail
                        </span>
                        <div className="bg-muted border border-border rounded-lg p-3 space-y-2.5 text-[10px] text-muted-foreground">
                          {msg.steps.map(function (step, idx) { return (<p key={idx} className="leading-relaxed border-l-2 border-bronze/45 pl-2">
                              {step}
                            </p>); })}
                        </div>
                      </div>)}

                    {/* Show memory interpolation link if available */}
                    {msg.role === "ai" && msg.memory && (<div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 text-[10px] text-amber-700/90 leading-relaxed italic flex gap-2">
                        <lucide_react_1.Quote className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5"/>
                        <div>
                          <span className="font-bold not-italic block text-[9px] uppercase tracking-wide text-bronze mb-1">Linked Memory Lesson</span>
                          "{msg.memory}"
                        </div>
                      </div>)}

                  </div>
                </div>); })}

              {isTyping && (<div className="flex gap-3.5 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-bronze/10 border border-bronze/20 flex items-center justify-center flex-shrink-0">
                    <lucide_react_1.Brain className="w-4 h-4 text-bronze"/>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border rounded-tl-none flex flex-col gap-2">
                    <span className="text-[9px] text-bronze uppercase font-bold tracking-widest flex items-center gap-1">
                      <lucide_react_1.Loader2 className="w-3 h-3 animate-spin"/> Synthesizing worldview reasoning...
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze animate-bounce"/>
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze animate-bounce delay-75"/>
                      <div className="w-1.5 h-1.5 rounded-full bg-bronze animate-bounce delay-150"/>
                    </div>
                  </div>
                </div>)}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAsk} className="p-4 bg-card border-t border-border flex gap-3">
              <input_1.Input placeholder={"Query ".concat(activeProfile.name, "'s legacy worldview...")} value={question} onChange={function (e) { return setQuestion(e.target.value); }} disabled={isTyping} className="flex-1 h-11 text-xs"/>
              <button_1.Button type="submit" variant="hero" disabled={isTyping || !question.trim()} className="h-11 px-5 text-xs font-semibold">
                <lucide_react_1.MessageSquare className="w-4 h-4 mr-2"/> Consult
              </button_1.Button>
            </form>
          </div>

        </div>)}

      {showCalibrateModal && activeProfile && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="bg-navy px-6 py-4 border-b border-cream/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <lucide_react_1.Brain className="w-5 h-5 text-bronze"/>
                <h3 className="font-serif text-cream text-base font-semibold">Calibrate & Verify Digital Twin</h3>
              </div>
              <button_1.Button type="button" variant="ghost" className="text-cream/60 hover:text-cream h-8 w-8 p-0" onClick={function () { return setShowCalibrateModal(false); }}>
                ✕
              </button_1.Button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Respond to these 5 validation scenarios. We will compare your actual choices against the AI model's computed probabilities to calculate replication metrics.
              </p>

              <div className="space-y-6 divide-y divide-border">
                {validationCases.map(function (c, idx) { return (<div key={c.id} className="pt-4 first:pt-0 space-y-3">
                    <h4 className="font-medium text-foreground text-xs leading-relaxed">
                      <span className="text-bronze font-bold mr-1.5">{idx + 1}.</span>
                      {c.question}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button type="button" onClick={function () { return setCalibrationAnswers(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[c.id] = 1, _a)));
            }); }} className={"text-left p-3 rounded-lg border text-[11px] transition-all flex items-start gap-2.5 leading-normal ".concat(calibrationAnswers[c.id] === 1
                    ? "bg-bronze/10 border-bronze text-foreground"
                    : "bg-background border-border text-muted-foreground hover:border-bronze/40")}>
                        <div className={"w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ".concat(calibrationAnswers[c.id] === 1 ? "border-bronze" : "border-muted-foreground")}>
                          {calibrationAnswers[c.id] === 1 && <div className="w-1.5 h-1.5 rounded-full bg-bronze"/>}
                        </div>
                        <span>{c.optionA}</span>
                      </button>
                      <button type="button" onClick={function () { return setCalibrationAnswers(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[c.id] = 0, _a)));
            }); }} className={"text-left p-3 rounded-lg border text-[11px] transition-all flex items-start gap-2.5 leading-normal ".concat(calibrationAnswers[c.id] === 0
                    ? "bg-bronze/10 border-bronze text-foreground"
                    : "bg-background border-border text-muted-foreground hover:border-bronze/40")}>
                        <div className={"w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center mt-0.5 ".concat(calibrationAnswers[c.id] === 0 ? "border-bronze" : "border-muted-foreground")}>
                          {calibrationAnswers[c.id] === 0 && <div className="w-1.5 h-1.5 rounded-full bg-bronze"/>}
                        </div>
                        <span>{c.optionB}</span>
                      </button>
                    </div>
                  </div>); })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
                <button_1.Button type="button" variant="outline" size="sm" onClick={function () { return setShowCalibrateModal(false); }}>
                  Cancel
                </button_1.Button>
                <button_1.Button type="button" variant="hero" size="sm" onClick={handleSubmitCalibration} disabled={Object.keys(calibrationAnswers).length < validationCases.length}>
                  Calculate Fidelity Metrics
                </button_1.Button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
