import { createClient } from '@supabase/supabase-js';
import { retrieveGraphRAGContext, generateSimulatorResponse } from './src/lib/graphrag.ts';

const supabase = createClient('https://wqihsuzehsxqszkvzefi.supabase.co', 'sb_publishable_HMJQJ5Srk77DBGzyZ4z9Wg_h3b5InLM');

const runTrace = async () => {
    // get a profile id
    const { data: profiles } = await supabase.from('identity_profiles').select('id').limit(1);
    const profileId = profiles?.[0]?.id || 'mock-id';
    
    console.log("USING PROFILE ID:", profileId);

    const queries = [
        "Should I marry young or focus on career?",
        "Should I take a risk or play it safe?"
    ];

    for (const q of queries) {
        console.log("\n=======================================================");
        console.log("TRACE FOR:", q);
        console.log("=======================================================\n");

        const evidence = await retrieveGraphRAGContext(profileId, q, { risk: 3 });
        
        console.log("1. Detected Domain (from Evidence):", evidence.situationType);
        console.log("2. Retrieved Memories:", evidence.memories.map(m => m.title));
        console.log("3. Retrieved Decisions:", evidence.decisions.map(d => d.situation));
        console.log("4. Retrieved Principles:", evidence.principles.map(p => p.title));
        
        const response = await generateSimulatorResponse("User", q, evidence, [], process.env.GROQ_API_KEY as string);
        
        console.log("5. Missing Variables:", response.nextQuestion?.variableId || "None");
        console.log("6. Exact generated question:", response.nextQuestion?.question || "None");
    }
};

runTrace().catch(console.error);
