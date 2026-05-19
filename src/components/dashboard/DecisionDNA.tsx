import { useState } from "react";
import { Brain, MessageSquare, ArrowRight, Activity, Loader2, Sparkles, User, RefreshCcw, Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "list" | "profile" | "mcq" | "values" | "rules" | "experiences" | "training" | "chat";

interface AIProfile {
    id: string;
    name: string;
    relationship: string;
    answers: {
        mcq: Record<number, string>;
        values: string;
        rules: string;
        experiences: string;
    };
}

const mcqQuestions = [
    {
        id: 1,
        question: "Risk vs Reward: You have a highly stable situation, but are offered a risky opportunity with massive upside. What do you do?",
        options: [
            "Prioritize stability. The risk isn't worth losing what's built.",
            "Take the leap. Growth only comes from stepping into the unknown.",
            "Negotiate a safety net first. I only take calculated risks."
        ]
    },
    {
        id: 2,
        question: "Trust: When dealing with a new business partner or major relationship, you naturally...",
        options: [
            "Trust them from the start until they give me a reason not to.",
            "Make them earn my trust through actions over time.",
            "Trust them, but verify everything with strict contracts and boundaries."
        ]
    },
    {
        id: 3,
        question: "Long-Term Vision: A decision requires taking a painful hit today for a potential 10x reward in 10 years.",
        options: [
            "Avoid the hit. Preserving current capital/peace is more important.",
            "Take the hit boldly. Short-term pain is necessary for long-term legacy.",
            "Analyze the failure rate relentlessly before making any move."
        ]
    },
    {
        id: 4,
        question: "Adversity: When faced with a sudden major setback, your first reaction is to...",
        options: [
            "Process the emotion fully, then work on a fix.",
            "Emotionally detach immediately and build a strategic recovery plan.",
            "Seek immediate counsel from trusted advisors and family."
        ]
    }
];

export default function DecisionDNA() {
    const [step, setStep] = useState<Step>("list");

    const [profiles, setProfiles] = useState<AIProfile[]>([
        {
            id: "1",
            name: "Grandpa Richard",
            relationship: "Grandfather",
            answers: {
                mcq: { 1: "Prioritize stability.", 2: "Make them earn my trust.", 3: "Avoid the hit.", 4: "Emotionally detach immediately." },
                values: "Hard work, faith, and family.",
                rules: "Never spend more than you earn.",
                experiences: "Surviving the 2008 crash taught me resilience."
            }
        }
    ]);

    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

    const [newProfile, setNewProfile] = useState<{ name: string, relationship: string }>({ name: "", relationship: "" });
    const [draftAnswers, setDraftAnswers] = useState<{ mcq: Record<number, string>, values: string, rules: string, experiences: string }>({
        mcq: {}, values: "", rules: "", experiences: ""
    });

    const [question, setQuestion] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai", content: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const activeProfile = profiles.find(p => p.id === activeProfileId);

    const startNewAI = () => {
        setNewProfile({ name: "", relationship: "" });
        setDraftAnswers({ mcq: {}, values: "", rules: "", experiences: "" });
        setStep("profile");
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProfile.name || !newProfile.relationship) return;
        setStep("mcq");
    };

    const handleMCQSelect = (qId: number, option: string) => {
        setDraftAnswers(prev => ({ ...prev, mcq: { ...prev.mcq, [qId]: option } }));
    };

    const finishMCQ = () => {
        if (Object.keys(draftAnswers.mcq).length < mcqQuestions.length) return;
        setStep("values");
    };

    const finishTest = () => {
        setStep("training");
        setTimeout(() => {
            const newAI: AIProfile = {
                id: Date.now().toString(),
                name: newProfile.name,
                relationship: newProfile.relationship,
                answers: draftAnswers
            };
            setProfiles(prev => [...prev, newAI]);
            setActiveProfileId(newAI.id);

            setStep("chat");
            setChatHistory([
                {
                    role: "ai",
                    content: `Hello! I am the Decision DNA model for ${newProfile.name} (${newProfile.relationship}). Ask me anything, and I'll answer based on my worldview.`
                }
            ]);
        }, 4000);
    };

    const openChat = (profileId: string) => {
        const prof = profiles.find(p => p.id === profileId);
        if (!prof) return;
        setActiveProfileId(profileId);
        setStep("chat");
        setChatHistory([
            {
                role: "ai",
                content: `Hello! I am the Decision DNA model for ${prof.name} (${prof.relationship}). Ask me anything, and I'll answer based on my worldview.`
            }
        ]);
    };

    const handleAsk = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !activeProfile) return;
        const userQ = question;
        setChatHistory(prev => [...prev, { role: "user", content: userQ }]);
        setQuestion("");
        setIsTyping(true);

        setTimeout(() => {
            const val = activeProfile.answers.values.split(/[.?!]/).filter(Boolean)[0] || "my core values";
            const rule = activeProfile.answers.rules.split(/[.?!]/).filter(Boolean)[0] || "my standard evaluation process";
            const exp = activeProfile.answers.experiences.split(/[.?!]/).filter(Boolean)[0] || "a similar past experience";

            const riskTolerance = activeProfile.answers.mcq[1] || "my approach to risk";

            const response = `Here's how I, ${activeProfile.name}, would think about this:\n\n**Step-by-step reasoning:**\nFirst, keeping in mind my general approach: "${riskTolerance}", I filter this through my priority of: "${val}". \nApplying my main standard: "${rule}", it suggests taking a step back before acting impulsively.\n\n**Supporting memory:**\nThis strongly reminds me of when "${exp}". The fundamental lesson there applies natively here.\n\n**Final perspective:**\nWhile you must make your own choice, I would lean towards following the principles we've discussed – prioritize what truly matters long-term.`;

            setChatHistory(prev => [...prev, { role: "ai", content: response }]);
            setIsTyping(false);
        }, 2500);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif text-foreground mb-2 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-bronze" />
                        Decision DNA
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        Talk to AI models trained on the exact values, rules, and logic of your family members.
                    </p>
                </div>
                {step !== "list" && (
                    <Button variant="outline" onClick={() => setStep("list")}>Back to Advisors</Button>
                )}
            </div>

            {step === "list" && (
                <div className="space-y-6 mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div
                            onClick={startNewAI}
                            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors h-[220px]"
                        >
                            <div className="w-12 h-12 bg-bronze/10 rounded-full flex items-center justify-center mb-4">
                                <Plus className="w-6 h-6 text-bronze" />
                            </div>
                            <h3 className="font-medium text-foreground tracking-wide">Create New AI Advisor</h3>
                            <p className="text-xs text-muted-foreground mt-2">Interview a family member to capture their decision-making logic.</p>
                        </div>

                        {profiles.map(p => (
                            <div key={p.id} className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between h-[220px]">
                                <div>
                                    <div className="w-12 h-12 bg-navy rounded-full flex items-center justify-center mb-4 border border-cream/10">
                                        <Users className="w-6 h-6 text-cream" />
                                    </div>
                                    <h3 className="font-serif text-lg text-foreground">{p.name}</h3>
                                    <p className="text-sm text-bronze font-medium">{p.relationship}</p>
                                </div>
                                <Button variant="hero" className="w-full mt-4" onClick={() => openChat(p.id)}>
                                    <MessageSquare className="w-4 h-4 mr-2" /> Ask for Advice
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === "profile" && (
                <div className="bg-card border border-border rounded-xl p-8 max-w-lg mx-auto mt-12 space-y-6">
                    <div className="w-16 h-16 bg-bronze/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-bronze" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-serif text-foreground">New Digital Advisor</h3>
                        <p className="text-muted-foreground text-sm mt-2">Who are we interviewing today?</p>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Full Name</label>
                            <Input
                                placeholder="e.g. Grandma Eleanor"
                                value={newProfile.name}
                                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Relationship to you</label>
                            <Input
                                placeholder="e.g. Grandmother"
                                value={newProfile.relationship}
                                onChange={(e) => setNewProfile({ ...newProfile, relationship: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" variant="hero" className="w-full mt-2">
                            Start Personality Test <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                </div>
            )}

            {step === "mcq" && (
                <div className="bg-card border border-border rounded-xl p-6 lg:p-10 max-w-3xl mx-auto space-y-8">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-serif text-foreground">Behavioral Assessment</h3>
                        <p className="text-muted-foreground text-sm mt-2">Select the choice that best matches how {newProfile.name} makes decisions.</p>
                    </div>

                    <div className="space-y-12">
                        {mcqQuestions.map((q, idx) => (
                            <div key={q.id} className="space-y-4">
                                <h4 className="font-medium text-foreground">
                                    <span className="text-bronze mr-2">{idx + 1}.</span>
                                    {q.question}
                                </h4>
                                <div className="space-y-3">
                                    {q.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleMCQSelect(q.id, opt)}
                                            className={`w-full text-left p-4 rounded-lg border text-sm transition-all ${draftAnswers.mcq[q.id] === opt
                                                    ? "bg-bronze/10 border-bronze text-foreground"
                                                    : "bg-background border-border text-muted-foreground hover:border-bronze/50"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-border mt-8">
                        <Button variant="hero" onClick={finishMCQ} disabled={Object.keys(draftAnswers.mcq).length < mcqQuestions.length}>
                            Proceed to Deep Interview <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}

            {(step === "values" || step === "rules" || step === "experiences") && (
                <div className="bg-card border border-border rounded-xl p-6 lg:p-10 max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className={`h-2 flex-1 rounded-full ${step === "values" || step === "rules" || step === "experiences" ? "bg-bronze" : "bg-muted"}`} />
                        <div className={`h-2 flex-1 rounded-full ${step === "rules" || step === "experiences" ? "bg-bronze" : "bg-muted"}`} />
                        <div className={`h-2 flex-1 rounded-full ${step === "experiences" ? "bg-bronze" : "bg-muted"}`} />
                    </div>

                    <div>
                        <h3 className="text-2xl font-serif text-foreground capitalize">
                            {step === "values" ? "Core Values" : step === "rules" ? "Decision Rules" : "Life Experiences"}
                        </h3>
                        <p className="text-muted-foreground font-medium text-sm mt-2">
                            {step === "values" ? "What does success mean to them? When is it okay to take risks?" :
                                step === "rules" ? "How do they evaluate opportunities? What makes them trust someone?" :
                                    "What was their biggest financial mistake or toughest life decision, and what did they learn?"}
                        </p>
                    </div>

                    <textarea
                        className="w-full h-48 bg-background border border-input rounded-xl p-4 text-foreground focus:ring-2 focus:ring-bronze outline-none resize-none"
                        placeholder={`Type ${newProfile.name}'s thoughts here...`}
                        value={draftAnswers[step]}
                        onChange={(e) => setDraftAnswers({ ...draftAnswers, [step]: e.target.value })}
                    />

                    <div className="flex justify-end gap-3">
                        {step === "values" && <Button variant="outline" onClick={() => setStep("mcq")}>Back</Button>}
                        {step === "rules" && <Button variant="outline" onClick={() => setStep("values")}>Back</Button>}
                        {step === "experiences" && <Button variant="outline" onClick={() => setStep("rules")}>Back</Button>}

                        {step === "values" && <Button variant="hero" onClick={() => setStep("rules")} disabled={!draftAnswers.values.trim()}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>}
                        {step === "rules" && <Button variant="hero" onClick={() => setStep("experiences")} disabled={!draftAnswers.rules.trim()}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>}
                        {step === "experiences" && <Button variant="hero" onClick={finishTest} disabled={!draftAnswers.experiences.trim()}>Complete & Train AI <Brain className="w-4 h-4 ml-2" /></Button>}
                    </div>
                </div>
            )}

            {step === "training" && (
                <div className="bg-card border border-border rounded-xl p-16 text-center max-w-2xl mx-auto mt-12 space-y-6">
                    <Loader2 className="w-16 h-16 text-bronze animate-spin mx-auto" />
                    <h3 className="text-xl font-serif text-foreground">Synthesizing {newProfile.name}'s DNA...</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        We are analyzing their behavioral assessment, worldview, and life experiences to create an accurate advisory model.
                    </p>
                </div>
            )}

            {step === "chat" && activeProfile && (
                <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden max-w-4xl mx-auto" style={{ height: '600px' }}>
                    <div className="bg-navy p-4 border-b border-cream/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-bronze/20 rounded-full flex items-center justify-center">
                                <Brain className="w-5 h-5 text-bronze" />
                            </div>
                            <div>
                                <h3 className="font-serif text-cream font-medium">{activeProfile.name} Advisor</h3>
                                <p className="text-xs text-cream/60">Simulating {activeProfile.relationship} decision model</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setStep("list")} className="text-cream/60 hover:text-cream">
                            <ChevronRight className="w-4 h-4 mr-2" /> Exit Chat
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-navy text-cream" : "bg-bronze text-white"}`}>
                                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                                </div>
                                <div className={`p-4 rounded-xl ${msg.role === "user" ? "bg-navy text-cream rounded-tr-none" : "bg-card border border-border text-foreground rounded-tl-none"}`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex gap-4 max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-bronze flex items-center justify-center flex-shrink-0">
                                    <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div className="p-4 rounded-xl bg-card border border-border rounded-tl-none flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-bronze animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-bronze animate-pulse delay-75" />
                                    <div className="w-2 h-2 rounded-full bg-bronze animate-pulse delay-150" />
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleAsk} className="p-4 bg-card border-t border-border flex gap-3">
                        <Input
                            placeholder={`Ask ${activeProfile.name} for advice...`}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={isTyping}
                            className="flex-1"
                        />
                        <Button type="submit" variant="hero" disabled={isTyping || !question.trim()}>
                            <MessageSquare className="w-4 h-4 mr-2" /> Ask
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
