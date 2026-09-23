# METALLICADOUR runs, 23 September 2026

Two training runs on the public ABB IRB 6660 recordings (METALLICADOUR, 272 files, 25.6 kHz current, force, torque, and vibration).

## First run

Each file became one summary row. Whole setups were held out, and the cut recipe (depth, feed, spindle speed) was not given to the model. Held-out faults: 53.

LightGBM missed 0/53 and false-alarmed on 92.9% of healthy recordings. XGBoost missed 0/53 and false-alarmed on 100%. The gate rejected both. The scores on held-out healthy recordings matched the fault scores. The model had memorized setups it was not shown at training time. There were enough faults to decide. The decision was reject.

## Second run

The cut recipe was added as input. Held-out rows are new recordings of setups the model has already seen, not brand-new speeds. Held-out faults: 55. Production model: a vibration RMS limit at 174.4, which missed 43/55 faults and false-alarmed on 15.4% of healthy recordings.

| Candidate | Missed faults | False alarms | Verdict |
| --- | --- | --- | --- |
| LightGBM | 4/55 | 0% | promote |
| XGBoost | 41/55 | 15.4% | reject |
| Always alarm | 0/55 | 100% | reject |
| Never alarm | 55/55 | 0% | reject |

LightGBM is the only model that cleared the pinned rules: fewer missed faults than production, and no false alarms on the held-out healthy recordings. It has not been promoted. The gate only records that promotion is allowed.

Warning time is still not in this dataset. The recordings are labeled health snapshots, not a countdown to a failure.
