from fastapi.testclient import TestClient


def test_read_patients(client: TestClient):
    response = client.get("/api/v1/patients")
    assert response.status_code == 200
    content = response.json()
    assert isinstance(content, list)
    if len(content) > 0:
        patient = content[0]
        assert "cpf" in patient
        assert "address" in patient
        assert "personal_income" in patient
        assert "family_income" in patient
