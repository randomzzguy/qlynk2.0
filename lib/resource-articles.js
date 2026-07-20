export const resourceArticles = {
  'what-is-an-ai-clone': {
    shortTitle: 'What is an AI clone?',
    title: 'What Is an AI Clone—and What Should It Actually Do?',
    description: 'A practical explanation of personal AI agents, the information behind them, the limits they need, and the jobs they can handle well.',
    category: 'Guide',
    readTime: '6 min read',
    sections: [
      {
        heading: 'A useful definition',
        paragraphs: ['An AI clone is a conversational AI representative built from information a person chooses to provide. The term “clone” can sound broader than the product should be: a responsible agent does not copy a person’s identity, make decisions on their behalf, or pretend that every answer came directly from them.', 'In Qlynk, the more precise product is a focused personal AI agent. It helps visitors understand someone’s work, experience, services, or public knowledge within an owner-defined scope.'],
      },
      {
        heading: 'What goes into it',
        points: [
          ['Approved knowledge', 'Profile context, capabilities, projects, facts, FAQs, links, custom notes, and supported documents.'],
          ['A defined job', 'Who the agent helps, which repeated questions it should answer, and what a useful response looks like.'],
          ['Clear limits', 'Allowed topics, blocked topics, do and don’t rules, uncertainty handling, and a human escalation path.'],
          ['A public experience', 'A name, introduction, visual style, suggested questions, and a shareable Qlynk link.'],
        ],
      },
      {
        heading: 'What it is good at',
        paragraphs: ['A focused agent is most useful when the questions are recurring and the answers can be grounded in information you maintain. It can explain a service, give context about a project, guide someone to the right resource, answer property questions, clarify a product, or help a team find an approved procedure.'],
      },
      {
        heading: 'What it should not do',
        paragraphs: ['It should not invent facts, expose private information, become a general-purpose assistant, make high-stakes decisions, or impersonate its owner. When the answer is missing, sensitive, uncertain, or outside the configured job, the best response is a clear limitation and an appropriate human handoff.'],
      },
      {
        heading: 'How it improves',
        paragraphs: ['The first version does not need every possible answer. Publish a reviewed starting point, observe the questions people ask, inspect unanswered or weak conversations, and add only the knowledge that belongs in the agent. The result becomes more useful through deliberate maintenance—not by making the agent less controlled.'],
      },
    ],
  },
  'how-to-create-ai-clone': {
    shortTitle: 'How to create an AI agent',
    title: 'How to Create an AI Agent That Gives Useful, Controlled Answers',
    description: 'A step-by-step process for turning repeated questions and approved information into a focused Qlynk Agent.',
    category: 'Tutorial',
    readTime: '7 min read',
    sections: [
      {
        heading: '1. Start with the repeated question',
        paragraphs: ['Write down the questions you answer again and again. A narrow, familiar job—explaining services, guiding guests, answering product FAQs, or clarifying a process—is a stronger starting point than “answer anything.”'],
      },
      {
        heading: '2. Choose the agent type and audience',
        paragraphs: ['Select the closest role: Personal AI, Business, Property, Operations, Product, Support, or Custom Guide. Then identify who will ask the questions and what they should be able to accomplish.'],
      },
      {
        heading: '3. Define scope before adding content',
        points: [
          ['Purpose', 'Describe the job in one or two sentences.'],
          ['Allowed topics', 'List the subjects that belong in the conversation.'],
          ['Blocked topics', 'Name anything the agent should not discuss.'],
          ['Human handoff', 'Explain when and how the visitor should contact a person.'],
        ],
      },
      {
        heading: '4. Add the answers',
        paragraphs: ['Add facts, FAQs, links, profile context, and supported documents that directly support the job. Review each source first. Do not upload passwords, access codes, private customer information, or material you are not allowed to use.'],
      },
      {
        heading: '5. Configure identity and behavior',
        paragraphs: ['Choose a clear agent name, welcome message, tone, response length, colors, and suggested questions. Make it obvious that visitors are speaking with an AI representative, not the person or team itself.'],
      },
      {
        heading: '6. Test the edges, not just the happy path',
        paragraphs: ['Ask expected questions, vague questions, out-of-scope questions, blocked questions, and questions whose answer is missing. Confirm that the agent stays grounded, admits uncertainty, and uses the intended handoff.'],
      },
      {
        heading: '7. Publish and maintain it',
        paragraphs: ['Share the Qlynk link where people already look for answers. Review conversations, correct outdated knowledge, and use knowledge gaps to decide what to add next. A trustworthy agent is maintained like any other source of public information.'],
      },
    ],
  },
  'ai-clone-vs-chatbot': {
    shortTitle: 'AI agent vs chatbot',
    title: 'AI Agent vs Chatbot: The Useful Difference Is the Job',
    description: 'Modern chatbots can use the same underlying AI models. What matters is the audience, knowledge, scope, ownership, and handoff designed around the experience.',
    category: 'Comparison',
    readTime: '6 min read',
    sections: [
      {
        heading: 'The labels overlap',
        paragraphs: ['“Chatbot” describes a conversational interface. Some chatbots follow simple scripted flows; others use modern language models and connected knowledge. “AI clone” usually describes a personal AI representative. Neither label alone tells you whether the experience is accurate, safe, or useful.'],
      },
      {
        heading: 'Compare the product design',
        points: [
          ['Job', 'Is it handling one defined task, or trying to answer anything?'],
          ['Knowledge', 'Does it answer from maintained, approved sources?'],
          ['Audience', 'Is it designed for customers, guests, teammates, visitors, or another specific group?'],
          ['Boundaries', 'Can the owner define blocked topics, uncertainty behavior, and human escalation?'],
          ['Improvement loop', 'Can the owner review real conversations and fill the gaps people expose?'],
        ],
      },
      {
        heading: 'When a simple chatbot is enough',
        paragraphs: ['A scripted flow can be the right choice for a small set of predictable actions, such as routing a support request, collecting a few fields, or linking to known resources. It is easier to test because the possible paths are limited.'],
      },
      {
        heading: 'When a focused AI agent helps',
        paragraphs: ['A focused agent is useful when people ask the same subject in many different ways and need answers assembled from a maintained body of knowledge. The flexibility is valuable, but it makes source quality, scope controls, testing, and escalation more important.'],
      },
      {
        heading: 'The practical question',
        paragraphs: ['Do not choose based on which label sounds newer. Choose the smallest system that can answer the real questions reliably, keep sensitive information out, and send the conversation to a person when judgment is required.'],
      },
    ],
  },
  'ai-clone-vs-chatgpt': {
    shortTitle: 'Personal AI vs ChatGPT',
    title: 'Personal AI vs ChatGPT: Who Is the Assistant For?',
    description: 'A personal AI agent and a general-purpose assistant can use similar technology, but they serve different users, knowledge, and goals.',
    category: 'Comparison',
    readTime: '5 min read',
    sections: [
      {
        heading: 'The shortest answer',
        paragraphs: ['Use a general-purpose assistant when you want help doing your own work across many topics. Use a focused personal AI when you want other people to explore information you have chosen to publish about your work, expertise, services, or process.'],
      },
      {
        heading: 'The main differences',
        points: [
          ['Primary user', 'A general assistant helps the person prompting it; a published personal AI helps that person’s visitors.'],
          ['Knowledge', 'A general assistant draws on broad model knowledge and supplied context; a Qlynk Agent is instructed to answer within approved owner knowledge and scope.'],
          ['Purpose', 'A general assistant handles many tasks; a Qlynk Agent is configured for one person, business, property, operation, product, support workflow, or custom job.'],
          ['Publishing', 'A Qlynk Agent has a public link, identity, welcome message, suggested questions, colors, and visitor experience.'],
          ['Feedback', 'Qlynk lets the owner review conversations and knowledge gaps to improve what visitors can learn.'],
        ],
      },
      {
        heading: 'They can complement each other',
        paragraphs: ['A general assistant can help you draft an FAQ, organize a procedure, or identify missing explanations. After human review, the approved result can become part of a focused Qlynk knowledge base. One tool helps create and think; the other helps publish and answer within a controlled job.'],
      },
      {
        heading: 'Keep the responsibility clear',
        paragraphs: ['Neither product removes the need to review important information. A public agent should identify itself as AI, avoid unsupported claims, protect private data, and hand off questions that require human judgment, authorization, or current confirmation.'],
      },
    ],
  },
};
