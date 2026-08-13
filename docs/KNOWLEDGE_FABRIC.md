# Qlynk Knowledge Fabric

## Phase 1: source-aware retrieval

Implemented:

- automatic, overlapping chunks for facts, FAQs, indexed pages, and documents;
- source provenance, evidence status, validity dates, and source versions;
- tenant-scoped PostgreSQL full-text retrieval;
- priority-aware reranking that cannot make unrelated knowledge relevant;
- automatic backfill and synchronization from the existing source tables;
- lexical compatibility fallback while migrations roll out.

## Phase 2: semantic hybrid retrieval

Implemented in code:

- optional 384-dimensional `gte-small` embeddings generated in Supabase Edge Runtime;
- HNSW cosine index on active knowledge chunks;
- service-only, bounded embedding job claims with retry and stale-job recovery;
- one model inference per Edge Function request with bounded four-request concurrency to stay within hosted inference resource limits;
- reciprocal-rank fusion of lexical and semantic candidates;
- a minimum semantic similarity threshold;
- preservation of embeddings during metadata-only edits;
- automatic invalidation and requeueing when source text changes;
- lazy per-agent indexing during chat plus a bounded cron backfill route;
- immediate lexical fallback if the semantic service is disabled or unavailable.

Semantic retrieval is intentionally feature-gated. Do not enable it until the database migrations and Edge Function are deployed.

## Phase 2 deployment order

1. Apply all pending Supabase migrations.
2. Generate a dedicated high-entropy `KNOWLEDGE_EMBEDDINGS_SECRET` and store the same value in Supabase Edge Function secrets and the web application environment. Do not reuse the database service-role key.
3. Deploy `supabase/functions/knowledge-embeddings` with the platform JWT check disabled as recorded in `supabase/config.toml`. This is a service-to-service endpoint: the function independently requires the exact dedicated secret in the `apikey` header before processing input.
4. Set `KNOWLEDGE_EMBEDDINGS_ENABLED=1` in the web application environment.
5. Run `npm run verify:integrations` against the target environment. When the flag is enabled, this verifies the model name and 384-dimensional response.
6. Invoke `/api/cron/knowledge-embeddings` with the configured cron bearer authorization, or allow the scheduled job to begin the backfill.
7. Test paraphrased questions that share meaning but not exact keywords, followed by exact prices, policies, dates, and contact details to verify hybrid behavior.

Rollback is safe: set `KNOWLEDGE_EMBEDDINGS_ENABLED=0`. Existing full-text retrieval continues to work, and stored embeddings remain private and unused.

## Phase 3: connected knowledge graph

Implemented in code:

- canonical tenant-scoped entities and source-grounded aliases;
- atomic claims separated from source prose while retaining exact supporting excerpts;
- typed relationships between entities and up to two-hop graph retrieval;
- automatic contradiction detection for different objects attached to the same subject and predicate;
- draft-by-default extraction: model-produced entities and claims cannot enter chat retrieval before owner approval;
- explicit contradiction resolution that records an owner note and supersedes the losing claim;
- automatic invalidation when the last current supporting source is changed, expired, excluded, or deleted;
- a Knowledge Base → Connections review interface and authenticated review API;
- immediate source-retrieval fallback when the graph is disabled or unavailable.

Graph extraction uses Groq JSON Object Mode, followed by local shape validation and database-level grounding checks. Entity names, aliases, and claim excerpts must occur in the claimed source chunk. Only active, verified source chunks are processed.

## Phase 3 deployment order

1. Apply `20260814030000_add_agent_knowledge_graph.sql` after the Phase 1 and Phase 2 migrations.
2. Deploy the web application with the new graph worker, review API, cron route, and Connections dashboard tab.
3. Keep `KNOWLEDGE_GRAPH_ENABLED=0` while verifying table policies and the review interface.
4. Set `KNOWLEDGE_GRAPH_ENABLED=1` to enable bounded background extraction and verified graph retrieval.
5. Invoke `/api/cron/knowledge-graph` with cron authorization, or wait for the scheduled job.
6. Review draft and contradictory connections in Knowledge Base → Connections. No draft affects chat before approval.
7. Test questions that require joining two approved sources, aliases, and one- or two-hop relationships. Then change or delete a supporting source and verify the affected claim becomes unresolved.

Rollback is safe: set `KNOWLEDGE_GRAPH_ENABLED=0`. Phase 1 lexical retrieval and Phase 2 semantic retrieval continue independently. Existing graph proposals remain private and unused.

## Phase 4: temporal memory and pattern intelligence

Implemented in code:

- dated observations sourced only from approved graph claims or explicit owner entry;
- explicit owner preferences with consent status, optional expiry, withdrawal, and verified-only retrieval;
- recurrence proposals requiring at least three observations across at least two dates;
- preference proposals requiring at least two dated signals, while a single observation never becomes a preference;
- change detection that preserves the earlier and later values instead of overwriting history;
- support counts, confidence, inference windows, review notes, and automatic 90-day pattern expiry;
- automatic deactivation when current support drops below the required threshold;
- semantic grouping of open Knowledge Gaps using the Phase 2 embedding service and a 0.82 similarity threshold;
- privacy-preserving intent clusters that are aggregate-only, contain no visitor identity, and are explicitly excluded from agent chat retrieval;
- a Knowledge Base → Memory interface for reviewing patterns and adding or withdrawing owner-approved observations and preferences;
- verified-only temporal retrieval with immediate source/graph fallback when disabled;
- a reusable evaluation dataset for multi-source, change-over-time, recurrence, preference, expiry, consent-withdrawal, and aggregate-privacy behavior.

Raw conversations, messages, visitor names, visitor email addresses, and visitor identifiers are not ingested into temporal memory. Repeated demand is derived only from the existing normalized Knowledge Gap records and shown as anonymous aggregate content demand.

## Phase 4 deployment order

1. Apply `20260814040000_add_temporal_memory_and_patterns.sql` after the Phase 1–3 migrations.
2. Deploy the web application with the memory service, authenticated review API, cron route, and Memory dashboard tab.
3. Keep `KNOWLEDGE_MEMORY_ENABLED=0` while verifying the new RLS policies, owner review interface, and tenant isolation.
4. Enable `KNOWLEDGE_GRAPH_ENABLED=1` first. Enable `KNOWLEDGE_EMBEDDINGS_ENABLED=1` when semantic grouping of differently worded Knowledge Gaps is desired.
5. Set `KNOWLEDGE_MEMORY_ENABLED=1` and invoke `/api/cron/knowledge-memory` with cron authorization, or wait for its daily schedule.
6. Review every draft recurrence, preference, change, and aggregate intent pattern. Only approved non-intent temporal memory may enter chat.
7. Run the cases in `tests/fixtures/knowledge-memory-evaluation.json`, then test withdrawal, expiry, source deletion, and falling-below-support behavior.

Rollback is safe: set `KNOWLEDGE_MEMORY_ENABLED=0`. Source, semantic, and graph retrieval continue independently. Existing observations and proposals remain private and unused by chat.
