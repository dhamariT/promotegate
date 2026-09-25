import pytest

from promotegate.studio import Studio


@pytest.mark.slow
def test_agent_promotes_the_model_that_earns_it_and_refuses_the_rest(tmp_path):
    studio = Studio(tmp_path)
    state = studio.run()
    verdicts = {item["candidate_name"]: item["decision"]["verdict"] for item in state["evaluations"]}

    # The degenerate baselines must never earn promotion, whichever fleet is loaded.
    assert verdicts["Always alarm"] == "reject"
    assert verdicts["Never alarm"] == "reject"

    earned = [item for item in state["evaluations"] if item["decision"]["verdict"] == "promote"]
    assert earned, f"no candidate cleared the pinned rules: {verdicts}"

    rejected = next(item for item in state["evaluations"] if item["candidate_name"] == "Always alarm")
    with pytest.raises(PermissionError):
        studio.promote(rejected["id"])

    winner = earned[0]
    features = {row["name"] for row in state["explanations"][winner["candidate_id"]]["features"]}
    assert any("vibration" in name for name in features)

    studio.promote(winner["id"])
    assert studio.incumbent.name == winner["candidate_name"]
    assert any(record["id"] == winner["id"] and record["promoted"] for record in studio.audit)
