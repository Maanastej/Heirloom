import { useState, useEffect, useRef } from "react";
import { 
  Brain, MessageSquare, ArrowRight, Activity, Loader2, Sparkles, User, 
  RefreshCcw, Plus, Users, ChevronRight, Quote, Heart, Calendar, 
  Shield, Scale, Eye, TrendingUp, AlertTriangle, CheckCircle, Award,
  Compass, Link2, GitFork, BookOpen, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  retrieveGraphRAGContext, 
  generateSimulatorResponse, 
  MemoryObject, 
  DecisionJournalObject, 
  PrincipleObject, 
  GraphNode, 
  GraphEdge,
  SimulatorResponseData
} from "@/lib/graphrag";
import { runPrincipleExtractionPipeline, PrincipleEvolutionSnapshot } from "@/lib/principleEngine";
import { analyzeUserResponse } from "@/lib/extractionEngine";
import { getPastQuestions } from "@/lib/uncertaintyRegistry";
import { getMemories, addMemory } from "@/lib/services/memoryService";
import { getDecisions, addDecision } from "@/lib/services/decisionService";
import { getPrinciples, addPrinciple } from "@/lib/services/principleService";
import { getGraphNodes, getGraphEdges, addGraphNode, addGraphEdge } from "@/lib/services/graphService";
import { getEvaluations, addEvaluation } from "@/lib/services/evaluationService";
import { processUploadedMedia } from "@/lib/mediaProcessor";
import { getSimilarDecisions, SimilarDecisionMatch } from "@/lib/similarityEngine";
import { runMultiAgentSimulation, MultiAgentReasoningOutput } from "@/lib/multiAgentReasoning";
import { calculateCalibrationError, generateLabSuggestions } from "@/lib/accuracyLab";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line, Legend } from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import IdentityDiscoveryChat from "./IdentityDiscoveryChat";
import LiveTwinStatusPanel from "./LiveTwinStatusPanel";
import { SimulatorChatMessage } from "./SimulatorChatMessage";

type ActiveTab = "identity" | "memories" | "decisions" | "principles" | "graph" | "simulator" | "accuracy" | "discovery";
type Step = "list" | "mcq" | "values" | "rules" | "experiences" | "training" | "dashboard";

interface AIProfile {
  id: string;
  name: string;
  relationship: string;
  scores: Record<string, number>;
  answers: {
    values: string;
    rules: string;
    experiences: string;
  };
  archetype: string;
  embedding?: number[] | null;
  isSelf?: boolean;
}

const mcqQuestions = [
  { id: 1, category: "risk_processing", trait: "risk_tolerance", question: "Choose one: A. Guaranteed smaller reward\nB. Risky larger reward", options: [{ text: "A. Guaranteed smaller reward", score: 1 }, { text: "B. Risky larger reward", score: 5 }] },
  { id: 2, category: "risk_processing", trait: "loss_aversion", question: "What feels worse?\nA. Missing a big opportunity\nB. Taking a bad risk", options: [{ text: "A. Missing a big opportunity", score: 5 }, { text: "B. Taking a bad risk", score: 1 }] },
  { id: 3, category: "risk_processing", trait: "uncertainty_tolerance", question: "When uncertain, you usually:\nA. Act quickly\nB. Gather more information", options: [{ text: "A. Act quickly", score: 5 }, { text: "B. Gather more information", score: 1 }] },
  { id: 4, category: "risk_processing", trait: "uncertainty_tolerance", question: "You trust more:\nA. Proven systems\nB. Unusual opportunities", options: [{ text: "A. Proven systems", score: 1 }, { text: "B. Unusual opportunities", score: 5 }] },
  { id: 5, category: "risk_processing", trait: "reward_sensitivity", question: "You would rather:\nA. Preserve what you have\nB. Chase something bigger", options: [{ text: "A. Preserve what you have", score: 1 }, { text: "B. Chase something bigger", score: 5 }] },
  { id: 6, category: "decision_speed", trait: "decisiveness", question: "Under pressure, you:\nA. Decide immediately\nB. Delay until clearer", options: [{ text: "A. Decide immediately", score: 5 }, { text: "B. Delay until clearer", score: 1 }] },
  { id: 7, category: "decision_speed", trait: "risk_of_speed", question: "Which creates more problems?\nA. Slow decisions\nB. Fast wrong decisions", options: [{ text: "A. Slow decisions", score: 1 }, { text: "B. Fast wrong decisions", score: 5 }] },
  { id: 8, category: "decision_speed", trait: "exploration_tendency", question: "When choices pile up, you:\nA. Narrow quickly\nB. Keep exploring options", options: [{ text: "A. Narrow quickly", score: 5 }, { text: "B. Keep exploring options", score: 1 }] },
  { id: 9, category: "decision_speed", trait: "regret_bias", question: "You usually regret:\nA. Acting too fast\nB. Waiting too long", options: [{ text: "A. Acting too fast", score: 5 }, { text: "B. Waiting too long", score: 1 }] },
  { id: 10, category: "stress_response", trait: "stress_focus", question: "Unexpected problems make you:\nA. More focused\nB. More emotionally reactive", options: [{ text: "A. More focused", score: 5 }, { text: "B. More emotionally reactive", score: 1 }] },
  { id: 11, category: "stress_response", trait: "recovery_speed", question: "When plans collapse, your first instinct is:\nA. Rebuild immediately\nB. Pause and process", options: [{ text: "A. Rebuild immediately", score: 5 }, { text: "B. Pause and process", score: 1 }] },
  { id: 12, category: "stress_response", trait: "dominance_under_stress", question: "In chaos, you naturally:\nA. Take control\nB. Observe first", options: [{ text: "A. Take control", score: 5 }, { text: "B. Observe first", score: 1 }] }
];

export default function DecisionDNA() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("list");
  const [activeTab, setActiveTab] = useState<ActiveTab>("identity");
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTrainedSelf, setHasTrainedSelf] = useState(false);

  // Core engines data states
  const [memories, setMemories] = useState<MemoryObject[]>([]);
  const [decisions, setDecisions] = useState<DecisionJournalObject[]>([]);
  const [principles, setPrinciples] = useState<PrincipleObject[]>([]);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEvolutionPrincipleId, setSelectedEvolutionPrincipleId] = useState<string | null>(null);
  const [principleEvolutionSnapshots, setPrincipleEvolutionSnapshots] = useState<PrincipleEvolutionSnapshot[]>([]);
  const [similarDecisions, setSimilarDecisions] = useState<SimilarDecisionMatch[]>([]);
  const [multiAgentOutput, setMultiAgentOutput] = useState<MultiAgentReasoningOutput | null>(null);

  // Forms / Modals
  const [newMemory, setNewMemory] = useState({ title: "", description: "", content: "", year: new Date().getFullYear(), event_type: "family", emotion: "hope", importance_score: 5, people_involved: "" });
  const [newDecision, setNewDecision] = useState({ situation: "", options: [{ id: "1", text: "" }, { id: "2", text: "" }], selected_option: "", reasoning: "", emotional_state: "calm", outcome: "", outcome_quality: 5 });
  const [newPrinciple, setNewPrinciple] = useState({ title: "", description: "", category: "ethics", confidence_score: 0.8 });
  const [newEval, setNewEval] = useState({ question: "", real_user_decision: "", predicted_decision: "", confidence_score: 0.8, is_correct: true });
  
  const [draftMCQAnswers, setDraftMCQAnswers] = useState<Record<number, number>>({});
  const [draftAnswers, setDraftAnswers] = useState({ values: "", rules: "", experiences: "" });

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ id: string; sessionId?: string; role: "user" | "ai" | "system"; content?: string; structuredData?: SimulatorResponseData; evidence?: any }[]>([]);
  const [activeSessionDomain, setActiveSessionDomain] = useState<string | null>(null);
  const [activeDecisionId, setActiveDecisionId] = useState<string>(() => crypto.randomUUID());
  const [isTyping, setIsTyping] = useState(false);
  const [isAwaitingFollowUp, setIsAwaitingFollowUp] = useState(false);
  const [pendingOriginalQuestion, setPendingOriginalQuestion] = useState("");
  const [pendingFollowUpQuestion, setPendingFollowUpQuestion] = useState("");

  // Graph interaction state
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Memory timeline filters & Media upload simulation states
  const [filterEmotion, setFilterEmotion] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [filterDecade, setFilterDecade] = useState("");
  const [filterPrinciple, setFilterPrinciple] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [mediaUpload, setMediaUpload] = useState({ name: "", type: "video", content: "" });

  useEffect(() => {
    loadDNAProfiles();
  }, [user]);

  useEffect(() => {
    if (activeProfileId) {
      loadActiveProfileData();
    }
  }, [activeProfileId]);

  const loadDNAProfiles = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from("dna_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
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
              experiences: d.life_experiences,
            },
            archetype: calculateArchetype(d.risk_score || 3, d.trust_score || 3, d.horizon_score || 3, d.adversity_score || 3, d.ethics_score || 3),
            isSelf: d.created_by === user.id,
          }));
          setProfiles(mapped);
          setHasTrainedSelf(mapped.some(p => p.isSelf));
          setLoading(false);
          return;
        }
      }
    } catch {}

    const cached = localStorage.getItem("heirloom_dna_profiles");
    if (cached) {
      const parsed = JSON.parse(cached);
      setProfiles(parsed);
      setHasTrainedSelf(parsed.some((p: any) => p.isSelf));
    } else {
      const seeds: AIProfile[] = [
        {
          id: "grandpa-richard",
          name: "Grandpa Richard",
          relationship: "Grandfather",
          scores: { risk: 2, trust: 4, horizon: 5, adversity: 3, ethics: 5 },
          answers: {
            values: "Hard work, faith, integrity, and absolute devotion to family legacy.",
            rules: "Always save 30% of what you make, never go to sleep angry at your kin, and back up your words with consistent actions.",
            experiences: "Rebuilding our family farm after a critical drought taught me the value of local community."
          },
          archetype: "The Compassionate Guardian"
        },
        {
          id: "eleanor-matriarch",
          name: "Eleanor Sterling",
          relationship: "Matriarch",
          scores: { risk: 3, trust: 3, horizon: 4, adversity: 5, ethics: 4 },
          answers: {
            values: "Intellect, constant curiosity, relational harmony, and elegance.",
            rules: "Learn something new every single day, never trade long-term respect for immediate wealth.",
            experiences: "Leading community preservation projects taught me about stewardship."
          },
          archetype: "The Legacy Builder"
        }
      ];
      setProfiles(seeds);
      localStorage.setItem("heirloom_dna_profiles", JSON.stringify(seeds));
    }
    setLoading(false);
  };

  const loadActiveProfileData = async () => {
    if (!activeProfileId) return;

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeProfileId)) {
      // If it is a mock profile ID, empty states to prevent 400 bad request database errors
      setMemories([]);
      setDecisions([]);
      setPrinciples([]);
      setGraphNodes([]);
      setGraphEdges([]);
      setEvaluations([]);
      return;
    }

    // Memories
    const mems = await getMemories(activeProfileId);
    setMemories(mems);

    // Decisions
    const decs = await getDecisions(activeProfileId);
    setDecisions(decs);

    // Principles pipeline extraction & snapshots
    const { principles: extractedPrincs, evolution } = await runPrincipleExtractionPipeline(activeProfileId);
    setPrinciples(extractedPrincs);
    setPrincipleEvolutionSnapshots(evolution);
    if (extractedPrincs.length > 0) {
      setSelectedEvolutionPrincipleId(extractedPrincs[0].id);
    }

    // Graph data
    const nodes = await getGraphNodes(activeProfileId);
    const edges = await getGraphEdges(activeProfileId);
    setGraphNodes(nodes);
    setGraphEdges(edges);

    // Accuracy evaluations
    const evs = await getEvaluations(activeProfileId);
    setEvaluations(evs);
  };

  const calculateArchetype = (r: number, t: number, h: number, a: number, e: number): string => {
    if (r >= 4 && t <= 2) return "The Guarded Trailblazer";
    if (h >= 4 && e >= 4) return "The Legacy Builder";
    if (r <= 2 && e >= 4) return "The Compassionate Guardian";
    if (r >= 4 && h >= 4) return "The Strategic Pioneer";
    if (a >= 4 && t <= 2) return "The Stoic Defender";
    return "The Pragmatic Counselor";
  };

  // Add handlers
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId) return;

    const memoryData = {
      profile_id: activeProfileId,
      title: newMemory.title,
      description: newMemory.description,
      content: newMemory.content,
      year: Number(newMemory.year),
      event_type: newMemory.event_type,
      emotion: newMemory.emotion,
      people_involved: newMemory.people_involved.split(",").map(p => p.trim()).filter(p => p),
      importance_score: Number(newMemory.importance_score)
    };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeProfileId)) {
        toast({ title: "Cannot save to database", description: "This is a local demo profile. Train your own Digital Twin to save data.", variant: "destructive" });
        return;
    }

    const newObj = await addMemory(memoryData);
    if (!newObj) {
      toast({ title: "Failed to preserve memory", description: "Database insertion error.", variant: "destructive" });
      return;
    }

    setMemories(prev => [newObj, ...prev]);

    // Update Knowledge Graph dynamically
    const node = await addGraphNode(activeProfileId, { id: "", entity_type: "Memory", label: newObj.title, properties: { year: newObj.year, score: newObj.importance_score } });
    if (node) {
      setGraphNodes(prev => [...prev, node]);
      const edge = await addGraphEdge(activeProfileId, { id: "", source: `node-person-${activeProfileId}`, target: node.id, type: "MADE", properties: {} });
      if (edge) {
        setGraphEdges(prev => [...prev, edge]);
      }
    }

    // Trigger Principle Extraction pipeline
    const { principles: extractedPrincs, evolution } = await runPrincipleExtractionPipeline(activeProfileId);
    setPrinciples(extractedPrincs);
    setPrincipleEvolutionSnapshots(evolution);

    setNewMemory({ title: "", description: "", content: "", year: new Date().getFullYear(), event_type: "family", emotion: "hope", importance_score: 5, people_involved: "" });
    toast({ title: "Memory preserved", description: "Successfully extracted structured entities and updated core principles." });
  };

  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId) return;

    const decisionData = {
      profile_id: activeProfileId,
      situation: newDecision.situation,
      options: newDecision.options.filter(o => o.text.trim()),
      selected_option: newDecision.selected_option,
      reasoning: newDecision.reasoning,
      emotional_state: newDecision.emotional_state,
      outcome: newDecision.outcome,
      outcome_quality: Number(newDecision.outcome_quality),
      decision_date: new Date().toISOString()
    };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeProfileId)) {
        toast({ title: "Cannot save to database", description: "This is a local demo profile. Train your own Digital Twin to save data.", variant: "destructive" });
        return;
    }

    const newObj = await addDecision(decisionData);
    if (!newObj) {
      toast({ title: "Failed to record decision", description: "Database insertion error.", variant: "destructive" });
      return;
    }

    setDecisions(prev => [newObj, ...prev]);

    // Update Graph
    const node = await addGraphNode(activeProfileId, { id: "", entity_type: "Decision", label: newObj.situation.substring(0, 30) + "...", properties: { selected: newObj.selected_option } });
    if (node) {
      setGraphNodes(prev => [...prev, node]);
      const edge = await addGraphEdge(activeProfileId, { id: "", source: `node-person-${activeProfileId}`, target: node.id, type: "MADE", properties: {} });
      if (edge) {
        setGraphEdges(prev => [...prev, edge]);
      }
    }

    // Trigger Principle Extraction pipeline
    const { principles: extractedPrincs, evolution } = await runPrincipleExtractionPipeline(activeProfileId);
    setPrinciples(extractedPrincs);
    setPrincipleEvolutionSnapshots(evolution);

    setNewDecision({ situation: "", options: [{ id: "1", text: "" }, { id: "2", text: "" }], selected_option: "", reasoning: "", emotional_state: "calm", outcome: "", outcome_quality: 5 });
    toast({ title: "Decision recorded", description: "Decision Journal logged and core principles updated." });
  };

  const handleAddPrinciple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId) return;

    const principleData = {
      profile_id: activeProfileId,
      title: newPrinciple.title,
      description: newPrinciple.description,
      category: newPrinciple.category,
      confidence_score: Number(newPrinciple.confidence_score),
      supporting_evidence: [],
      contradicting_evidence: []
    };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeProfileId)) {
        toast({ title: "Cannot save to database", description: "This is a local demo profile. Train your own Digital Twin to save data.", variant: "destructive" });
        return;
    }

    const newObj = await addPrinciple(principleData);
    if (!newObj) {
      toast({ title: "Failed to extract principle", description: "Database insertion error.", variant: "destructive" });
      return;
    }

    setPrinciples(prev => [newObj, ...prev]);

    // Update Graph
    const node = await addGraphNode(activeProfileId, { id: "", entity_type: "Principle", label: newObj.title, properties: { confidence: newObj.confidence_score } });
    if (node) {
      setGraphNodes(prev => [...prev, node]);
      const edge = await addGraphEdge(activeProfileId, { id: "", source: `node-person-${activeProfileId}`, target: node.id, type: "INSPIRED", properties: {} });
      if (edge) {
        setGraphEdges(prev => [...prev, edge]);
      }
    }

    setNewPrinciple({ title: "", description: "", category: "ethics", confidence_score: 0.8 });
    toast({ title: "Principle extracted", description: "Added new rule behavior system card." });
  };

  const handleAddEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfileId) return;

    const evalData = {
      question: newEval.question,
      predicted_decision: newEval.predicted_decision,
      real_user_decision: newEval.real_user_decision,
      confidence_score: Number(newEval.confidence_score),
      is_correct: newEval.is_correct
    };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeProfileId)) {
        toast({ title: "Cannot save to database", description: "This is a local demo profile. Train your own Digital Twin to save data.", variant: "destructive" });
        return;
    }

    const newObj = await addEvaluation(activeProfileId, evalData);
    if (!newObj) {
      toast({ title: "Failed to add evaluation", description: "Database insertion error.", variant: "destructive" });
      return;
    }

    setEvaluations(prev => [newObj, ...prev]);
    setNewEval({ question: "", real_user_decision: "", predicted_decision: "", confidence_score: 0.8, is_correct: true });
    toast({ title: "Evaluation added", description: "Accuracy dashboard updated." });
  };

  // Consult Twin Simulation handler
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeProfileId) return;

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    if (!activeProfile) return;

    const userQ = question;
    const newSessionId = crypto.randomUUID();
    setActiveDecisionId(newSessionId);
    
    // Append to keep history visible
    setChatHistory(prev => [...prev, { id: crypto.randomUUID(), sessionId: newSessionId, role: "user", content: userQ }]);
    setActiveSessionDomain(null);
    setPendingFollowUpQuestion("");
    setIsAwaitingFollowUp(false);
    setQuestion("");
    setIsTyping(true);

    try {
      // Main box is always a new question, bypass any stale await state
      const queryToSimulate = userQ;
      
      const currentSessionHistory = [{ role: "user", content: userQ }];
      const pastQs = getPastQuestions(currentSessionHistory as any);
      
      const evidence = await retrieveGraphRAGContext(activeProfileId, queryToSimulate, activeProfile.scores);
      const result = await generateSimulatorResponse(
        activeProfile.name,
        queryToSimulate,
        evidence,
        pastQs,
        import.meta.env.VITE_GROQ_API_KEY
      );

      // Phase 19 Confidence & Next Question State
      if (result.nextQuestion) {
          setIsAwaitingFollowUp(true);
          setPendingOriginalQuestion(queryToSimulate);
          setPendingFollowUpQuestion(result.nextQuestion.question);
      }
      
      console.log(`DOMAIN_RENDERED_TO_UI: ${result.domain}`);

      // Compute Phase 9 Similar Decisions
      const matches = getSimilarDecisions(userQ, decisions, principles, graphEdges);
      setSimilarDecisions(matches);

      // Compute Phase 11 Multi-Agent Reasoning simulation
      const agentOutput = runMultiAgentSimulation(
        activeProfile.name,
        userQ,
        activeProfile.scores,
        memories,
        decisions,
        principles,
        graphEdges
      );
      setMultiAgentOutput(agentOutput);

      // Track domain
      setActiveSessionDomain(result.domain);
      
      setChatHistory(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sessionId: newSessionId,
          role: "ai",
          structuredData: result,
          evidence
        }
      ]);
    } catch (err) {
      console.error(err);
      toast({ title: "Simulation Failed", description: "Could not generate response.", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  // Phase 19 Auto-Rerun on MCQ selection
  const handleFollowUpAnswer = async (answer: string) => {
    if (!activeProfileId) return;
    
    const currentSessionId = activeDecisionId;
    // Add user's answer to chat synchronously for the current execution block
    const updatedChatHistory: { id: string; sessionId?: string; role: "user" | "ai"; content?: string; structuredData?: any }[] = [
      ...chatHistory, 
      { id: crypto.randomUUID(), sessionId: currentSessionId, role: "user", content: answer }
    ];
    setChatHistory(updatedChatHistory as any);
    setIsTyping(true);

    try {
      console.log(`ANSWER_RECEIVED: ${answer}`);
      const activeProfile = profiles.find(p => p.id === activeProfileId);
      let confidenceBefore = 0;
      if (activeProfile) {
         const evidenceBefore = await retrieveGraphRAGContext(activeProfileId, pendingOriginalQuestion, activeProfile.scores);
         confidenceBefore = evidenceBefore.confidenceScore || 0;
      }

      // 1. Analyze user response and learn
      const analysis = await analyzeUserResponse(activeProfileId, pendingFollowUpQuestion, answer, import.meta.env.VITE_GROQ_API_KEY);
      if (analysis.extractedItems.length > 0) {
          toast({ title: "Continuous Learning", description: `Updated Twin with new insight.`});
      }
      
      // Phase 20A Fix: Always refresh local data because extraction might succeed on backend but return empty array string parsing.
      await loadActiveProfileData(); 
      setIsAwaitingFollowUp(false);

      if (!activeProfile) return;

      let recBefore = "Unknown";
      const lastMsg = chatHistory[chatHistory.length - 1];
      if (lastMsg && lastMsg.structuredData) {
         recBefore = lastMsg.structuredData.recommendation;
      }

      // 2. Auto-rerun original query with new data
      const sessionHistory = updatedChatHistory.filter(msg => msg.sessionId === currentSessionId);
      const pastQs = getPastQuestions(sessionHistory);
      const evidence = await retrieveGraphRAGContext(activeProfileId, pendingOriginalQuestion, activeProfile.scores);
      let result = await generateSimulatorResponse(
        activeProfile.name,
        pendingOriginalQuestion,
        evidence,
        pastQs,
        import.meta.env.VITE_GROQ_API_KEY
      );

      // Domain Reset Check
      if (activeSessionDomain && result.domain && activeSessionDomain !== result.domain) {
        console.warn(`DOMAIN SHIFT DETECTED: ${activeSessionDomain} -> ${result.domain}. Resetting session.`);
        toast({ title: "Topic Changed", description: "You changed the subject. Starting a new evaluation." });
        
        const newDomainSessionId = crypto.randomUUID();
        setActiveDecisionId(newDomainSessionId);
        setActiveSessionDomain(result.domain);
        setPendingOriginalQuestion(answer); // The user's follow up answer is actually a new topic
        
        // Re-run completely fresh
        const freshEvidence = await retrieveGraphRAGContext(activeProfileId, answer, activeProfile.scores);
        result = await generateSimulatorResponse(
          activeProfile.name,
          answer,
          freshEvidence,
          [], // Clean history
          import.meta.env.VITE_GROQ_API_KEY
        );

        if (result.nextQuestion) {
            setIsAwaitingFollowUp(true);
            setPendingFollowUpQuestion(result.nextQuestion.question);
        }

        setChatHistory(prev => [
           ...prev,
           { id: crypto.randomUUID(), sessionId: newDomainSessionId, role: "system", content: "Starting a new decision because this appears to be a different topic." },
           { id: crypto.randomUUID(), sessionId: newDomainSessionId, role: "ai", structuredData: result, evidence: freshEvidence }
        ]);
        return;
      }

      if (result.nextQuestion) {
          setIsAwaitingFollowUp(true);
          setPendingFollowUpQuestion(result.nextQuestion.question);
      }

      setChatHistory(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sessionId: currentSessionId,
          role: "ai",
          structuredData: result,
          evidence
        }
      ]);
    } catch (err) {
      console.error(err);
      toast({ title: "Simulation Failed", description: "Could not generate updated response.", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  const startNewAI = () => {
    setDraftMCQAnswers({});
    setDraftAnswers({ values: "", rules: "", experiences: "" });
    setStep("mcq");
  };

  const finishMCQ = () => {
    setStep("values");
  };

  const finishTest = async () => {
    setStep("training");
    
    try {
      let newProfileId = "self-" + Date.now();
      
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('family_id').eq('user_id', user.id).single();
        if (profile?.family_id) {
          const currentUserName = user.user_metadata?.full_name || "Arthur Sterling";
          const { data, error } = await supabase.from('dna_profiles').insert({
            family_id: profile.family_id,
            created_by: user.id,
            name: currentUserName,
            relationship: "Self",
            risk_score: draftMCQAnswers[1] || 3,
            trust_score: 3,
            horizon_score: 4,
            adversity_score: draftMCQAnswers[10] || 3,
            ethics_score: 4,
            core_values: draftAnswers.values || "Not provided",
            decision_rules: draftAnswers.rules || "Not provided",
            life_experiences: draftAnswers.experiences || "Not provided"
          }).select().single();
          
          if (!error && data) {
            newProfileId = data.id;
          }
        }
      }

      setTimeout(() => {
        const currentUserName = user?.user_metadata?.full_name || "Arthur Sterling";
        const mockProfile: AIProfile = {
          id: newProfileId,
          name: currentUserName,
          relationship: "Self",
          scores: { risk: 3, trust: 4, horizon: 4, adversity: 3, ethics: 4 },
          answers: draftAnswers,
          archetype: "The Legacy Builder",
          isSelf: true
        };

        const updated = [mockProfile, ...profiles];
        setProfiles(updated);
        localStorage.setItem("heirloom_dna_profiles", JSON.stringify(updated));
        setHasTrainedSelf(true);
        setActiveProfileId(newProfileId);
        setStep("dashboard");
        setActiveTab("identity");
        toast({ title: "Digital Twin Synthesized", description: "Your Decision DNA is online." });
      }, 1000);
    } catch (err) {
      console.error("Error creating DNA profile:", err);
      toast({ title: "Error", description: "Failed to persist profile to database. Saved locally.", variant: "destructive" });
      setTimeout(() => {
        const currentUserName = user?.user_metadata?.full_name || "Arthur Sterling";
        const newProfileId = "self-" + Date.now();
        const mockProfile: AIProfile = {
          id: newProfileId,
          name: currentUserName,
          relationship: "Self",
          scores: { risk: 3, trust: 4, horizon: 4, adversity: 3, ethics: 4 },
          answers: draftAnswers,
          archetype: "The Legacy Builder",
          isSelf: true
        };

        const updated = [mockProfile, ...profiles];
        setProfiles(updated);
        localStorage.setItem("heirloom_dna_profiles", JSON.stringify(updated));
        setHasTrainedSelf(true);
        setActiveProfileId(newProfileId);
        setStep("dashboard");
        setActiveTab("identity");
        toast({ title: "Digital Twin Synthesized", description: "Your Decision DNA is online." });
      }, 1000);
    }
  };

  const openDashboard = (profileId: string) => {
    setActiveProfileId(profileId);
    setStep("dashboard");
  };

  // Recharts Radar Map Data formatter
  const getRadarData = (scores: Record<string, number>) => {
    return [
      { subject: "Risk Tolerance", value: scores.risk || 3 },
      { subject: "Trust Speed", value: scores.trust || 3 },
      { subject: "Horizon", value: scores.horizon || 3 },
      { subject: "Adversity Coping", value: scores.adversity || 3 },
      { subject: "Ethics Alignment", value: scores.ethics || 3 }
    ];
  };

  // Accuracy Statistics Math helper
  const getStats = () => {
    if (evaluations.length === 0) return { accuracy: 0, f1: 0, precision: 0, recall: 0 };
    const correctCount = evaluations.filter(e => e.is_correct).length;
    const total = evaluations.length;

    // Mock math metrics based on the inputs
    const accuracy = correctCount / total;
    const precision = Math.min(0.95, accuracy * 1.05);
    const recall = Math.min(0.92, accuracy * 0.98);
    const f1 = (2 * precision * recall) / (precision + recall || 1);

    return {
      accuracy: Math.round(accuracy * 100),
      f1: Math.round(f1 * 100),
      precision: Math.round(precision * 100),
      recall: Math.round(recall * 100)
    };
  };

  const stats = getStats();
  const activeProfile = profiles.find(p => p.id === activeProfileId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-bronze animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-serif text-foreground mb-1 flex items-center gap-2">
            <Brain className="w-7 h-7 text-bronze animate-pulse" />
            Decision DNA v2 — Digital Twin System
          </h2>
          <p className="text-muted-foreground text-xs">
            Model, visualize, and simulate multi-generational reasoning trees using GraphRAG and life memories.
          </p>
        </div>
        {step !== "list" && (
          <Button variant="outline" size="sm" onClick={() => setStep("list")} className="self-start sm:self-auto flex items-center gap-1.5">
            <RefreshCcw className="w-3.5 h-3.5" /> Back to Tree
          </Button>
        )}
      </div>

      {/* STEP 1: CHOOSE OR CREATE TWIN */}
      {step === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={startNewAI}
            className="border-2 border-dashed border-bronze/30 bg-bronze/[0.02] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-bronze/[0.05] transition-all h-[260px] shadow-elegant group"
          >
            <div className="w-12 h-12 bg-bronze/10 rounded-full flex items-center justify-center mb-4 border border-bronze/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-bronze animate-bounce" />
            </div>
            <h3 className="font-serif text-base text-foreground font-semibold">
              {hasTrainedSelf ? "Train New DNA Model" : "Map Your Decision DNA"}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-[220px]">
              Preserve your financial, risk, and moral reasoning footprint.
            </p>
          </div>

          {profiles.map(p => (
            <div 
              key={p.id} 
              className={`bg-card border rounded-xl p-6 flex flex-col justify-between h-[260px] shadow-elegant relative overflow-hidden group hover:border-bronze/40 transition-all ${
                p.isSelf ? "border-bronze/30 bg-bronze/[0.01]" : "border-border"
              }`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-bronze/5 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
              <div>
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    p.isSelf ? "bg-bronze/10 border-bronze/20 text-bronze" : "bg-muted border-border text-foreground"
                  }`}>
                    {p.isSelf ? <Sparkles className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                  </div>
                  <span className="text-[9px] bg-muted text-muted-foreground border font-medium px-2 py-0.5 rounded uppercase tracking-wider">
                    {p.relationship}
                  </span>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-serif text-lg text-foreground font-semibold leading-tight">{p.name}</h3>
                  <p className="text-xs text-bronze mt-1 font-medium">{p.archetype}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex gap-2">
                <Button variant="hero" className="flex-1 text-xs h-9" onClick={() => openDashboard(p.id)}>
                  Explore Twin Dashboard
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSESSMENT STEPS */}
      {step === "mcq" && (
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8 max-w-2xl mx-auto space-y-6 shadow-elegant">
          <div className="text-center">
            <span className="text-[10px] text-bronze uppercase tracking-widest font-bold block mb-1">Layer 1 Onboarding</span>
            <h3 className="text-xl font-serif text-foreground font-semibold">Decision Blueprinting</h3>
          </div>
          <div className="space-y-6">
            {mcqQuestions.map((q, idx) => (
              <div key={q.id} className="space-y-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <h4 className="font-medium text-foreground text-xs leading-relaxed">
                  <span className="text-bronze font-bold mr-1">{idx + 1}.</span> {q.question}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDraftMCQAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                      className={`text-left p-3.5 rounded-lg border text-xs transition-all flex items-center gap-3 ${
                        draftMCQAnswers[q.id] === opt.score
                          ? "bg-bronze/10 border-bronze text-foreground"
                          : "bg-background border-border text-muted-foreground hover:border-bronze/30"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                        draftMCQAnswers[q.id] === opt.score ? "border-bronze" : "border-muted-foreground"
                      }`}>
                        {draftMCQAnswers[q.id] === opt.score && <div className="w-1.5 h-1.5 rounded-full bg-bronze" />}
                      </div>
                      <span>{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Answered {Object.keys(draftMCQAnswers).length} of {mcqQuestions.length}</span>
            <Button variant="hero" onClick={finishMCQ} className="h-9 px-4 text-xs">
              Next: Deep Beliefs <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {(step === "values" || step === "rules" || step === "experiences") && (
        <div className="bg-card border border-border rounded-xl p-6 lg:p-8 max-w-2xl mx-auto space-y-6 shadow-elegant">
          <div>
            <h3 className="text-lg font-serif text-foreground font-semibold capitalize">
              {step === "values" ? "Core Family Values" : step === "rules" ? "Guardrails & Rules" : "Life Crucible Experience"}
            </h3>
            <p className="text-muted-foreground text-xs mt-1">
              {step === "values" ? "Define the fundamental priorities that guide your decisions." :
               step === "rules" ? "State absolute boundaries (e.g. Always debt-free, long-term focus)." :
               "Describe a major career or life event that taught you a lasting lesson."}
            </p>
          </div>
          <textarea
            className="w-full h-36 bg-background border border-border rounded-lg p-3 text-xs focus:ring-1 focus:ring-bronze outline-none resize-none leading-relaxed text-foreground"
            value={draftAnswers[step]}
            onChange={(e) => setDraftAnswers({ ...draftAnswers, [step]: e.target.value })}
            placeholder="Type your insights here..."
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            {step === "values" && <Button variant="hero" onClick={() => setStep("rules")}>Next</Button>}
            {step === "rules" && <Button variant="hero" onClick={() => setStep("experiences")}>Next</Button>}
            {step === "experiences" && <Button variant="hero" onClick={finishTest}>Complete Synthesis</Button>}
          </div>
        </div>
      )}

      {step === "training" && (
        <div className="bg-card border border-border rounded-xl p-16 text-center max-w-md mx-auto space-y-6 shadow-elegant">
          <Loader2 className="w-10 h-10 text-bronze animate-spin mx-auto" />
          <h3 className="text-lg font-serif text-foreground font-semibold">Synthesizing Worldview DNA...</h3>
        </div>
      )}

      {/* DASHBOARD TABBED PORTAL */}
      {step === "dashboard" && activeProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* TAB BAR (Sidebar on large screens) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border-r lg:border-none lg:rounded-xl p-4 lg:p-0 lg:bg-transparent lg:border-transparent space-y-6">
              
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-bronze/10 rounded-full flex items-center justify-center border border-bronze/20">
                  <Brain className="w-5 h-5 text-bronze" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground font-serif leading-tight">{activeProfile.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{activeProfile.archetype}</p>
                </div>
              </div>

              <nav className="flex flex-col gap-6">
                
                {/* CORE PROFILE */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Core Profile</span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setActiveTab("identity")}
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === "identity" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Shield className="w-4 h-4" /> Identity Profile
                    </button>
                  </div>
                </div>

                {/* PERSONAL MEMORY */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Personal Memory</span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setActiveTab("memories")}
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === "memories" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" /> Memory Engine
                    </button>
                    <button
                      onClick={() => setActiveTab("decisions")}
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === "decisions" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Calendar className="w-4 h-4" /> Decision Journal
                    </button>
                    <button
                      onClick={() => setActiveTab("principles")}
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === "principles" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Scale className="w-4 h-4" /> Principle Cards
                    </button>
                  </div>
                </div>

                {/* DECISIONS */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Decisions</span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setActiveTab("simulator")}
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${
                        activeTab === "simulator" ? "bg-bronze/10 text-bronze font-semibold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" /> Decision Twin
                    </button>
                  </div>
                </div>

              </nav>
            </div>
          </div>

          {/* TAB PORTAL CONTENT */}
          <div className="lg:col-span-3 space-y-6">

            {/* TAB 1: IDENTITY PROFILE */}
            {activeTab === "identity" && (
              <div className="bg-card border rounded-xl p-6 shadow-elegant space-y-6 animate-fade-in">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-serif text-foreground font-semibold">Identity Engine Scorecard</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Continuous worldview evaluation dashboard.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Radar Plot of Traits */}
                  <div className="h-[240px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData(activeProfile.scores)}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 500 }} />
                        <Radar name={activeProfile.name} dataKey="value" stroke="#8c6c54" fill="#8c6c54" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Identity Scores list */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(activeProfile.scores).slice(0, 4).map(([trait, score]) => (
                        <div key={trait} className="bg-muted/50 p-3 rounded-lg border border-border">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider capitalize">{trait} score</span>
                          <span className="text-lg font-bold text-foreground block mt-1">{score} / 5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Scorecard Statements */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-bronze uppercase tracking-widest block">Philosophical Core values</span>
                    <p className="text-xs leading-relaxed text-foreground bg-muted/40 p-3 rounded-lg border border-border italic font-serif">
                      "{activeProfile.answers.values || "Preserving legacy, defending relationships, and focusing on long-term value creation."}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-bronze uppercase tracking-widest block">Strict Decision Rules</span>
                    <p className="text-xs leading-relaxed text-foreground bg-muted/40 p-3 rounded-lg border border-border italic font-serif">
                      "{activeProfile.answers.rules || "Always build slowly; protect our assets and refuse leverage."}"
                    </p>
                  </div>
                </div>
                
                {/* Advanced Profile Editor / Discovery */}
                <div className="pt-6 border-t border-border mt-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <h4 className="text-sm font-semibold">Identity Discovery</h4>
                       <p className="text-xs text-muted-foreground">Extract new traits and values through conversational profiling.</p>
                     </div>
                     <Button variant="outline" size="sm" onClick={() => setActiveTab("discovery")} className="text-xs h-8">
                       <Sparkles className="w-3.5 h-3.5 mr-2 text-bronze" /> Open Discovery Chat
                     </Button>
                   </div>
                </div>
              </div>
            )}

            {/* TAB 2: MEMORY ENGINE */}
            {activeTab === "memories" && (
              <div className="bg-card border rounded-xl p-6 shadow-elegant space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-serif text-foreground font-semibold">Memory Engine Timeline</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-light">Enrich, search, and map life events, letters, videos, and documents into structured graph knowledge.</p>
                  </div>
                </div>

                {/* Filter and search panel */}
                <div className="bg-muted/30 border p-4 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div className="sm:col-span-1 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Keyword Search</span>
                    <Input 
                      placeholder="Search text..." 
                      value={filterSearch} 
                      onChange={e => setFilterSearch(e.target.value)} 
                      className="text-xs h-8.5 bg-card"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Emotion Filter</span>
                    <select 
                      value={filterEmotion} 
                      onChange={e => setFilterEmotion(e.target.value)}
                      className="w-full bg-card border rounded-lg px-2 text-xs h-8.5 text-foreground"
                    >
                      <option value="">All Emotions</option>
                      <option value="hope">Hope</option>
                      <option value="anxiety">Anxiety</option>
                      <option value="pride">Pride</option>
                      <option value="regret">Regret</option>
                      <option value="calm">Calm</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">People Filter</span>
                    <Input 
                      placeholder="e.g. Father, Eleanor..." 
                      value={filterPerson} 
                      onChange={e => setFilterPerson(e.target.value)} 
                      className="text-xs h-8.5 bg-card"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Decade Filter</span>
                    <select 
                      value={filterDecade} 
                      onChange={e => setFilterDecade(e.target.value)}
                      className="w-full bg-card border rounded-lg px-2 text-xs h-8.5 text-foreground"
                    >
                      <option value="">All Decades</option>
                      <option value="1980">1980s</option>
                      <option value="1990">1990s</option>
                      <option value="2000">2000s</option>
                      <option value="2010">2010s</option>
                      <option value="2020">2020s</option>
                    </select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setFilterEmotion(""); setFilterPerson(""); setFilterDecade(""); setFilterSearch(""); }}
                    className="text-xs h-8.5 w-full"
                  >
                    Clear Filters
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left sub-column: Media Ingestion Portal */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-muted/40 border p-4 rounded-xl space-y-3.5">
                      <span className="text-[10px] font-bold text-bronze uppercase tracking-widest block">Media Ingestion Pipeline</span>
                      <Input 
                        placeholder="Asset Name (e.g. Grandma Interview)" 
                        value={mediaUpload.name} 
                        onChange={e => setMediaUpload({...mediaUpload, name: e.target.value})} 
                        className="text-xs h-9 bg-card"
                      />
                      <select 
                        value={mediaUpload.type} 
                        onChange={e => setMediaUpload({...mediaUpload, type: e.target.value})}
                        className="w-full bg-card border rounded-lg px-2 text-xs h-9 text-foreground"
                      >
                        <option value="video">Video Recording (transcribe)</option>
                        <option value="audio">Voice Note/Audio (transcribe)</option>
                        <option value="document">PDF / Legacy Document</option>
                        <option value="letter">Personal Letter / Journal</option>
                      </select>
                      <textarea 
                        placeholder="Paste transcription text, letter contents, or OCR document text..." 
                        value={mediaUpload.content} 
                        onChange={e => setMediaUpload({...mediaUpload, content: e.target.value})} 
                        className="w-full h-24 bg-card border rounded-lg p-3 text-xs focus:ring-1 focus:ring-bronze outline-none resize-none leading-relaxed text-foreground"
                      />
                      <Button 
                        onClick={async () => {
                          if (!mediaUpload.name || !mediaUpload.content) {
                            toast({ title: "Fields required", description: "Provide asset name and contents.", variant: "destructive" });
                            return;
                          }
                          const enriched = await processUploadedMedia(activeProfileId, mediaUpload.type as any, mediaUpload.name, mediaUpload.content);
                          
                          // Reload profile data
                          await loadActiveProfileData();

                          setMediaUpload({ name: "", type: "video", content: "" });
                          toast({ title: "Asset Processed", description: `Successfully ingested "${enriched.title}". Vector indexes and KG nodes created.` });
                        }}
                        variant="hero" 
                        className="w-full h-9 text-xs font-semibold"
                      >
                        Enrich & Ingest Media
                      </Button>
                    </div>

                    <form onSubmit={handleAddMemory} className="bg-card border p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Manual Experience Logger</span>
                      <Input 
                        placeholder="Event Title" 
                        value={newMemory.title} 
                        onChange={e => setNewMemory({...newMemory, title: e.target.value})} 
                        required 
                        className="text-xs h-9 bg-card"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          type="number" 
                          placeholder="Year" 
                          value={newMemory.year} 
                          onChange={e => setNewMemory({...newMemory, year: Number(e.target.value)})} 
                          required 
                          className="text-xs h-9 bg-card"
                        />
                        <select 
                          value={newMemory.event_type} 
                          onChange={e => setNewMemory({...newMemory, event_type: e.target.value})}
                          className="bg-card border rounded px-2 text-xs h-9 text-foreground"
                        >
                          <option value="family">Family</option>
                          <option value="career">Career</option>
                          <option value="financial">Financial</option>
                          <option value="crisis">Crisis</option>
                        </select>
                      </div>
                      <textarea 
                        placeholder="Memory content details..." 
                        value={newMemory.content} 
                        onChange={e => setNewMemory({...newMemory, content: e.target.value})} 
                        required 
                        className="w-full h-16 bg-card border rounded p-3 text-xs resize-none text-foreground"
                      />
                      <Button type="submit" variant="outline" className="w-full h-9 text-xs">
                        Preserve
                      </Button>
                    </form>
                  </div>

                  {/* Right sub-column: Memories Timeline grid */}
                  <div className="lg:col-span-2 space-y-4">
                    {(() => {
                      const filtered = memories.filter(m => {
                        if (filterEmotion && m.emotion !== filterEmotion) return false;
                        if (filterPerson && !m.people_involved?.some(p => p.toLowerCase().includes(filterPerson.toLowerCase()))) return false;
                        if (filterDecade) {
                          const dec = Math.floor(m.year / 10) * 10;
                          if (String(dec) !== filterDecade) return false;
                        }
                        if (filterSearch) {
                          const term = filterSearch.toLowerCase();
                          return m.title.toLowerCase().includes(term) || m.content.toLowerCase().includes(term) || (m as any).summary?.toLowerCase().includes(term);
                        }
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 text-muted-foreground text-xs italic bg-muted/20 border rounded-xl">
                            No memories match the selected filters.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {filtered.map(m => (
                            <div key={m.id} className="relative pl-6 border-l-2 border-bronze/35 py-1 hover:border-bronze transition-colors group">
                              <div className="absolute left-[-5px] top-2.5 w-2.5 h-2.5 rounded-full bg-bronze border border-card" />
                              <div className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[9px] font-bold text-bronze uppercase tracking-wider">{m.year} &bull; {m.event_type}</span>
                                    <h4 className="font-serif text-sm text-foreground font-semibold mt-0.5">{m.title}</h4>
                                  </div>
                                  <div className="flex gap-2">
                                    {m.emotion && (
                                      <span className="text-[8px] bg-muted border font-bold px-2 py-0.5 rounded capitalize">
                                        Emotion: {m.emotion}
                                      </span>
                                    )}
                                    <span className="text-[8px] bg-bronze/10 text-bronze border border-bronze/20 font-bold px-2 py-0.5 rounded">
                                      Score: {m.importance_score}/10
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{m.content}</p>
                                
                                {m.people_involved && m.people_involved.length > 0 && (
                                  <div className="flex flex-wrap gap-1 items-center pt-2 border-t text-[10px] text-muted-foreground">
                                    <span className="font-medium mr-1">People involved:</span>
                                    {m.people_involved.map(p => (
                                      <span key={p} className="bg-muted px-2 py-0.5 rounded border">{p}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: DECISION JOURNAL */}
            {activeTab === "decisions" && (
              <div className="bg-card border rounded-xl p-6 shadow-elegant space-y-6 animate-fade-in">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-serif text-foreground font-semibold">Decision Journal</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Chronological record of concrete choices made and their post-hoc evaluations.</p>
                </div>

                <form onSubmit={handleAddDecision} className="bg-muted/40 border p-4 rounded-xl space-y-3">
                  <Input 
                    placeholder="Decision Situation / Question" 
                    value={newDecision.situation} 
                    onChange={e => setNewDecision({...newDecision, situation: e.target.value})} 
                    required 
                    className="text-xs h-9 bg-card"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="Option A" 
                      value={newDecision.options[0].text} 
                      onChange={e => {
                        const opts = [...newDecision.options];
                        opts[0].text = e.target.value;
                        setNewDecision({...newDecision, options: opts});
                      }} 
                      required 
                      className="text-xs h-9 bg-card"
                    />
                    <Input 
                      placeholder="Option B" 
                      value={newDecision.options[1].text} 
                      onChange={e => {
                        const opts = [...newDecision.options];
                        opts[1].text = e.target.value;
                        setNewDecision({...newDecision, options: opts});
                      }} 
                      required 
                      className="text-xs h-9 bg-card"
                    />
                  </div>
                  <Input 
                    placeholder="Selected Option" 
                    value={newDecision.selected_option} 
                    onChange={e => setNewDecision({...newDecision, selected_option: e.target.value})} 
                    required 
                    className="text-xs h-9 bg-card"
                  />
                  <textarea 
                    placeholder="State your reasoning process, moral trade-offs, and emotional state..." 
                    value={newDecision.reasoning} 
                    onChange={e => setNewDecision({...newDecision, reasoning: e.target.value})} 
                    required 
                    className="w-full h-20 bg-card border rounded-lg p-3 text-xs focus:ring-1 focus:ring-bronze outline-none resize-none leading-relaxed text-foreground"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">Outcome Quality (1-10):</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={newDecision.outcome_quality} 
                        onChange={e => setNewDecision({...newDecision, outcome_quality: Number(e.target.value)})}
                        className="w-20 accent-bronze" 
                      />
                      <span className="text-xs font-bold">{newDecision.outcome_quality}</span>
                    </div>
                    <Button type="submit" variant="hero" size="sm" className="h-8 text-xs">
                      Log Decision
                    </Button>
                  </div>
                </form>

                <div className="space-y-4">
                  {decisions.map(d => (
                    <div key={d.id} className="border border-border rounded-xl p-4 hover:border-bronze/40 transition-colors bg-muted/20">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground border">
                          {new Date(d.decision_date).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] bg-green-500/10 text-green-600 border border-green-500/20 font-bold px-2 py-0.5 rounded">
                          Quality Score: {d.outcome_quality}/10
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-foreground mt-2 leading-relaxed">{d.situation}</h4>
                      <p className="text-xs text-bronze font-medium mt-1">Selected: {d.selected_option}</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed bg-card p-3 rounded-lg border">{d.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PRINCIPLE CARD LIBRARY & EVOLUTION VIEW */}
            {activeTab === "principles" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header */}
                <div className="bg-card border rounded-xl p-6 shadow-elegant">
                  <h3 className="text-lg font-serif text-foreground font-semibold">Principle Library & Evolution View</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Rules of thumb continuously derived from memories and historical decisions. Click any card to explore its evolutionary history.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Column: Principle Cards List */}
                  <div className="lg:col-span-1 space-y-4">
                    <form onSubmit={handleAddPrinciple} className="bg-muted/40 border p-4 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Manual Extraction Input</span>
                      <Input 
                        placeholder="Principle Name" 
                        value={newPrinciple.title} 
                        onChange={e => setNewPrinciple({...newPrinciple, title: e.target.value})} 
                        required 
                        className="text-xs h-9 bg-card"
                      />
                      <Input 
                        placeholder="Description" 
                        value={newPrinciple.description} 
                        onChange={e => setNewPrinciple({...newPrinciple, description: e.target.value})} 
                        required 
                        className="text-xs h-9 bg-card"
                      />
                      <div className="flex gap-2">
                        <select 
                          value={newPrinciple.category} 
                          onChange={e => setNewPrinciple({...newPrinciple, category: e.target.value})}
                          className="bg-card border rounded-lg px-2 text-xs h-9 text-foreground flex-1"
                        >
                          <option value="family">Family First</option>
                          <option value="risk">Risk Management</option>
                          <option value="ethics">Ethics</option>
                          <option value="financial">Financial Philosophy</option>
                        </select>
                        <Button type="submit" variant="hero" className="h-9 text-xs px-3">
                          Extract
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-3">
                      {principles.map(p => {
                        const isSelected = selectedEvolutionPrincipleId === p.id;
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedEvolutionPrincipleId(p.id)}
                            className={`cursor-pointer bg-card border rounded-xl p-4 shadow-sm hover:border-bronze/40 transition-all relative overflow-hidden group ${
                              isSelected ? "border-bronze ring-1 ring-bronze/20" : "border-border"
                            }`}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-bronze" />
                            <div className="flex justify-between items-start pl-1">
                              <div>
                                <span className="text-[8px] uppercase font-bold text-bronze tracking-wider">{p.category}</span>
                                <h4 className="font-serif text-sm font-semibold text-foreground mt-0.5 leading-tight">{p.title}</h4>
                              </div>
                              <span className="text-[10px] font-bold text-foreground">
                                {Math.round(p.confidence_score * 100)}%
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed pl-1 truncate">{p.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Evolution Viewer */}
                  <div className="lg:col-span-2 bg-card border rounded-xl p-6 shadow-elegant space-y-6">
                    {(() => {
                      const selectedPrinciple = principles.find(p => p.id === selectedEvolutionPrincipleId);
                      if (!selectedPrinciple) {
                        return (
                          <div className="text-center py-12 text-muted-foreground text-xs italic">
                            Select a principle card on the left to inspect its evolution timeline.
                          </div>
                        );
                      }

                      // Filter evolution points for the selected principle
                      const evolSnapshots = principleEvolutionSnapshots
                        .filter(s => s.principle_id === selectedPrinciple.id)
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                      // Map supporting memories & decisions
                      const supportMems = memories.filter(m => selectedPrinciple.supporting_evidence?.includes(m.id));
                      const supportDecs = decisions.filter(d => selectedPrinciple.supporting_evidence?.includes(d.id));

                      return (
                        <div className="space-y-6">
                          
                          {/* Selected Header */}
                          <div className="flex justify-between items-start border-b pb-4">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-bronze tracking-wider">{selectedPrinciple.category} Core</span>
                              <h4 className="font-serif text-base font-semibold text-foreground mt-0.5">{selectedPrinciple.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{selectedPrinciple.description}</p>
                            </div>
                            <div className="bg-bronze/10 border border-bronze/20 rounded-lg p-2 text-center flex-shrink-0">
                              <span className="text-[8px] uppercase font-bold text-bronze block">Current Match</span>
                              <span className="text-lg font-bold text-foreground">{Math.round(selectedPrinciple.confidence_score * 100)}%</span>
                            </div>
                          </div>

                          {/* Recharts Evolution Chart */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Confidence Evolution Chart</span>
                            <div className="h-[160px] bg-muted/20 p-2.5 rounded-lg border">
                              {evolSnapshots.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={evolSnapshots.map(s => ({ date: s.timestamp, confidence: Math.round(s.confidence_score * 100) }))}>
                                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                    <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="confidence" stroke="#8c6c54" strokeWidth={2.5} activeDot={{ r: 6 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground italic">
                                  Evolution timeline data is currently pending synthesis logs.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Evidence Package mapping */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Supporting memories */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Supporting Memories
                              </span>
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {supportMems.length > 0 ? (
                                  supportMems.map(m => (
                                    <div key={m.id} className="bg-muted/40 p-2.5 rounded-lg border border-border text-[11px]">
                                      <span className="font-bold text-foreground block">{m.title} ({m.year})</span>
                                      <p className="text-muted-foreground mt-1 leading-normal truncate">{m.content}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic">No supporting life memories cataloged.</p>
                                )}
                              </div>
                            </div>

                            {/* Supporting decisions / contradictions */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" /> Supporting Decisions
                              </span>
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {supportDecs.length > 0 ? (
                                  supportDecs.map(d => (
                                    <div key={d.id} className="bg-muted/40 p-2.5 rounded-lg border border-border text-[11px]">
                                      <span className="font-bold text-foreground block truncate">{d.situation}</span>
                                      <p className="text-bronze mt-1 leading-normal truncate">Selected: {d.selected_option}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[10px] text-muted-foreground italic">No supporting choices registered.</p>
                                )}
                              </div>

                              {/* Contradicting indicators */}
                              {selectedPrinciple.contradicting_evidence && selectedPrinciple.contradicting_evidence.length > 0 && (
                                <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center gap-2 text-[10px] text-red-600">
                                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                  <span>Contradiction: A high-leverage choice conflicts with this stability rule.</span>
                                </div>
                              )}
                            </div>

                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>

              </div>
            )}

            {/* TAB 5: LEGACY GRAPH VISUALIZER */}
            {activeTab === "graph" && (
              <div className="bg-card border rounded-xl p-6 shadow-elegant space-y-6 animate-fade-in">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-serif text-foreground font-semibold">Legacy Knowledge Network</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Explore their life, values, decisions, and memories as an interconnected web.</p>
                </div>

                {/* SVG Graph rendering area */}
                <div className="relative border rounded-xl bg-muted/20 h-[380px] overflow-hidden flex items-center justify-center">
                  
                  {/* Basic interactive visual node web */}
                  <svg className="w-full h-full select-none">
                    {/* Render connections / paths */}
                    {graphEdges.map((edge, i) => {
                      const srcNode = graphNodes.find(n => n.id === edge.source);
                      const tgtNode = graphNodes.find(n => n.id === edge.target);
                      if (!srcNode || !tgtNode) return null;
                      
                      // Calculate mock circular coordinates in SVG canvas
                      const idxS = graphNodes.indexOf(srcNode);
                      const idxT = graphNodes.indexOf(tgtNode);
                      const radiusS = idxS === 0 ? 0 : 120;
                      const radiusT = idxT === 0 ? 0 : 120;
                      const angleS = idxS * (360 / Math.max(1, graphNodes.length)) * (Math.PI / 180);
                      const angleT = idxT * (360 / Math.max(1, graphNodes.length)) * (Math.PI / 180);
                      
                      const x1 = idxS === 0 ? 250 : 250 + radiusS * Math.cos(angleS);
                      const y1 = idxS === 0 ? 190 : 190 + radiusS * Math.sin(angleS);
                      const x2 = idxT === 0 ? 250 : 250 + radiusT * Math.cos(angleT);
                      const y2 = idxT === 0 ? 190 : 190 + radiusT * Math.sin(angleT);

                      return (
                        <g key={edge.id || i}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8c6c54" strokeWidth={1} strokeOpacity={0.4} />
                          <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} fill="#8c6c54" fontSize="8" textAnchor="middle" className="font-bold opacity-60">
                            {edge.type}
                          </text>
                        </g>
                      );
                    })}

                    {/* Render entity nodes */}
                    {graphNodes.map((node, i) => {
                      const radius = i === 0 ? 0 : 120;
                      const angle = i * (360 / Math.max(1, graphNodes.length)) * (Math.PI / 180);
                      const x = i === 0 ? 250 : 250 + radius * Math.cos(angle);
                      const y = i === 0 ? 190 : 190 + radius * Math.sin(angle);
                      
                      const isSelected = selectedNode === node.id;
                      const fill = node.entity_type === "Person" ? "#1e293b" :
                                   node.entity_type === "Memory" ? "#8c6c54" :
                                   node.entity_type === "Decision" ? "#3b82f6" : "#10b981";

                      return (
                        <g 
                          key={node.id} 
                          className="cursor-pointer group"
                          onClick={() => setSelectedNode(isSelected ? null : node.id)}
                        >
                          <circle 
                            cx={x} 
                            cy={y} 
                            r={i === 0 ? 16 : 10} 
                            fill={fill} 
                            className="stroke-card stroke-2 transition-transform transform group-hover:scale-125" 
                          />
                          <text x={x} y={y + 24} className="text-[9px] font-semibold font-sans fill-foreground" textAnchor="middle">
                            {node.label.length > 20 ? node.label.substring(0, 18) + "..." : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Dynamic side popout detailing selected node properties */}
                  {selectedNode && (
                    <div className="absolute right-4 top-4 bg-card/90 backdrop-blur-sm border rounded-xl p-4 max-w-xs shadow-elegant animate-scale-in text-xs space-y-2">
                      {(() => {
                        const node = graphNodes.find(n => n.id === selectedNode);
                        if (!node) return null;
                        return (
                          <>
                            <div className="flex justify-between items-center pb-2 border-b">
                              <span className="font-bold text-bronze uppercase text-[10px]">{node.entity_type}</span>
                              <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{node.id.substring(0, 8)}</span>
                            </div>
                            <h4 className="font-serif font-semibold text-foreground text-sm">{node.label}</h4>
                            <div className="space-y-1 text-muted-foreground pt-1">
                              {Object.entries(node.properties || {}).map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="capitalize">{k}:</span>
                                  <span className="font-medium text-foreground">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Explanatory legend overlay */}
                  <div className="absolute bottom-4 left-4 bg-card/85 backdrop-blur-sm border rounded-lg p-2.5 flex flex-wrap gap-3 text-[9px] font-semibold shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1e293b]" /> <span>Identity Twin</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8c6c54]" /> <span>Memory</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> <span>Decision</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> <span>Principle</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 6: DECISION SIMULATOR (Decision Twin) */}
            {activeTab === "simulator" && (
              <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">

                {/* Main simulation/chat display */}
                <div className="bg-background flex flex-col h-[75vh]">
                  
                  {/* Simulator messages list */}
                  <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8">
                    {chatHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="space-y-3">
                          <h4 className="font-serif text-3xl font-medium text-foreground">Decision Twin</h4>
                          <p className="text-base text-muted-foreground max-w-md mx-auto">
                            What decision are you trying to make?
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-3 max-w-lg mt-8">
                          {[
                            "startup",
                            "marriage",
                            "relocation",
                            "career"
                          ].map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setQuestion(`Should I pursue a ${suggestion}?`);
                                setTimeout(() => {
                                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                                  handleAsk(fakeEvent);
                                }, 0);
                              }}
                              className="px-4 py-1.5 bg-muted hover:bg-muted-foreground/10 rounded-full text-[13px] text-muted-foreground transition-all"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 pb-10">
                        {chatHistory.map((msg, i) => (
                          <SimulatorChatMessage
                            key={msg.id || i}
                            msg={msg as any}
                            isLast={i === chatHistory.length - 1}
                            isAwaitingFollowUp={isAwaitingFollowUp}
                            isTyping={isTyping}
                            activeProfileId={activeProfileId}
                            handleFollowUpAnswer={handleFollowUpAnswer}
                          />
                        ))}
                        {isTyping && (
                          <div className="flex gap-3 max-w-[85%]">
                            <div className="p-4 bg-muted/30 border border-border/50 rounded-2xl rounded-tl-sm flex items-center gap-3">
                              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                              <span className="text-[13px] text-muted-foreground">Thinking...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Simulator input query form */}
                  <form onSubmit={handleAsk} className="p-4 bg-background border-t border-border/50 sticky bottom-0">
                    <div className="max-w-3xl mx-auto flex gap-3 relative">
                      <Input 
                        placeholder={isAwaitingFollowUp ? "Waiting for your answer to the multiple choice question..." : "Describe the situation or choice you are facing..."}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={isTyping || isAwaitingFollowUp}
                        className="bg-muted/30 border-border/50 text-foreground h-14 rounded-2xl pl-5 pr-14 text-base focus-visible:ring-1 focus-visible:ring-bronze/30 shadow-sm"
                      />
                      <Button 
                        type="submit" 
                        disabled={!question.trim() || isTyping || isAwaitingFollowUp}
                        className="absolute right-2 top-2 bottom-2 h-10 w-10 p-0 rounded-xl bg-foreground hover:bg-foreground/90 text-background"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 7: ACCURACY EVALUATION METRICS DASHBOARD */}
            {activeTab === "accuracy" && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div className="bg-card border rounded-xl p-6 shadow-elegant">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-serif text-foreground font-semibold">Digital Twin Accuracy Lab</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-light">Continuous learning loop testing predicted simulated decisions against actual verified choices.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-bronze/10 text-bronze border border-bronze/25 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> ECE Calibration: {calculateCalibrationError(evaluations.map(e => ({
                          id: e.id,
                          question: e.question,
                          predicted_answer: e.predicted_decision || e.predicted_answer || "",
                          actual_answer: e.real_user_decision || e.actual_answer || "",
                          confidence_score: e.confidence_score,
                          is_correct: e.is_correct,
                          timestamp: e.created_at
                        })))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Panel Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-bronze" />
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">Accuracy</span>
                    <span className="text-2xl font-serif font-semibold text-foreground block mt-2">{stats.accuracy}%</span>
                    <span className="text-[9px] text-muted-foreground mt-1">Target: &gt;90% match</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider block">Precision</span>
                    <span className="text-2xl font-serif font-semibold text-foreground block mt-2">{stats.precision}%</span>
                    <span className="text-[9px] text-muted-foreground mt-1">False alarm rate control</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider block">Recall</span>
                    <span className="text-2xl font-serif font-semibold text-foreground block mt-2">{stats.recall}%</span>
                    <span className="text-[9px] text-muted-foreground mt-1">Belief coverage depth</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                    <span className="text-[9px] uppercase font-bold text-purple-600 tracking-wider block">F1 Score</span>
                    <span className="text-2xl font-serif font-semibold text-foreground block mt-2">{stats.f1}%</span>
                    <span className="text-[9px] text-muted-foreground mt-1">Harmonic metric mean</span>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border flex flex-col justify-between shadow-sm relative overflow-hidden col-span-2 lg:col-span-1">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider block">Calibration Error</span>
                    <span className="text-2xl font-serif font-semibold text-foreground block mt-2">
                      {calculateCalibrationError(evaluations.map(e => ({
                        id: e.id,
                        question: e.question,
                        predicted_answer: e.predicted_decision || e.predicted_answer || "",
                        actual_answer: e.real_user_decision || e.actual_answer || "",
                        confidence_score: e.confidence_score,
                        is_correct: e.is_correct,
                        timestamp: e.created_at
                      })))}
                    </span>
                    <span className="text-[9px] text-muted-foreground mt-1">Goal: &lt; 0.150 deviation</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Section: Drift Graph & Verification Logger */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Model Drift Chart */}
                    <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-bronze uppercase tracking-widest block">Model Drift & Alignment Timeline</span>
                        <span className="text-[9px] text-muted-foreground">Historical precision tracking</span>
                      </div>
                      <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={evaluations.map((e, idx) => ({
                            name: `Point ${idx + 1}`,
                            confidence: Math.round(e.confidence_score * 100),
                            correct: e.is_correct ? 100 : 0
                          }))}>
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="currentColor" opacity={0.5} />
                            <YAxis tick={{ fontSize: 9 }} stroke="currentColor" opacity={0.5} />
                            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: "10px" }} />
                            <Area type="monotone" name="Confidence (%)" dataKey="confidence" stroke="#8c6c54" fill="#8c6c54" fillOpacity={0.1} strokeWidth={2} />
                            <Area type="step" name="Correctness (100=True)" dataKey="correct" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-muted-foreground border-t pt-2.5">
                        <span>Solid brown bounds forecast confidence</span>
                        <span>Green steps depict real-world correctness match</span>
                      </div>
                    </div>

                    {/* Verify Simulation Form */}
                    <form onSubmit={handleAddEval} className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                      <div className="border-b pb-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Log Actual Human Decision</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Submit simulated scenarios and compare against actual choices to trigger the learning loop.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Simulated Scenario Question</label>
                          <Input 
                            placeholder="e.g. Should we sell the family property?" 
                            value={newEval.question} 
                            onChange={e => setNewEval({...newEval, question: e.target.value})} 
                            required 
                            className="text-xs h-9 bg-muted/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Simulated Prediction</label>
                          <Input 
                            placeholder="e.g. Preserve and pass down" 
                            value={newEval.predicted_decision} 
                            onChange={e => setNewEval({...newEval, predicted_decision: e.target.value})} 
                            required 
                            className="text-xs h-9 bg-muted/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Actual Human Decision</label>
                          <Input 
                            placeholder="e.g. Preserve and pass down" 
                            value={newEval.real_user_decision} 
                            onChange={e => setNewEval({...newEval, real_user_decision: e.target.value})} 
                            required 
                            className="text-xs h-9 bg-muted/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Simulation Confidence (0-1)</label>
                          <Input 
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            placeholder="e.g. 0.85" 
                            value={newEval.confidence_score} 
                            onChange={e => setNewEval({...newEval, confidence_score: Number(e.target.value)})} 
                            required 
                            className="text-xs h-9 bg-muted/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase">Outcome Status</label>
                          <select 
                            value={newEval.is_correct ? "correct" : "incorrect"} 
                            onChange={e => setNewEval({...newEval, is_correct: e.target.value === "correct"})}
                            className="w-full bg-muted/20 border border-input rounded-lg px-2 text-xs h-9 text-foreground"
                          >
                            <option value="correct">Twin Correct (Match)</option>
                            <option value="incorrect">Twin Drift (Incorrect)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2 border-t">
                        <Button type="submit" variant="hero" size="sm" className="h-8.5 text-xs px-4">
                          Commit to Learning Loop
                        </Button>
                      </div>
                    </form>

                    {/* Historical Verified Logs Table */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden text-xs">
                      <div className="px-5 py-4 border-b">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Twin Evaluation Registry</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-muted/30 border-b border-border text-[9px] uppercase font-bold text-muted-foreground">
                              <th className="p-3 pl-5">Scenario Question</th>
                              <th className="p-3">Predicted</th>
                              <th className="p-3">Actual</th>
                              <th className="p-3">Confidence</th>
                              <th className="p-3 pr-5">Accuracy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-[11px]">
                            {evaluations.map(e => (
                              <tr key={e.id} className="hover:bg-muted/10">
                                <td className="p-3 pl-5 font-medium text-foreground">{e.question}</td>
                                <td className="p-3 text-muted-foreground">{e.predicted_decision || e.predicted_answer}</td>
                                <td className="p-3 text-muted-foreground">{e.real_user_decision || e.actual_answer}</td>
                                <td className="p-3 font-mono font-bold">{Math.round(e.confidence_score * 100)}%</td>
                                <td className="p-3 pr-5">
                                  {e.is_correct ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                      <CheckCircle className="w-3 h-3" /> MATCH
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                      <AlertTriangle className="w-3 h-3" /> DRIFT
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>

                  {/* Right Section: Learning Loop Action Recommendations */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border rounded-xl p-5 shadow-elegant space-y-4 text-xs">
                      <div>
                        <span className="text-[9px] text-bronze uppercase tracking-widest font-bold block">Self-Improving Learning Loop</span>
                        <h4 className="font-serif text-sm font-semibold text-foreground mt-0.5">Failure Diagnostic Lab</h4>
                        <p className="text-[11px] text-muted-foreground mt-1">Automatic analysis of mismatched predictions. These actions refine node weights and resolve memory gaps.</p>
                      </div>

                      <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                        {generateLabSuggestions(evaluations.map(e => ({
                          id: e.id,
                          question: e.question,
                          predicted_answer: e.predicted_decision || e.predicted_answer || "",
                          actual_answer: e.real_user_decision || e.actual_answer || "",
                          confidence_score: e.confidence_score,
                          is_correct: e.is_correct,
                          timestamp: e.created_at
                        }))).length > 0 ? (
                          generateLabSuggestions(evaluations.map(e => ({
                            id: e.id,
                            question: e.question,
                            predicted_answer: e.predicted_decision || e.predicted_answer || "",
                            actual_answer: e.real_user_decision || e.actual_answer || "",
                            confidence_score: e.confidence_score,
                            is_correct: e.is_correct,
                            timestamp: e.created_at
                          }))).map((suggestion, idx) => (
                            <div key={idx} className="bg-muted/40 p-4 rounded-xl border border-border space-y-3 relative overflow-hidden text-xs font-sans">
                              <div className="absolute top-0 left-0 w-1 h-full bg-bronze" />
                              
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-red-600 bg-red-500/10 border border-red-500/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Detected Discrepancy
                                </span>
                                <h5 className="font-semibold text-foreground text-[11px] mt-1.5 leading-normal">{suggestion.failureReason}</h5>
                              </div>

                              <div className="bg-card p-2.5 rounded border text-[10px] space-y-1">
                                <span className="font-bold text-bronze block">Weight Adjustment:</span>
                                <p className="text-muted-foreground leading-normal">{suggestion.weightAdjustment}</p>
                              </div>

                              <div className="text-[10px] space-y-1.5">
                                <span className="font-bold text-foreground block">Refinement Recommendation:</span>
                                <p className="text-muted-foreground leading-relaxed italic bg-card/50 p-2.5 rounded border border-border/60">
                                  "{suggestion.suggestedAction}"
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t text-[9px] text-muted-foreground">
                                <span className="font-medium">Target Principle:</span>
                                <span className="font-semibold text-foreground underline">{suggestion.targetPrinciple}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-muted-foreground/60 italic bg-muted/20 border rounded-xl p-4">
                            <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                            <p className="font-serif font-bold text-xs text-foreground not-italic">No model drift detected!</p>
                            <p className="text-[10px] mt-1 leading-normal font-sans">Your digital twin's responses match verified human choices across the registry.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeTab === "discovery" && (
              <div className="bg-card border rounded-xl p-6 shadow-elegant animate-fade-in">
                <IdentityDiscoveryChat 
                  profileId={activeProfileId} 
                  profileName={activeProfile.name}
                  onClose={() => setActiveTab("identity")}
                />
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
