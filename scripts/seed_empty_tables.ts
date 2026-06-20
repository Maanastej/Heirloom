import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or Supabase API Key in .env");
  process.exit(1);
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Checking for an existing user profile...");
  const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, user_id').limit(1);
  
  if (profileErr) {
    console.error("Error fetching profiles:", profileErr);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.error("No users found in the 'profiles' table. You must have at least one registered user to attach the mock data to.");
    return;
  }

  const userId = profiles[0].user_id;
  const profileId = profiles[0].id;
  console.log(`Using existing User ID: ${userId} and Profile ID: ${profileId}`);

  // Helpers
  const isTableEmpty = async (tableName: string) => {
    const { count, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.warn(`Could not count table ${tableName}: ${error.message}`);
      return false; // Skip if we can't verify
    }
    return count === 0;
  };

  // 1. Families
  let familyId = null;
  if (await isTableEmpty('families')) {
    console.log("Seeding 'families'...");
    const { data } = await supabase.from('families').insert([{
      family_name: "The Founders Family",
      is_inherited: true
    }]).select('id').single();
    if (data) familyId = data.id;
  } else {
    // get existing family
    const { data } = await supabase.from('families').select('id').limit(1).single();
    if (data) familyId = data.id;
  }

  if (familyId) {
    // Update profile if family_id is missing
    await supabase.from('profiles').update({ family_id: familyId }).eq('id', profileId).is('family_id', null);
  }

  // 2. DNA Profiles
  let dnaProfileId = null;
  if (await isTableEmpty('dna_profiles')) {
    console.log("Seeding 'dna_profiles'...");
    const { data } = await supabase.from('dna_profiles').insert([{
      family_id: familyId,
      created_by: userId,
      name: "Founder's Legacy Profile",
      relationship: "Patriarch/Matriarch",
      risk_score: 80,
      trust_score: 90,
      horizon_score: 75,
      adversity_score: 85,
      ethics_score: 95,
      core_values: "Integrity, Resilience, Innovation",
      decision_rules: "Always prioritize long-term stability over short-term gains.",
      life_experiences: "Started a company from scratch, survived multiple economic downturns."
    }]).select('id').single();
    if (data) dnaProfileId = data.id;
  } else {
    const { data } = await supabase.from('dna_profiles').select('id').limit(1).single();
    if (data) dnaProfileId = data.id;
  }

  // Use DNA Profile ID if available, otherwise fallback to Profile ID for the foreign keys depending on schema
  const primaryProfileId = dnaProfileId || profileId;

  // 3. DNA Memories
  if (await isTableEmpty('dna_memories')) {
    console.log("Seeding 'dna_memories'...");
    await supabase.from('dna_memories').insert([
      {
        profile_id: primaryProfileId,
        title: "The First Office",
        description: "Moving into the first real office space.",
        content: "It was a tiny room above a bakery, but it felt like the start of something massive.",
        year: 2010,
        event_type: "Career",
        emotion: "Hopeful",
        people_involved: ["Sarah", "Mike"],
        importance_score: 9
      },
      {
        profile_id: primaryProfileId,
        title: "The Big Gamble",
        description: "Risking all savings for a product launch.",
        content: "We decided to put all our remaining capital into the V2 launch. It was terrifying but necessary.",
        year: 2015,
        event_type: "Financial",
        emotion: "Anxious",
        people_involved: [],
        importance_score: 10
      }
    ]);
  }

  // 4. Decision Journal
  if (await isTableEmpty('decision_journal')) {
    console.log("Seeding 'decision_journal'...");
    await supabase.from('decision_journal').insert([
      {
        profile_id: primaryProfileId,
        situation: "Acquisition Offer from Big Tech",
        options: [{ id: "1", text: "Accept Offer" }, { id: "2", text: "Stay Independent" }],
        selected_option: "Stay Independent",
        reasoning: "I wanted to maintain control over the company culture and long-term vision.",
        emotional_state: "Conflicted but resolute",
        outcome: "Grew the company 5x in the next 3 years.",
        outcome_quality: 5,
        decision_date: new Date('2018-05-10').toISOString()
      }
    ]);
  }

  // 5. Extracted Principles
  if (await isTableEmpty('extracted_principles')) {
    console.log("Seeding 'extracted_principles'...");
    await supabase.from('extracted_principles').insert([
      {
        profile_id: primaryProfileId,
        title: "Independence over Quick Capital",
        description: "Maintaining sovereignty allows for compounding returns that outpace early buyouts.",
        category: "Business",
        confidence_score: 0.95,
        supporting_evidence: {},
        contradicting_evidence: {}
      }
    ]);
  }

  // 6. Identity Profiles
  if (await isTableEmpty('identity_profiles')) {
    console.log("Seeding 'identity_profiles'...");
    await supabase.from('identity_profiles').insert([{
      profile_id: primaryProfileId,
      family_vs_work: 0.4,
      risk_tolerance: 0.8,
      financial_priority: 0.6,
      legacy_orientation: 0.9,
      stability_vs_growth: 0.7,
      contradiction_flags: {},
      identity_consistency_score: 0.88,
      last_updated: new Date().toISOString()
    }]);
  }

  // 7. Knowledge Graph Nodes
  if (await isTableEmpty('knowledge_graph_nodes')) {
    console.log("Seeding 'knowledge_graph_nodes'...");
    await supabase.from('knowledge_graph_nodes').insert([
      { id: "person_self", profile_id: primaryProfileId, entity_type: "Person", label: "The Founder", properties: {} },
      { id: "memory_first_office", profile_id: primaryProfileId, entity_type: "Memory", label: "The First Office", properties: {} },
      { id: "decision_acquisition", profile_id: primaryProfileId, entity_type: "Decision", label: "Rejected Acquisition", properties: {} },
      { id: "principle_independence", profile_id: primaryProfileId, entity_type: "Principle", label: "Independence", properties: {} }
    ]);
  }

  // 8. Knowledge Graph Edges
  if (await isTableEmpty('knowledge_graph_edges')) {
    console.log("Seeding 'knowledge_graph_edges'...");
    await supabase.from('knowledge_graph_edges').insert([
      { profile_id: primaryProfileId, source_node_id: "person_self", target_node_id: "memory_first_office", relationship_type: "OWNED", properties: {} },
      { profile_id: primaryProfileId, source_node_id: "decision_acquisition", target_node_id: "principle_independence", relationship_type: "INFLUENCED", properties: {} }
    ]);
  }

  console.log("Database scan and population complete! 🎉");
}

main().catch(console.error);
