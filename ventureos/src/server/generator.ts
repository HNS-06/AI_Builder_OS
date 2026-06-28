import { GoogleGenAI } from "@google/genai";

interface ProjectAgent {
  name: string;
  status: "waiting" | "active" | "completed";
  output: string;
}

interface Project {
  id: string;
  idea: string;
  status: "incubating" | "completed" | "failed";
  agents: ProjectAgent[];
}

// In-memory project store
export const projectStore: Record<string, Project> = {};

export async function runVentureOSGenerator(
  project: Project,
  onChunk: (agentName: string, chunk: string, isDone: boolean) => void,
  onStatusChange: (agentName: string, status: "waiting" | "active" | "completed") => void
) {
  const idea = project.idea;
  const apiKey = process.env.GEMINI_API_KEY;

  const agentPrompts: { [key: string]: string } = {
    "Venture Planner": `You are an elite Silicon Valley Venture Builder and Partner at VentureOS. 
Analyze the startup idea: "${idea}".
Write a detailed, high-conviction Venture Overview in Markdown format.
Use professional, crisp, and high-agency language (like Linear, Stripe, or Notion documentation).
Include the following sections:
1. **The Core Thesis**: A one-sentence high-agency elevator pitch.
2. **Problem Statement**: What friction exists in the world that makes this inevitable?
3. **The Solution**: How does this platform uniquely solve it with a 10x advantage?
4. **Value Proposition**: A clear 3-bullet breakdown of value for key stakeholders.
5. **Business Model**: How does this capture value? Be specific with pricing tiers or take rates.

Structure it elegantly with clean headings, bullet points, and strong typography. Do not use generic introductions or conversational filler.`,

    "Market Analyst": `You are a world-class Market Analyst.
Perform a rigorous Market Analysis for the startup idea: "${idea}".
Write in professional Markdown format.
Include the following sections:
1. **Market Sizing (TAM, SAM, SOM)**: Provide estimated numbers and justify them with logical benchmarks.
2. **Ideal Customer Profile (ICP)**: Detail exactly who buys this, their pain points, and decision-making drivers.
3. **Competitor Matrix**: Identify 2-3 current players and explain the asymmetric advantage of "${idea}" over them.
4. **Go-To-Market Strategy**: Outline a highly targeted, low-CAC distribution plan (e.g., product-led growth, engineering-as-marketing, cold outbound).

Keep it empirical, logical, and highly practical. Avoid fluffy adjectives.`,

    "Product Architect": `You are a Senior Product Architect at a top-tier SaaS engineering lab.
Design a highly detailed Product MVP Roadmap and technical architecture for: "${idea}".
Write in professional Markdown format.
Include the following sections:
1. **MVP Scope (Core Features)**: List the absolute minimum features required to launch and prove value.
2. **Technical Stack**: Recommend a modern, fast-scaling technical stack (e.g., Next.js, FastAPI, Supabase, PostgreSQL, Tailwind) with specific reasons for each.
3. **User Stories & Flow**: A clean sequence of the user journey from signup to core value realization.
4. **Implementation Phases**: A 3-phase timeline (Weeks 1-2, Weeks 3-4, Weeks 5-6) showing deliverables and milestones.

Make it feel like a real engineering spec sheet that developers can build from today.`,

    "UX Designer": `You are an award-winning Principal Product Designer.
Generate a wireframe layout specification and interaction flow for the main screen of: "${idea}".
Write in Markdown. You MUST include a high-fidelity ASCII wireframe inside a markdown code block to represent the layout.
For example, use panels, boxes, headers, lists, and buttons made of characters like +, -, |, [ ], and =.

Include:
1. **UI Layout Spec**: Break down the visual hierarchy (header, sidebar, main canvas).
2. **High-Fidelity ASCII Wireframe**: Put the ASCII mock inside a \`\`\` text block. Ensure it looks extremely clean and aligned.
3. **Micro-interactions & States**: Detail hover states, loading skeletons, and custom transitions that will elevate the user experience.

Focus on ultra-clean Swiss design principles: heavy grid lines, clear visual rhythm, and minimalist aesthetics.`,

    "Pitch Coach": `You are an elite Pitch Coach who has helped startups raise over $500M.
Generate a high-converting 10-slide Pitch Deck Outline and Landing Page Copy for: "${idea}".
Write in professional Markdown format.
Include:
1. **10-Slide Outline**: For each slide (Title, Problem, Solution, Market Opportunity, Product, Business Model, Competitors, Go-To-Market, Financials, The Ask), provide the Slide Title, Visual Layout recommendation, Core Message, and Key Speaker Notes.
2. **High-Converting Landing Page Copy**: Write the exact copy for a minimalist, premium landing page, including:
   - **Hero Section**: Typographic headline, subheadline, CTA button text.
   - **Feature Grid**: Three core value pillars with headlines and copy.
   - **Pricing Section**: Clear single tier with features listed.
   - **Footer Call to Action**: Final high-agency push.

Make the copy feel expensive, direct, and incredibly compelling.`
  };

  const agentList = project.agents.map(a => a.name);

  // If we have an API key, run real streaming generations
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      for (let i = 0; i < project.agents.length; i++) {
        const agent = project.agents[i];
        
        // Update to active
        onStatusChange(agent.name, "active");
        agent.status = "active";

        const prompt = agentPrompts[agent.name];
        
        try {
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              temperature: 0.7,
            }
          });

          for await (const chunk of responseStream) {
            const chunkText = chunk.text || "";
            if (chunkText) {
              agent.output += chunkText;
              onChunk(agent.name, chunkText, false);
            }
          }
          
          onChunk(agent.name, "", true);
          onStatusChange(agent.name, "completed");
          agent.status = "completed";
        } catch (err: any) {
          console.error(`Error generating for agent ${agent.name}:`, err);
          // Fallback just for this agent in case of rate limit or individual model error
          const fallbackContent = getFallbackContentForAgent(agent.name, idea);
          await streamFallbackText(agent.name, fallbackContent, agent, onChunk);
          onStatusChange(agent.name, "completed");
          agent.status = "completed";
        }
      }

      project.status = "completed";
    } catch (e) {
      console.error("Critical Gemini execution error:", e);
      project.status = "failed";
    }
  } else {
    // FALLBACK ENGINE: High-quality tailored templates streamed over time
    console.log("No Gemini API key found, running premium fallback streaming engine.");
    for (let i = 0; i < project.agents.length; i++) {
      const agent = project.agents[i];
      onStatusChange(agent.name, "active");
      agent.status = "active";

      const content = getFallbackContentForAgent(agent.name, idea);
      await streamFallbackText(agent.name, content, agent, onChunk);

      onStatusChange(agent.name, "completed");
      agent.status = "completed";
    }
    project.status = "completed";
  }
}

// Helper to simulate a typewriter streaming effect
function streamFallbackText(
  agentName: string,
  fullText: string,
  agent: ProjectAgent,
  onChunk: (agentName: string, chunk: string, isDone: boolean) => void
): Promise<void> {
  return new Promise((resolve) => {
    // Stream in chunks of words to make it look realistic and reasonably fast
    const words = fullText.split(" ");
    let index = 0;
    const wordsPerTick = 4; // realistic speed

    const timer = setInterval(() => {
      if (index >= words.length) {
        clearInterval(timer);
        onChunk(agentName, "", true);
        resolve();
        return;
      }

      const chunk = words.slice(index, index + wordsPerTick).join(" ") + " ";
      agent.output += chunk;
      onChunk(agentName, chunk, false);
      index += wordsPerTick;
    }, 45); // highly smooth and responsive
  });
}

function getFallbackContentForAgent(agentName: string, idea: string): string {
  // Title-case the idea for nice templates
  const titleIdea = idea.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  if (agentName === "Venture Planner") {
    return `# Venture Overview — ${titleIdea}

## 1. The Core Thesis
${titleIdea} is a decentralized, high-agency operating platform designed to disrupt traditional industries by providing automated, intelligence-driven orchestration for modern enterprises.

## 2. Problem Statement
Modern businesses are drowning in operational fragmentation. Teams spend 40% of their working hours manually stitching together disparate SaaS tools, compiling status updates, and manually validating administrative data. This operational tax limits scale and leads to systemic human error.

## 3. The Solution
An AI-native automation canvas that operates as an intelligent central hub. By utilizing a highly resilient agentic workflow engine, **${titleIdea}** automatically ingests, structures, and processes complex organizational tasks, turning manual operational workflows into a unified, zero-touch experience.

## 4. Value Proposition
* **90% Overhead Reduction**: Eliminates mechanical administrative overhead entirely.
* **Continuous Execution**: Operates 24/7/365 with automated exceptions handling.
* **Absolute Auditability**: Every operation is logged, structured, and auditable in real-time.

## 5. Business Model
We capture value through a scalable usage-tier structure:
* **Developer Core**: $49/month (Up to 5 autonomous agents, 10,000 steps).
* **Enterprise Custom**: Custom take-rates based on server processing and volume scaling.
`;
  }

  if (agentName === "Market Analyst") {
    return `# Market Analysis — ${titleIdea}

## 1. Market Sizing (TAM, SAM, SOM)
* **Total Addressable Market (TAM)**: $48.5 Billion (global enterprise automation and agentic workflow orchestration market).
* **Serviceable Addressable Market (SAM)**: $12.4 Billion (SMEs and scaling technology startups with highly integrated tech stacks).
* **Serviceable Obtainable Market (SOM)**: $320 Million (early adopters in technical operations, product teams, and digital-first agencies).

## 2. Ideal Customer Profile (ICP)
* **Demographics**: Technical product managers, operation directors, and solo founders scaling on tight budgets.
* **Pain Points**: High headcount expenses for basic data workflows, bottlenecked engineering resources, and slow workflow iteration times.
* **Buying Triggers**: Hiring freezes, database or pipeline migration projects, or rapid user growth requiring automated scaling.

## 3. Competitor Matrix
* **Legacy Integrators (Zapier/Make)**: Highly manual, static trigger-action patterns. No deep contextual understanding or autonomous decision-making.
* **Custom Enterprise Consultancies**: Incredibly expensive ($100k+ contracts), long implementation times, and rigid code structures.
* **Our Advantage**: ${titleIdea} is fully autonomous, self-healing, learns from historic company context, and sets up in minutes rather than months.

## 4. Go-To-Market Strategy
* **Product-Led Growth (PLG)**: Offer a frictionless free-tier allowing solo operators to build their first custom agent and share it on public workspaces.
* **Engineering as Marketing**: Publish open-source workflow connectors and visual templates to capture developer intent on GitHub and Google search.
* **Asymmetric Warm Outreach**: Identify companies currently posting job openings for repetitive operations roles and offer ${titleIdea} as a 10x cheaper alternative.
`;
  }

  if (agentName === "Product Architect") {
    return `# MVP Technical Specification & Roadmap — ${titleIdea}

## 1. MVP Scope & Core Features
The absolute MVP will focus on the single, highest-value workflow:
* **Frictionless Onboarding**: A beautiful, single-screen chat bar to describe any desired workflow in plain English.
* **Visual Canvas**: A node-based interactive board to visualize the structured agent execution steps.
* **Direct Connectors**: Plug-and-play API integrations with standard communication tools (Slack, Gmail, Linear) and data repositories (PostgreSQL, Notion).

## 2. Recommended Technical Stack
* **Frontend**: Next.js 14 (App Router) with Tailwind CSS for high performance and clean styling.
* **Backend**: FastAPI (Python) or Node.js (TypeScript) for optimal asynchronous execution.
* **Database**: PostgreSQL (Supabase) for structured workspace states and fast querying.
* **Vector Store**: pgvector or Pinecone for agent short-term memory and retrieval-augmented generation.

## 3. System Architecture & Flow
\`\`\`
[User UI Canvas] ──(WebSockets)──> [Express / FastAPI Server]
                                           │
                                  [Agent Coordinator]
                                     /     │     \\
                     [Slack Connector] [LLM Engine] [Postgres State]
\`\`\`

## 4. Six-Week Implementation Timeline
* **Weeks 1-2 (Foundation)**: Core database schemas, visual UI layout, and basic LLM prompt structures.
* **Weeks 3-4 (Integration)**: Build and test direct connectors; configure the background queue.
* **Weeks 5-6 (Hardening & Launch)**: Real-time web socket events, visual polishing, and public landing page release.
`;
  }

  if (agentName === "UX Designer") {
    return `# UX Layout Specification — ${titleIdea}

## 1. Switzerland-Modern Grid System
Our visual interface is built on a strict, 8px grid system with barely-visible slate borders. It highlights typography and spacious margins, focusing entirely on user content.

## 2. System Core Screen Wireframe

\`\`\`text
+-------------------------------------------------------------------------+
| [ForgeOS]  Venture: ${titleIdea}                         [Export UI] [New] |
+-------------------------------------------------------------------------+
| (o) Venture Planner   |  # Venture Overview — ${titleIdea}                |
| (*) Market Analyst    |                                                 |
| ( ) Product Architect |  ## 1. The Core Thesis                           |
| ( ) UX Designer       |  ${titleIdea} is an autonomous, high-agency     |
| ( ) Pitch Coach       |  platform designed to automate...               |
|                       |                                                 |
| ───────────────────── |  +--------------------------------------------+ |
| [Active Agent Logs]   |  |  [Problem Statement]   |  [Solution Matrix]| |
| > Venture Analyst:    |  |  Manual overhead costs |  Autonomous agents | |
|   Mapping market sizes|  |  scale exponentially.  |  eliminate 90% cost| |
|                       |  +--------------------------------------------+ |
| [STATUS: INCUBATING]  |                                                 |
+-------------------------------------------------------------------------+
| Console logs: Agent execution connected via SSE on port 3000...         |
+-------------------------------------------------------------------------+
\`\`\`

## 3. Micro-interactions
* **Active Status Lights**: The sidebar list features small, glowing pulsars that fade between deep violet and high-contrast violet when an agent is running.
* **Tab-Switching Transitions**: Selecting another tab triggers a 150ms transform-scale transition that makes content appear to dock gracefully.
* **Typing Streams**: Live output utilizes a custom CSS blinking terminal cursor at the trailing edge of incoming text, providing mechanical feedback.
`;
  }

  if (agentName === "Pitch Coach") {
    return `# Startup Pitch Deck & Marketing Copy — ${titleIdea}

## 1. 10-Slide Investor Deck Structure

### Slide 1: The Title
* **Headline**: ${titleIdea}
* **Subhead**: Next-Generation Intelligent Venture Orchestration.
* **Speaker Notes**: Introduce the massive shifting trend towards autonomous business agents and present our core mission.

### Slide 2: The Problem
* **Headline**: The Manual Coordination Tax.
* **Message**: Businesses spend trillions collectively on mechanical operations that can be automated by intelligent agents.
* **Speaker Notes**: Highlight real case studies where operations scale linearly with cost, rather than exponentially with revenue.

### Slide 3: The Solution
* **Headline**: Seamless Enterprise Orchestration.
* **Message**: A unified, high-conviction platform where agents run business units with absolute safety.

---

## 2. Premium Landing Page Copy

### Hero Headline
"The future of execution is autonomous. Meet ${titleIdea}."

### Hero Subheadline
"Launch your specialized enterprise agent network in under sixty seconds. Automate operational friction, reclaim thousands of hours, and scale with infinite efficiency."

### Call to Action Button
"Initialize Workspace ── Free Trial"

### Three Core Pillars
* **01 / Autonomous Coordination**: Simply state your business objectives, and our cognitive engine synthesizes the necessary tasks, loops, and checks.
* **02 / Seamless Integrations**: Connect your entire software suite with zero custom code required.
* **03 / High-Conviction Audits**: A beautiful visual canvas documents every decision, step, and exception handled by your team.
`;
  }

  return "";
}
