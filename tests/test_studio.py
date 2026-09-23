import pytest

from promotegate.studio import Studio


@pytest.mark.slow
def test_agent_promotes_the_model_that_earns_it_and_refuses_the_rest(tmp_path):
    studio = Studio(tmp_path)
    state = studio.run()
    verdicts = {item["candidate_name"]: item["decision"]["verdict"] for item in state["evaluations"]}
    assert verdicts["XGBoost"] == "promote"
    assert verdicts["Always alarm"] == "reject"
    assert verdicts["Never alarm"] == "reject"
    assert "vibration_rms" in {row["name"] for row in state["explanations"][next(item["candidate_id"] for item in state["evaluations"] if item["candidate_name"] == "XGBoost")]["features"]}

    rejected = next(item for item in state["evaluations"] if item["candidate_name"] == "Always alarm")
    with pytest.raises(PermissionError):
        studio.promote(rejected["id"])

    earned = next(item for item in state["evaluations"] if item["candidate_name"] == "XGBoost")
    studio.promote(earned["id"])
    assert studio.incumbent.name == "XGBoost"
    assert any(record["id"] == earned["id"] and record["promoted"] for record in studio.audit)
