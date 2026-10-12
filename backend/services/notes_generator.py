"""Heuristic ("mock AI") meeting-notes generator.

Real speech-to-text and LLM summarisation are out of scope for this project, so
notes for uploaded transcripts are derived deterministically from the text:

* keywords  - most frequent meaningful words / two-word phrases
* chapters  - the transcript split into evenly sized blocks, titled by keyword
* action items - sentences containing commitment phrases ("I'll", "we need to"...)
* overview  - who met, what was covered, and the commitments made
"""

import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Optional, Sequence

from services.transcript_parser import ParsedSegment

STOPWORDS = set(
    """
    a about above after again against all also am an and any are aren't as at be because been before being
    below between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down
    during each few for from further get got had hadn't has hasn't have haven't having he he'd he'll he's her
    here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its
    itself just let's like me more most mustn't my myself no nor not now of off on once only or other ought
    our ours ourselves out over own really right same shan't she she'd she'll she's should shouldn't so some
    such than that that's the their theirs them themselves then there there's these they they'd they'll
    they're they've think this those through to too under until up us very was wasn't we we'd we'll we're
    we've were weren't what what's when when's where where's which while who who's whom why why's will with
    won't would wouldn't yeah yes you you'd you'll you're you've your yours yourself yourselves okay ok sure
    great good thanks thank going go know want need make one two also well thing things maybe actually
    something look looks let lets see said say mean kind lot bit still even back come next week today
    send share update review start finish add work take talk made done discuss discussed agree agreed
    team everyone people call meeting meetings tomorrow monday tuesday wednesday thursday friday morning
    afternoon quick quickly first last part sounds nice idea point honestly sure plan already today's
    every within open time times line lines
    question questions start started keep using use used put give show tell ask asked able many much
    """.split()
)

ACTION_PATTERNS = re.compile(
    r"\b(i'll|i will|we'll|we will|we need to|we should|i can|can you|could you|"
    r"please|action item|follow up|by (monday|tuesday|wednesday|thursday|friday|end of))\b",
    re.IGNORECASE,
)
ASSIGN_TO_OTHER = re.compile(r"\b(can|could) you\b", re.IGNORECASE)


@dataclass
class GeneratedChapter:
    title: str
    start_seconds: float
    summary: str


@dataclass
class GeneratedActionItem:
    title: str
    assignee: Optional[str]
    source_start_seconds: float


@dataclass
class GeneratedNotes:
    summary: str
    topics: list[str] = field(default_factory=list)
    chapters: list[GeneratedChapter] = field(default_factory=list)
    action_items: list[GeneratedActionItem] = field(default_factory=list)


def _words(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z][a-z'\-]+", text.lower()) if w not in STOPWORDS and len(w) > 2]


def extract_keywords(texts: Sequence[str], limit: int = 5) -> list[str]:
    unigrams: Counter = Counter()
    bigrams: Counter = Counter()
    for text in texts:
        words = _words(text)
        unigrams.update(words)
        bigrams.update(f"{a} {b}" for a, b in zip(words, words[1:]))

    keywords: list[str] = []
    for phrase, count in bigrams.most_common():
        if count < 2 or len(keywords) >= limit // 2:
            break
        keywords.append(phrase)
    for word, _count in unigrams.most_common():
        if len(keywords) >= limit:
            break
        if not any(word in phrase.split() for phrase in keywords):
            keywords.append(word)
    return [k.title() for k in keywords]


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def _clean_action(sentence: str) -> str:
    sentence = re.sub(r"^(so|and|okay|ok|alright|great|yeah|then)[,\s]+", "", sentence, flags=re.IGNORECASE)
    sentence = sentence.rstrip(".!? ")
    return sentence[:1].upper() + sentence[1:]


def extract_action_items(segments: Sequence[ParsedSegment], limit: int = 8) -> list[GeneratedActionItem]:
    items: list[GeneratedActionItem] = []
    seen: set[str] = set()
    speakers = [s.speaker for s in segments]
    for index, segment in enumerate(segments):
        for sentence in _sentences(segment.text):
            if not ACTION_PATTERNS.search(sentence) or sentence.endswith("?") and not ASSIGN_TO_OTHER.search(sentence):
                continue
            if len(sentence.split()) < 4:
                continue
            title = _clean_action(sentence)
            if title.lower() in seen:
                continue
            seen.add(title.lower())
            assignee: Optional[str] = segment.speaker
            if ASSIGN_TO_OTHER.search(sentence):
                # "Can you ..." is addressed to the next person who speaks.
                assignee = next((s for s in speakers[index + 1:] if s != segment.speaker), None)
            items.append(GeneratedActionItem(title=title, assignee=assignee, source_start_seconds=segment.start_seconds))
            if len(items) >= limit:
                return items
    return items


def build_chapters(segments: Sequence[ParsedSegment], max_chapters: int = 5) -> list[GeneratedChapter]:
    if not segments:
        return []
    count = max(1, min(max_chapters, len(segments) // 4 or 1))
    size = -(-len(segments) // count)  # ceiling division
    chapters: list[GeneratedChapter] = []
    used_titles: set[str] = set()
    for start in range(0, len(segments), size):
        block = segments[start:start + size]
        keywords = [k for k in extract_keywords([s.text for s in block], limit=4) if k not in used_titles]
        title = " & ".join(keywords[:2]) if keywords else f"Discussion part {len(chapters) + 1}"
        used_titles.update(keywords[:2])
        first_sentence = _sentences(block[0].text)[0] if block[0].text else ""
        speakers = sorted({s.speaker for s in block})
        summary = f"{', '.join(speakers)} discussed {title.lower()}. {first_sentence}".strip()
        chapters.append(GeneratedChapter(title=title, start_seconds=block[0].start_seconds, summary=summary))
    return chapters


def _join_names(names: Sequence[str]) -> str:
    names = list(names)
    if len(names) <= 1:
        return "".join(names)
    return f"{', '.join(names[:-1])} and {names[-1]}"


def generate_notes(segments: Sequence[ParsedSegment]) -> GeneratedNotes:
    if not segments:
        return GeneratedNotes(summary="")
    topics = extract_keywords([s.text for s in segments], limit=5)
    chapters = build_chapters(segments)
    action_items = extract_action_items(segments)
    speakers = list(dict.fromkeys(s.speaker for s in segments))

    parts = [
        f"{_join_names(speakers)} met to discuss {_join_names([t.lower() for t in topics[:3]]) or 'the agenda'}."
    ]
    if len(chapters) > 1:
        parts.append(
            "The conversation moved through "
            + _join_names([c.title.lower() for c in chapters])
            + "."
        )
    if action_items:
        owners = _join_names(sorted({a.assignee for a in action_items if a.assignee}))
        noun = "action item was" if len(action_items) == 1 else "action items were"
        parts.append(f"{len(action_items)} {noun} captured" + (f", owned by {owners}." if owners else "."))
    return GeneratedNotes(summary=" ".join(parts), topics=topics, chapters=chapters, action_items=action_items)
