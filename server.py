import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from promotegate.studio import Studio

ROOT = Path(__file__).resolve().parent
studio = Studio(ROOT / "var")
DEMO_PATH = ROOT / "web" / "demo.json"
if DEMO_PATH.exists():
    studio.load_demo(json.loads(DEMO_PATH.read_text()))
app = FastAPI(title="PromoteGate")
app.mount("/static", StaticFiles(directory=ROOT / "web"), name="static")


class RulesBody(BaseModel):
    min_held_out_failures: int
    max_false_alarm_rate: float
    false_alarm_allowance: float
    min_median_lead_hours: float
    max_lead_regression_hours: float
    min_lead_improvement_hours: float


class PromoteBody(BaseModel):
    evaluation_id: str


@app.get("/")
def index():
    return FileResponse(ROOT / "web" / "index.html")


@app.get("/api/state")
def state():
    return studio.state()


@app.put("/api/rules")
def update_rules(body: RulesBody):
    try:
        return studio.update_rules(body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/run")
def run_agent():
    try:
        return studio.run()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/promote")
def promote(body: PromoteBody):
    try:
        return studio.promote(body.evaluation_id)
    except PermissionError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Unknown evaluation") from exc
