"""Demo workspace content.

Transcripts use the same "[mm:ss] Speaker: text" format users can paste or
upload, and are loaded through services.transcript_parser. Dates are relative
to the day the database is seeded so the library always shows recent meetings.
"""

MEETINGS = [
    {
        "title": "Q4 Product Roadmap Planning",
        "days_ago": 0,
        "start_time": "10:00",
        "duration": "31:20",
        "participants": ["Sneha", "Rahul Mehta", "Priya Nair", "David Chen"],
        "topics": ["Roadmap", "Smart Search", "Mobile App", "Pricing", "Q4 Planning"],
        "summary": (
            "The team aligned on the Q4 roadmap. Smart search across transcripts is the top priority, "
            "followed by a redesigned meeting detail page; the native mobile app moves to Q1 because of "
            "engineering capacity. David shared that enterprise prospects keep asking for SSO, so a scoped "
            "SSO spike was added. Pricing changes for the Business tier will be validated with five "
            "customers before launch. The roadmap will be finalised and shared company-wide on Friday."
        ),
        "chapters": [
            ("Q3 recap and goals for Q4", "00:00", "Sneha recapped Q3 adoption numbers and framed the goal: make finding information in past meetings effortless."),
            ("Prioritising smart search", "04:32", "Rahul outlined the search architecture; the team agreed search ships first in Q4."),
            ("Meeting page redesign", "10:05", "Priya presented the new two-panel meeting page with a sticky player and clickable outline."),
            ("Mobile app and SSO trade-offs", "16:40", "The mobile app moves to Q1; a two-week SSO spike is added for enterprise deals."),
            ("Pricing and next steps", "23:10", "Business-tier pricing will be validated with customers; owners and dates were agreed."),
        ],
        "action_items": [
            ("Write the technical design doc for transcript search", "Rahul Mehta", "07:48", False),
            ("Share high-fidelity meeting page designs for review", "Priya Nair", "13:20", False),
            ("Schedule pricing interviews with five Business-tier customers", "David Chen", "25:02", False),
            ("Finalise and publish the Q4 roadmap", "Sneha", "29:30", False),
            ("Scope a two-week SSO spike", "Rahul Mehta", "19:15", True),
        ],
        "transcript": """
[00:00] Sneha: Good morning everyone. Thanks for joining. The goal today is to lock the Q4 roadmap so we can share it with the company on Friday.
[00:12] Sneha: Quick recap of Q3 first. Weekly active teams grew thirty-one percent, and the number one request in feedback is still better search across old meetings.
[00:31] David Chen: That matches what I hear on sales calls. Prospects love the summaries, but they ask how they would find something a customer said three weeks ago.
[00:48] Rahul Mehta: Today search only matches meeting titles, so that complaint is fair. Transcript text isn't indexed at all.
[01:05] Priya Nair: In the last usability study, four out of six people tried to search for a phrase and gave up when nothing came back.
[01:22] Sneha: So I'd like to propose that smart search is our top priority for Q4. Does anyone disagree?
[01:34] David Chen: No disagreement from me. It also helps renewals because admins can prove the value of the archive.
[02:10] Sneha: Great. Let's also review what else is on the candidate list: the meeting page redesign, the mobile app, SSO, and the pricing update.
[04:32] Rahul Mehta: On search, the plan is to index every transcript segment with the speaker and timestamp, so a result can jump straight to the moment in the recording.
[05:15] Rahul Mehta: We can start with database full-text search and only move to a dedicated search service if latency becomes a problem.
[06:02] Priya Nair: From a design point of view, results should be grouped by meeting and show the matching sentence with the keyword highlighted.
[06:40] Sneha: I like that. Rahul, how long would a first version take?
[07:05] Rahul Mehta: Roughly four weeks for search including the API and the results page, assuming two engineers.
[07:48] Rahul Mehta: I'll write the technical design doc for transcript search this week so we can review it on Monday.
[08:30] David Chen: Could we include filters for participant and date in the first version? Customers always ask for those.
[09:02] Rahul Mehta: Filters are cheap once the index exists, so yes, they can be in version one.
[10:05] Priya Nair: Next is the meeting page redesign. The current page hides the transcript behind a tab, which makes it hard to read notes and the conversation together.
[10:44] Priya Nair: The new layout puts the AI notes on the left, the transcript on the right, and a sticky player at the bottom that follows along as you listen.
[11:30] Sneha: Will the outline in the notes be clickable so I can jump to a chapter?
[11:46] Priya Nair: Yes, every chapter and action item will have a timestamp that seeks the player to the moment it was discussed.
[12:35] Rahul Mehta: The player sync is straightforward. We already store start times for every segment.
[13:20] Priya Nair: I will share the high-fidelity designs for the meeting page by Wednesday for everyone to review.
[14:55] Sneha: Perfect. That keeps the redesign on track to start right after search.
[16:40] Sneha: Now the harder conversation: the mobile app. We promised customers a native app this year.
[17:22] Rahul Mehta: Honestly, with search and the redesign we don't have the capacity to build a native app properly in Q4.
[18:05] David Chen: Mobile matters, but SSO is blocking two enterprise deals right now. If I had to choose, I would take SSO.
[19:15] Rahul Mehta: I can scope a two-week SSO spike to see how much of it we can reuse from the identity provider libraries.
[20:30] Sneha: Then the decision is that the mobile app moves to Q1, and we add the SSO spike to Q4. I'll communicate that to customers who asked.
[21:48] Priya Nair: We should make sure the web app works well on phones in the meantime, at least for reading notes.
[22:20] Sneha: Agreed, let's treat responsive layouts as part of the redesign.
[23:10] David Chen: Last topic is pricing. The proposal is to include unlimited transcript storage in the Business tier and raise the price by two dollars per seat.
[24:05] Sneha: My worry is churn among small teams. What evidence do we have that they will accept it?
[25:02] David Chen: Not enough yet. I'll schedule pricing interviews with five Business-tier customers before we commit.
[26:15] Rahul Mehta: If storage becomes unlimited we should also plan for retention costs on our side.
[27:00] Sneha: Good point. Let's revisit pricing once David has the interview results.
[28:10] Sneha: To summarise: search first, then the meeting page redesign, SSO spike in parallel, mobile in Q1, and pricing pending customer interviews.
[29:30] Sneha: I'll finalise the roadmap document and publish it on Friday. Thanks everyone, this was really productive.
[30:05] David Chen: Thanks Sneha, talk soon.
""",
    },
    {
        "title": "Engineering Sprint 42 Review",
        "days_ago": 1,
        "start_time": "15:30",
        "duration": "26:45",
        "participants": ["Rahul Mehta", "Ananya Rao", "Sneha", "Arjun Patel"],
        "topics": ["Sprint Review", "API Reliability", "Testing", "Deployment", "Performance"],
        "summary": (
            "Sprint 42 closed with 34 of 40 story points delivered. The transcript upload endpoint and "
            "action item API shipped; the flaky integration tests and a slow meeting list query were "
            "the main problems. Arjun traced the slowdown to an N+1 query and will fix it with eager "
            "loading. The team agreed to add request validation tests, enable cascading deletes in "
            "SQLite, and freeze the release branch on Thursday after a full regression pass."
        ),
        "chapters": [
            ("Sprint metrics", "00:00", "Rahul shared velocity and what shipped in Sprint 42."),
            ("Flaky tests and validation", "05:20", "Ananya walked through the failing integration tests and missing request validation."),
            ("Meeting list performance", "11:15", "Arjun found an N+1 query behind slow meeting list responses."),
            ("Release plan", "18:40", "The team agreed on regression testing and a Thursday branch freeze."),
        ],
        "action_items": [
            ("Add API request validation tests", "Ananya Rao", "08:05", False),
            ("Fix the N+1 query on the meeting list with eager loading", "Arjun Patel", "14:30", True),
            ("Enable foreign key cascades in the SQLite configuration", "Rahul Mehta", "16:10", True),
            ("Verify meeting edit and persistence flows end to end", "Sneha", "20:12", False),
            ("Freeze the release branch after the regression pass", "Rahul Mehta", "23:40", False),
        ],
        "transcript": """
[00:00] Rahul Mehta: Okay, let's kick off the Sprint 42 review. We committed to forty story points and delivered thirty-four.
[00:18] Rahul Mehta: The transcript upload endpoint and the action item API both shipped. The two items that slipped are the export feature and the settings page.
[00:45] Sneha: Thirty-four is solid given we lost two days to the deployment issue. What caused the slip on export?
[01:02] Arjun Patel: We underestimated the formatting work. Markdown export is done, but PDF needs a layout pass.
[01:40] Rahul Mehta: Let's carry export into Sprint 43 and keep PDF as a stretch goal.
[02:25] Ananya Rao: Before we move on, I want to flag the integration tests. They failed on about one in five runs this sprint.
[05:20] Ananya Rao: The flaky tests all share a database file, so when two run in parallel they overwrite each other's data.
[06:02] Arjun Patel: We could give every test its own temporary SQLite database. It's cheap and it removes the shared state.
[06:45] Ananya Rao: That fixes flakiness. The bigger gap is that the API accepts invalid requests, like an empty meeting title or a negative timestamp.
[07:20] Sneha: That could easily corrupt data in production. How many endpoints are affected?
[07:38] Ananya Rao: Most of the create and update endpoints. The schemas allow empty strings everywhere.
[08:05] Ananya Rao: I'll add API request validation tests for every create and update endpoint this sprint.
[09:10] Rahul Mehta: Please add the validation in the Pydantic schemas themselves, not just in the tests.
[09:35] Ananya Rao: Yes, schema-level constraints plus tests that prove they reject bad input.
[11:15] Arjun Patel: Next item is performance. The meeting list endpoint takes over two seconds with a hundred meetings.
[11:52] Arjun Patel: I profiled it and it's a classic N+1 problem. We load participants, topics and action items one meeting at a time.
[12:40] Rahul Mehta: So that's three extra queries for every meeting in the list. That explains it.
[13:15] Sneha: Is the fix risky this close to the release?
[13:40] Arjun Patel: Not really. Eager loading with selectin keeps it to four queries total regardless of the number of meetings.
[14:30] Arjun Patel: I will fix the N+1 query with eager loading today and share the before and after timings.
[15:20] Ananya Rao: While we're on the database, deleting a meeting left orphaned action items in local SQLite.
[15:48] Rahul Mehta: SQLite ignores foreign keys unless you turn them on per connection. Postgres was fine, which is why we missed it.
[16:10] Rahul Mehta: I'll enable foreign key cascades in the SQLite configuration and add a test that deletes a meeting.
[17:30] Sneha: Good catch. Data integrity bugs are the worst kind to find after launch.
[18:40] Rahul Mehta: Let's talk release. I'd like a full regression pass before we cut the branch.
[19:22] Ananya Rao: I can run the regression suite Wednesday once the validation work is merged.
[20:12] Sneha: I'll verify the meeting edit and persistence flows end to end, including refreshing the page after every change.
[21:05] Arjun Patel: Should we also test the upload flow with real VTT files from customers?
[21:30] Rahul Mehta: Yes, use the anonymised samples in the shared drive.
[22:15] Sneha: What's our rollback plan if something goes wrong in production?
[22:42] Rahul Mehta: The deployment is atomic on Vercel, so rollback is one click to the previous build.
[23:40] Rahul Mehta: Then the plan is: regression on Wednesday, and I'll freeze the release branch Thursday morning after it passes.
[24:30] Sneha: Sounds good. Thanks all, great sprint despite the hiccups.
[25:10] Arjun Patel: Thanks everyone.
""",
    },
    {
        "title": "Customer Feedback Review: Onboarding",
        "days_ago": 3,
        "start_time": "11:00",
        "duration": "21:30",
        "participants": ["Priya Nair", "Maria Garcia", "Sneha"],
        "topics": ["Customer Feedback", "Onboarding", "Usability", "Transcript Readability"],
        "summary": (
            "Maria and Priya reviewed 48 support tickets and 12 interview notes about onboarding. The "
            "most common problems were not knowing how to upload an existing recording, transcripts that "
            "are hard to scan, and confusion about where action items live. The team agreed to add an "
            "upload step to the onboarding checklist, colour-code speakers in the transcript, and surface "
            "action items on the home page. Success will be measured by activation within seven days."
        ),
        "chapters": [
            ("Feedback themes", "00:00", "Maria summarised the top themes from support tickets and interviews."),
            ("Upload and first-meeting experience", "04:10", "New users don't realise they can upload an existing recording or transcript."),
            ("Transcript readability", "09:30", "Speakers are hard to tell apart; colour-coding and avatars were proposed."),
            ("Action items and success metrics", "14:50", "Action items will be shown on the home page; activation is the success metric."),
        ],
        "action_items": [
            ("Add an upload step to the onboarding checklist", "Priya Nair", "07:20", False),
            ("Colour-code speakers and add avatars in the transcript", "Priya Nair", "12:05", True),
            ("Show open action items on the home page", "Sneha", "16:35", False),
            ("Build the seven-day activation dashboard", "Maria Garcia", "19:10", False),
        ],
        "transcript": """
[00:00] Maria Garcia: Thanks for making time. I went through forty-eight support tickets and twelve interview notes from the last month, all about onboarding.
[00:22] Maria Garcia: Three themes came up again and again: uploading existing recordings, reading transcripts, and finding action items.
[00:48] Priya Nair: That lines up with what we saw in the usability sessions. Let's take them one at a time.
[01:10] Sneha: Before we dive in, do we know how many new teams drop off in the first week?
[01:28] Maria Garcia: About forty percent of new workspaces never get past their first meeting.
[04:10] Maria Garcia: The first theme is uploads. Many users have old recordings or transcripts and don't realise they can upload them.
[04:45] Priya Nair: The upload option is buried in a menu. Nothing in onboarding points to it.
[05:30] Sneha: Uploading something they already have is the fastest way to show value. They don't need to wait for their next call.
[06:15] Maria Garcia: One customer said, and I quote, I wanted to try it on last week's board meeting but couldn't figure out how.
[07:20] Priya Nair: I'll add an upload step to the onboarding checklist, right after connecting the calendar.
[08:05] Sneha: Let's also accept pasted text. Some people only have a transcript from another tool.
[08:40] Priya Nair: Good idea. Paste, upload a file, or connect a calendar, all from the same screen.
[09:30] Maria Garcia: The second theme is readability. People say long transcripts look like a wall of text.
[10:12] Priya Nair: Speakers all look the same. You have to read the name on every line to know who is talking.
[10:55] Sneha: In the competitor products, each speaker gets a colour and an avatar. It makes scanning much faster.
[11:30] Maria Garcia: Several customers also asked to jump to the moment in the recording from a line in the transcript.
[12:05] Priya Nair: I will colour-code speakers and add avatars in the transcript, and make every line clickable to seek the player.
[13:10] Sneha: And highlight the line that is currently playing, so people can follow along.
[13:45] Priya Nair: Yes, that's part of the same change.
[14:50] Maria Garcia: The last theme is action items. Users can't find them after the meeting unless they open each meeting.
[15:35] Sneha: That's a big one. Action items are the main reason managers use the product.
[16:35] Sneha: I'll make sure open action items show up on the home page, with a link back to the meeting they came from.
[17:20] Priya Nair: We should also let people tick them off right there without opening the meeting.
[18:00] Maria Garcia: How will we know these changes work?
[18:30] Sneha: Activation within seven days is the clearest metric. A team counts as activated when they review a meeting and complete an action item.
[19:10] Maria Garcia: I'll build the seven-day activation dashboard so we have a baseline before anything ships.
[20:05] Priya Nair: Great. Let's regroup in two weeks with the first designs.
[20:40] Maria Garcia: Thanks both.
""",
    },
    {
        "title": "Acme Corp Discovery Call",
        "days_ago": 5,
        "start_time": "16:00",
        "duration": "36:10",
        "participants": ["David Chen", "Maria Garcia", "Laura Kim"],
        "topics": ["Sales", "Discovery", "Security", "Integrations", "Pricing"],
        "summary": (
            "David and Maria ran a discovery call with Laura Kim, Head of Operations at Acme Corp. Acme "
            "runs around 300 customer calls a week across Zoom and Google Meet and loses context when "
            "account managers change. Their must-haves are searchable transcripts, CRM sync with "
            "Salesforce, and SSO; data residency in the EU is a strong preference. Laura will bring "
            "their security lead to a technical deep dive next week, and David will send a security "
            "questionnaire and a pilot proposal for 25 seats."
        ),
        "chapters": [
            ("Introductions and Acme's context", "00:00", "Laura described Acme's customer success team and their meeting volume."),
            ("Current pain points", "05:40", "Context is lost when account managers change; notes are inconsistent."),
            ("Requirements: search, CRM and SSO", "12:30", "Must-haves are transcript search, Salesforce sync and SSO."),
            ("Security and data residency", "20:15", "Acme prefers EU data residency and needs a security review."),
            ("Pilot proposal and next steps", "28:00", "A 25-seat pilot was proposed with a technical deep dive next week."),
        ],
        "action_items": [
            ("Send the security questionnaire and SOC 2 report to Acme", "David Chen", "24:30", False),
            ("Prepare a 25-seat pilot proposal", "David Chen", "29:40", False),
            ("Invite Acme's security lead to the technical deep dive", "Laura Kim", "31:15", False),
            ("Confirm EU data residency options with engineering", "Maria Garcia", "22:50", False),
        ],
        "transcript": """
[00:00] David Chen: Hi Laura, thanks for taking the time today. I'm David, and I'm joined by Maria from our customer success team.
[00:14] Laura Kim: Nice to meet you both. I'm Head of Operations at Acme, and I look after our customer success organisation.
[00:32] Maria Garcia: To start, could you tell us a bit about how your team runs customer calls today?
[00:45] Laura Kim: Sure. We have about forty account managers, and together they run roughly three hundred customer calls a week.
[01:10] Laura Kim: Most calls are on Zoom, but a few large customers insist on Google Meet.
[01:35] David Chen: And how are those calls documented right now?
[01:50] Laura Kim: Honestly, inconsistently. Some people write great notes in Salesforce, others write two lines or nothing at all.
[05:40] Laura Kim: The real pain shows up when an account changes hands. The new manager has no idea what was promised in previous calls.
[06:22] Maria Garcia: We hear that a lot. Do you have an example of what that has cost you?
[06:50] Laura Kim: Last quarter we nearly lost a renewal because a discount promised on a call was never written down.
[07:40] David Chen: That's exactly the situation where a searchable archive pays for itself.
[08:15] Laura Kim: Searchable is the key word. I want to type a customer name and a phrase and find the exact moment.
[09:05] Maria Garcia: Our transcripts are searchable across all meetings, and every result jumps to the timestamp in the recording.
[12:30] Laura Kim: Let me list our must-haves. First, search across every transcript. Second, it has to sync with Salesforce.
[13:12] David Chen: Is the Salesforce sync about attaching notes to the account, or about updating fields too?
[13:35] Laura Kim: Mainly attaching the summary and action items to the opportunity. Field updates would be a bonus.
[14:20] Laura Kim: Third, single sign-on. Our IT team won't approve any tool without SSO.
[15:05] David Chen: SSO is on our roadmap for this quarter. I can share the timeline once engineering finishes their scoping.
[16:30] Maria Garcia: How do your account managers prefer to receive action items after a call?
[17:02] Laura Kim: In Slack, ideally. That's where they spend the day.
[20:15] Laura Kim: The other thing I have to raise is security. We have many European customers.
[20:48] David Chen: Do you require data to be stored in the EU, or is it a preference?
[21:10] Laura Kim: It's a strong preference today, and it may become a requirement next year.
[22:50] Maria Garcia: I'll confirm our EU data residency options with engineering and get back to you this week.
[23:40] Laura Kim: Thank you. Our security lead will also want to see your compliance documentation.
[24:30] David Chen: I'll send you the security questionnaire responses and our SOC 2 report right after this call.
[28:00] David Chen: Given what you've shared, I'd suggest a pilot with one team before a wider rollout.
[28:45] Laura Kim: That makes sense. Our enterprise team of twenty-five would be the natural place to start.
[29:40] David Chen: Great. I'll prepare a twenty-five seat pilot proposal with success criteria based on what you described.
[30:25] Maria Garcia: We'd also run a short onboarding session for the pilot team in the first week.
[31:15] Laura Kim: Perfect. I'll invite our security lead to a technical deep dive next week so we can move quickly.
[32:30] David Chen: Does Tuesday or Wednesday afternoon work better for that session?
[32:50] Laura Kim: Wednesday afternoon works.
[34:10] David Chen: Wonderful. Thanks again Laura, we'll follow up today with everything we discussed.
[34:30] Laura Kim: Thank you both, this was helpful.
""",
    },
    {
        "title": "Weekly Team Stand-up",
        "days_ago": 7,
        "start_time": "09:30",
        "duration": "14:20",
        "participants": ["Sneha", "Rahul Mehta", "Ananya Rao", "Priya Nair", "Arjun Patel"],
        "topics": ["Stand-up", "Deployment", "Blockers", "Design"],
        "summary": (
            "Quick weekly sync. The backend deployment to production succeeded but CORS was blocking "
            "the frontend domain; Rahul fixed it during the meeting. Ananya is finishing the transcript "
            "player, Priya is wrapping up the onboarding designs, and Arjun is on support rotation. "
            "The only blocker was waiting on the production database credentials, which Sneha will "
            "share securely after the call."
        ),
        "chapters": [
            ("Updates: backend and deployment", "00:00", "Rahul reported the production deployment and a CORS issue."),
            ("Updates: frontend and design", "03:45", "Ananya and Priya shared progress on the player and onboarding designs."),
            ("Blockers and priorities", "08:30", "Database credentials were the only blocker; priorities for the week were confirmed."),
        ],
        "action_items": [
            ("Add the production frontend domain to the CORS allow-list", "Rahul Mehta", "01:50", True),
            ("Share production database credentials through the password manager", "Sneha", "09:10", True),
            ("Document remaining deployment issues in the tracker", "Arjun Patel", "11:20", False),
            ("Test frontend interactions on the production build", "Ananya Rao", "12:15", False),
        ],
        "transcript": """
[00:00] Sneha: Morning all, let's keep this quick. Rahul, do you want to start?
[00:08] Rahul Mehta: Sure. The backend is deployed to production and the health check is green.
[00:25] Rahul Mehta: The problem is the frontend can't call it yet. The browser blocks requests because of CORS.
[00:50] Arjun Patel: Is the production domain in the allowed origins list?
[01:05] Rahul Mehta: No, only localhost is in there right now. That's the issue.
[01:50] Rahul Mehta: I'll add the production frontend domain to the CORS allow-list right after this call. It's a one-line change.
[02:30] Sneha: Thanks. Let's make the allowed origins an environment variable so we don't hardcode it again.
[02:52] Rahul Mehta: Good idea, I'll do that at the same time.
[03:45] Ananya Rao: On the frontend, the transcript player is almost done. Clicking a line seeks the player, and the current line is highlighted.
[04:30] Ananya Rao: I'm still working on auto-scrolling the transcript while the meeting plays.
[05:10] Priya Nair: The onboarding designs are ninety percent done. I'll share them for review on Thursday.
[05:48] Sneha: Nice. Arjun, how's support rotation going?
[06:05] Arjun Patel: Quiet so far. Two tickets about uploading VTT files, both resolved.
[08:30] Sneha: Any blockers?
[08:42] Ananya Rao: I'm waiting on the production database credentials to test the full flow against real data.
[09:10] Sneha: I'll share the production database credentials through the password manager right after the call. Please never paste them in chat.
[10:05] Rahul Mehta: Also a reminder that the env files must stay out of git.
[10:40] Arjun Patel: Should I write up the deployment issues we hit this week so we don't repeat them?
[11:20] Arjun Patel: Okay, I'll document the remaining deployment issues in the tracker today.
[12:15] Ananya Rao: Once the CORS fix is live, I'll test the frontend interactions on the production build.
[13:05] Sneha: Perfect. Thanks everyone, have a good week.
""",
    },
    {
        "title": "Design Review: Transcript Experience",
        "days_ago": 10,
        "start_time": "14:00",
        "duration": "27:40",
        "participants": ["Priya Nair", "Ananya Rao", "Sneha"],
        "topics": ["Design Review", "Transcript", "Media Player", "Accessibility", "Dark Mode"],
        "summary": (
            "Priya presented the new transcript experience: a notes panel beside the transcript, "
            "colour-coded speakers, in-transcript search with match navigation, and a sticky player "
            "with a speaker timeline. Ananya raised performance concerns for very long transcripts, so "
            "the team will render efficiently and auto-scroll only while the user isn't reading elsewhere. "
            "Accessibility feedback led to keyboard shortcuts for play and pause and better contrast. "
            "Dark mode was approved as a follow-up."
        ),
        "chapters": [
            ("Layout walkthrough", "00:00", "Priya walked through the two-panel layout and the sticky player."),
            ("Search within the transcript", "06:20", "Matches are highlighted with next and previous navigation."),
            ("Performance on long meetings", "12:10", "Strategies for long transcripts and smart auto-scroll."),
            ("Accessibility and dark mode", "18:30", "Keyboard controls, contrast fixes and a dark theme follow-up."),
        ],
        "action_items": [
            ("Add keyboard shortcuts for play, pause and skip", "Ananya Rao", "19:40", False),
            ("Fix colour contrast on timestamps and secondary text", "Priya Nair", "21:05", True),
            ("Pause auto-scroll while the user scrolls the transcript", "Ananya Rao", "15:20", False),
            ("Create dark mode tokens for the design system", "Priya Nair", "24:30", False),
        ],
        "transcript": """
[00:00] Priya Nair: Thanks for joining the design review. Today I want feedback on the new transcript experience.
[00:15] Priya Nair: The page is split in two. AI notes on the left with the summary, outline and action items, and the full transcript on the right.
[00:48] Priya Nair: The player sits at the bottom of the screen and stays visible while you scroll.
[01:20] Sneha: I really like that the notes and the conversation are visible at the same time.
[01:45] Ananya Rao: Does the player show who was speaking when?
[02:05] Priya Nair: Yes, the seek bar has a speaker timeline, so you can see each person's turns as coloured blocks.
[03:10] Sneha: What happens when I click a chapter in the outline?
[03:25] Priya Nair: The player jumps to the start of that chapter and the transcript scrolls to the matching line.
[06:20] Priya Nair: Next, search within the transcript. Matches are highlighted in yellow, and there's a counter like three of twelve.
[06:58] Ananya Rao: Can you move between matches with the keyboard?
[07:15] Priya Nair: Enter goes to the next match and shift enter goes to the previous one.
[08:02] Sneha: Should search hide the lines that don't match?
[08:20] Priya Nair: I'd keep the full transcript visible so people keep the context around a match.
[09:10] Ananya Rao: Agreed, filtering made it confusing in the old version.
[12:10] Ananya Rao: My main concern is performance. Some customers have meetings over two hours with thousands of lines.
[12:52] Ananya Rao: Re-rendering every line on each tick of the player will get slow.
[13:30] Priya Nair: Could we only update the line that becomes active?
[13:48] Ananya Rao: Yes, if each line is a memoised component, only the previous and next active lines re-render.
[14:35] Sneha: And the auto-scroll? It's annoying when you're reading something and the page jumps.
[15:20] Ananya Rao: I'll pause auto-scroll while the user scrolls the transcript, and show a button to resume following the player.
[16:10] Priya Nair: That's a nice pattern. We can label it follow along.
[18:30] Sneha: Let's talk accessibility. Can someone use this page without a mouse?
[18:58] Ananya Rao: Not yet. The player only works with clicks today.
[19:40] Ananya Rao: I'll add keyboard shortcuts for play, pause and skipping fifteen seconds forward or back.
[20:30] Priya Nair: I also checked contrast, and the timestamps and secondary text fail the guidelines.
[21:05] Priya Nair: I'll fix the colour contrast on timestamps and secondary text this week.
[22:15] Sneha: Last thing: several users asked for dark mode, especially people who review calls in the evening.
[23:00] Priya Nair: If we move our colours to design tokens, dark mode becomes mostly a token swap.
[24:30] Priya Nair: I'll create dark mode tokens for the design system as a follow-up.
[25:40] Sneha: Great work Priya, this is a big improvement. Let's ship it.
[26:10] Ananya Rao: Thanks, I'll start implementation tomorrow.
""",
    },
]
