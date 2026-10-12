import pytest

from services.transcript_parser import TranscriptParseError, detect_format, parse_timestamp, parse_transcript


@pytest.mark.parametrize(
    ("value", "expected"),
    [("00:12", 12), ("1:02:03", 3723), ("75", 75), (4.5, 4.5), ("00:00:01.500", 1.5), ("00:01,250", 1.25)],
)
def test_parse_timestamp(value, expected):
    assert parse_timestamp(value) == expected


@pytest.mark.parametrize("value", ["abc", -1, "1:xx", True])
def test_parse_timestamp_rejects_invalid(value):
    with pytest.raises(TranscriptParseError):
        parse_timestamp(value)


def test_txt_line_shapes():
    segments = parse_transcript(
        "[00:05] Alice: one\n00:10 Bob: two\nCarol (00:20): three\nDave: four\nplain five"
    )
    assert [(s.speaker, s.text, s.start_seconds) for s in segments[:3]] == [
        ("Alice", "one", 5),
        ("Bob", "two", 10),
        ("Carol", "three", 20),
    ]
    assert segments[3].speaker == "Dave" and segments[3].start_seconds > 20
    assert segments[4].speaker == "Speaker 1"
    # End times never overlap the next segment.
    assert all(a.end_seconds <= b.start_seconds for a, b in zip(segments, segments[1:]))


def test_vtt_speaker_formats():
    raw = "WEBVTT\n\nNOTE comment\n\n1\n00:00:01.000 --> 00:00:03.000\n<v Ann>Hello</v>\n\n00:00:04.000 --> 00:00:06.000\nBen: Hi there"
    segments = parse_transcript(raw)
    assert [(s.speaker, s.text, s.start_seconds, s.end_seconds) for s in segments] == [
        ("Ann", "Hello", 1, 3),
        ("Ben", "Hi there", 4, 6),
    ]


def test_detect_format():
    assert detect_format("WEBVTT\n\n") == "vtt"
    assert detect_format('[{"text": "x"}]') == "json"
    assert detect_format("[00:01] A: hi") == "txt"


def test_empty_and_invalid_input():
    with pytest.raises(TranscriptParseError):
        parse_transcript("   ")
    with pytest.raises(TranscriptParseError):
        parse_transcript('{"segments": "nope"}', "json")
