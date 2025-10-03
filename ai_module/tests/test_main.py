import sys
from pathlib import Path

from fastapi.testclient import TestClient
import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from main import app, genai  # noqa: E402

client = TestClient(app)


class DummyResponse:
    def __init__(self, text: str):
        self.text = text


class DummyModel:
    def __init__(self, response_text: str):
        self._response = response_text

    def generate_content(self, *_args, **_kwargs):
        return DummyResponse(self._response)


@pytest.fixture(autouse=True)
def patch_key(monkeypatch):
    monkeypatch.setattr('main.has_gemini_key', lambda: True)


@pytest.fixture
def patched_model(monkeypatch):
    def fake_model(*_args, **_kwargs):
        return DummyModel("Consider isolating the variable on one side.")

    monkeypatch.setattr(genai, 'GenerativeModel', fake_model)
    return fake_model


def test_chat_endpoint(monkeypatch, patched_model):
    response = client.post('/chat', json={'message': 'Explain derivatives.'})
    assert response.status_code == 200
    assert 'response' in response.json()
    assert response.json()['response']


def test_generate_exercise_fallback(monkeypatch):
    monkeypatch.setattr('main.has_gemini_key', lambda: False)
    response = client.post('/generate_exercise', json={'prompt': 'Linear equations'})
    assert response.status_code == 200
    payload = response.json()
    assert 'question' in payload and 'answer' in payload


def test_hint_generation(monkeypatch, patched_model):
    response = client.post(
        '/hint',
        json={
            'stem': 'Solve for x: 3x + 5 = 14',
            'options': [{'key': 'a', 'label': '3'}, {'key': 'b', 'label': '4'}],
            'domain': 'algebra',
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload.get('hint')


def test_hint_requires_stem(patched_model):
    response = client.post('/hint', json={})
    assert response.status_code == 422
