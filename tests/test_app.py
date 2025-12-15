import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Soccer Team" in data

def test_signup_and_unregister():
    activity = "Soccer Team"
    email = "testuser@mergington.edu"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400

    # Unregister
    response = client.post(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregister again (should fail)
    response = client.post(f"/activities/{activity}/unregister?email={email}")
    assert response.status_code == 400