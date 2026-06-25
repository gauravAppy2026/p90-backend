// Clinical functional-medicine intake (ISHA "A Self-Assessment Health
// Questionnaire") — used by the public web Self-Assessment + NUMA Plus
// intake. Tagged audience: 'clinical' so it stays separate from the lighter
// in-app "basic" check-in. Faithfully transcribed from Lara's PDF; personal
// contact fields (name/address/phone/email) are intentionally omitted —
// identity is captured by the form wrapper / account.

type QType = 'short-text' | 'long-text' | 'number' | 'dropdown' | 'scale-1-10';

interface Raw {
  section: string;
  text: string;
  type: QType;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

const TRI = ['Current', 'Past', 'N/A'];
const YN = ['Yes', 'No'];

const tri = (section: string, text: string): Raw => ({ section, text, type: 'dropdown', options: TRI });
const yn = (section: string, text: string): Raw => ({ section, text, type: 'dropdown', options: YN });
const pick = (section: string, text: string, options: string[]): Raw => ({ section, text, type: 'dropdown', options });
const txt = (section: string, text: string, placeholder = ''): Raw => ({ section, text, type: 'short-text', placeholder });
const lng = (section: string, text: string, placeholder = ''): Raw => ({ section, text, type: 'long-text', placeholder });
const num = (section: string, text: string): Raw => ({ section, text, type: 'number' });

const S1 = '1. About You';
const S2 = '2. Vitals';
const S3 = '3. Lifestyle & Diet';
const S4 = '4. Medications & Supplements';
const S5 = '5. Goals & Concerns';
const S6 = '6. History';
const S7 = '7. Family / Genetic History';
const S8 = '8. Surgical History';
const S9 = '9. Thyroid / Glandular System';
const S10 = '10. Parathyroid';
const S11 = '11. Pancreas';
const S12 = '12. Adrenals';
const S13 = '13. Female Health';
const S14 = '14. Male Health';
const S15 = '15. Gastro-Intestinal Tract';
const S16 = '16. Liver / Gallbladder / Blood';
const S17 = '17. Cardiovascular';
const S18 = '18. Skin';
const S19 = '19. Lymphatic System';
const S20 = '20. Kidneys & Bladder';
const S21 = '21. Respiratory System';
const S22 = '22. Environmental & Toxic Exposure';

const RAW: Raw[] = [
  // 1. About You
  num(S1, 'Age'),
  pick(S1, 'Gender', ['Male', 'Female']),
  txt(S1, 'Height', `e.g. 5'8"`),
  txt(S1, 'Weight', 'e.g. 150 lb'),

  // 2. Vitals (leave blank if unsure)
  txt(S2, 'Blood Pressure — Right'),
  txt(S2, 'Blood Pressure — Left'),
  pick(S2, 'Eye Color', ['Brown', 'Blue']),
  txt(S2, 'Resting Pulse'),
  txt(S2, 'Basal Temperature'),
  txt(S2, 'Urine pH'),
  txt(S2, 'Saliva pH'),
  pick(S2, 'Bowel Movements Per Day', ['0', '1-2', '3-4', '4 or more']),

  // 3. Lifestyle & Diet
  lng(S3, 'Typical Breakfast', 'Please be as honest as possible.'),
  lng(S3, 'Typical Lunch'),
  lng(S3, 'Typical Dinner'),
  lng(S3, 'Typical Snacks'),
  pick(S3, 'Alcohol Consumption', ["Don't Drink", 'Daily', 'Weekly', 'Monthly or Less']),
  pick(S3, 'Are You a Smoker?', ['Current', 'Past', 'Never Smoked']),
  txt(S3, 'If a Smoker, How Much? (packs or cigarettes per day)'),
  tri(S3, 'Have You Ever Used Recreational Drugs?'),
  lng(S3, 'If so, Please List Recreational Drugs Used', 'Confidential — used only to help you attain optimal health.'),

  // 4. Medications & Supplements
  lng(S4, 'Current Medications (please list individually)'),
  lng(S4, 'Herbal Products & Supplements (please list individually)'),

  // 5. Goals & Concerns
  lng(S5, 'What are your primary health concerns?'),
  lng(S5, 'What do you hope to gain from this program?'),

  // 6. History
  pick(S6, "Experience with Dr. Morse's Formulas", ['I currently use them', 'I used them in the past', 'I have never used them']),
  pick(S6, 'Glandular Recommendations Preference', ['Preferred', 'Not Preferred']),

  // 7. Family / Genetic History (known health concerns; leave blank if unsure)
  txt(S7, 'Mother — known health concerns'),
  txt(S7, 'Father — known health concerns'),
  txt(S7, 'Maternal Grandmother — known health concerns'),
  txt(S7, 'Maternal Grandfather — known health concerns'),
  txt(S7, 'Paternal Grandmother — known health concerns'),
  txt(S7, 'Paternal Grandfather — known health concerns'),
  txt(S7, 'Sibling 1 — known health concerns'),
  txt(S7, 'Sibling 2 — known health concerns'),
  txt(S7, 'Sibling 3 — known health concerns'),
  txt(S7, 'Sibling 4 — known health concerns'),

  // 8. Surgical History
  lng(S8, 'Previous Surgical Procedures (minor or major, with the year)'),

  // 9. Thyroid / Glandular System
  tri(S9, 'Cold Hands or Feet'),
  tri(S9, 'Frequently Cold / Difficulty Warming'),
  tri(S9, 'Cold, but Burning Inside'),
  tri(S9, 'Easy to Gain Weight and Hard to Lose It'),
  tri(S9, "Irregular Heartbeat / Arrhythmia's"),
  tri(S9, 'Headaches / Migraines'),
  tri(S9, 'Easily Irritable'),
  tri(S9, 'Overweight'),
  tri(S9, 'Low Energy / Always Tired'),
  tri(S9, 'Goiter'),
  tri(S9, "Hashimoto's"),
  tri(S9, "Grave's Disease"),
  tri(S9, "Reidel's Disease"),
  tri(S9, "Family Member with Goiter / Hashimoto's / Grave's / Reidel's"),
  pick(S9, 'How Much Do You Sweat?', ['Low', 'Medium', 'Excessive']),

  // 10. Parathyroid
  yn(S10, 'Ridged Fingernails'),
  yn(S10, 'Brittle Fingernails'),
  yn(S10, 'Weak Fingernails'),
  tri(S10, 'Varicose Veins'),
  tri(S10, 'Spider Veins'),
  tri(S10, 'Hemorrhoids'),
  tri(S10, 'Prolapses'),
  tri(S10, 'Muscle Cramps / Legs Tire Easily'),
  pick(S10, 'Is Your Bladder', ['Strong', 'A Few Leaks', 'Weak']),
  tri(S10, 'Hernia'),
  tri(S10, 'Aneurysm'),
  tri(S10, 'Low Bone Density'),
  tri(S10, 'Low Calcium'),
  tri(S10, 'Osteoporosis'),
  tri(S10, 'Scoliosis'),
  tri(S10, 'Kyphosis'),
  tri(S10, 'Lordosis'),
  tri(S10, 'Mental Health Challenges (Depression, PTSD, OCD, etc.)'),
  lng(S10, 'Mental Health Challenges — Please List'),
  tri(S10, 'Spinal Deterioration'),
  tri(S10, 'Herniated Discs'),
  tri(S10, 'Bone Spurs'),
  tri(S10, 'Bruise Easily'),

  // 11. Pancreas
  tri(S11, 'Slow Digestion'),
  tri(S11, 'Food Passes Quickly Through You (Diarrhea)'),
  tri(S11, 'Acid Reflux / Heartburn / Indigestion'),
  tri(S11, 'Undigested Food in Stool'),
  tri(S11, 'Thin / Difficulty Gaining Weight'),
  tri(S11, 'Moles'),

  // 12. Adrenals
  tri(S12, 'Overweight'),
  tri(S12, 'MS'),
  tri(S12, 'ALS'),
  tri(S12, "Parkinson's"),
  tri(S12, 'Palsy'),
  tri(S12, 'Anxiety'),
  tri(S12, 'Excessive Shyness / Inferiority Complex'),
  tri(S12, 'Tremors / Nervous Legs'),
  tri(S12, 'High Blood Pressure'),
  tri(S12, 'Low Blood Pressure'),
  tri(S12, 'Hypoglycemia (Low Blood Sugar)'),
  tri(S12, 'Diabetes'),
  pick(S12, 'Diabetes — Type', ['Type 1', 'Type 2', 'N/A']),
  tri(S12, 'Tinnitus (Ringing in Ears)'),
  tri(S12, 'Difficulty Taking Deep Breath / Shortness of Breath'),
  tri(S12, 'Cardiac Arrhythmia'),
  txt(S12, 'Cardiac Arrhythmia — Which Type'),
  tri(S12, 'Sleep — Difficulty Getting to Sleep'),
  tri(S12, 'Sleep — Difficulty Staying Asleep'),
  tri(S12, 'CFS (Chronic Fatigue Syndrome)'),
  tri(S12, "Addison's Disease"),
  tri(S12, 'Congenital Adrenal Hyperplasia'),
  tri(S12, 'High Cholesterol'),
  tri(S12, '"Itis" Conditions (Arthritis, Osteoarthritis, Bursitis, etc.)'),
  txt(S12, '"Itis" Conditions — Please List'),
  tri(S12, 'Low Steroids / Low Cortisol'),
  tri(S12, 'ADD'),
  tri(S12, 'ADHD'),
  tri(S12, 'Autism'),

  // 13. Female Health
  yn(S13, 'Are You Currently Pregnant?'),
  yn(S13, 'Are You Currently Breastfeeding?'),
  tri(S13, 'Irregular Menses'),
  tri(S13, 'Excessive Bleeding During Menstruation'),
  tri(S13, 'Ovarian Cysts'),
  tri(S13, 'Fibroids'),
  tri(S13, 'Endometriosis'),
  tri(S13, 'A-Typical Cells'),
  tri(S13, 'Fibrocystic Breasts'),
  tri(S13, 'Sore or Painful Breasts, Especially During Menstruation'),
  pick(S13, 'Sex Drive', ['Low', 'Normal', 'Excessive']),
  tri(S13, 'Complete or Partial Hysterectomy'),
  txt(S13, 'If Hysterectomy — Other Organs / Lymph Nodes Removed (list)'),
  tri(S13, 'Difficulty Conceiving'),
  tri(S13, 'Birth Control Pills'),
  txt(S13, 'Birth Control Pills — For How Long'),

  // 14. Male Health
  tri(S14, 'Prostatitis'),
  txt(S14, 'How Often Do You Urinate?'),
  tri(S14, "Diagnosed With Prostate 'Cancer'"),
  txt(S14, 'What are Your PSA Levels?'),
  tri(S14, 'Testicular Hypertrophy (Enlarged Testicles)'),
  pick(S14, 'Sex Drive', ['Low', 'Normal', 'Excessive']),
  tri(S14, 'Erection Problems'),
  tri(S14, 'Premature Ejaculation'),

  // 15. Gastro-Intestinal Tract
  tri(S15, "Crohn's"),
  tri(S15, 'Colitis'),
  tri(S15, 'Gastritis'),
  tri(S15, 'Enteritis'),
  tri(S15, 'Diverticulitis'),
  tri(S15, 'Gastroparesis (Paralysis of the Stomach)'),
  tri(S15, 'Hiatus Hernia'),
  tri(S15, 'Coated Tongue, Especially Upon Waking'),
  txt(S15, 'Coated Tongue — Color (white, yellow, green, brown)'),
  tri(S15, 'Diarrhea'),
  tri(S15, 'Constipation'),
  tri(S15, 'Stomach Ulcers'),
  tri(S15, 'Intestinal Ulcers'),
  tri(S15, "Gastro-Intestinal 'Cancer'"),
  txt(S15, 'GI Cancer — Location'),
  tri(S15, 'Gas Problems'),
  tri(S15, 'Other GI Issues Not Listed'),
  txt(S15, 'Other GI Issues — Please List'),

  // 16. Liver / Gallbladder / Blood
  tri(S16, 'Difficulty Digesting Fats'),
  tri(S16, 'Fats or Dairy Cause Stomach Bloat / Pain'),
  tri(S16, 'Light Colored or White Stools'),
  tri(S16, 'Pain Mid-Back (Especially After Eating)'),
  tri(S16, "'Liver' or Brown Spots (Not Freckles)"),
  tri(S16, 'Skin Pigmentation Irregularities or Changes'),
  tri(S16, 'Jaundice of Eyes / Skin'),
  tri(S16, 'Anemia'),
  tri(S16, 'Hepatitis A'),
  tri(S16, 'Hepatitis B'),
  tri(S16, 'Hepatitis C'),

  // 17. Cardiovascular
  tri(S17, 'Angina / Chest Pain'),
  tri(S17, 'Myocardial Infarction (Heart Attack)'),
  tri(S17, 'Pacemaker'),
  tri(S17, 'Stents'),
  tri(S17, 'Other Open Heart Surgery'),
  tri(S17, 'Pressure on Your Chest'),
  tri(S17, "'Prickly' Pains"),
  txt(S17, "'Prickly' Pains — Where"),

  // 18. Skin
  tri(S18, 'Blemishes'),
  tri(S18, 'Rashes'),
  tri(S18, 'Acne'),
  tri(S18, 'Dermatitis'),
  tri(S18, 'Eczema'),
  tri(S18, 'Psoriasis'),
  tri(S18, 'Dry, Itchy Skin'),
  tri(S18, 'Excessively Oily Skin'),
  tri(S18, 'Dandruff'),
  tri(S18, 'Other Skin Problems'),
  txt(S18, 'Other Skin Problems — Please List'),
  yn(S18, 'Do You Have Any Tattoos?'),

  // 19. Lymphatic System
  tri(S19, 'Hair Loss'),
  tri(S19, 'Balding'),
  tri(S19, 'Fully Bald (Not by Choice)'),
  yn(S19, 'Have You Ever Had Any Lymph Nodes Removed?'),
  txt(S19, 'Lymph Nodes Removed — From Which Area'),
  txt(S19, 'Lymph Nodes Removed — How Many'),
  tri(S19, 'Swollen Lymph Nodes'),
  tri(S19, 'Lymphedema'),
  tri(S19, 'Edema (Fluid Retention)'),
  txt(S19, 'Edema — Location'),
  tri(S19, 'Fibromyalgia'),
  tri(S19, 'Scleroderma'),
  tri(S19, 'Cold & Flu-like Symptoms'),
  tri(S19, 'Sore Throat / Sinus Problems'),
  tri(S19, 'Poor Memory / Brain Fog'),
  tri(S19, 'Blurred Vision'),
  tri(S19, 'Mucus in Eyes Upon Waking'),
  tri(S19, "Diagnosed With 'Cancer'"),
  txt(S19, 'Cancer — Location'),
  pick(S19, 'Non-Malignant Mass / Tumor', ['Fatty', 'Benign', 'N/A']),
  txt(S19, 'Non-Malignant Mass / Tumor — Location'),
  tri(S19, 'AIDS / HIV+'),
  tri(S19, 'Low Platelet Count'),
  tri(S19, 'Appendicitis / Appendectomy'),
  txt(S19, 'Appendicitis / Appendectomy — Date'),
  txt(S19, 'Tonsillectomy — Date'),
  tri(S19, 'Boils'),
  tri(S19, 'Pimples'),
  tri(S19, 'Cysts'),
  tri(S19, 'Abscesses'),
  tri(S19, 'Gout'),
  tri(S19, 'Toxemia'),
  tri(S19, 'Cellulitis'),
  tri(S19, 'Sleep Apnea'),
  tri(S19, 'Do You Snore?'),

  // 20. Kidneys & Bladder
  tri(S20, 'UTI / Bladder Infection / Cystitis'),
  tri(S20, 'Burning While Urinating'),
  tri(S20, 'Weak Bladder / Urinary Incontinence'),
  tri(S20, 'Restricted Urine Flow'),
  tri(S20, 'Kidney Stones'),
  tri(S20, 'Nephritis'),
  tri(S20, 'Cramping or Pain Mid-to-Lower Back on Either Side'),
  tri(S20, 'Lower Back Weakness'),
  tri(S20, 'Sciatica'),
  tri(S20, 'Bags Under Eyes'),

  // 21. Respiratory System
  tri(S21, 'Bronchitis'),
  tri(S21, 'Asthma'),
  tri(S21, 'COPD'),
  tri(S21, 'Emphysema'),
  tri(S21, 'Pneumonia'),
  tri(S21, 'Pain / Difficulty Breathing'),
  tri(S21, 'Pain / Difficulty Taking Deep Breaths'),
  tri(S21, 'Collapsed Lung'),
  tri(S21, 'Frequent Cough'),
  pick(S21, 'Color of Mucus Expectorated', ['Clear', 'Yellow', 'Green', 'Brown', 'Black']),
  tri(S21, 'Use a Nebulizer or Inhaler'),
  txt(S21, 'Oxygen Saturation (SpO2)'),
  tri(S21, "Diagnosed With Lung 'Cancer'"),

  // 22. Environmental & Toxic Exposure
  tri(S22, 'Exposure to Nuclear Wastes & By-Products'),
  tri(S22, 'Exposure to Heavy Metals'),
  tri(S22, 'Exposure to Toxic Chemicals'),
  tri(S22, 'Exposure to Asbestos or Coal Mines'),
  tri(S22, 'Have You Gone Through Chemotherapy or Radiation?'),
  txt(S22, 'Chemo / Radiation — How Many Treatments'),
  yn(S22, 'Received the "Standard" Vaccinations?'),
  yn(S22, 'Received Vaccinations for Travelling to Foreign Countries?'),
  yn(S22, 'Received a COVID / Flu Shot?'),
];

export const CLINICAL_SAQ_QUESTIONS = RAW.map((q, i) => ({
  section: q.section,
  text: q.text,
  type: q.type,
  options: q.options ?? [],
  placeholder: q.placeholder ?? '',
  helpText: q.helpText ?? '',
  required: false,
  order: 1000 + i * 5,
  isActive: true,
  audience: 'clinical' as const,
}));
