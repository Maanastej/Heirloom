// scripts/backfill_embeddings.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { generateDecisionEmbedding } from '../src/lib/behavioralEmbeddings.js';

// Load .env variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or Supabase API Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("=========================================");
  console.log("   EMBEDDINGS BACKFILL UTILITY START ");
  console.log("=========================================\n");

  // --- Backfill dna_memories ---
  console.log("Checking 'dna_memories' for missing embeddings...");
  const { data: memories, error: memErr } = await supabase
    .from('dna_memories')
    .select('id, title, content')
    .is('memory_embedding', null);

  if (memErr) {
    console.error("Error fetching memories:", memErr);
  } else {
    console.log(`Found ${memories?.length || 0} memories lacking embeddings.`);
    if (memories && memories.length > 0) {
      let successCount = 0;
      for (const mem of memories) {
        console.log(`Generating embedding for memory: "${mem.title}" (ID: ${mem.id})...`);
        const contentToEmbed = (mem.title || "") + " " + (mem.content || "");
        const embedding = await generateDecisionEmbedding({ input: contentToEmbed });
        if (embedding) {
          const { error: updateErr } = await supabase
            .from('dna_memories')
            .update({ memory_embedding: embedding })
            .eq('id', mem.id);
          if (updateErr) {
            console.error(`  Failed to update memory ${mem.id} in DB:`, updateErr.message);
          } else {
            console.log(`  Success.`);
            successCount++;
          }
        } else {
          console.error(`  Failed to generate embedding for memory ${mem.id}.`);
        }
      }
      console.log(`Completed memories backfill. Status: ${successCount}/${memories.length} updated successfully.\n`);
    }
  }

  // --- Backfill decision_journal ---
  console.log("Checking 'decision_journal' for missing embeddings...");
  const { data: decisions, error: decErr } = await supabase
    .from('decision_journal')
    .select('id, situation, reasoning')
    .is('decision_embedding', null);

  if (decErr) {
    console.error("Error fetching decisions:", decErr);
  } else {
    console.log(`Found ${decisions?.length || 0} decisions lacking embeddings.`);
    if (decisions && decisions.length > 0) {
      let successCount = 0;
      for (const dec of decisions) {
        console.log(`Generating embedding for decision: "${dec.situation}" (ID: ${dec.id})...`);
        const contentToEmbed = (dec.situation || "") + " " + (dec.reasoning || "");
        const embedding = await generateDecisionEmbedding({ input: contentToEmbed });
        if (embedding) {
          const { error: updateErr } = await supabase
            .from('decision_journal')
            .update({ decision_embedding: embedding })
            .eq('id', dec.id);
          if (updateErr) {
            console.error(`  Failed to update decision ${dec.id} in DB:`, updateErr.message);
          } else {
            console.log(`  Success.`);
            successCount++;
          }
        } else {
          console.error(`  Failed to generate embedding for decision ${dec.id}.`);
        }
      }
      console.log(`Completed decisions backfill. Status: ${successCount}/${decisions.length} updated successfully.\n`);
    }
  }

  console.log("=========================================");
  console.log("        BACKFILL UTILITY RUN DONE        ");
  console.log("=========================================");
}

main().catch(console.error);
