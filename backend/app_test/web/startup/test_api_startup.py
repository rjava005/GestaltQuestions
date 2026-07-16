import pytest
def test_startup_connection(api_client) -> None:
    response = api_client.get("/health/live")
    body = response.json()
    assert response.status_code == 200
    assert response.json() == {
        "message": "The API is LIVE!!",
        "status": "ok",
        "service": "backend",
    }


def test_database_health(api_client) -> None:
    response = api_client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data
    assert data.get("status") == "ok"
    assert data.get("database") == "connected"

@pytest.mark.usefixtures("firebase_app_for_tests")
def test_firebase_health(api_client,) -> None:
    response = api_client.get("health/firebase")

    assert response.status_code == 200

    data = response.json()
    assert data
    assert data.get("status") == "ok"
    assert data.get("firebase") == "initialized"
