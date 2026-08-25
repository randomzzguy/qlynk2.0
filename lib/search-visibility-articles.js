const published = '2026-08-26';

const searchArticle = ({
  shortTitle,
  title,
  description,
  category,
  readTime,
  keywords,
  quickAnswer,
  sections,
  faqs,
  relatedSolutions,
  relatedArticles,
  sources,
  download,
  ctaTitle,
  ctaText,
  ctaHref,
  ctaLabel,
}) => ({
  shortTitle,
  title,
  description,
  category,
  readTime,
  keywords,
  quickAnswer,
  sections,
  faqs,
  relatedSolutions,
  relatedArticles,
  sources,
  download,
  datePublished: published,
  dateModified: published,
  ctaTitle,
  ctaText,
  ctaHref,
  ctaLabel,
});

export const searchVisibilityArticles = {
  'ai-model-retirement-migration-checklist': searchArticle({
    shortTitle: 'AI model retirement checklist',
    title: 'What Happens When an AI Model Is Retired? A Production Migration Checklist',
    description: 'Use Qlynk’s August 2026 Groq migration as a practical checklist for replacing a retired AI model without breaking chat, streaming, structured output, or response quality.',
    category: 'Engineering case study',
    readTime: '10 min read',
    keywords: ['AI model retirement', 'Groq model migration', 'model deprecation checklist', 'GPT OSS migration', 'LLM production checklist'],
    quickAnswer: 'When a provider retires a model ID, requests to that exact ID can fail immediately even when the API key and surrounding code are valid. A safe migration maps every workload to an available replacement, tests streaming and structured output, centralizes model configuration, and retests user-visible behavior—not only whether the endpoint returns 200.',
    sections: [
      {
        heading: 'The failure can look sudden and absolute',
        paragraphs: [
          'On August 16, 2026, Groq shut down llama-3.1-8b-instant and llama-3.3-70b-versatile for free and developer-tier usage. Qlynk requests that still named those model IDs began returning HTTP 404 with model_not_found. The key was accepted and the API was reachable; the requested model simply no longer existed for that tier.',
          'That distinction matters during diagnosis. Rotating a valid key, retrying the same request, or changing the user-facing error message cannot restore a retired model. The configured model ID has to change.',
        ],
      },
      {
        heading: 'What Qlynk changed',
        points: [
          ['Customer-facing chat', 'Qlynk moved the main response workload from llama-3.3-70b-versatile to openai/gpt-oss-120b, Groq’s recommended replacement for the retired 70B model.'],
          ['Lightweight work', 'Classification and background tasks moved from llama-3.1-8b-instant to openai/gpt-oss-20b, the recommended replacement for that smaller model.'],
          ['Configuration', 'Model IDs were centralized behind environment-aware configuration so a future migration does not require scattered source-code edits.'],
          ['Compatibility', 'Reasoning controls are only sent to models that support them, preventing a nominally valid replacement from failing because its request schema differs.'],
          ['Verification', 'The migration was tested with ordinary chat, streamed chat, and JSON-shaped responses before the agents were considered restored.'],
        ],
      },
      {
        heading: 'Inventory every place a model is used',
        paragraphs: [
          'The visible chat endpoint is rarely the only dependency. Search the application, deployment variables, scheduled jobs, evaluation scripts, support tools, and fallback paths for the retired ID. A primary request can succeed while a classifier, title generator, moderation helper, or retry path still fails later.',
          'Record the workload beside each reference: conversational generation, structured extraction, classification, embeddings, speech, or another capability. Replacements should be selected for the job and supported features, not by choosing one new model name for everything.',
        ],
      },
      {
        heading: 'Choose the replacement by workload',
        points: [
          ['Availability first', 'Confirm the exact model ID through the provider’s current model catalogue or API for the account and service tier you actually use.'],
          ['Capability fit', 'Check context size, structured outputs, tool use, streaming, reasoning options, language coverage, and any safety controls the workload depends on.'],
          ['Quality on your questions', 'Run the permanent evaluation set for factual support, completeness, boundaries, handoff, tone, and formatting. Generic benchmarks cannot represent an individual knowledge base.'],
          ['Rate limits and latency', 'Test realistic concurrency and token volume against the limits on your tier. A free model can be suitable for launch while still needing graceful handling for rate-limit responses.'],
          ['Fallback behavior', 'A fallback should be explicitly compatible and tested. Silently substituting any available model can change request semantics or answer behavior.'],
        ],
      },
      {
        heading: 'Test the protocol, not only the prompt',
        paragraphs: [
          'Send the smallest valid non-streaming request first, then exercise the exact production path. Verify stream events terminate correctly, structured responses parse, token limits behave as expected, and unsupported parameters are omitted. Log the provider request ID and error category without exposing secrets.',
          'Treat a successful status code as the beginning of validation. Compare output against approved facts and expected behavior. A model migration can change Markdown style, verbosity, refusals, ordering, and how strongly the model follows formatting instructions even when the same prompt is used.',
        ],
      },
      {
        heading: 'Use a production migration checklist',
        points: [
          ['Confirm the retirement', 'Read the provider notice and deprecation history; capture the shutdown date, affected tiers, and official replacement IDs.'],
          ['Find all references', 'Search code, environment variables, jobs, tests, fallbacks, and operational documentation.'],
          ['Map workloads', 'Choose and document a replacement for each capability rather than each old model name.'],
          ['Check request compatibility', 'Validate supported parameters, reasoning controls, streaming, JSON output, tool calls, and token limits.'],
          ['Run regression cases', 'Test normal questions, follow-ups, missing knowledge, boundaries, prompt injection, formatting, and human handoff.'],
          ['Deploy observably', 'Monitor status codes, model identifiers, latency, rate limits, empty streams, parse failures, and user-reported answer changes.'],
          ['Remove dead fallbacks', 'A fallback pointing to another retired model creates a second failure, not resilience.'],
        ],
      },
      {
        heading: 'The practical lesson from Qlynk',
        paragraphs: [
          'The outage was resolved by replacing retired dependencies, but testing also exposed a presentation difference: the new model produced richer Markdown than the previous rendering path displayed cleanly. Qlynk’s shared response renderer was updated so headings, lists, emphasis, links, tables, and code blocks remain readable across full-page and embedded chat.',
          'Model migrations are therefore application releases, not string replacements. Provider availability, transport compatibility, answer quality, safety behavior, and final presentation all belong in the acceptance criteria.',
        ],
      },
    ],
    faqs: [
      ['Why does a retired Groq model return 404 instead of a clearer application error?', 'The provider cannot serve the requested model ID, so the API returns model_not_found. The application should translate that provider error for users while logging the specific operational cause for maintainers.'],
      ['Can I keep the old model as a fallback?', 'No. Once the model is shut down for your tier, the retired ID is not a working fallback. Use an available, compatible model and test it through the same production path.'],
      ['Are GPT OSS models free on Groq?', 'Groq lists the retirement as affecting free and developer-tier users and recommends GPT OSS replacements. Actual access and rate limits depend on the current Groq account and tier, so confirm them in the provider console before deployment.'],
      ['Is changing the model ID enough?', 'Not reliably. Check supported parameters, streaming, structured output, rate limits, safety behavior, factual quality, verbosity, and rendering before calling the migration complete.'],
    ],
    relatedSolutions: ['ai-agent-builder', 'knowledge-based-ai', 'ai-customer-support'],
    relatedArticles: ['ai-agent-testing-checklist', 'qlynk-agent-understands-questions-better', 'ai-hallucinations-approved-knowledge'],
    sources: [
      ['Groq model deprecation history', 'https://console.groq.com/docs/deprecations'],
      ['Groq production model catalogue', 'https://console.groq.com/docs/models'],
      ['Groq rate limits', 'https://console.groq.com/docs/rate-limits'],
    ],
  }),

  'ai-knowledge-base-template': searchArticle({
    shortTitle: 'AI knowledge-base template',
    title: 'AI Knowledge Base Template for Small Businesses',
    description: 'Download a practical AI knowledge-base template for organizing approved answers, source ownership, boundaries, handoff, review dates, and agent testing.',
    category: 'Free template',
    readTime: '9 min read',
    keywords: ['AI knowledge base template', 'chatbot knowledge base template', 'small business AI template', 'AI agent FAQ template', 'knowledge base checklist'],
    quickAnswer: 'A useful AI knowledge base does more than collect FAQs. It identifies the agent’s audience and job, records an authoritative source and owner for each important answer, states conditions and exclusions explicitly, defines uncertainty and human handoff, and includes a review date. The free template below turns those decisions into one maintainable working document.',
    download: {
      href: '/downloads/qlynk-ai-knowledge-base-template.md',
      label: 'Download the free Markdown template',
      description: 'A plain-text Markdown file you can edit in any notes app, document editor, Git repository, or knowledge tool.',
      filename: 'qlynk-ai-knowledge-base-template.md',
    },
    sections: [
      {
        heading: 'What the template includes',
        points: [
          ['Agent brief', 'Define the one job, intended audience, approved actions, and human route before adding content.'],
          ['Source register', 'Record which document, page, system, or person is authoritative for each topic.'],
          ['Approved answers', 'Write direct answers with conditions, exceptions, links, ownership, and review triggers.'],
          ['Boundaries', 'State what the agent must not decide, promise, disclose, or perform.'],
          ['Handoff', 'Give a usable next step for questions that need identity checks, authorization, judgment, or missing information.'],
          ['Evaluation set', 'Preserve representative questions and expected outcomes so changes can be regression-tested.'],
        ],
      },
      {
        heading: 'Start with one audience and one job',
        paragraphs: [
          'Write a one-sentence brief: “This agent helps [audience] understand [topic] and directs them to [next step] when a person is needed.” If the sentence requires several unrelated audiences or jobs, split the work or define the scopes more carefully.',
          'A focused brief helps owners decide what belongs in the knowledge base. It also prevents a collection of documents from being mistaken for permission to answer every question found inside them.',
        ],
      },
      {
        heading: 'Create a source register before copying content',
        paragraphs: [
          'For each topic, record the authoritative source, its audience, its owner, its last review, and the event that should trigger another review. Sources can include an approved web page, policy, product sheet, operating procedure, or a written answer approved by the responsible person.',
          'Do not index obsolete copies “just in case.” Where historical guidance is genuinely required, label its applicable version and dates so it cannot be confused with the current answer.',
        ],
      },
      {
        heading: 'Write answer cards that stand on their own',
        points: [
          ['Question and aliases', 'Use the real customer question plus common alternative terms, abbreviations, or product names.'],
          ['Direct answer', 'Lead with the fact or action the reader needs instead of a long introduction.'],
          ['Conditions', 'State which plan, location, audience, date, prerequisite, or situation the answer applies to.'],
          ['Exceptions', 'Make exclusions and stop conditions explicit rather than expecting the model to infer them.'],
          ['Next step', 'Provide the exact approved link, contact route, or escalation when more help is needed.'],
          ['Evidence and owner', 'Tie the answer to its source and the person responsible for keeping it current.'],
        ],
      },
      {
        heading: 'Define uncertainty, boundaries, and handoff',
        paragraphs: [
          'Write what should happen when the answer is absent, ambiguous, conflicting, private, individualized, or time-sensitive. The agent should say what it can establish from approved information and then give the correct human route; it should not fill gaps with a plausible guess.',
          'Name actions the agent cannot perform, such as changing an account, taking payment, guaranteeing an outcome, negotiating an exception, or giving individualized regulated advice. A useful boundary explains the limit and still helps the visitor move forward.',
        ],
      },
      {
        heading: 'Build a small permanent test set',
        points: [
          ['Expected questions', 'Test the highest-frequency questions and important buying or process steps.'],
          ['Paraphrases', 'Ask the same intent with a synonym, shorthand, typo, and follow-up.'],
          ['Missing knowledge', 'Request a fact that is deliberately absent and verify honest uncertainty.'],
          ['Conflicts', 'Test how the agent behaves when controlled sources disagree.'],
          ['Boundaries', 'Ask for private data, authority, guarantees, or actions outside the configured job.'],
          ['Handoff', 'Confirm that the escalation route is accurate, usable, and appropriate to the situation.'],
        ],
      },
      {
        heading: 'Maintain the knowledge base on events and a schedule',
        paragraphs: [
          'Review high-impact answers whenever pricing, policy, staff, products, locations, links, regulations, or operating processes change. Add a calendar review as a safety net: monthly for frequently changing operational content and quarterly for stable public FAQs is a sensible starting point, adjusted to the business’s actual rate of change.',
          'Use unanswered and weak conversations as a queue, not as automatic truth. A subject owner should decide whether the gap needs a new answer, a clearer source, a synonym, a scope change, or a human-only policy decision.',
        ],
      },
    ],
    faqs: [
      ['What format is the download?', 'It is a Markdown file, which is readable as plain text and easy to edit in a notes app, document editor, code repository, or many knowledge tools.'],
      ['Do I need to fill in every section before testing?', 'No. Start with the agent brief, ten to twenty high-value approved answers, boundaries, and handoff. Test that focused version, then expand from real gaps.'],
      ['Can I paste existing website text into the template?', 'Yes, if it is current, approved, intended for the audience, and tied to an owner. Rewrite buried or ambiguous facts as direct answer cards rather than copying pages without review.'],
      ['How often should the knowledge base be updated?', 'Update it whenever a real-world fact changes and use scheduled reviews as a backstop. Frequently changing operational content may need monthly review; stable public FAQs may begin with quarterly review.'],
    ],
    relatedSolutions: ['knowledge-based-ai', 'ai-knowledge-platform', 'ai-documentation-assistant'],
    relatedArticles: ['ai-documentation-best-practices', 'ai-knowledge-management', 'how-to-train-ai-agent-on-company-documents'],
    sources: [
      ['Google guidance on helpful, people-first content', 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'],
      ['Google guidance on generative AI content', 'https://developers.google.com/search/docs/fundamentals/using-gen-ai-content'],
      ['Qlynk documentation', '/docs'],
    ],
    ctaTitle: 'Turn the completed template into a Qlynk Agent',
    ctaText: 'Use the free guided builder to shape approved source material, test important answers, and prepare a client-owned handoff.',
    ctaHref: '/agent-builder',
    ctaLabel: 'Open the free Agent Builder',
  }),

  'seo-aeo-geo-2026': searchArticle({
    shortTitle: 'SEO vs AEO vs GEO',
    title: 'SEO vs AEO vs GEO in 2026: What Businesses Actually Need',
    description: 'Learn how SEO, answer engine optimization, and generative engine optimization overlap—and use a practical 2026 plan for search rankings and AI citations.',
    category: 'Search visibility guide',
    readTime: '11 min read',
    keywords: ['SEO vs AEO vs GEO', 'answer engine optimization', 'generative engine optimization', 'AI search optimization 2026', 'ChatGPT search visibility'],
    quickAnswer: 'SEO, AEO, and GEO describe overlapping visibility work, not three separate websites or content systems. In 2026, businesses still need crawlable pages, strong technical SEO, original evidence, clear answers, accurate entity information, and measurement. Google explicitly treats generative-search optimization as SEO, while Bing and ChatGPT provide additional citation and crawler signals to monitor.',
    sections: [
      {
        heading: 'The terms describe different surfaces',
        points: [
          ['SEO', 'Search engine optimization improves discovery, indexing, relevance, presentation, and usefulness in conventional and AI-assisted search.'],
          ['AEO', 'Answer engine optimization emphasizes content that can resolve a question clearly in snippets, assistants, voice results, and direct-answer interfaces.'],
          ['GEO', 'Generative engine optimization emphasizes whether AI systems can retrieve, understand, trust, and cite a page while composing a generated answer.'],
        ],
      },
      {
        heading: 'For Google, the foundation is still SEO',
        paragraphs: [
          'Google’s 2026 guidance says its generative search features use core Search ranking and quality systems. A page needs to be publicly accessible, crawlable, indexed, eligible for a snippet, technically clear, and useful to visitors. Google describes AEO and GEO as terms for work focused on AI search, while treating that work as part of the search experience and therefore SEO.',
          'This removes the need for a parallel content strategy built on tricks. Canonical URLs, descriptive titles, internal links, semantic page structure, useful media, good page experience, structured data that matches visible content, and unique people-first information still do the heavy lifting.',
        ],
      },
      {
        heading: 'Do not manufacture a page for every possible prompt',
        paragraphs: [
          'Generative systems can issue several related searches—often called query fan-out—to collect the information needed for a complex answer. That does not mean a publisher should create near-duplicate pages for every phrasing. Google warns that scaled pages made primarily to manipulate rankings or generative answers can violate spam policy.',
          'Build a strong page around a real task or decision. Answer the main question early, cover the useful follow-up questions, use the vocabulary customers use, and link to narrower supporting resources when those topics deserve their own page.',
        ],
      },
      {
        heading: 'AI citations reward content that can support an answer',
        points: [
          ['Original evidence', 'Publish first-hand experience, product behavior, examples, methods, data, or expert review that adds more than a generic summary.'],
          ['Clear claims', 'Make important answers easy to locate under descriptive headings and state conditions, dates, scope, and uncertainty.'],
          ['Source support', 'Link material claims to authoritative primary sources and distinguish reported facts from your own inference or experience.'],
          ['Consistent entities', 'Keep names, descriptions, contact details, product facts, and media aligned across the site and relevant profiles.'],
          ['Freshness with purpose', 'Update a page when facts, evidence, screenshots, links, or recommendations change; changing only the date adds no reader value.'],
        ],
      },
      {
        heading: 'Make the site accessible to search and AI crawlers',
        paragraphs: [
          'A valuable page cannot be cited if the relevant system cannot access it. Keep important content in indexable HTML, return successful status codes, use self-referencing canonical URLs, include pages in the XML sitemap, and avoid blocking assets needed to understand the experience.',
          'OpenAI says public sites can appear in ChatGPT search and advises publishers who want their content included in summaries and snippets not to block OAI-SearchBot. Crawler access is an eligibility step, not a guarantee of ranking or citation.',
        ],
      },
      {
        heading: 'Use one practical publishing rhythm',
        points: [
          ['Weekly', 'Publish one genuinely useful article, case study, template, comparison, or product answer when the team can maintain that quality.'],
          ['Monthly', 'Refresh the pages closest to revenue or product change, improve internal links, consolidate overlap, and inspect crawl and indexing issues.'],
          ['Quarterly', 'Review the topic map, retire or redirect obsolete content, update comparisons and evidence, and evaluate which subjects produce qualified visits or citations.'],
          ['On every material change', 'Update affected pages immediately when models, features, pricing, policies, interfaces, or recommendations change.'],
        ],
      },
      {
        heading: 'Measure search traffic and AI citation signals separately',
        paragraphs: [
          'Use Google Search Console for indexing and Google Search performance, analytics for landing-page engagement and conversion, and Bing Webmaster Tools for conventional Bing data. Bing’s AI Performance report also shows citation counts, cited URLs, and sampled grounding queries across supported AI experiences.',
          'OpenAI advises allowing OAI-SearchBot and says referral traffic from ChatGPT can be tracked in analytics. No single dashboard represents every model or answer surface, so combine citations, referral traffic, branded search, assisted conversions, and qualitative sales questions instead of relying on one “AI visibility” score.',
        ],
      },
      {
        heading: 'A 2026 checklist for a small business',
        points: [
          ['Technical baseline', 'Verify crawlability, indexability, canonical URLs, sitemap coverage, mobile usability, speed, and meaningful internal links.'],
          ['Content baseline', 'Publish a clear service or product explanation, real use cases, FAQs, comparisons, original examples, and trustworthy about/contact information.'],
          ['Answer baseline', 'Lead with direct answers, then add context, conditions, steps, evidence, and a useful next action.'],
          ['Trust baseline', 'Use accurate authorship or organizational attribution, dates, source citations, honest limitations, and an editorial review process.'],
          ['Measurement baseline', 'Track queries, indexed pages, conversions, AI referrals, cited URLs, and content gaps on a recurring schedule.'],
        ],
      },
    ],
    faqs: [
      ['Is GEO replacing SEO?', 'No. Google explicitly describes optimization for its generative search features as part of SEO. GEO is useful language for citation-focused analysis, but it still depends on technical access, indexation, relevance, quality, and trust.'],
      ['Do I need an llms.txt file to appear in AI answers?', 'Google’s 2026 generative-search guidance says businesses can ignore tactics such as unnecessary AI text files. Focus first on crawlable pages, useful original content, clear structure, and supported crawler access.'],
      ['How often should a small business publish?', 'One strong item per week is a practical target when quality and maintenance are sustainable. A useful case study or template is better than several thin posts produced only to meet a quota.'],
      ['How can I see whether AI systems cite my site?', 'Bing Webmaster Tools offers AI Performance data for supported Microsoft experiences. Track referral traffic from ChatGPT and other assistants in analytics, and pair those signals with Search Console, conversions, and direct customer feedback.'],
    ],
    relatedSolutions: ['ai-knowledge-platform', 'business-ai-assistant', 'ai-agent-builder'],
    relatedArticles: ['ai-knowledge-base-template', 'ai-documentation-best-practices', 'ai-model-retirement-migration-checklist'],
    sources: [
      ['Google: Optimizing for generative AI features', 'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide'],
      ['Google: Creating helpful, reliable, people-first content', 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'],
      ['Bing: AI Performance in Webmaster Tools', 'https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview'],
      ['OpenAI: Publishers and developers FAQ', 'https://help.openai.com/en/articles/12627856-publishers-and-developers-faq'],
    ],
  }),
};
