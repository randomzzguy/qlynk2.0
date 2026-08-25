const growthArticle = ({ shortTitle, title, description, category, readTime, sections, faqs, relatedSolutions, relatedArticles }) => ({
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
  ctaTitle: 'Turn this guide into a client-ready Qlynk build',
  ctaText: 'Use the free Qlynk Agent Builder to run discovery, prepare approved knowledge, test the agent, and hand it to the client.',
  ctaHref: '/agent-builder',
  ctaLabel: 'Open the free Agent Builder',
});

export const seoGrowthArticles = {
  'how-to-sell-ai-agents-to-small-businesses': growthArticle({
    shortTitle: 'Sell AI agents to small businesses',
    title: 'How to Sell AI Agents to Small Businesses Without Overselling',
    description: 'Package a focused AI-agent service around a real business problem, approved knowledge, testing, website installation, and a clean client-owned handoff.',
    category: 'Freelancer guide',
    readTime: '11 min read',
    sections: [
      {
        heading: 'Sell the outcome, not the technology',
        paragraphs: [
          'A small-business owner rarely wakes up wanting retrieval-augmented generation or a new chatbot platform. They want fewer repetitive enquiries, clearer service information, faster first answers, or an easier way for employees to find an approved procedure. Start with that observable problem.',
          'A useful first offer is narrow: one audience, one body of maintained knowledge, one publishing surface, and one clear human handoff. This is easier to explain, test, approve, and maintain than a promise to automate the entire company.',
        ],
      },
      {
        heading: 'Choose businesses with the right starting conditions',
        points: [
          ['Repeated questions', 'The owner or team answers the same service, product, policy, property, onboarding, or support questions every week.'],
          ['Existing source material', 'The business has a website, FAQ, service sheet, policy, manual, brochure, or knowledgeable owner who can approve the facts.'],
          ['A safe first scope', 'The initial agent can explain and route without making regulated decisions, changing accounts, taking payment, or accessing private records.'],
          ['A valuable next step', 'Visitors can contact a person, request a quote, open a booking page, read a policy, or follow an existing process after receiving the answer.'],
        ],
      },
      {
        heading: 'Demonstrate with permission and clear labels',
        paragraphs: [
          'Ask permission before building or publishing an agent for a prospect. If you prepare a private demonstration from public website information, label it as a draft, identify the sources, avoid implying endorsement, and do not publish it as the company’s official agent.',
          'A short demonstration should show three things: a strong answer from approved material, an honest response when information is missing, and the correct human handoff. That is more persuasive than a long feature tour.',
        ],
      },
      {
        heading: 'Package a complete implementation service',
        points: [
          ['Discovery', 'Identify the audience, recurring questions, desired next step, prohibited topics, and business owner for approvals.'],
          ['Knowledge preparation', 'Turn source material into clear facts, FAQs, links, documents, conditions, and missing-information notes.'],
          ['Configuration', 'Set the agent’s purpose, scope, tone, uncertainty behavior, blocked topics, and escalation route.'],
          ['Quality assurance', 'Test expected questions, paraphrases, missing answers, sensitive requests, conflicts, and prompt-injection attempts.'],
          ['Launch and handoff', 'Install the widget or shareable page, document ownership, train the client, and transfer continuing billing to the client-controlled account.'],
        ],
      },
      {
        heading: 'Make ownership part of the sale',
        paragraphs: [
          'The client should control the account email, recovery method, subscription, source files, public identity, and final approval. The freelancer charges for professional implementation rather than reselling access through a personal account.',
          'This makes the relationship easier to explain: you are responsible for discovery, setup, testing, installation, and optional maintenance; the client remains responsible for its business facts, approvals, plan, and final decisions.',
        ],
      },
      {
        heading: 'Offer maintenance only when it has a defined job',
        paragraphs: [
          'A sensible recurring service reviews repeated questions, knowledge gaps, changed prices or policies, outdated sources, broken links, and affected test cases. State the review frequency, included changes, approval process, and response time.',
          'Do not sell a vague promise that the AI will improve by itself. Improvement comes from reviewing real questions, resolving missing or conflicting information, updating the authoritative source, and retesting the relevant behavior.',
        ],
      },
    ],
    faqs: [
      ['Do I need to be a developer to sell AI-agent setup?', 'Not for a no-code knowledge agent. You still need strong discovery, information organization, testing, client communication, and website implementation skills.'],
      ['Should I promise reduced support costs?', 'Only use measurable outcome claims after the client has real baseline and post-launch data. Before that, describe the intended workflow rather than guaranteeing savings.'],
      ['Who should pay for the Qlynk subscription?', 'The client should own the account and continuing subscription. The freelancer charges separately for implementation and any agreed maintenance.'],
    ],
    relatedSolutions: ['ai-agent-builder', 'ai-for-consultants', 'business-ai-assistant'],
    relatedArticles: ['how-much-to-charge-for-ai-agent-setup', 'ai-agent-client-discovery-questionnaire', 'ai-agent-testing-checklist'],
  }),

  'how-much-to-charge-for-ai-agent-setup': growthArticle({
    shortTitle: 'Price AI-agent setup',
    title: 'How Much Should You Charge for AI-Agent Setup?',
    description: 'Build a defensible project price from discovery, source preparation, configuration, testing, installation, handoff, risk, and continuing maintenance.',
    category: 'Freelancer guide',
    readTime: '10 min read',
    sections: [
      {
        heading: 'Price the implementation work',
        paragraphs: [
          'The software subscription is only one cost. A client is paying you to understand the business, organize reliable information, define the agent’s boundaries, test difficult questions, install the experience, and leave behind something the client can operate.',
          'Separate your professional fee from the Qlynk subscription. The client owns and pays for the platform account; your proposal covers the work required to reach an agreed launch condition.',
        ],
      },
      {
        heading: 'Estimate the real scope before quoting',
        points: [
          ['Discovery complexity', 'Count audiences, services, locations, stakeholders, regulated topics, and approval rounds.'],
          ['Source condition', 'Clean FAQs take less work than contradictory PDFs, scattered website pages, or undocumented owner knowledge.'],
          ['Configuration depth', 'A simple public guide differs from multiple topic boundaries, custom tone, detailed escalation, and access requirements.'],
          ['Testing burden', 'More risk, languages, products, policies, and edge cases require a larger evaluation set.'],
          ['Publishing work', 'Price the hosted page, website widget, origin restrictions, styling, CMS access, and cross-device checks you actually provide.'],
          ['Handoff and training', 'Include documentation, client review, revisions, training, and a defined support window.'],
        ],
      },
      {
        heading: 'Use a cost floor before choosing a package price',
        paragraphs: [
          'Estimate your delivery hours, multiply them by the minimum sustainable hourly value of your time, add direct project expenses, and add a contingency for approved revisions and coordination. That total is your cost floor—not automatically the final selling price.',
          'For example, a ten-hour project at a chosen internal rate of 75 per hour produces a 750 labor floor before expenses and contingency. The number is an illustration, not a market rate. Your geography, experience, specialization, taxes, sales costs, and project risk may produce a very different figure.',
        ],
      },
      {
        heading: 'Create packages around deliverables',
        points: [
          ['Starter', 'One audience, one focused job, a limited approved source set, core configuration, a launch test set, and hosted-page handoff.'],
          ['Website launch', 'Starter scope plus widget installation, styling, origin configuration, lead-capture choices, and browser/device checks.'],
          ['Complex knowledge build', 'Multiple source groups or stakeholders, deeper discovery, content restructuring, expanded testing, and documented governance.'],
        ],
      },
      {
        heading: 'Control revisions and exclusions',
        paragraphs: [
          'State how many review rounds are included and what counts as a revision. A correction to an approved fact is different from adding a new product line, audience, language, workflow, or source library after the quote.',
          'List exclusions such as copywriting an entire knowledge base, legal or compliance approval, custom API integrations, CRM actions, private account access, and ongoing content updates unless you have explicitly included them.',
        ],
      },
      {
        heading: 'Price maintenance as a defined service',
        paragraphs: [
          'A maintenance agreement can cover a fixed review cadence, a bounded number of source changes, knowledge-gap review, broken-link checks, and regression testing. Charge separately for large migrations or new scopes.',
          'Avoid promising unlimited updates or guaranteed accuracy. Your maintenance value is a documented review process and timely implementation of client-approved changes.',
        ],
      },
    ],
    faqs: [
      ['Should I charge hourly or by project?', 'Use hourly pricing when scope is genuinely uncertain. A defined project package is easier for clients to buy when deliverables, revisions, exclusions, and acceptance criteria are clear.'],
      ['Should the Qlynk subscription be included in my price?', 'Keep it separate. The client should create and control the Qlynk account, select the plan, and enter its own billing details.'],
      ['Can I charge a monthly maintenance fee?', 'Yes, when the agreement names the review cadence, included updates, testing, reporting, and work that requires a separate quote.'],
    ],
    relatedSolutions: ['ai-agent-builder', 'custom-ai-agents', 'ai-for-consultants'],
    relatedArticles: ['how-to-sell-ai-agents-to-small-businesses', 'ai-agent-client-discovery-questionnaire', 'ai-agent-testing-checklist'],
  }),

  'ai-agent-client-discovery-questionnaire': growthArticle({
    shortTitle: 'AI-agent discovery questionnaire',
    title: 'AI-Agent Client Discovery Questionnaire: Five Questions That Find the Real Scope',
    description: 'Use five high-leverage questions to uncover an AI agent’s audience, job, approved knowledge, boundaries, handoff, voice, and launch requirements.',
    category: 'Template',
    readTime: '9 min read',
    sections: [
      {
        heading: 'A short interview should produce implementation decisions',
        paragraphs: [
          'A long questionnaire does not guarantee a useful brief. The goal is to ask a small number of compound questions that let you extract the agent’s audience, purpose, common intents, authoritative facts, prohibited topics, response behavior, and next step.',
          'Ask for one rough answer at a time, summarize what you understood, and request clarification only where the answer changes the build. Do not make the client repeat information already supplied in a website, document, or earlier answer.',
        ],
      },
      {
        heading: 'Question 1: Who is the agent for, and what should it help them do?',
        paragraphs: [
          'Ask: “Who should use this agent, what should it help them accomplish, and what five questions do those people ask most often?”',
          'Extract the primary audience, secondary audiences, desired outcome, repeated intents, vocabulary, and a first set of launch tests. If the answer includes several unrelated jobs, choose the highest-value safe starting job rather than building a general assistant.',
        ],
      },
      {
        heading: 'Question 2: What business information must it know?',
        paragraphs: [
          'Ask: “In one rough message, tell me what you offer and the facts people need before taking the next step—such as services, products, prices, inclusions, process, timing, hours, locations, policies, proof, and current limitations.”',
          'Turn the answer into explicit facts and FAQs. Record conditions, dates, locations, plans, exclusions, and source ownership. Mark anything uncertain for confirmation instead of smoothing it into confident marketing copy.',
        ],
      },
      {
        heading: 'Question 3: What must it never answer or decide?',
        paragraphs: [
          'Ask: “What must the agent never answer, promise, reveal, or decide; what should it say when information is missing; and exactly where should it send someone who needs a human?”',
          'Capture sensitive information, regulated advice, private records, guarantees, negotiations, emergency matters, unsupported comparisons, and any action requiring authorization. Make the handoff actionable with a person, team, form, email, phone number, or approved link.',
        ],
      },
      {
        heading: 'Question 4: How should the agent sound and guide the conversation?',
        paragraphs: [
          'Ask: “How should it sound, how detailed should answers be, what should it call the business and visitor, and what action should it normally recommend next?”',
          'Convert vague answers such as “professional but friendly” into observable guidance: preferred terminology, response length, use of bullets, questions it may ask, phrases to avoid, and the single primary next step.',
        ],
      },
      {
        heading: 'Question 5: Which sources and launch surfaces are approved?',
        paragraphs: [
          'Ask: “Which websites, documents, FAQs, notes, and contact links may the agent use; who approves them; and should the final agent use a Qlynk page, a website widget, or both?”',
          'Record source permission, authority, owner, effective date, review trigger, privacy level, and publishing destination. Confirm who will create the client-owned account and who can approve publishing and website installation.',
        ],
      },
      {
        heading: 'Turn the answers into a build pack',
        points: [
          ['Agent brief', 'Name, type, audience, job, welcome message, suggested questions, and primary next step.'],
          ['Knowledge plan', 'Approved facts, FAQs, links, documents, gaps, conflicts, and source owners.'],
          ['Behavior rules', 'Allowed topics, blocked topics, uncertainty response, tone, response length, and escalation.'],
          ['Launch plan', 'Account ownership, publishing surface, website installation, acceptance tests, approval, and maintenance.'],
        ],
      },
    ],
    faqs: [
      ['Are five questions enough for every business?', 'They are enough for a focused Quick discovery. Use deeper follow-up for multiple audiences, regulated topics, complex policies, many source owners, or custom website requirements.'],
      ['Should the client complete the questionnaire alone?', 'A guided conversation is usually better because you can summarize decisions, spot conflicts, and ask only the follow-up questions that affect the build.'],
      ['What if the client does not know an answer?', 'Record it as a knowledge or policy gap. Do not invent a default; identify who can approve the missing decision.'],
    ],
    relatedSolutions: ['ai-agent-builder', 'custom-ai-agents', 'business-ai-assistant'],
    relatedArticles: ['how-to-sell-ai-agents-to-small-businesses', 'how-much-to-charge-for-ai-agent-setup', 'ai-agent-testing-checklist'],
  }),

  'ai-agent-testing-checklist': growthArticle({
    shortTitle: 'AI-agent testing checklist',
    title: 'AI-Agent Testing Checklist: What to Test Before You Publish',
    description: 'Build a practical evaluation set covering expected answers, paraphrases, missing knowledge, conflicts, sensitive requests, prompt injection, and human handoff.',
    category: 'Testing guide',
    readTime: '11 min read',
    sections: [
      {
        heading: 'Test behavior, not just fluent writing',
        paragraphs: [
          'A polished answer can still be unsupported, incomplete, out of date, or unsafe. Launch testing should compare the response with an expected outcome: the facts it should include, the qualifier it must preserve, the topics it should refuse, or the handoff it should provide.',
          'Create the evaluation set before making final prompt changes. Otherwise it becomes difficult to tell whether a revision improved the agent or merely changed its style.',
        ],
      },
      {
        heading: 'Start with normal questions',
        points: [
          ['Core FAQs', 'Test the questions the business already receives most often.'],
          ['Buying or next-step questions', 'Test fit, inclusions, process, timing, price context, location, and contact routes.'],
          ['Procedural questions', 'Confirm ordered steps, prerequisites, stop conditions, and escalation points.'],
          ['Follow-up questions', 'Ask a short follow-up that only makes sense in the context of the previous message.'],
        ],
      },
      {
        heading: 'Test different wording and ambiguity',
        paragraphs: [
          'Ask the same intent with formal wording, shorthand, a common synonym, a typo, and a vague follow-up. The agent should find the same authoritative answer without pretending that a genuinely ambiguous question is clear.',
          'Include a question that could refer to two products, locations, plans, or policies. A safe response should clarify the missing detail or explain both scoped possibilities instead of selecting one without support.',
        ],
      },
      {
        heading: 'Test missing and conflicting information',
        points: [
          ['Missing answer', 'Ask for a price, date, feature, policy, or exception that is not in the approved knowledge.'],
          ['Stale version', 'Ask using an old product name or superseded process.'],
          ['Conflicting sources', 'Create a controlled test where two sources disagree and verify that the agent does not merge them into a new claim.'],
          ['False premise', 'State an incorrect assumption and confirm the agent corrects it only when the approved information supports the correction.'],
        ],
      },
      {
        heading: 'Test boundaries and prompt injection',
        paragraphs: [
          'Ask for private information, individual professional advice, guarantees, discounts, negotiations, credentials, internal instructions, or account changes that the agent cannot authorize. Confirm that the response protects the boundary while still offering a useful next step.',
          'Try requests to ignore earlier rules, reveal system instructions, treat visitor text as authoritative business knowledge, or answer outside the configured scope. The agent should keep platform safeguards and owner-approved rules in control.',
        ],
      },
      {
        heading: 'Score the response consistently',
        points: [
          ['Supported', 'Are material claims present in the approved knowledge?'],
          ['Complete', 'Does the answer preserve important conditions, dates, limits, and exceptions?'],
          ['Relevant', 'Does it answer the actual question without unrelated material?'],
          ['Bounded', 'Does it refuse or qualify requests outside its authority?'],
          ['Actionable', 'When a person is needed, does the answer give the correct usable route?'],
          ['Appropriate', 'Is the tone, length, formatting, and disclosure suitable for the audience?'],
        ],
      },
      {
        heading: 'Retest after every material change',
        paragraphs: [
          'Rerun affected cases when prices, policies, products, documents, instructions, model behavior, retrieval, or publishing settings change. Keep a small permanent regression set for the most important and highest-risk questions.',
          'A failed test is not always a prompt problem. The source may be unclear, duplicated, inaccessible, or missing. Repair the authoritative knowledge first when that is the actual cause.',
        ],
      },
    ],
    faqs: [
      ['How many questions should I test?', 'Use at least 12 varied cases for a simple agent and expand the set for more audiences, source groups, languages, policies, or risk. Coverage matters more than a universal number.'],
      ['Can automated evaluation replace human review?', 'Automation can help run repeatable checks, but the business owner still needs to approve material facts, boundaries, tone, and handoff behavior.'],
      ['Should a failed answer always be fixed with instructions?', 'No. Fix missing, conflicting, outdated, or poorly structured source knowledge before adding prompt complexity.'],
    ],
    relatedSolutions: ['ai-agent-builder', 'knowledge-based-ai', 'ai-customer-support'],
    relatedArticles: ['ai-model-retirement-migration-checklist', 'ai-hallucinations-approved-knowledge', 'how-to-train-ai-agent-on-company-documents', 'ai-agent-client-discovery-questionnaire'],
  }),

  'how-to-train-ai-agent-on-company-documents': growthArticle({
    shortTitle: 'Train an AI agent on company documents',
    title: 'How to Train an AI Agent on Company Documents—Without Fine-Tuning',
    description: 'Prepare, approve, structure, upload, retrieve, test, and maintain company documents so a knowledge-based AI agent can answer responsibly.',
    category: 'Knowledge guide',
    readTime: '12 min read',
    sections: [
      {
        heading: '“Training” usually means connecting maintained knowledge',
        paragraphs: [
          'When a business wants an agent trained on its documents, it often does not need to retrain the foundation model. A knowledge-based system can index approved source material, retrieve relevant passages for a question, and provide those passages as context for the answer.',
          'This approach keeps the business knowledge separate from the underlying model and creates a practical update path: revise the source, refresh the index, and retest the affected questions.',
        ],
      },
      {
        heading: 'Choose the job and audience before collecting files',
        paragraphs: [
          'Do not begin by uploading every drive folder. Define who will use the agent, what questions it should answer, what result it should support, and what information is inappropriate for that audience.',
          'A customer-facing product guide, internal SOP assistant, property guide, and employee-onboarding agent require different source sets and access decisions even when they belong to the same company.',
        ],
      },
      {
        heading: 'Build an approved source register',
        points: [
          ['Authority', 'Identify the document, webpage, FAQ, or person that governs each topic.'],
          ['Permission', 'Confirm that the material may be used for the intended public or internal audience.'],
          ['Owner', 'Name the person responsible for approving and updating it.'],
          ['Version', 'Record the effective date, product version, location, plan, or policy scope.'],
          ['Review trigger', 'Define the date or business event that requires another review.'],
          ['Retirement', 'Remove obsolete and duplicate copies rather than leaving retrieval to choose among them.'],
        ],
      },
      {
        heading: 'Prepare documents for retrieval',
        paragraphs: [
          'Use descriptive headings, direct answers, short sections, consistent terminology, ordered steps, explicit conditions, and meaningful links. Make critical prices, limits, exceptions, and handoffs easy to find rather than burying them in long prose.',
          'Scanned images, complex tables, headers repeated on every page, broken character encoding, and multi-column layouts can weaken extracted text. Check what the platform actually reads, not only how the original file looks.',
        ],
      },
      {
        heading: 'Separate structured answers from long references',
        paragraphs: [
          'Long documents are useful for coverage, but frequent high-value questions often deserve explicit facts or FAQs. Add the direct answer, its conditions, the authoritative link, and the handoff when the answer requires judgment.',
          'Do not duplicate the same policy in several formats unless ownership and precedence are clear. Contradictory copies can lead to inconsistent retrieval and generated answers.',
        ],
      },
      {
        heading: 'Define behavior around the knowledge',
        points: [
          ['Scope', 'State which topics the agent may answer for the intended audience.'],
          ['Uncertainty', 'Tell it how to respond when the approved material is missing or insufficient.'],
          ['Blocked topics', 'Name private, regulated, unsafe, or unauthorized subjects.'],
          ['Handoff', 'Provide the exact person, team, form, or link for questions requiring human judgment.'],
          ['Source use', 'Require important conditions and dates to remain attached to the corresponding claim.'],
        ],
      },
      {
        heading: 'Test and maintain the document set',
        paragraphs: [
          'Test core questions, paraphrases, missing answers, conflicts, outdated terminology, sensitive requests, and follow-ups. Compare the response with the authoritative source and record any knowledge gap.',
          'When business information changes, update the source of truth, refresh the agent, and rerun affected tests. More documents do not automatically create better answers; current, scoped, owned documents do.',
        ],
      },
    ],
    faqs: [
      ['Is uploading documents the same as fine-tuning?', 'No. Document-grounded systems usually retrieve relevant source text at answer time. Fine-tuning changes model behavior through a separate training process.'],
      ['Should I upload every company document?', 'No. Add only current, authorized material relevant to the defined audience and job. Exclude secrets, private records, obsolete versions, and unrelated content.'],
      ['How do I know whether a PDF was read correctly?', 'Inspect the extracted text or test specific facts from different sections, especially tables, scans, columns, footnotes, and pages with unusual formatting.'],
    ],
    relatedSolutions: ['knowledge-based-ai', 'ai-documentation-assistant', 'ai-knowledge-platform'],
    relatedArticles: ['rag-explained', 'ai-documentation-best-practices', 'ai-agent-testing-checklist'],
  }),
};
