// 12 deterministic SYNTHETIC cases. No real patient data.
// cat: symptoms | vitals | history (always shown); tests have cat labs | imaging | vitals (requested on demand).
// key:true on a test = clinically useful to request. probes = conditions the test can confirm/rule out.
const S = (label, ...tags) => ({ cat: 'symptoms', label, tags });
const V = (label, ...tags) => ({ cat: 'vitals', label, tags });
const H = (label, ...tags) => ({ cat: 'history', label, tags });
const T = (id, label, cat, result, tags, probes, key = false) => ({ id, label, cat, result, tags, probes, key });

const CASES = [
  { id: 'c1', age: 67, gender: 'Male', complaint: 'Cough and fever for 4 days', difficulty: 1, diagnosis: 'pneumonia', judgeRole: 'Easy case: correct diagnosis',
    findings: [S('Fever 38.9°C', 'fever'), S('Productive cough, yellow sputum', 'productive_cough'), S('Breathless on exertion', 'dyspnea'), V('SpO2 91% on room air', 'low_spo2'), V('Heart rate 104 bpm', 'tachycardia'), V('Respiratory rate 24/min'), H('Former smoker (20 pack-years)'), H('Hypertension')],
    medications: ['Amlodipine 5 mg'],
    tests: [T('cxr', 'Chest X-ray', 'imaging', 'Right lower lobe consolidation', ['cxr_consolidation'], ['pneumonia', 'viral'], true), T('cbc', 'CBC', 'labs', 'WBC 15.2 ×10⁹/L (high)', ['wbc_high'], ['pneumonia', 'viral'], true), T('chestexam', 'Chest auscultation', 'vitals', 'Crackles at right base', ['crackles'], ['pneumonia', 'asthma'])],
    explanation: 'Fever, productive cough and hypoxia point to a lower respiratory infection; imaging showing lobar consolidation confirms bacterial pneumonia.' },
  { id: 'c2', age: 24, gender: 'Female', complaint: 'Burning when urinating', difficulty: 1, diagnosis: 'uti',
    findings: [S('Burning urination for 2 days', 'dysuria'), S('Urinary frequency', 'freq_urination'), S('Suprapubic discomfort', 'suprapubic'), V('Temperature 37.2°C'), V('Heart rate 78 bpm'), H('No previous UTIs'), H('Sexually active')],
    medications: ['Combined oral contraceptive'],
    tests: [T('urine', 'Urinalysis', 'labs', 'Nitrite positive, leukocyte esterase positive', ['urine_nitrite'], ['uti'], true), T('cbc', 'CBC', 'labs', 'WBC normal', [], ['uti'])],
    explanation: 'Classic lower urinary tract symptoms without fever or flank pain; positive nitrite supports uncomplicated cystitis.' },
  { id: 'c3', age: 29, gender: 'Female', complaint: 'Wheezing and breathlessness after cleaning the attic', difficulty: 1, diagnosis: 'asthma',
    findings: [S('Audible wheeze', 'wheeze'), S('Chest tightness and breathlessness', 'dyspnea'), S('Dry cough', 'dry_cough'), S('Dust exposure before onset', 'trigger_exposure'), V('SpO2 94%'), V('Respiratory rate 22/min'), H('Childhood asthma', 'hx_asthma')],
    medications: ['Salbutamol inhaler as needed'],
    tests: [T('peakflow', 'Peak flow', 'vitals', '48% of predicted', ['peak_flow_low'], ['asthma'], true), T('cxr', 'Chest X-ray', 'imaging', 'Clear lung fields', ['cxr_clear'], ['pneumonia', 'asthma'])],
    explanation: 'Trigger exposure, wheeze and a known asthma history; markedly reduced peak flow confirms airflow obstruction.' },
  { id: 'c4', age: 31, gender: 'Female', complaint: 'Severe headache with light sensitivity', difficulty: 2, diagnosis: 'migraine',
    findings: [S('Throbbing one-sided headache', 'headache', 'unilateral'), S('Sensitivity to light', 'photophobia'), S('Nausea', 'nausea'), S('Zigzag visual disturbance before headache', 'aura'), V('Temperature 36.8°C'), V('BP 118/76'), H('Similar episodes since age 19; mother has migraines', 'hx_migraine')],
    medications: ['None'],
    tests: [T('neuro', 'Neurological exam', 'vitals', 'Normal, no neck stiffness', ['neuro_normal'], ['migraine'], true)],
    explanation: 'Unilateral throbbing headache with aura, photophobia and a family history; normal neurology and no fever argue against serious secondary causes.' },
  { id: 'c5', age: 22, gender: 'Male', complaint: 'Vomiting and diarrhoea since last night', difficulty: 2, diagnosis: 'gastro',
    findings: [S('Vomited 5 times', 'vomiting'), S('Watery diarrhoea', 'diarrhea'), S('Crampy abdominal pain', 'abd_cramps'), S('Two friends ill after the same street-food meal', 'stool_sick_contact'), V('Temperature 37.8°C'), V('Heart rate 96 bpm'), V('Mucous membranes moist'), H('Otherwise healthy')],
    medications: ['None'],
    tests: [T('creat', 'Creatinine', 'labs', 'Normal', ['creat_normal'], ['dehydration', 'gastro'], true), T('cbc', 'CBC', 'labs', 'WBC normal', [], ['gastro'])],
    explanation: 'Acute vomiting and diarrhoea with a shared meal exposure; normal renal function shows he is not significantly dehydrated.' },
  { id: 'c6', age: 45, gender: 'Male', complaint: 'Tiredness and dizziness for 2 weeks', difficulty: 3, diagnosis: 'anemia', judgeRole: 'Ambiguous case: AI says "not sure"',
    findings: [S('Persistent fatigue', 'fatigue'), S('Dizzy on standing', 'dizzy'), S('Breathless climbing stairs', 'dyspnea'), S('Occasional palpitations', 'palpitations'), V('Heart rate 102 bpm', 'tachycardia'), V('BP 112/70'), V('SpO2 98%'), H('Vegetarian diet'), H('Back pain, takes ibuprofen daily')],
    medications: ['Ibuprofen 400 mg three times daily'],
    tests: [T('cbc', 'CBC', 'labs', 'Haemoglobin 7.9 g/dL (low)', ['hb_low'], ['anemia'], true), T('pallor', 'Pallor exam', 'vitals', 'Conjunctival pallor present', ['pallor'], ['anemia'], true), T('creat', 'Creatinine', 'labs', 'Normal', ['creat_normal'], ['dehydration']), T('glucose', 'Blood glucose', 'labs', '96 mg/dL (normal)', ['glucose_normal'], ['hypoglycemia'])],
    explanation: 'Non-specific symptoms fit several diagnoses. Chronic NSAID use suggests occult blood loss; a low haemoglobin settles it.' },
  { id: 'c7', age: 78, gender: 'Female', complaint: 'Weakness and low-grade fever; eating little', difficulty: 3, diagnosis: 'dehydration', judgeRole: 'Doctor and AI may disagree (fever is a distractor)',
    findings: [S('Poor oral intake for 3 days', 'low_intake'), S('Dizzy on standing', 'dizzy'), S('Mild dry cough', 'dry_cough'), S('Low-grade fever 37.9°C', 'fever'), V('BP 92/58', 'hypotension'), V('Heart rate 108 bpm', 'tachycardia'), V('Dry mucous membranes', 'dry_mucosa'), V('Postural BP drop', 'orthostatic'), V('SpO2 96%'), H('Takes furosemide for ankle swelling')],
    medications: ['Furosemide 40 mg'],
    tests: [T('creat', 'Creatinine', 'labs', '1.9 mg/dL (baseline 0.9)', ['creatinine_high'], ['dehydration'], true), T('cxr', 'Chest X-ray', 'imaging', 'Clear lung fields', ['cxr_clear'], ['pneumonia'])],
    explanation: 'Volume depletion signs (dry membranes, hypotension, postural drop, diuretic) outweigh the mild fever and cough; the creatinine rise confirms it.' },
  { id: 'c8', age: 55, gender: 'Male', complaint: 'Burning upper-chest discomfort after dinner, nausea', difficulty: 4, diagnosis: 'acs', judgeRole: 'Overconfident wrong answer = big penalty (looks like heartburn)',
    findings: [S('Central chest pressure/burning for 40 minutes', 'chest_pain'), S('Nausea with one vomiting episode', 'nausea', 'vomiting'), S('Cold sweat', 'sweating'), V('BP 148/92'), V('Heart rate 92 bpm'), V('SpO2 97%'), H('Diabetes, smoker, father had MI at 52', 'hx_cad'), H('Months of occasional "heartburn"')],
    medications: ['Metformin 500 mg', 'Omeprazole as needed'],
    tests: [T('ecg', 'ECG', 'labs', 'ST elevation in leads II, III, aVF', ['ecg_st'], ['acs', 'gastro'], true), T('trop', 'Troponin', 'labs', 'Elevated 2.4 ng/mL', ['trop_high'], ['acs'], true)],
    explanation: 'Heartburn-like pain after a meal is a classic trap. Risk factors, sweating and ST elevation on ECG make this an inferior-wall heart attack.' },
  { id: 'c9', age: 40, gender: 'Male', complaint: 'Fever and cough for 3 days', difficulty: 3, diagnosis: 'pneumonia', judgeRole: 'New evidence changes AI confidence',
    findings: [S('Fever 38.6°C', 'fever'), S('Dry cough', 'dry_cough'), S('Mild breathlessness', 'dyspnea'), V('SpO2 95%'), V('Heart rate 96 bpm'), V('Respiratory rate 20/min'), H('Healthy non-smoker'), H('Colleague recently had flu')],
    medications: ['None'],
    tests: [T('cxr', 'Chest X-ray', 'imaging', 'Left lower lobe infiltrate', ['cxr_consolidation'], ['pneumonia', 'viral'], true), T('viraltest', 'Rapid viral test', 'labs', 'Negative', ['rapid_viral_neg'], ['viral'], true), T('cbc', 'CBC', 'labs', 'WBC 13.8 ×10⁹/L (high)', ['wbc_high'], ['pneumonia', 'viral'])],
    explanation: 'Initially indistinguishable from a viral illness; the chest X-ray infiltrate and negative viral test shift the balance to pneumonia.' },
  { id: 'c10', age: 62, gender: 'Male', complaint: 'Sweating, shaking and confusion this morning', difficulty: 2, diagnosis: 'hypoglycemia',
    findings: [S('Tremor', 'tremor'), S('Cold sweat', 'sweating'), S('Confused, slow to answer', 'confusion'), V('Heart rate 110 bpm', 'tachycardia'), V('BP 130/80'), H('Type 2 diabetes on insulin', 'insulin_use'), H('Skipped breakfast after taking insulin', 'missed_meal')],
    medications: ['Insulin glargine', 'Mealtime insulin'],
    tests: [T('glucose', 'Blood glucose', 'labs', '42 mg/dL', ['glucose_low'], ['hypoglycemia'], true), T('ecg', 'ECG', 'labs', 'Sinus tachycardia, no ST change', ['ecg_normal'], ['acs'])],
    explanation: 'Insulin plus a missed meal with adrenergic and neuroglycopenic symptoms; glucose of 42 mg/dL confirms it. Treat immediately.' },
  { id: 'c11', age: 66, gender: 'Female', complaint: 'Unusual tiredness and breathlessness since morning', difficulty: 5, diagnosis: 'acs', judgeRole: 'Expert: atypical presentation, information insufficient',
    findings: [S('Marked fatigue', 'fatigue'), S('Shortness of breath', 'dyspnea'), S('Nausea', 'nausea'), S('No chest pain reported'), V('Heart rate 98 bpm'), V('BP 138/84'), V('SpO2 96%'), H('Diabetes 15 years, hypertension, prior coronary stent', 'hx_cad')],
    medications: ['Aspirin', 'Metformin', 'Atorvastatin'],
    tests: [T('trop', 'Troponin', 'labs', 'Elevated 0.9 ng/mL', ['trop_high'], ['acs'], true), T('ecg', 'ECG', 'labs', 'Non-specific T-wave changes', ['ecg_nonspecific'], ['acs'], true), T('cbc', 'CBC', 'labs', 'Haemoglobin 12.6 g/dL (normal)', ['hb_normal'], ['anemia'])],
    explanation: 'Diabetic women often present atypically without chest pain. History of stenting plus raised troponin identifies a heart attack; anaemia is excluded by a normal haemoglobin.' },
  { id: 'c12', age: 34, gender: 'Female', complaint: 'Tiredness and heavy periods', difficulty: 2, diagnosis: 'anemia',
    findings: [S('Ongoing fatigue', 'fatigue'), S('Heavy menstrual bleeding for months', 'heavy_periods'), S('Dizzy when standing up', 'dizzy'), V('Looks pale', 'pallor'), V('Heart rate 100 bpm', 'tachycardia'), V('BP 108/66'), H('No chronic illness')],
    medications: ['None'],
    tests: [T('cbc', 'CBC', 'labs', 'Haemoglobin 8.4 g/dL, low MCV', ['hb_low'], ['anemia'], true), T('glucose', 'Blood glucose', 'labs', '88 mg/dL (normal)', ['glucose_normal'], ['hypoglycemia'])],
    explanation: 'Chronic menstrual blood loss with pallor and fatigue; low haemoglobin with microcytosis confirms iron-deficiency anaemia.' },
];

// The 5 scripted judge cases, in demo order
const JUDGE_SEQUENCE = ['c1', 'c6', 'c7', 'c8', 'c9'];
module.exports = { CASES, JUDGE_SEQUENCE };
