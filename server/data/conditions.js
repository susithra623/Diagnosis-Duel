// Weighted-evidence knowledge base. Each condition lists how strongly a finding "tag"
// supports (+) or argues against (-) it. severity drives the AI's risk level.
// This is a transparent teaching model, NOT a validated clinical model.
const C = (id, name, severity, weights) => ({ id, name, severity, weights });

const CONDITIONS = [
  C('pneumonia', 'Pneumonia', 'Medium', { fever: 1.2, productive_cough: 1.4, dry_cough: 0.3, low_spo2: 1.3, dyspnea: 0.6, wbc_high: 1.0, crackles: 1.5, cxr_consolidation: 3.5, cxr_clear: -3, wheeze: -0.5 }),
  C('viral', 'Viral infection', 'Low', { fever: 0.8, sore_throat: 1.4, myalgia: 1.3, dry_cough: 1.0, congestion: 1.2, rapid_viral_pos: 3.5, rapid_viral_neg: -2, cxr_clear: 0.5, low_spo2: -1, wbc_high: -0.8 }),
  C('asthma', 'Asthma exacerbation', 'Medium', { wheeze: 2.0, dyspnea: 1.2, hx_asthma: 1.8, peak_flow_low: 3.0, dry_cough: 0.8, trigger_exposure: 1.0, low_spo2: 0.4, fever: -1 }),
  C('dehydration', 'Dehydration', 'Medium', { dry_mucosa: 1.6, low_intake: 1.2, tachycardia: 0.6, hypotension: 1.0, dizzy: 0.8, orthostatic: 1.6, creatinine_high: 2.5, creat_normal: -1.5, vomiting: 0.4, diarrhea: 0.4 }),
  C('migraine', 'Migraine', 'Low', { headache: 1.4, photophobia: 1.6, nausea: 0.6, aura: 2.2, hx_migraine: 1.8, unilateral: 1.4, neuro_normal: 0.8, fever: -1 }),
  C('gastro', 'Gastroenteritis', 'Low', { vomiting: 1.2, diarrhea: 1.6, abd_cramps: 1.2, stool_sick_contact: 1.6, nausea: 0.6, fever: 0.4, wbc_high: 0.2 }),
  C('uti', 'Urinary tract infection', 'Low', { dysuria: 2.0, freq_urination: 1.6, suprapubic: 1.4, flank_pain: 0.8, fever: 0.5, urine_nitrite: 3.5, urine_normal: -3 }),
  C('acs', 'Acute coronary syndrome', 'High', { chest_pain: 1.6, radiating_pain: 1.8, sweating: 1.2, hx_cad: 1.2, dyspnea: 0.5, nausea: 0.4, ecg_st: 4.0, ecg_nonspecific: 0.6, ecg_normal: -1.8, trop_high: 4.0, trop_normal: -2.5 }),
  C('hypoglycemia', 'Hypoglycemia', 'High', { tremor: 1.4, sweating: 0.9, confusion: 1.0, insulin_use: 1.8, missed_meal: 1.2, dizzy: 0.5, glucose_low: 4.5, glucose_normal: -4 }),
  C('anemia', 'Anemia', 'Medium', { fatigue: 1.2, pallor: 1.8, dyspnea: 0.5, tachycardia: 0.6, dizzy: 0.7, palpitations: 0.8, heavy_periods: 1.5, hb_low: 4.0, hb_normal: -3 }),
];

module.exports = { CONDITIONS };
