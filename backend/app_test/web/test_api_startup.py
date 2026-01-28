from src.core import logger


def test_startup_connection(api_client):
    response = api_client.get("/startup")
    body = response.json()
    logger.debug("This is the startup response %s", body)
    assert response.status_code == 200
    assert response.json() == {"message": "The API is LIVE!!"}
