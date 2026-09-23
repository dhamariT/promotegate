# PromoteGate

A failure model is promoted only when it beats the model already in production on missed failures, false alarms, and warning time. Training score is not the decision.

The demo fleet is 40 synthetic compressors, hourly. Vibration rises before a failure. The production model is a temperature high-limit at 82°C, which also trips on harmless temperature spikes. Held-out compressors are never used to train or to pick an alarm threshold.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn server:app --port 8841
```

Open http://127.0.0.1:8841. Save the rules, run the agent, and promote only a candidate whose verdict is `promote`.
