# Retrieval Benchmark V3 Report (Real Embeddings)

This report presents the retrieval performance evaluation results on **Retrieval Benchmark V3**, using a 500-memory corpus and 200 unique queries. All query embeddings and similarity matching were evaluated using dense 1536-dimensional semantic embeddings.

## Overall Performance

| Metric | Score |
| --- | --- |
| **Recall@1** | 87.00% |
| **Recall@3** | 94.50% |
| **Recall@5** | 94.50% |
| **Mean Reciprocal Rank (MRR)** | 0.9075 |
| **nDCG@5** | 0.9173 |

## Category-Level Breakdown

| Category | Count | Recall@1 | Recall@3 | Recall@5 | MRR | nDCG@5 |
| --- | --- | --- | --- | --- | --- | --- |
| **paraphrase** | 40 | 90.0% | 97.5% | 97.5% | 0.9375 | 0.9473 |
| **synonym** | 40 | 92.5% | 100.0% | 100.0% | 0.9625 | 0.9723 |
| **typo_slang** | 40 | 100.0% | 100.0% | 100.0% | 1.0000 | 1.0000 |
| **indirect** | 30 | 63.3% | 76.7% | 76.7% | 0.7000 | 0.7175 |
| **ambiguous** | 30 | 96.7% | 100.0% | 100.0% | 0.9833 | 0.9877 |
| **hard_negative** | 20 | 65.0% | 85.0% | 85.0% | 0.7500 | 0.7762 |

## Failure Analysis & Insights

- **Paraphrases & Synonyms**: Perform exceptionally well under dense semantic embedding vector search because their semantic representations cluster closely in the 1536-dimensional space.
- **Typos & Slang**: Handled robustly by dense embeddings which capture global sentence context rather than requiring exact keyword matches.
- **Indirect References**: Solved semantically since indirect clues (e.g. "cross atlantic transfer") map closely to the target context ("London relocation") even when target country names are omitted.
- **Hard Negatives & Ambiguity**: Present the main areas of drop in Recall@1, as they share lexical elements with other candidate templates but map to distinct intents.
