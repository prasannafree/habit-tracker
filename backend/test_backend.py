"""
Unit and integration tests for the FastAPI backend.
Uses standard library unittest and FastAPI TestClient.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db

client = TestClient(app)


class TestHabitTrackerBackend(unittest.TestCase):
    def setUp(self):
        init_db()

    def test_health(self):
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "ok")

    def test_create_and_delete_habit(self):
        # Create
        res = client.post(
            "/api/habits",
            json={
                "name": "Evening Yoga",
                "targetMinutes": 30,
                "description": "Relaxation",
                "dateKey": "2026-10-24",
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        habit_id = data["habit"]["id"]
        self.assertEqual(data["habit"]["name"], "Evening Yoga")
        self.assertEqual(data["record"]["habitNameSnapshot"], "Evening Yoga")

        # List
        list_res = client.get("/api/habits")
        self.assertEqual(list_res.status_code, 200)
        habits = list_res.json()
        self.assertTrue(any(h["id"] == habit_id for h in habits))

        # Delete
        del_res = client.delete(f"/api/habits?id={habit_id}&dateKey=2026-10-24")
        self.assertEqual(del_res.status_code, 200)

        # Verify deleted
        list_after = client.get("/api/habits").json()
        self.assertFalse(any(h["id"] == habit_id for h in list_after))

    def test_invalid_habit_inputs(self):
        # Empty name
        res = client.post("/api/habits", json={"name": "   ", "targetMinutes": 30})
        self.assertEqual(res.status_code, 400)

        # Zero target
        res = client.post("/api/habits", json={"name": "Read", "targetMinutes": 0})
        self.assertEqual(res.status_code, 422)

        # Target over 1440
        res = client.post("/api/habits", json={"name": "Read", "targetMinutes": 1500})
        self.assertEqual(res.status_code, 422)

    def test_settings_flow(self):
        update_res = client.put(
            "/api/settings",
            json={
                "displayName": "Prasanna Test",
                "greetingName": "Prasanna",
                "dailyGoalMinutes": 45,
                "theme": "dark",
            },
        )
        self.assertEqual(update_res.status_code, 200)

        get_res = client.get("/api/settings")
        self.assertEqual(get_res.status_code, 200)
        s = get_res.json()
        self.assertEqual(s["displayName"], "Prasanna Test")
        self.assertEqual(s["theme"], "dark")
        self.assertEqual(s["dailyGoalMinutes"], 45)

    def test_timer_sync(self):
        timer_payload = {
            "runningHabitId": "test-habit-id",
            "sessionStartedAt": 1729700000000,
            "accumulatedMs": {"test-habit-id": 120000},
        }
        res = client.put("/api/timer", json=timer_payload)
        self.assertEqual(res.status_code, 200)

        get_res = client.get("/api/timer")
        self.assertEqual(get_res.status_code, 200)
        t = get_res.json()
        self.assertEqual(t["runningHabitId"], "test-habit-id")
        self.assertEqual(t["accumulatedMs"]["test-habit-id"], 120000)


if __name__ == "__main__":
    unittest.main()
