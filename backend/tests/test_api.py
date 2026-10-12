PASTED_TRANSCRIPT = """[00:00] Sneha: Let's review the launch checklist.
[00:20] Rahul Mehta: I'll update the deployment runbook by Friday.
[00:45] Sneha: Can you also share the release notes with marketing?
[01:05] Rahul Mehta: Sure, I will share them today."""


def test_health(client):
    assert client.get("/health").json() == {"status": "healthy"}


def test_list_meetings_sorted_newest_first(client):
    meetings = client.get("/meetings").json()
    assert len(meetings) == 6
    dates = [m["started_at"] for m in meetings]
    assert dates == sorted(dates, reverse=True)
    assert client.get("/meetings", params={"sort": "oldest"}).json()[0]["id"] == meetings[-1]["id"]
    # List items are lightweight: no transcript segments.
    assert "segments" not in meetings[0]


def test_filters(client):
    by_text = client.get("/meetings", params={"q": "eager loading"}).json()
    assert [m["title"] for m in by_text] == ["Engineering Sprint 42 Review"]

    by_participant = client.get("/meetings", params={"participant": "Laura Kim"}).json()
    assert [m["title"] for m in by_participant] == ["Acme Corp Discovery Call"]

    by_topic = client.get("/meetings", params={"topic": "Pricing"}).json()
    assert {m["title"] for m in by_topic} == {"Q4 Product Roadmap Planning", "Acme Corp Discovery Call"}

    mine = client.get("/meetings", params={"mine": True}).json()
    assert all(any(p["name"] == "Sneha" for p in m["participants"]) for m in mine)
    assert len(mine) == 5


def test_meeting_detail_has_relations(client):
    meeting_id = client.get("/meetings").json()[0]["id"]
    detail = client.get(f"/meetings/{meeting_id}").json()
    assert len(detail["segments"]) > 20
    assert detail["chapters"] and detail["action_items"] and detail["topics"]
    starts = [s["start_seconds"] for s in detail["segments"]]
    assert starts == sorted(starts)
    assert client.get("/meetings/99999").status_code == 404


def test_create_meeting_from_pasted_transcript_generates_notes(client):
    response = client.post(
        "/meetings",
        json={"title": "Launch sync", "participants": ["Sneha"], "transcript_text": PASTED_TRANSCRIPT, "source": "paste"},
    )
    assert response.status_code == 201
    meeting = response.json()
    assert [s["start_seconds"] for s in meeting["segments"]] == [0, 20, 45, 65]
    assert {p["name"] for p in meeting["participants"]} == {"Sneha", "Rahul Mehta"}
    assert meeting["summary"] and meeting["topics"] and meeting["chapters"]
    owners = {item["assignee"]["name"] for item in meeting["action_items"] if item["assignee"]}
    # "Can you also share..." is assigned to the next speaker (Rahul).
    assert "Rahul Mehta" in owners


def test_create_meeting_from_vtt_and_json(client):
    vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\n<v Priya Nair>We need to fix the build.</v>\n"
    meeting = client.post("/meetings", json={"title": "VTT", "transcript_text": vtt, "source": "upload"}).json()
    assert meeting["segments"][0]["speaker"]["name"] == "Priya Nair"
    assert meeting["segments"][0]["end_seconds"] == 4

    data = '[{"speaker": "A", "text": "hello", "start": "0:05"}, {"speaker": "B", "text": "hi", "start": 9}]'
    meeting = client.post("/meetings", json={"title": "JSON", "transcript_text": data, "source": "upload"}).json()
    assert [s["start_seconds"] for s in meeting["segments"]] == [5, 9]


def test_create_validation(client):
    assert client.post("/meetings", json={"title": "   "}).status_code == 422
    bad = client.post("/meetings", json={"title": "x", "transcript_text": '{"segments": 3}', "transcript_format": "json"})
    assert bad.status_code == 422
    assert "Could not read transcript" in bad.json()["detail"]


def test_update_meeting_metadata(client):
    meeting_id = client.get("/meetings").json()[0]["id"]
    updated = client.patch(
        f"/meetings/{meeting_id}",
        json={"title": "Renamed", "participants": ["Sneha", " sneha ", "New Person"], "topics": ["Tag"]},
    ).json()
    assert updated["title"] == "Renamed"
    assert sorted(p["name"] for p in updated["participants"]) == ["New Person", "Sneha"]
    assert [t["name"] for t in updated["topics"]] == ["Tag"]


def test_replace_transcript(client):
    meeting_id = client.get("/meetings").json()[0]["id"]
    updated = client.put(
        f"/meetings/{meeting_id}/transcript",
        json={"transcript_text": "Zed: First.\nSneha: Second.", "regenerate_notes": True},
    ).json()
    assert [s["speaker"]["name"] for s in updated["segments"]] == ["Zed", "Sneha"]


def test_action_item_crud(client):
    meeting_id = client.get("/meetings").json()[0]["id"]
    created = client.post(
        f"/meetings/{meeting_id}/action-items", json={"title": "  Write tests ", "assignee_name": "Sneha"}
    ).json()
    assert created["title"] == "Write tests" and created["assignee"]["name"] == "Sneha"

    done = client.patch(f"/action-items/{created['id']}", json={"completed": True, "assignee_name": ""}).json()
    assert done["completed"] and done["completed_at"] and done["assignee"] is None

    open_items = client.get("/action-items", params={"status": "open"}).json()
    assert created["id"] not in {item["id"] for item in open_items}

    assert client.post(f"/meetings/{meeting_id}/action-items", json={"title": ""}).status_code == 422
    assert client.delete(f"/action-items/{created['id']}").status_code == 204
    assert client.patch(f"/action-items/{created['id']}", json={}).status_code == 404


def test_highlights_and_comments(client):
    meeting_id = client.get("/meetings").json()[0]["id"]
    segment_id = client.get(f"/meetings/{meeting_id}").json()["segments"][0]["id"]
    assert client.patch(f"/segments/{segment_id}", json={"is_highlighted": True}).json()["is_highlighted"]
    comment = client.post(f"/segments/{segment_id}/comments", json={"body": "Nice"}).json()
    assert comment["author"] == "Sneha"
    assert client.delete(f"/comments/{comment['id']}").status_code == 204


def test_delete_meeting_cascades(client):
    meeting_id = client.get("/meetings").json()[0]["id"]
    assert client.delete(f"/meetings/{meeting_id}").status_code == 204
    assert client.get(f"/meetings/{meeting_id}").status_code == 404
    assert all(item["meeting_id"] != meeting_id for item in client.get("/action-items").json())
    assert all(hit["meeting_id"] != meeting_id for hit in client.get("/search", params={"q": "the"}).json()["hits"])


def test_global_search_and_stats(client):
    result = client.get("/search", params={"q": "renewal"}).json()
    assert result["total"] == 2
    assert {hit["meeting_title"] for hit in result["hits"]} == {"Q4 Product Roadmap Planning", "Acme Corp Discovery Call"}

    stats = client.get("/stats").json()
    assert stats["meetings"] == 6 and stats["action_items_open"] > 0
