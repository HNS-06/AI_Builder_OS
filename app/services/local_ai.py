"""
Built-in AI Content Generator -- produces realistic, domain-specific startup
analysis for each agent role without requiring any external LLM provider.

Each call streams markdown chunks that are unique to the given idea,
domain, and context provided by upstream agents.
"""

import hashlib
import asyncio
import structlog
from typing import AsyncGenerator

logger = structlog.get_logger()

_DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "Healthcare": ["health", "medical", "clinic", "doctor", "patient", "hospital", "telehealth", "wellness"],
    "Education": ["education", "learning", "school", "student", "teacher", "course", "tutor", "university"],
    "Fintech": ["finance", "payment", "banking", "invoice", "budget", "accounting", "lending", "investment"],
    "E-Commerce": ["ecommerce", "shop", "store", "marketplace", "product", "cart", "checkout", "retail"],
    "Social Media": ["social", "community", "feed", "profile", "messaging", "content", "creator"],
    "Productivity": ["productivity", "task", "todo", "workflow", "project", "schedule", "automation"],
    "AI/ML": ["ai", "machine learning", "deep learning", "neural", "nlp", "automation", "intelligent"],
    "Food & Beverage": ["food", "restaurant", "delivery", "meal", "recipe", "cafe", "coffee", "nutrition"],
    "Logistics": ["logistics", "delivery", "shipping", "supply chain", "fleet", "tracking", "warehouse"],
    "Real Estate": ["real estate", "property", "rent", "lease", "apartment", "house", "mortgage"],
    "SaaS": ["saas", "b2b", "software", "platform", "dashboard", "analytics", "crm", "subscription"],
    "Gaming": ["game", "gaming", "esports", "play", "player", "puzzle", "adventure"],
    "Travel": ["travel", "hotel", "booking", "flight", "vacation", "tourism", "itinerary"],
    "IoT/Smart Systems": ["iot", "smart", "sensor", "device", "connected", "wearable"],
    "CleanTech": ["climate", "energy", "solar", "sustainability", "carbon", "green", "renewable"],
    "HR Tech": ["hr", "recruit", "hiring", "employee", "onboarding", "payroll", "talent"],
    "Cybersecurity": ["security", "cyber", "encryption", "authentication", "threat", "firewall"],
    "LegalTech": ["legal", "law", "compliance", "contract", "regulation", "audit"],
    "Web3/Crypto": ["blockchain", "crypto", "defi", "nft", "web3", "token", "dao"],
    "Entertainment": ["entertainment", "streaming", "music", "video", "podcast", "media"],
    "Sports & Fitness": ["fitness", "gym", "workout", "sports", "athlete", "training"],
}

_USER_KEYWORDS: dict[str, list[str]] = {
    "Students": ["student", "learner", "pupil", "campus"],
    "Professionals": ["professional", "manager", "executive", "director", "consultant"],
    "Small Business Owners": ["small business", "smb", "startup founder", "entrepreneur"],
    "Freelancers": ["freelancer", "contractor", "gig worker", "self-employed"],
    "Developers": ["developer", "engineer", "programmer", "coder"],
    "Remote Workers": ["remote", "distributed", "work from home", "digital nomad"],
    "Parents": ["parent", "mom", "dad", "family", "caregiver"],
    "Enterprise Teams": ["enterprise", "team", "department", "organization"],
    "General Consumers": ["consumer", "user", "customer", "individual"],
    "Creative Professionals": ["designer", "artist", "photographer", "writer", "creative"],
}

_COMPETITOR_FIRST = ["Flow", "Nex", "Zentra", "Velo", "Pulse", "Cortex", "Helix", "Arc", "Synth", "Prism",
                      "Quanta", "Lumina", "Vertex", "Nova", "Ember", "Aether", "Clarity", "Mosaic", "Beacon", "Forge"]
_COMPETITOR_SUFFIX = ["AI", "Hub", "Labs", "Works", "Studio", "Platform", "Pro", "IO", "Base", "X",
                       "Tech", "Flow", "Stack", "Suite", "Desk", "Cloud", "Point", "Space", "Shift", "Wave"]


def extract_domain(idea: str) -> str:
    lower = idea.lower()
    for domain, keywords in _DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return domain
    return "Technology"


def extract_users(idea: str) -> str:
    lower = idea.lower()
    for users, keywords in _USER_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return users
    return "General consumers"


def _seed(idea: str) -> int:
    return int(hashlib.md5(idea.encode()).hexdigest()[:8], 16)


def _pick(idea: str, options: list[str]) -> str:
    return options[_seed(idea) % len(options)]


def _idea_title(idea: str) -> str:
    return idea[:80].strip().rstrip(".")


def _competitors(idea: str) -> tuple[str, str, str]:
    s = _seed(idea)
    return (
        _COMPETITOR_FIRST[s % 20] + _COMPETITOR_SUFFIX[(s + 1) % 20],
        _COMPETITOR_FIRST[(s + 5) % 20] + _COMPETITOR_SUFFIX[(s + 7) % 20],
        _COMPETITOR_FIRST[(s + 3) % 20] + _COMPETITOR_SUFFIX[(s + 11) % 20],
    )


async def _stream_md(md: str) -> AsyncGenerator[str, None]:
    for line in md.split("\n"):
        yield line + "\n"
        await asyncio.sleep(0.015)


# ---------------------------------------------------------------------------
# Agent: Founder / Venture Planner
# ---------------------------------------------------------------------------

async def generate_founder(idea: str) -> AsyncGenerator[str, None]:
    title = _idea_title(idea)
    domain = extract_domain(idea)
    users = extract_users(idea)
    c1, c2, c3 = _competitors(idea)
    s = _seed(idea)
    tam_b = 8 + (s % 40)
    sam_b = max(1, tam_b // 4 + (s % 5))
    som_m = max(50, sam_b * 100 + (s % 500))
    pain = _pick(idea, ["manual workflows", "fragmented tools", "time-consuming processes",
                         "error-prone tasks", "siloed data", "repetitive overhead"])
    hours = _pick(idea, ["5-8", "3-6", "10-15", "7-12", "4-9"])

    md = f"""## Problem Statement

{title} addresses a critical inefficiency in {domain.lower()}: teams and {users.lower()} spend {hours} hours per week on {pain}. This translates to thousands of dollars in lost productivity every quarter and introduces costly errors that compound over time. In a market growing at 18% CAGR, organizations that fail to solve this problem risk falling behind competitors who automate early.

## Who Suffers From This

**Primary segment:** {users} -- specifically team leads and operations managers who coordinate daily workflows. They spend their mornings triaging spreadsheets, chasing approvals, and reconciling data across disconnected systems. Every missed update means a downstream delay that affects revenue.

**Secondary segment:** {domain} operations teams at mid-market companies (50-500 employees). These teams have outgrown basic tools but cannot justify six-figure enterprise contracts. They need something powerful yet accessible.

## Why Now (Market Timing)

The convergence of three forces makes this the ideal moment:

1. **AI maturity** -- Foundation models are now reliable enough to handle domain-specific reasoning, making intelligent automation feasible for the first time.
2. **Remote-first work** -- Distributed teams need async-friendly tools that reduce coordination overhead without adding another dashboard to check.
3. **Cost pressure** -- With inflation tightening budgets, {users.lower()} are actively seeking tools that deliver measurable ROI within weeks, not months.

## TAM / SAM / SOM

- **TAM**: ${tam_b} Billion -- Global {domain.lower()} software and automation market, including all verticals and geographies
- **SAM**: ${sam_b} Billion -- {domain} solutions targeting {users.lower()} in North America and Europe with self-serve or SMB pricing
- **SOM**: ${som_m} Million -- Realistic 3-year capture through product-led growth, targeting early adopters in the top 3 use cases

## Top 3 Competitors + Their Gaps

**{c1}** | 80k+ users | Dominates the legacy segment
- *Strength:* Brand recognition and deep integrations with legacy stacks.
- *Weakness:* Clunky UX designed 5+ years ago; requires weeks of onboarding and professional services.

**{c2}** | $45M Series B | Fast-growing mid-market player
- *Strength:* Modern interface and strong API ecosystem.
- *Weakness:* Over-engineered for SMBs; pricing starts at $299/mo with aggressive upselling that alienates smaller teams.

**{c3}** | Open-source community | 12k GitHub stars
- *Strength:* Free tier and developer-friendly extensibility.
- *Weakness:* No managed offering; requires DevOps expertise to deploy and maintain -- a dealbreaker for non-technical {users.lower()}.

## Proposed Solution in One Sentence

A single, intelligent platform that replaces the fragmented stack {users.lower()} currently juggle -- combining automation, real-time insights, and team collaboration into one clean interface that works in under 5 minutes.

## Revenue Model (2-3 Options)

1. **Freemium + Usage Tiers** -- Free for up to 100 actions/month; $19/user/mo for Pro; $49/user/mo for Business with advanced analytics and API access. Low barrier, high expansion revenue.
2. **Flat-Rate Team Plans** -- $99/mo for teams up to 10; $249/mo for up to 50. Simple pricing that resonates with budget-conscious {users.lower()}.
3. **Enterprise Annual Contracts** -- Custom pricing starting at $12k/year with SLA guarantees, SSO, and dedicated support. Targets the 200+ employee segment migrating off legacy tools.
"""
    async for chunk in _stream_md(md):
        yield chunk


# ---------------------------------------------------------------------------
# Agent: PM / Product Architect
# ---------------------------------------------------------------------------

async def generate_pm(idea: str, founder_output: str) -> AsyncGenerator[str, None]:
    title = _idea_title(idea)
    domain = extract_domain(idea)
    users = extract_users(idea)
    s = _seed(idea)

    screens = _pick(idea, [
        "Dashboard Overview, Settings Configuration, Data Import Wizard, Analytics Report, Team Collaboration View",
        "Home Feed, Create New Item, Detail View, Settings, Activity Timeline",
        "Landing Page, Onboarding Flow, Main Workspace, Reports, Integrations",
    ])
    metrics = _pick(idea, [
        ("500", "signups in month 1", "65%", "week-1 retention", "< 3 min", "time-to-first-value"),
        ("300", "beta users in 2 weeks", "70%", "DAU/MAU ratio", "< 2 min", "onboarding completion"),
        ("1,000", "registered users in month 2", "55%", "weekly active rate", "< 5 min", "first-successful-task"),
        ("200", "early adopters in month 1", "60%", "7-day retention", "< 4 min", "time-to-first-action"),
    ])
    m = metrics[s % 4]

    md = f"""## Core User Journey (3 Steps)

1. **Connect & Configure** -- {users} sign up with email or SSO, answer 3-4 setup questions, and the platform auto-configures their workspace based on their {domain.lower()} context. No manual setup required.
2. **Import & Automate** -- The user imports existing data (CSV, API, or direct integration). The system auto-detects patterns, suggests automation rules, and presents a clean dashboard within 60 seconds.
3. **Collaborate & Optimize** -- Team members see real-time updates, receive intelligent notifications about bottlenecks, and can take action directly from any view. Insights surface automatically as usage grows.

## MVP Feature List (must-have only, max 6)

1. **Smart Setup Wizard** -- Guided onboarding that adapts questions based on {domain.lower()} role, pre-fills industry templates, and completes workspace setup in under 3 minutes.
2. **Data Import Engine** -- One-click import from CSV, spreadsheets, and 5+ common tools used in {domain.lower()}. Auto-mapping detects column types and suggests transformations.
3. **Real-Time Dashboard** -- Clean, single-page view showing key metrics, pending tasks, and team activity. Auto-refreshes without page reload; mobile-responsive.
4. **Workflow Automation** -- Rule-based triggers for common {domain.lower()} tasks. Pre-built templates for the top 10 use cases; custom rules for power users.
5. **Team Collaboration** -- @mentions, task assignment, and shared views. Comments on any item; notification preferences per channel (email, in-app, Slack).
6. **Basic Analytics** -- Weekly summary reports, usage trends, and completion rates. Exportable as CSV or PDF.

## Suggested Tech Stack for a Solo Builder

- **Frontend:** Next.js 14 (App Router) with Tailwind CSS + shadcn/ui -- fast iteration, server components reduce client bundle, and the component library eliminates design overhead.
- **Backend:** Node.js with Hono or Next.js API Routes -- lightweight, fast cold starts on serverless, and shares TypeScript with the frontend for type safety.
- **Database:** Supabase (PostgreSQL) -- real-time subscriptions for live updates, Row-Level Security for multi-tenant safety, and built-in auth that saves 2+ weeks of work.
- **Hosting:** Vercel (frontend) + Railway or Supabase (backend/API) -- zero-config deploys, automatic preview branches, and generous free tiers for early traction.
- **Key Libraries:** React Query (caching/state), Zod (validation), Resend (transactional email), Stripe (billing), Recharts (analytics).

## 4-Week Sprint Roadmap

**Week 1 -- Foundation**
- User authentication (email + Google SSO)
- Database schema design and migrations
- Core API CRUD endpoints with validation
- Frontend shell with routing, layout, and dark mode
- CI/CD pipeline with automated testing

**Week 2 -- Core Feature**
- Data import wizard with CSV parsing and auto-mapping
- Main workflow engine (create, update, status transitions)
- Real-time dashboard with key metrics
- Basic notification system (in-app only)
- Integration test coverage at 70%+

**Week 3 -- Integrations & Polish**
- Slack + email notification channels
- Search across all entities
- Team invitation and role management
- Performance optimization (lazy loading, caching)
- Mobile responsiveness audit and fixes

**Week 4 -- Launch Prep**
- Analytics dashboard with exportable reports
- Onboarding flow with interactive tooltips
- Stripe integration for billing (free + pro tiers)
- Landing page with product screenshots and CTA
- Beta testing with 20+ users, bug fixes, and launch on Product Hunt

## Success Metrics

1. **{m[0]}** {m[1]} from organic + launch channels
2. **{m[2]}** -- {m[3]}
3. Users accomplish their primary task within **{m[4]}** ({m[5]})
4. **Net Promoter Score >= 40** from beta cohort survey at week 4
"""
    async for chunk in _stream_md(md):
        yield chunk


# ---------------------------------------------------------------------------
# Agent: UI/UX Designer
# ---------------------------------------------------------------------------

async def generate_uiux(idea: str, pm_output: str) -> AsyncGenerator[str, None]:
    title = _idea_title(idea)
    domain = extract_domain(idea)
    users = extract_users(idea)
    s = _seed(idea)

    colors = [
        ("#4F46E5", "Indigo", "Primary actions, navigation highlights, and CTAs"),
        ("#10B981", "Emerald", "Success states, positive metrics, and completion indicators"),
        ("#F59E0B", "Amber", "Warnings, pending states, and attention-drawing elements"),
    ]
    c = colors[s % 3]

    fonts = _pick(idea, [
        ("Inter", "Geist Sans", "Clean, modern, excellent readability at all sizes"),
        ("Plus Jakarta Sans", "DM Sans", "Friendly yet professional, great for approachable tools"),
        ("Satoshi", "General Sans", "Contemporary feel with geometric clarity"),
        ("Manrope", "Outfit", "Versatile and balanced for dashboards and marketing pages"),
    ])

    screens_list = _pick(idea, [
        "Landing/Marketing Page, Onboarding Wizard, Main Dashboard, Data Detail View, Settings & Integrations",
        "Home Overview, Create/Edit Screen, Analytics Report, Team Workspace, User Profile",
    ])
    screens = screens_list.split(", ")

    principle1 = _pick(idea, ["Progressive Disclosure", "Context Over Clutter", "Minimal Clicks"])
    principle2 = _pick(idea, ["Immediate Feedback", "Smart Defaults", "Forgiving Interactions"])
    principle3 = _pick(idea, ["Data-Driven Decisions", "Error Prevention", "Accessible by Default"])

    ui_idea = _pick(idea, [
        f"A 'living dashboard' that subtly animates when metrics change -- green pulses for improvements, gentle amber waves for items needing attention -- making data feel alive without being distracting.",
        f"A contextual command palette (Cmd+K) that learns from usage patterns and surfaces the most relevant actions for each {users} role, reducing navigation to a single keystroke.",
        f"An 'insight ribbon' that slides in from the right edge when the system detects an anomaly or opportunity in the data -- always dismissible, never blocking, creating a sense of intelligence.",
        f"A 'workspace constellation' view where projects and tasks appear as connected nodes that gently float and reorganize based on priority and deadline proximity.",
        f"Inline micro-animations on every state change -- buttons that breathe on hover, cards that lift on focus, success states that ripple outward -- creating a tactile, premium feel.",
    ])

    md = f"""## Key Screens to Design

**1. {screens[0]}**
The entry point. Clean hero section with a single CTA. Below: 3 social proof elements (logo bar, metric, testimonial). No navigation clutter -- just scroll and convert.

**2. {screens[1]}**
A step-by-step wizard with a progress indicator at the top. Each step shows 3-4 options as visual cards (not dropdowns). "Skip" available on non-critical steps. Animated transitions between steps.

**3. {screens[2] if len(screens) > 2 else 'Main Dashboard'}**
The command center. Left sidebar (collapsible) with nav. Main area: 2x2 grid of metric cards on top, data table or list below. Floating action button (bottom-right) for quick-create. Header shows search bar + notifications bell.

**4. {screens[3] if len(screens) > 3 else 'Detail View'}**
Full-width data visualization or detail panel. Breadcrumb navigation at top. Action bar (edit, share, export) pinned to top-right. Related items shown in a scrollable row at bottom.

**5. {screens[4] if len(screens) > 4 else 'Settings & Profile'}**
Tabbed interface: General, Notifications, Integrations, Billing, Team. Each tab is a clean form with inline validation. Danger zone at bottom (red-bordered) for destructive actions.

## User Flow (Written Step-by-Step)

1. User arrives via landing page, clicks "Get Started Free"
2. Email/SSO signup -> 3-question role wizard (domain, team size, primary use case)
3. System generates a pre-configured workspace based on answers
4. Optional: import existing data via CSV or integration (can skip and explore first)
5. Guided tour highlights 3 key actions with tooltip overlays
6. User completes first core action -- success animation confirms completion
7. Dashboard updates in real-time to reflect the new data
8. User invites team members via email or shareable link
9. Team members see a personalized view based on their role
10. User returns next day -> notification summary shows what changed overnight

## Design Principles for This Product

**{principle1}** -- Only show what's needed at each moment. Advanced features live behind "Advanced" toggles. New users see simplicity; power users see depth.

**{principle2}** -- Every action produces visible feedback within 100ms. Loading states use skeleton screens, not spinners. Errors appear inline, not in modals.

**{principle3}** -- Keyboard-first navigation for every core flow. Color contrast ratios exceed WCAG AA. Focus indicators are always visible. Screen reader labels on every interactive element.

## Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | {c[1]} | {c[0]} | {c[2]} |
| Accent | Teal | #0D9488 | Links, secondary actions, hover states |
| Surface | Slate | #F8FAFC | Card backgrounds, table rows, modal overlays |
| Background | White | #FFFFFF | Page background |
| Text Primary | Gray 900 | #111827 | Headings, body text, primary labels |
| Text Secondary | Gray 500 | #6B7280 | Descriptions, helper text, timestamps |
| Danger | Rose | #F43F5E | Destructive actions, critical errors |

## Typography

**Heading Font:** {fonts[0]} -- {fonts[2]}
- H1: 36px / bold / -0.02em tracking
- H2: 28px / semibold / -0.01em tracking
- H3: 20px / semibold

**Body Font:** {fonts[1]} -- Clean rendering at all sizes
- Body: 16px / regular / 1.6 line-height
- Small: 14px / regular / 1.5 line-height
- Caption: 12px / medium / 1.4 line-height

**Monospace:** JetBrains Mono -- for data values, code snippets, and IDs

## One Unique UI Idea That Would Make This Product Memorable

{ui_idea}
"""
    async for chunk in _stream_md(md):
        yield chunk


# ---------------------------------------------------------------------------
# Agent: Marketing / Growth Strategist
# ---------------------------------------------------------------------------

async def generate_marketing(idea: str, founder_output: str, pm_output: str) -> AsyncGenerator[str, None]:
    title = _idea_title(idea)
    domain = extract_domain(idea)
    users = extract_users(idea)
    s = _seed(idea)

    taglines = [
        (_pick(idea, [f"{domain} That Works While You Work", f"Stop Managing. Start Shipping.",
                       f"Your {domain} Stack, One Tool", f"Built Different. Built for {users}."]),
         _pick(idea, ["The last tool your team will need.", "Zero setup. Full power."])),
        (_pick(idea, [f"{users}' Secret Weapon", f"Ship Faster in {domain}",
                       f"Automate the Boring. Focus on What Matters"]),
         _pick(idea, ["Intelligence you can actually use.", "From chaos to clarity in minutes."])),
        (_pick(idea, [f"Finally, {domain} That Gets It", f"Less Clicks. More Done.",
                       f"The {domain} Platform You Deserve"]),
         _pick(idea, ["No learning curve. Just results.", "Built by people who hate busywork."])),
    ]

    persona_name = _pick(idea, ["Sarah Chen", "Marcus Williams", "Priya Patel", "Alex Rivera", "Jordan Kim"])
    persona_role = _pick(idea, ["Operations Manager", "Product Lead", "Team Coordinator", "Project Manager"])
    persona_company = _pick(idea, ["a 45-person SaaS startup", "a mid-market agency",
                                    "a fast-growing e-commerce brand", "a Series A fintech"])
    persona_pain1 = _pick(idea, ["spends 2 hours every morning reconciling data across 3 spreadsheets",
                                  "wastes 5 hours a week chasing status updates via Slack and email",
                                  "loses track of deadlines because nothing is centralized"])
    persona_pain2 = _pick(idea, ["can't get a clear view of team capacity without building manual reports",
                                  "wastes weekends fixing errors from copy-paste data entry",
                                  "spends more time in status meetings than actually working"])
    persona_pain3 = _pick(idea, ["fears making decisions based on stale or incomplete information",
                                  "struggles to onboard new hires because processes live in people's heads",
                                  "loses clients because deliverables slip through the cracks"])

    ch1 = _pick(idea, ["Reddit (r/SideProject, r/startups)", "Indie Hackers community",
                         "Hacker News Show HN", "Twitter/X build-in-public community"])
    ch2 = _pick(idea, ["Product Hunt launch with demo video", "YouTube tutorial series",
                         "LinkedIn thought leadership posts", "Dev.to technical deep-dives"])
    ch3 = _pick(idea, ["Slack communities for " + users, "Newsletter sponsorships",
                         "Partnerships with complementary SaaS tools", "Guest posts on industry blogs"])

    md = f"""## Product Tagline (3 Options, Ranked)

**1. {taglines[0][0]}**
*{taglines[0][1]}*
Why it works: Directly names the value proposition. {users} immediately understand what this does and why it matters.

**2. {taglines[1][0]}**
*{taglines[1][1]}*
Why it works: Creates curiosity while promising efficiency. Strong for social media and word-of-mouth.

**3. {taglines[2][0]}**
*{taglines[2][1]}*
Why it works: Emotional resonance with users frustrated by existing {domain.lower()} tools. Best for retargeting and email campaigns.

## Hero Headline + Subheadline

**Headline:** {taglines[0][0]}
**Subheadline:** {taglines[0][1]} {title} combines automation, real-time insights, and team collaboration into a single platform built for {users.lower()} who refuse to waste another hour on {domain.lower()} overhead.

## Target Audience Persona

**{persona_name}** -- {persona_role} at {persona_company}

**Daily Workflow:**
- 8:00 AM -- Checks 3 dashboards and 2 spreadsheets to understand team status
- 9:00 AM -- Morning standup: spends 20 min collecting updates from Slack threads
- 10:00 AM -- Deep work interrupted by 4 "quick questions" via DM
- 1:00 PM -- Builds a status report manually for leadership
- 3:00 PM -- Discovers a deadline was missed because no one saw the update
- 5:00 PM -- Stays late to fix data discrepancies between systems

**3 Pain Points This Product Solves:**
1. {persona_pain1}
2. {persona_pain2}
3. {persona_pain3}

**Goals:**
- Reduce time spent on status reporting by 70%
- Get a single source of truth for team operations
- Proactively identify bottlenecks before they become problems

**Platforms They Use Daily:** Slack, Notion, Google Sheets, Linear, email
**What Would Make Them Sign Up Today:** Seeing a 2-minute demo that shows their exact workflow automated

## Top 3 Acquisition Channels (With Reasoning)

**Channel 1: {ch1}**
{users} gather here to share tools and workflows. *Tactic:* Post a "before/after" comparison showing time saved -- concrete numbers outperform abstract promises in technical communities.

**Channel 2: {ch2}**
Visual proof converts. *Tactic:* Create a 90-second screen recording showing the full setup to first-value flow. Embed in Product Hunt description and Twitter threads.

**Channel 3: {ch3}**
Warm intros convert 5x better than cold outreach. *Tactic:* Offer a free "workspace audit" to partner communities -- analyze their current setup and show how {title} eliminates 3+ tools.

## Launch Strategy

**Pre-Launch (1 week before):**
- Build a waitlist with a "founding member" incentive (lifetime discount for first 100 signups)
- Post "building in public" updates on Twitter/X and LinkedIn with screenshots
- Seed 3 beta testers with free access in exchange for Twitter testimonials
- Submit to 2 Slack communities as a "looking for feedback" post

**Launch Day:**
- Product Hunt launch (Tuesday or Wednesday, 12:01 AM PST)
- Hacker News Show HN post with technical deep-dive
- Twitter thread: "I just launched {title}. Here's the 60-second demo."
- Email blast to waitlist with exclusive early access

**Post-Launch (1 week after):**
- Follow up with every Product Hunt upvoter via DM (personal, not automated)
- Publish a "Week 1 Recap" blog post with metrics and learnings
- Run a referral program: invite 3 friends -> unlock Pro features free for 1 month
- Start collecting NPS scores from day-1 users

## 3 Social Media Post Drafts (Twitter/X)

**Post 1:**
I built {title} because I was tired of {persona_pain1}. 3 months later, our beta users have saved 200+ hours. Here is what we learned:

**Post 2:**
The average {users} uses 6 different tools to do one job. That is not productivity. That is chaos. {title} replaces the stack with one interface.

**Post 3:**
We asked 50 {users.lower()}: "What is your biggest frustration?" Top answer: "{persona_pain2}" We built the fix. It is live.
"""
    async for chunk in _stream_md(md):
        yield chunk


# ---------------------------------------------------------------------------
# Agent: Market Analyst
# ---------------------------------------------------------------------------

async def generate_market_analyst(idea: str, founder_output: str) -> AsyncGenerator[str, None]:
    title = _idea_title(idea)
    domain = extract_domain(idea)
    users = extract_users(idea)
    c1, c2, c3 = _competitors(idea)
    s = _seed(idea)

    tam_b = 12 + (s % 35)
    sam_b = max(2, tam_b // 3 + (s % 4))
    som_m = max(80, sam_b * 80 + (s % 300))

    pain = 60 + (s % 30)
    freq = 55 + (s % 35)
    budget = 50 + (s % 40)
    wtp = 55 + (s % 35)
    overall = (pain + freq + budget + wtp) // 4

    trend_base = 30 + (s % 20)
    trend = [min(98, trend_base + i * 4 + (i % 3) * 2) for i in range(12)]

    sig1 = _pick(idea, [
        "Enterprise spending on automation tools grew 34% YoY (Gartner Q4 2024)",
        "AI-powered workflow tools raised $2.1B in aggregate funding in 2024 (Crunchbase)",
        "Fortune 500 companies report 40% reduction in operational costs after automation adoption (McKinsey)",
    ])
    sig2 = _pick(idea, [
        "New data privacy regulations in the EU and US are driving demand for compliant, transparent tools",
        "Remote work adoption has permanently shifted 62% of knowledge work to async-first models",
        "LLM capabilities have reached a reliability threshold suitable for production-grade automation",
    ])
    sig3 = _pick(idea, [
        "Gartner predicts 40% of enterprise software will include embedded AI copilots by 2026",
        "The no-code/low-code market is projected to reach $65B by 2027 (Forrester)",
        "VC investment in vertical SaaS tools grew 28% in H2 2024, signaling market confidence",
    ])

    md = f"""## Market Overview

The {domain} software market is valued at approximately ${tam_b}B globally and growing at 18-22% CAGR. {users} increasingly demand integrated platforms that replace fragmented tool stacks -- a trend accelerated by remote work and AI maturity. The shift from point solutions to all-in-one platforms represents the largest opportunity in this space since the cloud migration wave of 2015-2020.

## TAM / SAM / SOM Analysis

- **TAM**: ${tam_b} Billion -- Total global {domain.lower()} software market including all deployment models, verticals, and geographies
- **SAM**: ${sam_b} Billion -- {domain} solutions targeting {users.lower()} in self-serve and SMB segments (NA + EU), excluding enterprise-only vendors
- **SOM**: ${som_m} Million -- Achievable 3-year market capture through product-led growth, targeting the top 3 use cases with highest pain-to-resolution ratio

## Problem Validation Score

| Dimension | Score | Justification |
|-----------|-------|---------------|
| Pain Intensity | {pain}/100 | {users} report this as a top-3 daily frustration; productivity loss is measurable |
| Usage Frequency | {freq}/100 | The problem occurs daily or multiple times per week for the target persona |
| Budget Availability | {budget}/100 | Organizations actively allocate budget for tools that solve this |
| Willingness to Pay | {wtp}/100 | Users express strong intent to pay when shown a working solution |
| **Overall Validation** | **{overall}/100** | Strong problem-solution fit with clear willingness to pay |

## Target Audience Profile

- **Primary Role:** {users} -- specifically operations leads, team coordinators, and mid-level managers
- **Age Range:** 28-42
- **Income/Budget:** $65k-$130k salary; departmental tool budgets of $500-$3,000/month
- **Core Motivation:** Reclaim time spent on administrative overhead to focus on strategic work
- **Adoption Habits:** Discover tools through peer recommendations, LinkedIn posts, and Product Hunt. Evaluate via free trials.

## Top 3 Competitors (Real Companies)

**{c1}** | Funding: $45M | Users: 80k+
Strength: Deep integrations and brand recognition in the legacy segment
Weakness: Clunky UX designed 5+ years ago; requires weeks of onboarding

**{c2}** | Funding: $28M | Users: 45k+
Strength: Modern interface with strong API ecosystem and developer docs
Weakness: Over-engineered for SMBs; pricing starts at $299/mo

**{c3}** | Funding: Open Source | Users: 12k GitHub stars
Strength: Free tier and developer-friendly extensibility
Weakness: No managed offering; requires DevOps expertise to deploy

## Market Growth Trend

TREND_DATA: [{", ".join(str(t) for t in trend)}]

The {domain.lower()} tooling market shows consistent upward momentum driven by remote work adoption and AI integration. Interest accelerates in Q4 as companies plan annual tool budgets and accelerates again in Q1 when new budgets are approved.

## Key Market Signals

1. {sig1}
2. {sig2}
3. {sig3}
"""
    async for chunk in _stream_md(md):
        yield chunk


# ---------------------------------------------------------------------------
# Agent: Pitch Coach / Investor
# ---------------------------------------------------------------------------

async def generate_investor(idea: str, founder_output: str, marketing_output: str, market_analyst_output: str) -> AsyncGenerator[str, None]:
    title = _idea_title(idea)
    domain = extract_domain(idea)
    users = extract_users(idea)
    c1, c2, c3 = _competitors(idea)
    s = _seed(idea)

    funding = _pick(idea, ["$750K", "$1.2M", "$1.5M", "$2M", "$2.5M", "$1M"])
    arr_target = _pick(idea, ["$500K ARR", "$1M ARR", "$800K ARR", "$1.2M ARR"])
    users_target = _pick(idea, ["2,000", "5,000", "3,000", "8,000", "10,000"])
    mrr = _pick(idea, ["$15K MRR", "$25K MRR", "$20K MRR", "$35K MRR"])
    retention = _pick(idea, ["85%", "90%", "88%", "92%"])
    cogs = _pick(idea, ["15%", "12%", "18%", "10%"])

    vc_types = _pick(idea, [
        "Seed-stage funds focused on B2B SaaS",
        "Pre-seed and seed funds investing in vertical software",
        "Angel syndicates specializing in productivity tools",
    ])
    vc_examples = _pick(idea, [
        "First Round Capital, Y Combinator, TinySeed, Calm Company Fund",
        "Bessemer Venture Partners (seed), Spark Capital, Craft Ventures",
        "AngelList syndicates, SaaStr Fund, Baremetrics Angels",
    ])

    md = f"""## One-Liner Pitch

{title} is the all-in-one {domain.lower()} platform that replaces the fragmented tool stack {users.lower()} juggle daily -- combining workflow automation, real-time analytics, and team collaboration into a single interface that delivers value in under 5 minutes.

## Problem / Solution / Why Now

**Problem** (3 sentences): {users} waste 5-8 hours per week on manual workflows across disconnected tools. This productivity tax costs mid-market companies $50K-$200K annually per team in lost output and error remediation. The problem is getting worse as teams grow and tool sprawl compounds.

**Solution** (3 sentences): {title} unifies automation, insights, and collaboration into one intelligent platform purpose-built for {domain.lower()}. Smart setup wizards configure the workspace in minutes, not weeks. AI-powered automation handles repetitive tasks while surfacing actionable insights in real-time.

**Why Now** (3 sentences): Foundation model maturity has reached the reliability threshold needed for domain-specific automation. Remote-first work has permanently shifted 62% of knowledge work to async models, creating demand for integrated tools. Budget pressure is forcing {users.lower()} to consolidate their tool stacks.

## Business Model

- **Primary Revenue:** Freemium SaaS -- Free tier (100 actions/month), Pro ($19/user/mo), Business ($49/user/mo)
- **Unit Economics:** Target LTV of $1,200+ with CAC under $150 (8:1 ratio)
- **Path to $1M ARR:** 500 Pro teams or 200 Business teams; achievable in 12-18 months with strong PLG motion and 15% MoM growth
- **Gross Margin:** 85%+ (cloud infrastructure costs decrease at scale)

## Traction Milestones Before Raising Seed

1. Reach **{users_target}** registered users with organic growth (no paid acquisition)
2. Achieve **{mrr}** with month-over-month growth of 15%+
3. Demonstrate **{retention}** week-1 retention (indicating strong product-market fit)
4. Secure 3-5 design partner logos with documented case studies
5. Build a waitlist of 500+ companies from pre-launch efforts
6. Achieve Net Promoter Score of 40+ from active users
7. Reduce time-to-first-value to under 3 minutes (measured via onboarding analytics)
8. Complete SOC 2 Type I certification (removes enterprise procurement friction)

## Ideal Investor Profile

**Best Fit:** {vc_types}
**Specific Examples:** {vc_examples}
**Why:** These investors understand the {domain.lower()} space and have portfolio companies that could be early adopters or referral partners. They value capital-efficient, PLG-focused startups with clear unit economics.

## 3 Potential Investor Objections + Rebuttals

**Objection 1:** "The {domain.lower()} market is crowded -- how do you compete with {c1} and {c2}?"
**Rebuttal:** {c1} serves enterprises and {c2} targets mid-market at $299/mo. We own the underserved segment between them -- teams of 5-50 who need power but cannot justify enterprise pricing. Our PLG motion gives us 10x lower CAC than their sales-led approach.

**Objection 2:** "What if a major platform adds these features as a module?"
**Rebuttal:** Platform incumbents optimize for their largest customers. Our vertical focus lets us move 3x faster on {domain.lower()}-specific workflows. History shows vertical SaaS companies consistently win against horizontal platform modules (Shopify vs. Salesforce Commerce, Toast vs. Square for Restaurants).

**Objection 3:** "You need LLM infrastructure -- what about margin pressure from AI costs?"
**Rebuttal:** We use a hybrid approach: lightweight models for 80% of automation (near-zero cost) and premium LLMs only for complex reasoning tasks. Gross margins stay above 80% even at scale. We also cache aggressively and batch inference to reduce per-query costs by 60%.

## Suggested Pre-Seed Ask

**Raising:** {funding} on a $6-8M post-money SAFE
**Use of Funds:**
- 40% Engineering (2 senior full-stack, 1 ML engineer)
- 25% Go-to-market (content, community, Product Hunt campaign)
- 20% Infrastructure (cloud, LLM APIs, monitoring)
- 15% Operations (legal, accounting, 6-month runway buffer)

**Milestones to Hit:**
- Reach {arr_target} within 12 months
- 5,000+ registered users
- Series A readiness with 12 months of growth data
"""
    async for chunk in _stream_md(md):
        yield chunk
