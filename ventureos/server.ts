import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { projectStore, runVentureOSGenerator } from "./src/server/generator";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API 1: Generate a project from an idea
  app.post("/api/generate", (req, res) => {
    const { idea } = req.body;
    if (!idea || typeof idea !== "string" || !idea.trim()) {
      res.status(400).json({ error: "Idea string is required" });
      return;
    }

    const projectId = "proj_" + Math.random().toString(36).substr(2, 9);
    
    // Create new project structure
    projectStore[projectId] = {
      id: projectId,
      idea: idea.trim(),
      status: "incubating",
      agents: [
        { name: "Venture Planner", status: "waiting", output: "" },
        { name: "Market Analyst", status: "waiting", output: "" },
        { name: "Product Architect", status: "waiting", output: "" },
        { name: "UX Designer", status: "waiting", output: "" },
        { name: "Pitch Coach", status: "waiting", output: "" }
      ]
    };

    console.log(`Created new project ${projectId} for idea: ${idea}`);
    res.json({ project_id: projectId });
  });

  // API 2: Get project details
  app.get("/api/project/:id", (req, res) => {
    const { id } = req.params;
    const project = projectStore[id];

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json(project);
  });

  // API 4: Generate Brand Logo
  app.post("/api/generate-logo", async (req, res) => {
    const { idea, name } = req.body;
    if (!idea) {
      res.status(400).json({ error: "Idea is required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const prompt = `A premium, ultra-modern, minimalist high-tech logo icon for a startup named "${name || idea}". Style: clean vector art, flat design, elegant geometric symbol, deep indigo and violet accents, isolated on a solid dark gray (#0F0F10) background, centered composition, high visual weight, 10x developer tool style.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
              return;
            }
          }
        }
        throw new Error("No image data found in response");
      } catch (err: any) {
        console.error("AI Logo generation failed, falling back:", err);
      }
    }

    const svg = generateProceduralLogo(name || idea);
    res.json({ imageUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` });
  });

  // API 5: Simulate VC Pitch Evaluation
  app.post("/api/simulate-pitch", async (req, res) => {
    const { idea, pitch, personality } = req.body;
    if (!idea || !pitch) {
      res.status(400).json({ error: "Idea and pitch are required" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const prompt = `You are a legendary Silicon Valley Venture Capitalist. Evaluate the following startup venture.
Venture Idea: "${idea}"
Founder's Elevator Pitch: "${pitch}"
Your VC Persona: "${personality || "balanced"}"

Perform an expert critique and return a JSON structured critique with the exact JSON keys schema:
{
  "verdict": "A 2-3 sentence summary of your investment thesis or pass decision.",
  "scorecard": [
    { "criteria": "Market Size & TAM", "score": 85, "feedback": "Detailed feedback on the market scale..." },
    { "criteria": "Product Moat", "score": 75, "feedback": "Detailed feedback on technical defensibility..." },
    { "criteria": "Business Model", "score": 80, "feedback": "Feedback on unit economics and pricing..." },
    { "criteria": "Feasibility & Risk", "score": 70, "feedback": "Feedback on technical execution hurdles..." }
  ],
  "questions": [
    { "question": "Tough VC Question 1", "why": "Why this question is critical", "advice": "How the founder should answer this" },
    { "question": "Tough VC Question 2", "why": "Why this question is critical", "advice": "How the founder should answer this" },
    { "question": "Tough VC Question 3", "why": "Why this question is critical", "advice": "How the founder should answer this" }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                verdict: { type: Type.STRING },
                scorecard: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criteria: { type: Type.STRING },
                      score: { type: Type.INTEGER },
                      feedback: { type: Type.STRING }
                    },
                    required: ["criteria", "score", "feedback"]
                  }
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      why: { type: Type.STRING },
                      advice: { type: Type.STRING }
                    },
                    required: ["question", "why", "advice"]
                  }
                }
              },
              required: ["verdict", "scorecard", "questions"]
            }
          }
        });

        const text = response.text || "{}";
        res.json(JSON.parse(text));
        return;
      } catch (err: any) {
        console.error("AI VC simulation failed, falling back:", err);
      }
    }

    const fallbackData = getFallbackVCEvaluation(idea, pitch, personality);
    res.json(fallbackData);
  });

  // API 3: SSE stream endpoint
  app.get("/api/stream/:id", (req, res) => {
    const { id } = req.params;
    const project = projectStore[id];

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    // Set Server-Sent Events headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // Send initial ping to establish connection
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);

    // Callback when a chunk of text is generated by an agent
    const onChunk = (agentName: string, chunk: string, isDone: boolean) => {
      res.write(`data: ${JSON.stringify({ agent: agentName, chunk, done: isDone })}\n\n`);
    };

    // Callback when an agent's status transitions
    const onStatusChange = (agentName: string, status: "waiting" | "active" | "completed") => {
      res.write(`data: ${JSON.stringify({ type: "status", agent: agentName, status })}\n\n`);
    };

    // Start generator in the background
    runVentureOSGenerator(project, onChunk, onStatusChange)
      .then(() => {
        res.write(`data: ${JSON.stringify({ type: "complete", status: "completed" })}\n\n`);
        res.end();
      })
      .catch((err) => {
        console.error(`Generator error for project ${id}:`, err);
        res.write(`data: ${JSON.stringify({ type: "error", message: err.message })} \n\n`);
        res.end();
      });

    // Handle client disconnects gracefully
    req.on("close", () => {
      console.log(`Client disconnected from stream ${id}`);
    });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

function generateProceduralLogo(name: string): string {
  const initials = name
    .split(" ")
    .map(w => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
  
  // Choose beautiful modern background gradient colors based on string hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue1}, 75%, 60%)" />
          <stop offset="100%" stop-color="hsl(${hue2}, 85%, 50%)" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="200" height="200" fill="#0D0D10" rx="24"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
      <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
      <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
      <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(255,255,255,0.02)" stroke-width="1"/>
      
      <g filter="url(#glow)">
        <polygon points="100,45 145,90 100,135 55,90" fill="none" stroke="url(#grad)" stroke-width="3" />
        <rect x="75" y="75" width="50" height="50" rx="8" fill="url(#grad)" opacity="0.15" transform="rotate(45 100 100)" />
        <circle cx="100" cy="100" r="16" fill="url(#grad)" />
      </g>
      
      <text x="100" y="106" font-family="'Space Grotesk', 'Inter', sans-serif" font-size="16" font-weight="bold" fill="#0D0D10" text-anchor="middle">${initials}</text>
    </svg>
  `.trim();
}

function getFallbackVCEvaluation(idea: string, pitch: string, personality: string) {
  const isTech = idea.toLowerCase().includes("tech") || idea.toLowerCase().includes("ai") || idea.toLowerCase().includes("software");
  
  const personaIntro = personality === "optimist" 
    ? "This is highly ambitious and aligns with our fund's core thesis on accelerated technological leverage."
    : personality === "skeptic"
    ? "We like the ambition, but have deep reservations regarding immediate customer acquisition costs and technical defensibility."
    : "An interesting proposal with high utility. The core challenge resides in immediate product positioning and go-to-market execution.";

  return {
    verdict: `${personaIntro} If the team can prove early 10x customer retention and organic distribution velocity, this could represent a highly attractive seed-stage investment opportunity.`,
    scorecard: [
      {
        criteria: "Market Size & TAM",
        score: isTech ? 88 : 78,
        feedback: "The global market category is vast and expanding rapidly, but immediate wedge positioning is critical to avoid legacy giants."
      },
      {
        criteria: "Product Moat",
        score: pitch.length > 50 ? 82 : 68,
        feedback: "Initial product features look high-utility. We recommend focusing heavily on custom workflow hooks or proprietary models to establish a defensible moat."
      },
      {
        criteria: "Business Model",
        score: 75,
        feedback: "Direct SaaS subscription models work but we suggest modeling usage-based billing or API take-rates to capture downstream enterprise value."
      },
      {
        criteria: "Feasibility & Risk",
        score: 80,
        feedback: "Technical execution risk is moderate. The core challenge will be building reliable automated integrations with legacy client environments."
      }
    ],
    questions: [
      {
        question: "How do you defend against massive legacy incumbents implementing similar features?",
        why: "Incumbents have distribution power. You need a dedicated, hyper-focused edge.",
        advice: "Highlight your speed of iteration, proprietary micro-workflows, or superior designer/developer-centric user experiences."
      },
      {
        question: "What is your high-conviction distribution wedge for acquiring your first 100 enterprise users?",
        why: "SaaS failure is almost always a distribution problem, not a product problem.",
        advice: "Acknowledge that direct cold sales are hard; emphasize product-led growth, open-source triggers, or community-led loops."
      },
      {
        question: "As models become commoditized, where does your long-term proprietary value reside?",
        why: "If anyone can build this with basic LLM APIs, pricing power will race to zero.",
        advice: "Frame your value in the workflow context, integrated metadata, user state, and multi-agent system performance."
      }
    ]
  };
}

startServer();
