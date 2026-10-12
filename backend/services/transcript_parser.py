"""Parse uploaded / pasted transcripts into timed, speaker-labelled segments.

Supported formats
-----------------
txt   One utterance per line. Accepted line shapes:
          [00:12] Speaker: text      [1:02:03] Speaker: text
          00:12 Speaker: text        Speaker (00:12): text
          Speaker: text              plain text (speaker "Speaker 1")
      Lines without a timestamp are placed after the previous one, using an
      estimated speaking rate.
vtt   WebVTT cues. Speaker from "<v Name>text" or "Name: text".
json  A list of {speaker, text, start|timestamp|time, end?} objects, or
      {"segments": [...]} wrapping such a list. Times may be seconds or "mm:ss".
"""

import json
import re
from dataclasses import dataclass
from typing import Optional

WORDS_PER_SECOND = 2.5
MIN_SEGMENT_SECONDS = 2.0
DEFAULT_SPEAKER = "Speaker 1"


class TranscriptParseError(ValueError):
    pass


@dataclass
class ParsedSegment:
    speaker: str
    text: str
    start_seconds: float
    end_seconds: float = 0.0


_TIME = r"(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?"
_TXT_PATTERNS = [
    # [00:12] Speaker: text   /   00:12 - Speaker: text
    re.compile(rf"^\[?(?P<time>{_TIME})\]?\s*[-–]?\s*(?P<speaker>[^:]{{1,60}}):\s*(?P<text>.+)$"),
    # Speaker (00:12): text   /   Speaker [00:12]: text
    re.compile(rf"^(?P<speaker>[^:(\[]{{1,60}}?)\s*[(\[](?P<time>{_TIME})[)\]]\s*:?\s*(?P<text>.+)$"),
    # Speaker: text
    re.compile(r"^(?P<speaker>[A-Za-z][\w .'\-]{0,59}):\s*(?P<text>.+)$"),
    # [00:12] text  (no speaker)
    re.compile(rf"^\[?(?P<time>{_TIME})\]?\s+(?P<text>.+)$"),
]
_VTT_CUE_TIME = re.compile(rf"^(?P<start>{_TIME})\s+-->\s+(?P<end>{_TIME})")
_VTT_VOICE = re.compile(r"^<v(?:\.[^ >]*)?\s+(?P<speaker>[^>]+)>(?P<text>.*?)(?:</v>)?$")


def parse_timestamp(value) -> float:
    """Convert seconds (int/float/numeric string) or "[hh:]mm:ss[.ms]" to seconds."""
    if isinstance(value, bool):
        raise TranscriptParseError(f"Invalid timestamp: {value!r}")
    if isinstance(value, (int, float)):
        if value < 0:
            raise TranscriptParseError("Timestamps cannot be negative")
        return float(value)
    if isinstance(value, str):
        text = value.strip().replace(",", ".")
        try:
            return parse_timestamp(float(text))
        except ValueError:
            pass
        parts = text.split(":")
        if 2 <= len(parts) <= 3:
            try:
                numbers = [float(part) for part in parts]
            except ValueError:
                numbers = None
            if numbers is not None and all(n >= 0 for n in numbers):
                total = 0.0
                for number in numbers:
                    total = total * 60 + number
                return total
    raise TranscriptParseError(f"Invalid timestamp: {value!r}")


def _estimate_duration(text: str) -> float:
    return max(MIN_SEGMENT_SECONDS, len(text.split()) / WORDS_PER_SECOND)


def _finalise(segments: list[ParsedSegment]) -> list[ParsedSegment]:
    """Sort by start time and fill in missing / inconsistent end times."""
    if not segments:
        raise TranscriptParseError("No transcript lines could be read from the input")
    segments.sort(key=lambda s: s.start_seconds)
    for index, segment in enumerate(segments):
        next_start = segments[index + 1].start_seconds if index + 1 < len(segments) else None
        if segment.end_seconds <= segment.start_seconds:
            estimated = segment.start_seconds + _estimate_duration(segment.text)
            segment.end_seconds = min(estimated, next_start) if next_start and next_start > segment.start_seconds else estimated
    return segments


def _parse_txt(raw: str) -> list[ParsedSegment]:
    segments: list[ParsedSegment] = []
    cursor = 0.0
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        speaker, text, start = DEFAULT_SPEAKER, line, None
        for pattern in _TXT_PATTERNS:
            match = pattern.match(line)
            if match:
                groups = match.groupdict()
                text = groups["text"].strip()
                speaker = (groups.get("speaker") or DEFAULT_SPEAKER).strip()
                if groups.get("time"):
                    start = parse_timestamp(groups["time"])
                break
        if not text:
            continue
        if start is None:
            start = cursor
        segments.append(ParsedSegment(speaker=speaker, text=text, start_seconds=start))
        cursor = start + _estimate_duration(text)
    return _finalise(segments)


def _parse_vtt(raw: str) -> list[ParsedSegment]:
    segments: list[ParsedSegment] = []
    blocks = re.split(r"\r?\n\s*\r?\n", raw.strip())
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        timing_index = next((i for i, line in enumerate(lines) if _VTT_CUE_TIME.match(line)), None)
        if timing_index is None:
            continue  # header, NOTE or STYLE block
        timing = _VTT_CUE_TIME.match(lines[timing_index])
        start = parse_timestamp(timing.group("start"))
        end = parse_timestamp(timing.group("end"))
        speaker, parts = DEFAULT_SPEAKER, []
        for line in lines[timing_index + 1:]:
            voice = _VTT_VOICE.match(line)
            if voice:
                speaker = voice.group("speaker").strip()
                line = voice.group("text")
            else:
                named = re.match(r"^([A-Za-z][\w .'\-]{0,59}):\s*(.+)$", line)
                if named and not parts:
                    speaker, line = named.group(1).strip(), named.group(2)
            line = re.sub(r"<[^>]+>", "", line).strip()
            if line:
                parts.append(line)
        if parts:
            segments.append(ParsedSegment(speaker=speaker, text=" ".join(parts), start_seconds=start, end_seconds=end))
    return _finalise(segments)


def _parse_json(raw: str) -> list[ParsedSegment]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise TranscriptParseError(f"Invalid JSON: {exc.msg} (line {exc.lineno})") from exc
    if isinstance(data, dict):
        data = data.get("segments") or data.get("transcript") or data.get("sentences")
    if not isinstance(data, list):
        raise TranscriptParseError('JSON must be a list of segments or {"segments": [...]}')

    segments: list[ParsedSegment] = []
    cursor = 0.0
    for index, item in enumerate(data):
        if not isinstance(item, dict):
            raise TranscriptParseError(f"Segment {index + 1} must be an object")
        text = str(item.get("text") or "").strip()
        if not text:
            continue
        speaker = str(item.get("speaker") or item.get("speaker_name") or DEFAULT_SPEAKER).strip()
        raw_start = next((item[key] for key in ("start", "start_time", "timestamp", "time") if key in item), None)
        start = parse_timestamp(raw_start) if raw_start is not None else cursor
        raw_end = next((item[key] for key in ("end", "end_time") if key in item), None)
        end = parse_timestamp(raw_end) if raw_end is not None else 0.0
        segments.append(ParsedSegment(speaker=speaker, text=text, start_seconds=start, end_seconds=end))
        cursor = max(end, start + _estimate_duration(text))
    return _finalise(segments)


def detect_format(raw: str) -> str:
    stripped = raw.lstrip("﻿").lstrip()
    if stripped.upper().startswith("WEBVTT"):
        return "vtt"
    if stripped[:1] in "[{":
        try:
            json.loads(stripped)
            return "json"
        except json.JSONDecodeError:
            pass
    return "txt"


def parse_transcript(raw: str, fmt: Optional[str] = "auto") -> list[ParsedSegment]:
    raw = (raw or "").lstrip("﻿")
    if not raw.strip():
        raise TranscriptParseError("Transcript is empty")
    fmt = detect_format(raw) if fmt in (None, "", "auto") else fmt
    parsers = {"txt": _parse_txt, "vtt": _parse_vtt, "json": _parse_json}
    if fmt not in parsers:
        raise TranscriptParseError(f"Unsupported transcript format: {fmt}")
    return parsers[fmt](raw)
