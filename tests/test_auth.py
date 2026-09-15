from fastapi import status
from tests.conftest import client

def test_register_and_login(client):
    # Test Registration
    reg_payload = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = client.post("/auth/register", json=reg_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "user_id" in data

    # Test Login
    login_payload = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    # OAuth2PasswordRequestForm uses form data, not JSON
    response = client.post("/auth/login", data=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    login_payload = {
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/auth/login", data=login_payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.json()["detail"] == "Credenciais inválidas"
