export const marketingPages = {
  'ai-clone': {
    eyebrow: 'AI Clone',
    title: 'Create an AI Version of Your Knowledge—Not a Pretend Version of You',
    description: 'Build a clearly identified AI representative that answers from the professional information, examples, and limits you choose.',
    definition: 'In Qlynk, an “AI clone” means a focused personal AI agent. It can explain what you know and what you do, but it does not claim to be you, make decisions for you, or use information you have not approved.',
    benefits: [
      ['Choose the repeated questions', 'Start with the things people regularly ask about your work, experience, services, or process.'],
      ['Provide the approved answers', 'Add profile context, facts, FAQs, links, examples, and supported documents you want it to use.'],
      ['Set the handoff', 'Tell the agent what is out of scope and where visitors should go when a person needs to step in.'],
    ],
  },
  'personal-ai': {
    eyebrow: 'Personal AI',
    title: 'Make What You Know Available Through One Simple Link',
    description: 'Turn the professional knowledge you choose to share into a focused AI agent that visitors can ask directly.',
    definition: 'A Qlynk Personal AI is built around one person’s approved professional context. It helps visitors understand that person’s work without becoming an unrestricted assistant or pretending to speak with human authority.',
    benefits: [
      ['Organize your context', 'Bring together your background, capabilities, projects, links, facts, FAQs, and relevant documents.'],
      ['Choose how it responds', 'Set the agent’s purpose, audience, topics, tone, response length, uncertainty message, and escalation path.'],
      ['Learn what people ask', 'Review conversations and knowledge gaps so the information becomes more useful over time.'],
    ],
  },
  'ai-agent': {
    eyebrow: 'AI Agent Platform',
    title: 'Build an AI Agent That Understands the Question in Context',
    description: 'Create a focused agent that follows the conversation, finds relevant approved knowledge, and gives natural answers on your Qlynk page or existing website.',
    definition: 'A Qlynk Agent is a conversational guide that uses trusted conversation context and owner-approved knowledge within a defined purpose and set of boundaries. It is designed for a specific job, not open-ended general assistance.',
    benefits: [
      ['Understand follow-up questions', 'Use trusted recent conversation context to make sense of what a visitor asks next.'],
      ['Find the relevant knowledge', 'Select approved facts, FAQs, links, and documents that best match the question.'],
      ['Publish anywhere', 'Share a qlynk.site/username page or embed the same agent on an existing website.'],
    ],
  },
  'digital-twin': {
    eyebrow: 'Digital Twin',
    title: 'A Conversational Digital Twin Built From What You Choose to Share',
    description: 'Create a professional AI representative that makes selected knowledge easier to explore while staying clearly identified as AI.',
    definition: 'Qlynk uses “digital twin” as another way to describe a focused personal AI representative. It reflects approved professional context; it is not a human replacement, identity copy, or permission to impersonate someone.',
    benefits: [
      ['Represent useful context', 'Add the experience, work, examples, and answers visitors actually need.'],
      ['Keep the boundaries visible', 'Control its scope, behavior, knowledge, and handoff instead of giving it unrestricted instructions.'],
      ['Share a consistent destination', 'Use one Qlynk link wherever people already discover your work.'],
    ],
  },
};

export const featurePages = {
  'ai-training': {
    title: 'Choose What Your Agent Knows and How It Responds',
    description: 'Build the agent from approved context, facts, FAQs, links, documents, and response settings you control.',
    points: ['Add only information you want the agent to use', 'Set identity, tone, welcome message, and response length', 'Update the knowledge whenever the source information changes'],
  },
  'knowledge-base': {
    title: 'Keep the Answers in One Controlled Knowledge Base',
    description: 'Organize the information behind your agent so repeated questions have a clear, maintainable source.',
    points: ['Store profile context, facts, FAQs, links, and supported documents', 'Separate knowledge by source and remove anything that should no longer be used', 'Review knowledge gaps revealed by real conversations'],
  },
  'website-widget': {
    title: 'Embed Your AI Agent on an Existing Website',
    description: 'Add the same focused Qlynk Agent to your website with one hosted script and installation-level controls.',
    points: ['Restrict each installation to exact allowed website origins', 'Choose the launcher side and color, with an optional pre-chat form', 'Disable an installation or update its settings without replacing the embed code'],
  },
  analytics: {
    title: 'See Which Questions People Actually Ask',
    description: 'Use conversation and engagement signals to understand what visitors need and where your information is still unclear.',
    points: ['Review conversations and visitor trends', 'Identify popular topics and recurring questions', 'Use knowledge gaps to decide what to improve next'],
  },
  integrations: {
    title: 'Share One Agent Wherever People Find You',
    description: 'Connect visitors to the same Qlynk Agent through a changeable public URL, an embedded website widget, and the links you configure.',
    points: ['Share your qlynk.site/username link and change the username once every 30 days', 'Add your own contact, booking, portfolio, and social destinations', 'Embed the agent with an installation-specific script and allowed-origin controls'],
  },
  security: {
    title: 'Set the Scope, Limits, and Human Handoff',
    description: 'Define what the agent is for, which questions it may answer, what it should refuse, and when a person should step in.',
    points: ['Set purpose, audience, allowed topics, and blocked topics', 'Configure do and don’t rules, uncertainty handling, and escalation', 'Manage the agent from an authenticated dashboard with platform safeguards'],
  },
};
