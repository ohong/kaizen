# Supabase AI Tooling Survey Responses

## Response 1 - Sarah K. (Senior Backend Engineer, Auth team, 3 years)

**1. Task where AI helped vs slowed down:**

Helped: Writing migration scripts for the auth schema changes last sprint. I described what I needed in plain English to Copilot and it generated pretty solid SQL with proper constraints. Saved me maybe 45 minutes of looking up Postgres syntax.

Slowed down: Debugging a race condition in our Elixir realtime server. Copilot kept suggesting GenServer patterns that looked reasonable but were subtly wrong for our supervision tree. I spent probably 90 minutes going down a rabbit hole before I just turned it off and reasoned through it myself. The suggestions were confident but wrong, which is worse than no suggestions.

**2. Energy/focus/flow:**

Mixed bag. On good days when I'm doing straightforward CRUD or schema work, AI keeps me in flow—I don't context switch to docs as much. On hard days debugging distributed systems or optimizing queries, the constant autocomplete suggestions are noise that breaks my concentration. I've started disabling it completely when I need to think deeply. 

Mentally tired? Not really more or less, but differently tired. Less "ugh I have to write 50 lines of boilerplate" tired, more "did the AI just introduce a subtle bug I need to check for" tired.

**3. After AI generates code:**

For SQL/migrations: ~60% accept as-is, 30% minor tweaks, 10% scrap
For Elixir: ~20% accept, 50% heavy modification, 30% scrap and rewrite myself
For tests: ~70% accept with tweaks

I'd say I spend 5-10 minutes per significant AI suggestion just reviewing it carefully. That's on top of the time I would have spent writing it. Sometimes it's net positive, sometimes net neutral. For Elixir specifically, I trust it less because the training data is probably sparse compared to TypeScript.

**4. Collaboration impact:**

Code reviews are weird now. I can usually tell when someone used AI heavily because the code is... verbose? Like it does the right thing but in 15 lines instead of 8. I find myself leaving more "this works but could be simpler" comments. Not sure if that's good or bad.

Pairing is worse though. When I'm pairing with someone and they're using Copilot aggressively, there's this awkward dance of "wait let me see what it suggests... okay no that's wrong... let me try rephrasing..." It slows down the conversation.

**5. One thing to fix:**

Context awareness for our specific codebase. Copilot doesn't know our internal Postgres extensions or our Elixir app architecture. I wish I could give it our monorepo structure and have it actually understand "when working in /supabase/auth, use these patterns." Right now it's just generic Elixir advice.

---

## Response 2 - Marcus T. (Staff Engineer, Postgres/Storage, 5 years)

**1. Task where AI helped vs slowed down:**

AI helped: Wrote a bunch of OpenAPI spec updates for our storage API. Tedious YAML work that Copilot handled great. 2 hours became 45 minutes.

AI slowed down: Performance optimization on a Postgres query that was killing our prod database. I asked ChatGPT for help, it suggested adding an index that would have made things worse. Wasted 30 minutes on that before I realized it didn't understand our data distribution. The problem is AI gives you the "textbook answer" but we're dealing with 500GB tables with specific access patterns.

**2. Energy/focus/flow:**

Honestly? I'm more tired. Not because of the AI itself but because I'm now reviewing code I didn't write. It's like being in code review mode constantly. When I write code from scratch, I understand every line because I reasoned through it. With AI, I'm auditing someone else's work, and that's a different cognitive load.

Flow state: Worse. The autocomplete breaks my train of thought. I've mostly turned it off except for boilerplate.

**3. After AI generates code:**

I treat AI-generated code like junior engineer code—needs thorough review. 

For straightforward stuff (CRUD, types, tests): 10 min review, usually good
For database stuff: 20-30 min review, often needs significant changes
For performance-critical paths: I don't use AI at all

Honestly maybe 40% of the time I just delete the suggestion and write it myself because reviewing would take longer than writing.

**4. Collaboration impact:**

We've had some interesting debates in PRs about whether AI-generated code needs more comments. Like, if I wrote it myself I might not comment an obvious pattern, but if AI generated it and I accepted it, should I add a comment explaining why this approach? We haven't settled on a standard.

Also: new engineers seem to lean on AI more, which worries me. Are they actually learning our patterns or just accepting what Copilot suggests? Hard to tell in async code review.

**5. One thing to fix:**

Postgres-specific tuning. The AI doesn't understand our specific Postgres setup (extensions, config, version). It gives generic Postgres advice. I want an AI that knows "oh you're on Postgres 15 with pg_cron and pg_net installed, here's what you can do."

---

## Response 3 - Priya M. (Mid-level Frontend, Dashboard team, 1.5 years)

**1. Task where AI helped vs slowed down:**

Helped MASSIVELY: Building out the new billing UI components. I was able to describe the Tailwind layout I wanted and Cursor just... made it. Forms, validation, the whole thing. What would have been a full day was maybe 3 hours. TypeScript + React is where AI really shines.

Slowed down: Integrating with our Realtime API. The AI kept suggesting deprecated patterns from old Supabase docs (I think?) and I kept hitting runtime errors. Ended up in our internal docs/Slack to figure out the current approach. Maybe added an hour to what should have been 30 minutes.

**2. Energy/focus/flow:**

Way less frustrated with CSS and Tailwind minutiae. I used to spend so much mental energy on "is it flex-col or flex-column again?" Now I just describe what I want and fix any small issues. That's genuinely improved my quality of life.

Flow state is better for UI work, worse for state management logic. When I'm reasoning through complex React hooks or Zustand state, the suggestions are distracting.

**3. After AI generates code:**

For UI components: Accept 70%, tweak 25%, scrap 5%
For business logic: Accept 30%, tweak 40%, scrap 30%
For tests: Accept 80% with minor changes

Review time is maybe 5 minutes for components, 15 minutes for logic. The thing is, AI-generated React components often work but aren't accessible or don't match our design system perfectly. So I'm always checking for aria labels, keyboard nav, etc.

**4. Collaboration impact:**

Honestly it's made me a better reviewer. I used to skim UI code in PRs because it's tedious. Now I'm more careful because I assume some of it might be AI-generated and need closer scrutiny. That's probably good?

Downside: I rely less on asking teammates for help with UI patterns because I just ask ChatGPT first. I'm not sure if that's making me less connected to the team or just more efficient.

**5. One thing to fix:**

Make it understand our design system. We have specific component patterns (our button variants, our form layouts, our color tokens) but Copilot doesn't know them. I end up accepting code then manually converting it to use our components. If it could learn our Storybook or design tokens, that would be killer.

---

## Response 4 - Jake R. (Junior Backend, Functions team, 8 months)

**1. Task where AI helped vs slowed down:**

Helped: Writing unit tests for our Deno edge functions. I'm still learning our testing patterns and Copilot basically taught me by example. Instead of asking seniors for help constantly, I could see what tests should look like and adjust. Probably saved my teammates 2-3 hours of mentoring time.

Slowed down: I tried to use ChatGPT to help debug a TypeScript type error in our function orchestration code and it just... made things worse. It kept suggesting "any" types which defeats the whole point. My lead eventually told me to stop using AI for type-level programming until I understand it better myself.

**2. Energy/focus/flow:**

As a newer engineer: AI makes me feel less stupid? Like I don't have to ask "how do I do X" for every little thing. That's huge for my confidence.

But... I also worry I'm not learning as deeply. Sometimes I accept code that works without fully understanding why. My lead called this out in 1:1 and now I'm more paranoid about it.

Energy: slightly lower because I'm context-switching between writing code and prompting AI and reviewing AI output. It's a lot of task switching.

**3. After AI generates code:**

I probably accept more than I should (60-70%?) and then find bugs later. I'm getting better at reviewing but it's a skill I'm still building.

Time spent: honestly 15-20 minutes reviewing per suggestion because I'm slower at code review in general. Sometimes it would have been faster to just write it myself, but I'm learning so maybe that's okay?

**4. Collaboration impact:**

I ask fewer questions in Slack, which my manager says is both good and bad. Good because I'm more self-sufficient, bad because I'm missing out on context and team knowledge that comes from those conversations.

In pair programming, I feel pressure to not use AI because I don't want to seem like I'm relying on it too much. Not sure if that's in my head or real.

**5. One thing to fix:**

I wish it came with a "confidence score" or something. Like "I'm 90% sure this is right" vs "I'm 50% sure, please review carefully." Right now everything looks equally confident which makes it hard to know when to be skeptical.

---

## Response 5 - Linda C. (Principal Engineer, Infrastructure, 6 years)

**1. Task where AI helped vs slowed down:**

Helped: Writing Terraform for our new region deployment. Repetitive resource definitions that followed clear patterns. AI handled it fine and I just reviewed. Maybe saved 2 hours.

Slowed down: I asked ChatGPT about optimizing our Kubernetes pod autoscaling and it gave me advice that would have caused cascading failures under load. The problem is infrastructure mistakes are expensive and scary, so now I'm triple-checking everything AI suggests. That overhead is significant—I'd estimate I spend 50% more time reviewing AI-generated infrastructure code than I would spend just writing it myself.

**2. Energy/focus/flow:**

For infrastructure work? AI is net negative for my flow. The stakes are too high. I can't afford to zone out and accept suggestions. I'm in "paranoid vigilance" mode the whole time.

I've basically stopped using autocomplete for anything production-critical. I use it for scripts and one-off tooling where mistakes aren't costly.

Not more tired, just differently anxious. There's this nagging "did I miss something the AI got wrong" feeling.

**3. After AI generates code:**

Terraform/IaC: 30% accept, 40% modify, 30% reject
Scripts/tooling: 60% accept, 30% modify, 10% reject
Prod systems: I don't use AI

Review time: 20-30 minutes minimum for anything touching production infrastructure. The cost of a mistake is too high.

**4. Collaboration impact:**

I'm now asking people to mark AI-generated code in PRs, at least for infrastructure. I want to know what needs extra scrutiny. Some people find this insulting ("don't you trust me to review it myself?") but others appreciate the clarity.

Team knowledge sharing might be suffering. We used to have great discussions about "why did you choose this approach" that surfaced tradeoffs. Now sometimes the answer is "AI suggested it and it seemed fine" which... doesn't teach anyone anything.

**5. One thing to fix:**

Liability and verification. I want AI to be able to say "I don't know enough about your prod setup to answer this safely." Right now it just generates something that looks plausible. For high-stakes infrastructure decisions, that's dangerous.

---

## Response 6 - Alex V. (Senior Frontend, Auth UI, 2.5 years)

**1. Task where AI helped vs slowed down:**

Helped: Refactoring our auth form components to use React Hook Form instead of our old custom validation. Cursor basically did 80% of the mechanical work—changing prop names, updating validation schemas, etc. What could have been 2 days was 4 hours.

Slowed down: Implementing passwordless auth flow with WebAuthn. AI kept suggesting patterns from outdated WebAuthn specs and I kept hitting browser compatibility issues. Would have been faster to just read the MDN docs myself. Lost maybe 3 hours.

**2. Energy/focus/flow:**

For refactoring and mechanical changes: AI is amazing, keeps me in flow, less tedious frustration.

For new feature development: It's hit or miss. Sometimes AI suggests an approach I hadn't considered (good!), sometimes it suggests antipatterns we deliberately avoid (bad!).

I feel less creative though? Like I'm leaning on AI for the "first draft" and then editing, rather than thinking through the design myself. Not sure if that's efficient or if I'm atrophying.

**3. After AI generates code:**

I've developed a system:
- Boilerplate/types: Accept 90%, quick scan
- UI components: Accept 60%, check accessibility + design system compliance
- State logic: Accept 20%, rewrite most of it

Time: 3-5 min for simple stuff, 15-20 min for complex components. Always check for a11y issues—AI frequently misses ARIA labels, keyboard nav, focus management.

**4. Collaboration impact:**

Design review has gotten more interesting. Designers now sometimes ask "did you use AI for this?" when components don't quite match mocks. There's a visible difference in the "feel" of hand-crafted vs AI-generated UI.

Pairing: I've noticed I explain my reasoning less when I'm using AI. I'll say "let me try Copilot" instead of talking through my approach. That might be bad for knowledge transfer.

**5. One thing to fix:**

Accessibility by default. AI should know that every interactive element needs keyboard nav, proper ARIA, focus states, etc. Right now it generates "working" UI that fails WCAG. I want it trained specifically on accessible patterns.

---

## Response 7 - Chen W. (Mid-level Backend, Realtime team, 2 years)

**1. Task where AI helped vs slowed down:**

Helped: Converting some of our Elixir code comments into proper ExDoc documentation. Tedious work that AI handled well enough. 90 minutes → 30 minutes.

Slowed down: Debugging a message ordering issue in our Phoenix Channel implementation. I pasted the code into Claude and it suggested refactoring to use a different PubSub pattern that would have broken our at-least-once delivery guarantees. This is the problem with AI and distributed systems—it doesn't understand the subtle invariants we're maintaining.

**2. Energy/focus/flow:**

Flow is worse for Elixir work specifically. Copilot's suggestions are mediocre because there's less Elixir in its training data, so I'm constantly being interrupted by bad suggestions. I've actually turned off autocomplete for .ex files.

For our TypeScript client libraries: flow is better, suggestions are good.

Energy: I'm frustrated that AI works great for some languages and terribly for others. It's making me resentful when I'm in Elixir-land.

**3. After AI generates code:**

Elixir: 10% accept, 30% modify, 60% reject (basically useless)
TypeScript: 50% accept, 35% modify, 15% reject (pretty helpful)
SQL: 40% accept, 40% modify, 20% reject (decent)

For Elixir, I might spend 10 minutes reviewing a suggestion only to realize it misunderstands OTP patterns and I should just write it myself. That's wasted time.

**4. Collaboration impact:**

Language disparity is creating some weird team dynamics. Frontend folks are raving about AI, Elixir/Rust folks are skeptical. Feels like we're having different experiences of the same tool.

In code review, I'm now extra careful when I see idiomatic-looking Elixir code from less experienced team members because it might be AI-generated and subtly wrong.

**5. One thing to fix:**

Better support for less-common languages. Or at least honest about confidence—like, Copilot should tell me "I don't have enough Elixir training data to help much here" instead of confidently suggesting mediocre code.

---

## Response 8 - Tasha B. (Staff Engineer, Platform/API, 4 years)

**1. Task where AI helped vs slowed down:**

Helped: Writing OpenAPI schemas and JSON Schema validators for our new API endpoints. Mind-numbing work that AI crushed. Saved probably 4 hours.

Slowed down: Designing the actual API structure and deciding on resource naming, nesting, error codes. I tried asking ChatGPT for API design advice and it gave me generic REST best practices that didn't account for our specific backwards compatibility requirements or client usage patterns. Waste of time; should have just designed it myself.

**2. Energy/focus/flow:**

For implementation: AI helps
For design/architecture: AI hurts

The problem is these phases are interleaved. I'll be designing something, get distracted by an AI suggestion, implement it, then realize it doesn't fit the overall design. Context switching cost is real.

Energy: I feel productive in the moment (look how fast I'm typing!) but less thoughtful overall. Not sure that's a good trade.

**3. After AI generates code:**

Schema/types: 80% accept
API handlers: 40% accept  
Tests: 70% accept
Design docs: 0% (I don't use AI for design)

I have a rule: if I can't explain why the AI-generated code is correct, I don't merge it. That forces me to actually understand it. This adds 10-15 min review time but prevents bugs.

**4. Collaboration impact:**

RFCs and design docs are still 100% human-written on our team, which is good. I'm worried about teams that use AI to write design docs—you lose the clarification of thought that comes from writing.

Code review: I'm seeing more "this is correct but why did you do it this way?" questions. AI tends to pick one approach without explaining tradeoffs.

**5. One thing to fix:**

Make it better at saying "this is a design decision you should make, not an implementation detail I can help with." Right now it answers every question with code, even when the question is really about tradeoffs or architecture.

---

## Response 9 - Omar H. (Senior DevRel Engineer, 3 years)

**1. Task where AI helped vs slowed down:**

Helped: Writing code examples for docs and tutorials. I can say "show me how to do real-time subscriptions with error handling in JavaScript" and Copilot generates a decent example I can refine. Huge time saver—maybe 50% faster on documentation code.

Slowed down: Creating a demo app for a conference talk. I used Cursor heavily to speed up development, but the code was so... generic? I ended up rewriting half of it to better showcase Supabase patterns and avoid antipatterns. Net time: probably neutral, but quality was worse initially.

**2. Energy/focus/flow:**

For tutorial content: great! Less tedious, more creative energy for the narrative.

For example apps: mixed. AI helps me build faster but I'm less intentional about showing best practices. I have to consciously slow down and review.

Honestly I'm less tired because I spend less time on Stack Overflow and more time in my editor.

**3. After AI generates code:**

For docs/tutorials: I basically treat every AI suggestion as a "first draft" that needs editing for clarity, best practices, and teaching value. Maybe 20-30 min review per code example.

For demo apps: 50/50 accept vs modify. The code works but doesn't always show off Supabase features well.

**4. Collaboration impact:**

Interesting: I'm creating MORE code examples now because the barrier is lower, which our community likes. But I've gotten feedback that some examples feel "copy-pasted" or generic. Working on that.

Collaboration with PMs/docs team: They can't tell what I wrote vs AI, which is good? But sometimes I ship examples with subtle issues because I didn't review carefully enough.

**5. One thing to fix:**

Product-specific context. I want Copilot to know Supabase idioms, common gotchas, and best practices. Like, it should know to always include error handling in examples, or to showcase our realtime features in specific ways. Right now it generates generic Postgres/React code.

---

## Response 10 - Rachel S. (Senior Backend, Extensions, 4 years, Rust focus)

**1. Task where AI helped vs slowed down:**

Helped: Writing Rust tests. Copilot understands Rust test syntax well and can scaffold out property tests, table-driven tests, etc. Probably saves me 30% on test writing time.

Slowed down: Implementing custom Postgres extension code in C. AI is completely useless here. It suggests patterns that don't compile or misunderstands Postgres internals. I've just stopped using it for that work. Didn't slow me down per se, but also zero value added.

**2. Energy/focus/flow:**

Rust: AI is okay for boilerplate but terrible for borrow checker issues or lifetime problems. When I'm wrestling with the compiler, AI suggestions are just noise.

Flow: slightly worse because Rust development is already cognitively demanding and context-switching to review AI suggestions adds overhead.

I'm not more tired, but I'm more annoyed when AI confidently suggests Rust code that doesn't compile.

**3. After AI generates code:**

Rust: 30% accept, 20% modify, 50% reject
Tests: 60% accept, 30% modify, 10% reject

Review time for Rust: 15-20 minutes because I need to reason about memory safety, thread safety, etc. Can't just accept it.

The problem with Rust AI suggestions is they often compile but violate our safety invariants or have performance issues. Reviewing is hard.

**4. Collaboration impact:**

Not much impact. Our Rust team is small and we all have similar skepticism of AI for systems programming. We trust each other's code more than AI code.

One positive: when onboarding someone new to Rust, AI-generated tests can be good learning examples (after I verify they're correct).

**5. One thing to fix:**

Understand compile errors and borrow checker output. Half the time I paste a Rust error into ChatGPT and it suggests a fix that doesn't address the root issue. It's like it's seen Rust syntax but doesn't understand the type system.

---

## Response 11 - Dev K. (Mid-level Full-stack, Dashboard, 1 year)

**1. Task where AI helped vs slowed down:**

Helped: Building out a new data table component with sorting, filtering, pagination. Cursor basically built the whole thing from my description—generated TypeScript types, React Table setup, Tailwind styles. 6-hour task → 2 hours.

Slowed down: Adding real-time updates to that same table using Supabase Realtime. AI kept suggesting polling-based approaches or websocket libraries instead of our Realtime SDK. I ended up in our docs and Slack for the right approach. Added maybe 90 minutes.

**2. Energy/focus/flow:**

Way better for UI work. I used to get bogged down in "how do I structure this component" analysis paralysis. Now I just describe it and iterate on what AI gives me. More time in creative/design mode, less time in implementation hell.

For backend/API work: neutral to slightly worse. AI suggestions feel less reliable.

Energy: Same or slightly better? Fewer "ugh I don't want to write this form validation" moments.

**3. After AI generates code:**

UI components: Accept 70%, quick review for design system compliance
TypeScript types: Accept 85%, very quick
React hooks: Accept 40%, careful review
API integration: Accept 25%, usually need to adjust

Review time: 5 min for simple components, 15 min for complex state logic, 25 min for anything touching data integrity.

**4. Collaboration impact:**

I'm asking fewer questions in our eng Slack, which I think is bad for team bonding? I used to get to know people by asking for help. Now I ask AI first.

Code reviews: sometimes I'll ask "did you use AI for this?" when something feels off. Not sure if that's offensive or just pragmatic.

**5. One thing to fix:**

Integration with our internal tools. AI doesn't know our component library, our Supabase client wrapper functions, our auth patterns. I'm constantly converting generic code to use our specific abstractions.

---

## Response 12 - Yuki T. (Junior Frontend, Growth team, 5 months)

**1. Task where AI helped vs slowed down:**

Helped: Everything CSS and Tailwind. I'm still learning responsive design and Copilot basically teaches me as I go. "Oh that's how you do mobile-first breakpoints." Probably would take me 2x longer without it.

Slowed down: Understanding our app's state management. I accepted an AI suggestion for updating Zustand state and it worked but I didn't understand why. My mentor caught it in code review and made me rewrite it to understand the pattern. That probably added a day to the task but I learned a lot.

**2. Energy/focus/flow:**

Confidence: way up. I don't feel like an imposter as much because I can actually ship features.

But... learning: maybe down? I worry I'm not building fundamentals. My mentor told me to turn off Copilot for one week per month to force myself to struggle and learn. I hate it but it's probably smart.

Energy: I'm less frustrated day-to-day but more anxious about whether I actually know what I'm doing.

**3. After AI generates code:**

Honestly I probably accept 70-80% of suggestions because I don't always know what's wrong with them. I'm getting better at reviewing but it's hard when you're junior.

Review time: maybe 5-10 minutes? But that's because I'm not reviewing deeply enough. Working on this.

**4. Collaboration impact:**

I ask fewer questions which means I learn less from seniors. That's bad. I'm trying to balance "be self-sufficient" with "ask for help to learn."

Also I think some seniors judge me for using AI too much? Or maybe that's in my head. There's definitely a vibe of "back in my day we read the docs."

**5. One thing to fix:**

Learning mode. Like, AI could quiz me: "I'm going to suggest this code, but first explain why you think this approach works." Force me to think before I accept. Right now it's too easy to just tab-complete my way through work without learning.

---

## Response 13 - James L. (Staff Engineer, Postgres Core, 7 years)

**1. Task where AI helped vs slowed down:**

Helped: Documentation and SQL migration scripts. Repetitive, well-understood patterns. AI is fine at this. Saves maybe 20-30% time.

Slowed down: Optimizing Postgres queries and explaining plans. I tried using ChatGPT to analyze a slow query explain plan and it gave completely wrong advice (suggested rewriting a join in a way that would table scan). AI doesn't understand Postgres optimizer internals or our specific data distribution. Any time I try to use it for actual database engineering, it's a waste.

**2. Energy/focus/flow:**

For Postgres work: I've turned off AI entirely. It's distracting and wrong often enough that it's net negative.

For auxiliary tasks (docs, scripts, tooling): mildly helpful.

Energy: Slightly more frustrated because colleagues using AI for database work sometimes ship things that look right but have performance cliffs. Then I have to fix it.

**3. After AI generates code:**

SQL migrations: 40% accept, 60% modify (mostly formatting/style)
Postgres extensions: 0% (don't use AI)
Docs: 70% accept
Perf-critical queries: 0% (don't use AI)

When I do use AI, review time is 20-30 min because I'm paranoid about correctness.

**4. Collaboration impact:**

Frustration: When someone asks me to review AI-generated database code, I have to spend extra time understanding their intent because they might not fully understand the code themselves. In traditional code review, I can assume the author reasoned through it.

Knowledge transfer: Suffering. We used to have great discussions about query optimization strategies. Now sometimes people just ask ChatGPT and ship whatever it suggests.

**5. One thing to fix:**

Database-specific reasoning. Current AI is trained on StackOverflow answers and blog posts, which often contain outdated or wrong Postgres advice. I want AI that understands: query planner behavior, index selectivity, vacuum, connection pooling, replication lag, etc. Right now it's dangerously superficial.

---

## Response 14 - Zoe M. (Senior Backend, API/Functions, 3 years)

**1. Task where AI helped vs slowed down:**

Helped: Writing TypeScript types for our new GraphQL schema. Mechanical transformation work that Copilot handled great. 3 hours → 45 minutes.

Slowed down: Implementing rate limiting for our edge functions. AI suggested a simple in-memory approach that would break in a distributed environment. I had to research proper distributed rate limiting (with Redis), which I would have known to do immediately if I'd just designed it myself. Wasted about 2 hours.

**2. Energy/focus/flow:**

Honestly the quality of AI suggestions varies so much that I'm in a constant state of "is this going to be good or is it going to waste my time?" That uncertainty is cognitively draining.

Flow: worse for complex work, better for boilerplate.

I'm more tired at the end of the day because I'm reviewing code all day instead of writing it.

**3. After AI generates code:**

I've gotten disciplined about this:
- If it's <20 lines: Accept and quick review (2-3 min)
- If it's >20 lines: Read every line carefully (10-20 min)
- If it's distributed systems code: Don't use AI at all

Accept rate: maybe 50% overall. The other 50% gets modified or scrapped.

**4. Collaboration impact:**

I've started asking teammates to mark in their PRs: "I used AI for X and Y, reviewed carefully" just for context. Helps me calibrate my review.

Pairing: Definitely slower when someone is using AI heavily. Too much "let's try this AI suggestion... no wait... try another prompt..." It's faster to just talk through the design.

**5. One thing to fix:**

Distributed systems awareness. AI needs to understand: race conditions, network partitions, eventual consistency, idempotency. Right now it thinks everything is a single-process app. That's dangerous at our scale.

---

## Response 15 - Kieran P. (Principal Engineer, OSS/DX, 5 years)

**1. Task where AI helped vs slowed down:**

Helped: Updating our client library examples for a breaking API change. We have examples in JS, Python, Dart, Swift, Kotlin. AI helped me port the JS changes to other languages I'm less fluent in. Saved probably 6 hours.

Slowed down: Responding to a complex GitHub issue about auth edge cases. I tried using ChatGPT to help formulate a response and it gave a technically correct but tone-deaf answer that would have frustrated the community. I ended up writing it myself. Lost 30 minutes.

**2. Energy/focus/flow:**

For mechanical tasks: AI is great, less cognitive load.

For community engagement, API design, developer experience decisions: AI is harmful. These require empathy, context, and judgment that AI doesn't have.

Energy: I'm less burned out on tedious work, but I also feel less ownership over code? Like, when I write every line myself, I have pride in it. When AI writes it and I review it, it feels... hollow.

**3. After AI generates code:**

Multi-language examples: 60% accept across languages, more modification needed for languages I don't know well
OSS contributions: 30% accept (community has high standards)
Internal tools: 80% accept (lower stakes)

Review time: 10-15 min for examples, 30+ min for anything user-facing or API design.

**4. Collaboration impact:**

Community impact is interesting. I think some community members can tell when our responses or code examples are AI-generated and they don't like it. There's an authenticity issue.

Internally: I worry we're becoming less thoughtful about DX because we can generate code quickly. Speed doesn't equal quality in developer experience work.

**5. One thing to fix:**

Context and judgment. For developer-facing work (docs, APIs, examples, community engagement), AI should be a writing assistant, not a decision maker. I want it to help me express my ideas, not generate ideas for me. Right now the UX pushes toward "AI generates, you review" when it should be "you design, AI helps implement."