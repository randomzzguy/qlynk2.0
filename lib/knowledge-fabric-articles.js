const knowledgeFabricArticle = ({ shortTitle, title, description, category, readTime, sections, faqs, relatedSolutions, relatedArticles }) => ({
  shortTitle,
  title,
  description,
  category,
  readTime,
  sections,
  faqs,
  relatedSolutions,
  relatedArticles,
  datePublished: '2026-08-14',
  dateModified: '2026-08-14',
});

export const knowledgeFabricArticles = {
  'qlynk-knowledge-fabric': knowledgeFabricArticle({
    shortTitle: 'Qlynk Knowledge Fabric',
    title: 'Qlynk Knowledge Fabric: How Connected AI Knowledge Works',
    description: 'See how Qlynk connects approved sources, entities, relationships, changes, and reviewed patterns so an AI agent can answer with richer context.',
    category: 'Product update',
    readTime: '10 min read',
    sections: [
      {
        heading: 'A knowledge base should be more than a pile of inputs',
        paragraphs: [
          'Most AI knowledge systems begin with useful ingredients: facts, FAQs, web pages, notes, and documents. The problem appears when those inputs describe the same client, service, policy, person, or product in different places. A flat search can retrieve relevant passages, but it may not understand that the passages are connected.',
          'Qlynk Knowledge Fabric adds structure around those approved inputs. It keeps the original source evidence, identifies the entities and claims inside it, connects related claims, and preserves dated observations so the agent can use relationships and change over time without treating every old statement as equally current.',
        ],
      },
      {
        heading: 'Four layers work together',
        points: [
          ['Source-aware retrieval', 'Approved facts, FAQs, pages, notes, and documents are divided into useful passages with source identity, status, and validity retained.'],
          ['Semantic retrieval', 'Hybrid search can match meaning as well as exact words, which helps when a visitor phrases a question differently from the source.'],
          ['Connected knowledge', 'Entities, atomic claims, aliases, and typed relationships make it possible to join supporting information across more than one source.'],
          ['Temporal memory', 'Dated observations, explicit preferences, changes, and reviewed recurring patterns add time without overwriting the history that explains the current state.'],
        ],
      },
      {
        heading: 'What makes this different from ordinary document chat',
        paragraphs: [
          'Ordinary retrieval-augmented generation usually searches for passages and gives the best matches to a model. Qlynk still uses that retrieval foundation, because the source passage is essential evidence. The difference is that retrieval is no longer the only representation of the client’s knowledge.',
          'A graph can connect one entity to multiple supported claims and other entities. Temporal records can distinguish an observation from a lasting preference, or a previous value from a newer value. The agent receives a bounded combination of source passages, verified connections, and approved temporal context rather than an undifferentiated collection of text.',
        ],
      },
      {
        heading: 'The practical benefit is better context, not unchecked guessing',
        points: [
          ['Multi-source answers', 'The agent can bring together related approved facts instead of relying on one passage to contain the entire answer.'],
          ['Change awareness', 'Earlier and later values can coexist with dates, reducing the chance that history is mistaken for the present.'],
          ['Qualified patterns', 'Repeated observations can become a reviewable tendency with support count and confidence, rather than being stated as certainty.'],
          ['Traceable maintenance', 'Owners can see the evidence behind a proposed connection or pattern and resolve contradictions before it affects answers.'],
        ],
      },
      {
        heading: 'Review gates protect the agent from false connections',
        paragraphs: [
          'Model-extracted claims and inferred patterns begin as drafts. They do not enter agent answers simply because software found a possible relationship. The owner reviews the wording, supporting evidence, dates, and contradictions before approval. If evidence expires, disappears, or falls below the required support threshold, the affected memory can become unresolved and leave retrieval.',
          'This separation matters because more connections are only useful when their evidence and authority remain visible. Qlynk is designed to increase contextual intelligence while preserving a clear line between verified, draft, unresolved, and excluded material.',
        ],
      },
      {
        heading: 'Visitor privacy remains a separate boundary',
        paragraphs: [
          'Qlynk does not copy raw conversations, visitor names, email addresses, or visitor identifiers into temporal memory. Repeated unanswered demand can be grouped from normalized Knowledge Gaps as anonymous aggregate intent, but those clusters are for the owner’s content planning and are excluded from agent chat retrieval.',
          'Explicit memory entry also rejects credentials, payment information, and identity-document data. The useful target is connected business knowledge—not a hidden profile of the people asking questions.',
        ],
      },
    ],
    faqs: [
      ['What is Qlynk Knowledge Fabric?', 'It is Qlynk’s layered way of representing approved knowledge as source passages, connected entities and claims, and reviewed temporal observations or patterns.'],
      ['Does Qlynk replace the original source with AI-generated facts?', 'No. Source evidence remains part of the system, while extracted connections and inferred patterns are review-gated before they can affect answers.'],
      ['Does the agent remember individual visitors?', 'Not through this temporal knowledge system. Raw conversations and visitor identifiers are not ingested into memory, and aggregate intent clusters are excluded from chat retrieval.'],
      ['Can connected knowledge guarantee a correct answer?', 'No. It can improve the relevance and context available to the model, but source quality, owner review, testing, and human handoff remain necessary.'],
    ],
    relatedSolutions: ['knowledge-based-ai', 'ai-knowledge-platform', 'custom-ai-agents'],
    relatedArticles: ['what-is-ai-knowledge-graph', 'ai-agent-memory-patterns', 'rag-vs-knowledge-graph-ai-memory'],
  }),

  'what-is-ai-knowledge-graph': knowledgeFabricArticle({
    shortTitle: 'AI knowledge graphs',
    title: 'What Is an AI Knowledge Graph? A Practical Guide',
    description: 'Learn how entities, claims, aliases, relationships, and source evidence help an AI agent connect information across business knowledge.',
    category: 'Technical guide',
    readTime: '9 min read',
    sections: [
      {
        heading: 'A knowledge graph represents facts through connections',
        paragraphs: [
          'An AI knowledge graph organizes information around identifiable things and the claims that connect them. The things may be a company, person, service, product, location, policy, or project. A relationship expresses how one thing relates to another, while supporting evidence records where the claim came from.',
          'For example, a profile may name a consultant, a service page may describe a discovery workshop, and an FAQ may explain who that workshop is for. A graph can represent those statements as connected knowledge without pretending that they were originally written in one document.',
        ],
      },
      {
        heading: 'The main building blocks',
        points: [
          ['Entities', 'Canonical subjects and objects such as an organization, offering, audience, place, project, or policy.'],
          ['Aliases', 'Approved alternative names that help “Qlynk Knowledge Fabric” and “the connected knowledge system” resolve to the same entity when appropriate.'],
          ['Atomic claims', 'Small statements with one subject, predicate, and object, which are easier to review than a generated paragraph.'],
          ['Relationships', 'Typed links that connect entities and allow bounded one-hop or two-hop discovery.'],
          ['Evidence', 'The exact current source passage supporting a claim, including its status and provenance.'],
        ],
      },
      {
        heading: 'Why vector similarity is not the same as a relationship',
        paragraphs: [
          'Semantic search is good at finding passages with similar meaning. It does not automatically prove that two passages describe the same entity or that a specific business relationship exists. Similar language can occur in unrelated services, people, or policies.',
          'A knowledge graph adds explicit structure. Qlynk grounds proposed names, claims, and excerpts in the source passage, then asks the owner to approve the connection. Semantic retrieval and graph retrieval complement each other: one finds relevant language, while the other follows verified relationships.',
        ],
      },
      {
        heading: 'How graph connections benefit an agent user',
        points: [
          ['Fewer isolated answers', 'A question about a service can retrieve related audience, process, owner, or policy context from connected approved sources.'],
          ['More consistent naming', 'Aliases help the agent recognize different approved terms for the same thing.'],
          ['Visible contradictions', 'Different current objects attached to the same subject and predicate can be surfaced for owner resolution.'],
          ['Explainable review', 'Each proposed claim can be inspected with its supporting excerpt before it becomes usable knowledge.'],
        ],
      },
      {
        heading: 'A graph should not silently choose the truth',
        paragraphs: [
          'If one current source says a service starts at one price and another current source gives a different price, a trustworthy system should not select whichever value is easiest to retrieve. Qlynk records the contradiction and keeps unresolved claims out of normal graph retrieval until the owner decides which source is authoritative.',
          'The same principle applies when supporting content changes or is removed. A graph claim without current support should lose its verified status rather than survive indefinitely as detached generated knowledge.',
        ],
      },
      {
        heading: 'Knowledge graphs work best with clear source ownership',
        paragraphs: [
          'The technology can expose relationships, but it cannot decide an organization’s policy. Owners still need to maintain the authoritative sources, approve important claims, record effective dates, and test questions whose answers span multiple inputs.',
          'Start with stable, public, low-risk knowledge. Add more connected domains only when their audience, authority, privacy, and review process are equally clear.',
        ],
      },
    ],
    faqs: [
      ['Is a knowledge graph a database?', 'It is a way of organizing entities and relationships that can be implemented in a database. The important property is the explicit connected structure and evidence, not a particular database brand.'],
      ['Does Qlynk automatically trust graph claims?', 'No. Extracted claims are drafts until reviewed, and contradictions or loss of current support can keep or return a claim to an unresolved state.'],
      ['How many connections does the Qlynk agent follow?', 'Graph retrieval is intentionally bounded to closely related one-hop and two-hop connections so the prompt does not expand without control.'],
      ['Is a knowledge graph better than RAG?', 'They solve different parts of the problem. RAG finds relevant source passages; a graph represents explicit relationships. Qlynk combines them.'],
    ],
    relatedSolutions: ['ai-knowledge-platform', 'knowledge-based-ai', 'ai-documentation-assistant'],
    relatedArticles: ['qlynk-knowledge-fabric', 'rag-vs-knowledge-graph-ai-memory', 'rag-explained'],
  }),

  'ai-agent-memory-patterns': knowledgeFabricArticle({
    shortTitle: 'AI agent memory and patterns',
    title: 'AI Agent Memory: Safe Patterns, Changes and Preferences',
    description: 'Understand how dated observations, explicit preferences, recurrence thresholds, expiry, and review can give an AI agent safer temporal context.',
    category: 'Technical guide',
    readTime: '10 min read',
    sections: [
      {
        heading: 'Useful memory needs time, evidence, and consent',
        paragraphs: [
          'An AI agent becomes more useful when it can distinguish what is current, what changed, what happened repeatedly, and what an owner explicitly prefers. But storing every message as permanent memory would mix casual wording, outdated facts, and private visitor information into the knowledge base.',
          'Qlynk uses a narrower temporal model. Memory is built from approved source claims or explicit owner entries. Each item carries an evidence state, date, confidence, consent basis, and optional expiry so the system can reason about time without treating all history as permanent truth.',
        ],
      },
      {
        heading: 'Observations, preferences, and patterns are different things',
        points: [
          ['Observation', 'A dated event, state, change, behavior, availability note, or preference signal supported by an approved source or owner entry.'],
          ['Explicit preference', 'A choice the owner deliberately records and can later withdraw, optionally with an expiry date.'],
          ['Inferred pattern', 'A draft summary supported by multiple dated observations, with a support count and confidence.'],
          ['Aggregate intent', 'A privacy-preserving cluster of repeated Knowledge Gaps used for content planning, not personal memory or chat context.'],
        ],
      },
      {
        heading: 'One event does not become a habit',
        paragraphs: [
          'A single observation can be useful history, but it does not prove recurrence. Qlynk requires at least three supporting observations across at least two dates before proposing a recurring pattern. A preference pattern needs at least two dated signals, while an explicit owner preference can be recorded directly because the owner supplied the consent and meaning.',
          'These thresholds do not make an inference certain. They create a minimum evidence boundary. The owner still reviews the proposal, and the agent is instructed to describe a pattern as a tendency rather than a guaranteed future event.',
        ],
      },
      {
        heading: 'Changes are preserved instead of overwritten',
        paragraphs: [
          'When the same subject and property receive different dated values, the earlier state can matter. A new delivery day, availability window, team owner, or process version should not erase the evidence that explains why an older source or answer was once valid.',
          'Qlynk can propose a change pattern that includes the evidence window and latest value. Retrieval also carries relevant occurrence and expiry dates so the response can preserve phrases such as “as of” or “previously” when the distinction matters.',
        ],
      },
      {
        heading: 'Expiry and invalidation prevent permanent habits',
        points: [
          ['Time expiry', 'Patterns receive a bounded lifetime and stop entering retrieval after expiry unless supported and reviewed again.'],
          ['Support loss', 'If current supporting observations fall below the required threshold, an approved pattern becomes unresolved.'],
          ['Preference withdrawal', 'An owner can revoke a preference so it no longer appears in temporal retrieval.'],
          ['Source invalidation', 'When an approved graph claim loses current source support, the connected observation can become unresolved too.'],
        ],
      },
      {
        heading: 'Private visitor history is not the memory source',
        paragraphs: [
          'Raw conversations, visitor identities, and contact details do not flow into Qlynk temporal memory. The system may group normalized unanswered questions to show that people repeatedly seek a topic, but the result is anonymous aggregate demand and is excluded from the agent’s answer context.',
          'This boundary keeps the focus on improving approved client knowledge. Owners should never copy private visitor records, credentials, payment data, or identity documents into an agent memory entry.',
        ],
      },
    ],
    faqs: [
      ['Does Qlynk learn habits from every conversation?', 'No. Temporal memory is sourced from approved claims or explicit owner entries, not raw visitor conversations.'],
      ['When does an observation become a recurring pattern?', 'A recurrence proposal requires at least three current observations across at least two dates, followed by owner review before it can enter chat retrieval.'],
      ['Can a user remove a preference?', 'Yes. Explicit preferences have consent status and can be withdrawn so they leave retrieval.'],
      ['What happens when a pattern becomes outdated?', 'Expired patterns are excluded, and patterns with insufficient current support become unresolved until the evidence and review state justify them again.'],
    ],
    relatedSolutions: ['custom-ai-agents', 'ai-knowledge-platform', 'business-ai-assistant'],
    relatedArticles: ['qlynk-knowledge-fabric', 'what-is-ai-knowledge-graph', 'ai-knowledge-management'],
  }),

  'rag-vs-knowledge-graph-ai-memory': knowledgeFabricArticle({
    shortTitle: 'RAG vs graphs vs memory',
    title: 'RAG vs Knowledge Graph vs AI Memory: Key Differences',
    description: 'Compare document retrieval, knowledge graphs, and temporal AI memory—and see why a connected agent can use all three without confusing their roles.',
    category: 'Comparison',
    readTime: '11 min read',
    sections: [
      {
        heading: 'These approaches answer different questions',
        paragraphs: [
          'Retrieval-augmented generation asks, “Which source passages are relevant to this question?” A knowledge graph asks, “Which entities and verified claims are connected?” Temporal memory asks, “What happened when, what changed, and which reviewed tendencies or preferences remain current?”',
          'Treating the three terms as interchangeable hides important design decisions. A strong knowledge agent can use each layer for the job it does best while retaining source evidence and review controls.',
        ],
      },
      {
        heading: 'RAG finds relevant source text',
        paragraphs: [
          'A RAG pipeline prepares source content, retrieves passages using lexical or semantic signals, and supplies a bounded selection to the language model. It is effective when the answer exists in readable material and the question can be matched to that material.',
          'Its common limits include missed synonyms, passages that split one answer across sources, duplicate or contradictory versions, and weak awareness of historical state. Hybrid lexical and semantic retrieval improves matching, but similarity alone does not establish a business relationship or chronology.',
        ],
      },
      {
        heading: 'A knowledge graph makes relationships explicit',
        paragraphs: [
          'A graph represents canonical entities, aliases, atomic claims, and typed relationships. It can connect a client to a service, that service to an audience, and the audience to an approved process even when the supporting claims originated in different inputs.',
          'The graph is most trustworthy when every claim remains grounded in current source evidence and generated proposals require approval. Without those controls, a graph can merely make an unsupported assumption look structured.',
        ],
      },
      {
        heading: 'Temporal memory represents state across time',
        paragraphs: [
          'Temporal memory preserves dated observations, explicit preferences, changes, and qualified recurring patterns. It helps the agent avoid flattening “used to be,” “currently,” and “usually” into the same kind of statement.',
          'Safe temporal memory also needs expiry, withdrawal, minimum support, and consent. Otherwise a one-off event can become a false habit and an old preference can survive after it is no longer wanted.',
        ],
      },
      {
        heading: 'A side-by-side decision guide',
        points: [
          ['Use source retrieval for', 'Direct questions whose answer lives in one or more maintained passages, especially when exact wording, URLs, qualifications, or excerpts matter.'],
          ['Use graph connections for', 'Questions that require aliases, entity identity, contradiction visibility, or relationships spanning multiple approved sources.'],
          ['Use temporal memory for', 'Questions involving current versus previous state, explicit preferences, repeated supported behavior, or evidence expiry.'],
          ['Use all three for', 'An agent that must find the evidence, connect the facts, and preserve the time context without losing the owner’s review boundary.'],
        ],
      },
      {
        heading: 'How Qlynk combines the layers',
        paragraphs: [
          'Qlynk begins with source-aware chunks and hybrid retrieval. It adds source-grounded graph proposals that remain drafts until approval. Approved claims can support dated observations, while repeated evidence can create reviewable temporal patterns. During a question, the agent receives a bounded mix of relevant source, graph, and temporal context.',
          'The fallback path remains important. If semantic, graph, or memory processing is unavailable or disabled, source retrieval can continue. More advanced structure should improve the answer when justified, not make the basic knowledge inaccessible.',
        ],
      },
      {
        heading: 'Choose evidence quality before architecture complexity',
        paragraphs: [
          'No retrieval or graph design can rescue an organization that has not decided which price, policy, process, or contact is authoritative. Begin by cleaning the sources, assigning owners, preserving dates, and resolving contradictions. Then add the smallest connected layer that improves a real evaluation question.',
          'Measure success through supported answers, correct qualifications, useful handoffs, and maintainability—not through the number of vectors, nodes, or memories stored.',
        ],
      },
    ],
    faqs: [
      ['Is RAG obsolete when you add a knowledge graph?', 'No. Source retrieval remains essential for grounding, exact detail, and provenance. A graph adds explicit connections rather than replacing source evidence.'],
      ['Can vector search detect a business relationship?', 'It can find semantically similar passages, but similarity alone does not prove entity identity or a specific relationship.'],
      ['Is AI memory just conversation history?', 'Not in this design. Qlynk temporal memory uses approved claims and explicit owner entries with dates, evidence, consent, review, and expiry.'],
      ['Which approach should a small business start with?', 'Start with current approved sources and direct retrieval. Add graph or temporal layers when real questions require cross-source relationships or change-over-time context.'],
    ],
    relatedSolutions: ['knowledge-based-ai', 'ai-knowledge-platform', 'custom-ai-agents'],
    relatedArticles: ['rag-explained', 'qlynk-knowledge-fabric', 'what-is-ai-knowledge-graph'],
  }),
};
