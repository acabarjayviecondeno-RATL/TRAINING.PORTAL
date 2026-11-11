# Training Portal — KPI Process & Computation

Hango sa code ng `ST.html`, `ST_Content_Developer.html`, `ST_SES_NSO_CX.html`, `ST_SPlus_Expert_Admin.html`, `SEPCO.html` at Apps Script.
(Kasama ang **bagong Efficiency formula**.)

---

## 1. Buong Proseso (Flow)

1. **Monthly Plan** — itinatakda ang mga content/task/others/training ng user para sa buwan (Title, Category, Category 2, Frequency per Month, Duration per Min).
2. **Daily Plan / Daily Actual** — araw-araw na plano at aktwal na oras ng ginawa (Title, Date, Start/End, Duration).
3. **File Upload (Approval Requests)** — ina-upload ang tapos na CONTENT para ma-approve.
4. **Approval flow**
   - Bagong upload → **Pending RTO** (kung may RTO approver) o diretso **Pending SEPCO**.
   - RTO approve → **Pending SEPCO** → SEPCO approve → **Approved** (final).
   - Reject (kailangan ng remarks) → **Rejected by RTO / SEPCO**.
   - **Resubmit** → bumabalik sa Pending RTO (o SEPCO), nabubura ang lumang remarks.
   - Puwedeng mag-approve/reject sa email o Telegram; ang *kasalukuyang assigned approver* lang ang may karapatan.
5. **KPI Inputs** (manual, ng admin) — CONTENT ERRORS, SO ACH, SOCMED, TRAINING, atbp.
6. **Leave / Absent Log** — bawat leave day = 480 mins; nagbabawas sa plan.
7. **KPI Landing Page** — kinukuwenta ang bawat component → i-cap sa 100% → i-multiply sa weight → **Total KPI Score**.

### Kailan bibilangin ang content?
- **CONTENT** ay binibilang **lang kapag Approved** (may Approval Date, o may Approved file na tugma ang pangalan).
- Dapat tugma sa Monthly Plan (file name vs Title; kung wala, approval category vs Category). Kung walang tugma o lampas sa Target = **PLUS / extra** (bibilangin pa rin sa Own Content, Ach %, at Productivity).
- Ang file na may "proofread" sa pangalan/category ay **Proof**, hindi **Own**. `Total = Own + Proof`.
- Exact duplicate na Daily Actual row (parehong petsa, title, start/end, duration) = 1 lang.
- Monthly Plan row na walang Frequency = **1**; walang Duration = **480 mins**.

---

## 2. Mga Basic na Bilang

| Term | Kahulugan |
|---|---|
| **Target** | Σ Frequency ng lahat ng Monthly Plan rows na bucket = CONTENT (bawas leave/absent) |
| **Own** | Bilang ng Approved na content (hindi proofread) |
| **Revisions** | Bilang ng **Rejected** files na tugma sa CONTENT ng Monthly Plan. Ang reject na wala sa plan ay **hindi** binibilang |
| **W/o revisions** | `max(0, Total approved − Revisions)` |
| **On-time (content)** | Approved content na ang Daily Actual duration ay nasa loob ng Daily Plan duration |
| **Bucket** | *Category 2* muna ang tinitingnan (CONTENT / TASK / OTHERS / TRAINING); kung wala, *Category* |

---

## 3. Mga Formula ng KPI Components

### 3.1 Target Count (Ach %)
```
Ach % = Own Content ÷ Target
```
Walang Target = "—" (walang data).

### 3.2 Accuracy (Quality)
```
Accuracy = (Target − Revisions) ÷ Target − Error Deduction      (min 0%)
Error Deduction = ceil(Content Errors ÷ 2) × 1%
```
Errors: 1–2 = −1%, 3–4 = −2%, 5–6 = −3% …
Halimbawa: Target 10, Revisions 2, Errors 3 → 80% − 2% = **78%**.

### 3.3 Efficiency ⭐ (BAGONG FORMULA)
```
Efficiency = W/o revisions ÷ Target          (max 100%)
W/o revisions = Total approved − Revisions
```
Halimbawa (Content Developer, Oct 2026): Target 16, W/o revisions 4 → **25%**.
> Dati: `(On-time − Revisions) ÷ Target`. Hindi na ginagamit ang On-time dito.
> Sa **SEPCO Overview table**, ibang sukat pa rin: *Daily Plan mins ÷ Daily Actual mins*.

### 3.4 Timeliness (On-time)
```
Timeliness = Daily Actual mins ÷ Daily Plan mins   (parehong buwan)
```
- Daily Plan: bawat row na may Title; walang duration = 480 mins.
- Daily Actual: rows na may Title at duration. CONTENT = kapag approved lang; TASK/OTHERS = laging kasama.
- **On Time / Late** (hiwalay na bilang): bawat unique Daily Plan item (user + petsa + title). Actual ≤ Plan = On Time; Actual > Plan = Late.

### 3.5 Productivity
```
Productivity = Counted Actual mins ÷ (Monthly Plan mins − Leave days × 480)
Designated Minutes = (Working days − Leave) × 480
```
- **Plan < Designated** → actuals na wala sa plan ay hindi bibilangin; Productivity ≤ 100%.
- **Plan ≥ Designated** → actuals na wala sa plan ay idinadagdag; puwedeng lumampas sa 100%.
- CONTENT ay approved **at** nasa plan; TASK/OTHERS/TRAINING = unique unit na nasa target count ng plan line.

---

## 4. Weights (Job Group)

| Component | Content Developer | SES / NSO / CX | S+ Expert / Admin |
|---|---|---|---|
| Target Count | 20% | 20% | 20% |
| Accuracy | 20% | 15% | 15% |
| Efficiency | 10% | 15% | 15% |
| Timeliness | 20% | 20% | 15% |
| Productivity | 30% | 30% | 35% |
| **Total** | **100%** | **100%** | **100%** |

Ang Job Group ay galing sa *JOB GROUP* column ng user account sheet.

---

## 5. Total KPI Score

```
Capped value  = min(value, 100%)           (bawat component)
Total (Capped)   = Σ ( Capped value × Weight )
Total (Uncapped) = Σ ( value × Weight )
```
- Kapag **walang data** ang isang component (hal. walang Target), hindi ito ibibilang na 0 — **ine-exclude** at **ni-re-scale ang natitirang weights sa 100%**.

### KPI Band (batay sa Capped)
| Capped Score | Band |
|---|---|
| ≥ 141% | 141% & up |
| 121–140% | 121–140% |
| 101–120% | 101–120% |
| 80–100% | 80–100% |
| < 80% | Below 80% |

Kulay sa table: 🟢 ≥100% · 🟠 80–99% · 🔴 <80%.

---

## 6. Halimbawa — Content Developer, October 2026

Target 16 · Approved total 10 · Revisions 6 · W/o revisions 4

| KPI | Value | Weight | Score |
|---|---|---|---|
| Target Count | 62.5% | 20% | 12.5% |
| Accuracy | 62.5% | 20% | 12.5% |
| Efficiency (luma: 0%) | **25%** (4 ÷ 16) | 10% | **2.5%** (dati 0%) |
| Timeliness | 105.7% → cap 100% | 20% | 20% |
| Productivity | 153% → cap 100% | 30% | 30% |
| **Total** | | | **77.5%** (dati 75%) |

---

## 7. Leave / Absent

- Bawat leave/absent day = **480 mins**.
- Pumipili ng Plan Task; ang frequency nito ay mababawasan ng `480 ÷ duration per min` (hal. 60 min → −8×).
- Nagbabawas sa: Productivity plan, Designated Minutes, Target days.
- **Working days** = lahat ng araw ng buwan maliban Linggo at PH holidays (01-01, 04-09, 05-01, 06-12, 08-21, 08-26, 11-01, 11-02, 11-30, 12-08, 12-24, 12-25, 12-30, 12-31).
- Sa SEPCO, **Approved** na leave lang ang binibilang.

---

## 8. SEPCO User Summary

```
Revised     = Approved file na may naunang Rejected na parehong file name
netApproved = max(0, Approved − Revised)
Achievement = netApproved ÷ Target
```
Halimbawa: Approved 9, Revised 2, Target 10 → net 7 → **70%**.

---

## 9. SNS Boosting

- **Target TTL** = Heart + Share + Views (inilagay). **Actual TTL** = diggs + shares + plays. **ACH% = Actual ÷ Target × 100**.
- Isang TikTok video = isang submit lang kada buwan; kailangan ng screenshot proof.

**Boosting only**

| ACH% | SCORE% |
|---|---|
| ≥2001 | 180 |
| 501–2000 | 150 |
| 101–500 | 100 |
| 85–100 | 95 |
| 75–84 | 90 |
| 50–74 | 80 |
| 31–49 | 70 |
| 21–30 | 60 |
| 11–20 | 50 |
| 1–10 | 25 |

Special: Actual TTL ≥ 100,000 (o lamang ng ≥100,000 sa target) = **200**.

**Creation + boosting**

| ACH% | SCORE% |
|---|---|
| ≥500 | 200 |
| 400–499 | 180 |
| 300–399 | 150 |
| 200–299 | 120 |
| 100–199 | 100 |
| 90–99 | 90 |
| 80–89 | 80 |
| 70–79 | 70 |
| 60–69 | 60 |
| 50–59 | 50 |
| >0–49 | 25 |

---

## 10. Category Plan vs Actual

- Isang row bawat Category 2. **Target** = Σ Frequency. **Actual** = bilang ng unique *title + petsa* (CONTENT = Approved lang).
- Status: 0 = *Not done* · mas mababa sa target = *In progress* · abot/lampas = *Done*.
- **Overall Plan Completion** = Σ min(actual, target) ÷ Σ target.
- **Target days** = working days − leave · **Actual days** = total Actual mins ÷ 480.
