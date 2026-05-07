# Q-Agent: AI-Powered Chat Widget

## Overview

Q-Agent is an AI-powered chatbot feature for Qlynk that allows users to create intelligent assistants powered by Groq LLM. Each user can configure their own agent with personalized knowledge, branding, and appearance settings.

## Features

### 1. **Agent Configuration Dashboard**
- Located at `/dashboard/agent`
- Configure agent name, welcome message, and avatar
- Set primary color for the chat widget UI
- Choose chat widget position (bottom-right, bottom-left, top-right, top-left)
- Enable/disable the agent

### 2. **Knowledge Base Management**
Users can populate the agent's knowledge base through two methods:

#### Form-Based Input
- **Bio**: Personal or business background
- **Skills**: Professional skills with proficiency levels
- **Projects**: Past or current projects with descriptions and URLs
- **Contact Information**: Email, phone, location, website, and Calendly link
- **Social Links**: Links to social media profiles
- **Custom Knowledge**: Additional information in free text format

#### Document Upload
- Located at `/dashboard/agent/documents`
- Supported formats: PDF, TXT, MD, DOC, DOCX
- Documents are processed and embedded in the agent's context
- Extracted text is used to enhance responses

### 3. **Chat Widget**
- Floating chat bubble appears on user pages at `/:username`
- Only displays if agent is enabled
- Real-time streaming responses using Groq
- Customizable color and position
- Shows visitor messages and agent responses
- Tracks conversation for analytics

### 4. **Analytics**
- Enhanced analytics dashboard at `/dashboard/analytics`
- Track total conversations and messages
- View average messages per conversation
- Filter conversations by date and status
- View full conversation transcripts
- Track visitor engagement

## Technical Architecture

### Database Schema

#### `agent_configs` Table
Stores AI agent configuration for each user
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- agent_name (TEXT)
- agent_avatar (TEXT, URL to avatar image)
- welcome_message (TEXT)
- bio (TEXT)
- skills (JSONB, Array)
- projects (JSONB, Array)
- contact_info (JSONB, Object)
- social_links (JSONB, Array)
- custom_knowledge (TEXT)
- primary_color (TEXT, Hex color)
- position (TEXT, Widget position)
- is_enabled (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `agent_documents` Table
Stores uploaded knowledge base documents
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- filename (TEXT)
- file_type (TEXT)
- file_size (INTEGER)
- storage_path (TEXT)
- extracted_text (TEXT)
- is_processed (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### `agent_conversations` Table
Tracks visitor conversations
```sql
- id (UUID, Primary Key)
- agent_owner_id (UUID, Foreign Key)
- visitor_id (TEXT, Unique visitor identifier)
- visitor_ip (TEXT)
- visitor_location (TEXT)
- visitor_device (TEXT)
- started_at, ended_at (TIMESTAMPTZ)
- message_count (INTEGER)
- sentiment (TEXT)
```

#### `agent_messages` Table
Individual chat messages
```sql
- id (UUID, Primary Key)
- conversation_id (UUID, Foreign Key)
- role (TEXT: 'user' or 'assistant')
- content (TEXT)
- created_at (TIMESTAMPTZ)
```

#### `user_trials` Table
Free trial tracking
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key, Unique)
- trial_started_at (TIMESTAMPTZ)
- trial_ends_at (TIMESTAMPTZ)
- is_active (BOOLEAN)
```

### API Routes

#### `POST /api/chat`
Main chat endpoint using AI SDK 6 with Groq
- Accepts messages in UIMessage format from `@ai-sdk/react`
- Returns streaming responses via SSE
- Handles conversation creation and message logging
- Builds system prompt from agent config + documents

**Request Body:**
```json
{
  "messages": [...],        // UIMessage array from useChat
  "username": "string",     // Target user's username
  "conversationId": "uuid", // Optional, creates new if not provided
  "visitorId": "uuid"       // Unique visitor identifier
}
```

### Components

#### `ChatWidget.jsx`
Floating chat widget component
- Props: `username`, `agentName`, `agentAvatar`, `welcomeMessage`, `primaryColor`, `position`
- Manages chat state with `useChat` hook from `@ai-sdk/react`
- Handles message sending and streaming responses
- Stores visitor ID in localStorage

#### `AgentConfigPage.jsx`
Agent configuration dashboard (`/dashboard/agent`)
- Forms for all agent settings
- Save/update agent configuration
- Preview agent widget
- Enable/disable agent
- Live preview with color picker

#### `DocumentsPage.jsx`
Document management (`/dashboard/agent/documents`)
- Drag-and-drop file upload
- Display uploaded documents
- Delete documents
- Track processing status

### Libraries

- **AI SDK 6**: `/ai`, `@ai-sdk/react` for LLM interactions
- **Groq**: `@ai-sdk/groq` for fast LLM inference
- **Supabase**: `@supabase/supabase-js` for database and auth
- **React**: `useChat` hook from `@ai-sdk/react` for chat UI
- **Icons**: `lucide-react` for UI icons

## Usage Flow

### Setting Up Q-Agent

1. **User Signs Up/Logs In**
   - Automatically gets a 14-day trial
   - `user_trials` table tracks trial status

2. **Navigate to Q-Agent Dashboard**
   - Go to `/dashboard/agent`
   - Fill in personal information (bio, skills, projects, etc.)
   - Upload avatar image
   - Customize colors and position
   - Save configuration

3. **Upload Knowledge Documents** (Optional)
   - Go to `/dashboard/agent/documents`
   - Upload PDF, DOCX, or text files
   - Documents are extracted and embedded in context

4. **Enable Agent**
   - Toggle `is_enabled` on the configuration page
   - Agent appears on their public page

5. **Monitor Analytics**
   - Go to `/dashboard/analytics`
   - View conversations and messages
   - Read conversation transcripts

### Visitor Interaction

1. **Visit Public Page**
   - Go to `qlynk.site/:username`
   - Chat widget appears if agent is enabled

2. **Start Chat**
   - Click the floating chat bubble
   - Widget opens with welcome message
   - Visitor can type messages

3. **Get AI Responses**
   - Agent responds based on configured knowledge
   - Conversation is tracked and logged
   - Messages are streamed in real-time

## System Prompt Generation

The agent's system prompt is dynamically built from:

1. **Agent Identity**
   - Agent name and role

2. **Knowledge Sections** (in order)
   - Bio/Background
   - Skills
   - Projects
   - Contact Information
   - Social Links
   - Custom Knowledge
   - Uploaded Documents

3. **Behavior Guidelines**
   - Stay professional
   - Answer enthusiastically
   - Never make up information
   - Provide contact details when asked

## Free Trial System

- New users automatically get 14-day trial
- Triggered by database trigger on user creation
- Trial extends to `NOW() + INTERVAL '14 days'`
- Can be upgraded to paid plan (payments deferred for now)

## Future Enhancements

1. **Payment Integration** (Stripe/LemonSqueezy)
   - Implement monthly subscription after trial
   - Usage-based pricing for API calls

2. **Advanced Analytics**
   - Sentiment analysis per conversation
   - Visitor engagement heatmaps
   - Response quality metrics

3. **Multi-Agent Support**
   - Allow multiple agents per user
   - Different agents for different purposes

4. **Custom Integration**
   - Connect to external APIs
   - Tools for web search, calendar booking, etc.

5. **Agent Training**
   - Fine-tuning with user feedback
   - Conversation quality improvements
   - Performance tracking

## Troubleshooting

### Widget Not Appearing
- Verify agent is enabled in configuration
- Check if agent_configs record exists
- Ensure user is not in trial-blocked state

### Chat Not Working
- Verify GROQ_API_KEY environment variable is set
- Check Supabase connection and RLS policies
- Verify conversation record exists in database

### Messages Not Saving
- Check RLS policies on agent_messages table
- Ensure conversation_id is valid
- Verify user has write permissions to tables

## Environment Variables

```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## Security Considerations

- **RLS Policies**: All tables have Row Level Security enabled
- **Agent Visibility**: Public read for enabled agents
- **Message Privacy**: Users can only see their own conversations
- **Document Handling**: User documents only accessible to their agent
