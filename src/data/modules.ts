/**
 * AHI question bank.
 *
 * Index (9 domains, 98 questions) and Prakṛti (27 questions) come from
 * "Final all questions.docx". The two in-depth questionnaires (Agni, 25
 * questions; MAQ-H, 45 questions) come from "AHI_ Agni etc.docx".
 *
 * Every option carries the points the documents assign to it. A module score is
 *   round((sum − min) / (max − min) × 100)
 * where min and max are the lowest and highest possible sums for that module.
 * For the in-depth questionnaires (0–4 points) this equals the documents'
 * "score as a percentage of the maximum".
 */

export type ModuleKind = 'index' | 'prakriti' | 'indepth';
export type IndexId = 'agni' | 'nidra' | 'bala' | 'mala' | 'sara' | 'samhanana' | 'satmya' | 'sattva' | 'vyadhi';
export type ModuleId = IndexId | 'prakriti' | 'agni-detail' | 'mala-detail';
export type DoshaId = 'vata' | 'pitta' | 'kapha';
/** "Major domains" of the AHI document. */
export type DomainGroup = 'physiological' | 'psychological' | 'lifestyle';

export interface Option {
  label: string;
  points: number;
}

export interface Question {
  id: string;
  text: string;
  section?: string; // the "Part" or domain it belongs to, shown above the question
  domain?: string; // in-depth questionnaires: the domain it adds to
  dosha?: DoshaId; // Prakṛti only
  options: Option[];
}

export interface AhiModule {
  id: ModuleId;
  kind: ModuleKind;
  en: string; // English label
  title: string; // Sanskrit term (IAST)
  deva: string; // Sanskrit term (Devanāgarī)
  icon: string; // Ionicons base name
  group?: DomainGroup;
  weight?: number; // share of the composite AHI (index modules)
  bandLabels?: [string, string, string, string, string]; // document-specific interpretation, best first
  blurb: string;
  why: string; // shown beside the questions ("Why we ask")
  source: string;
  context: string; // shown on the result screen
  questions: Question[];
}

const opts = (labels: readonly string[], points: readonly number[]): Option[] => labels.map((label, i) => ({ label, points: points[i] }));

const FREQ = ['Never', 'Rarely', 'Often', 'Almost always'] as const;
const LEVEL = ['Low', 'Medium', 'High'] as const;
const DOC1 = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] as const;

/** Frequency question: "Almost always" is healthy (+) or unhealthy (−). */
const f = (id: string, text: string, sign: '+' | '-', section?: string): Question => ({ id, text, section, options: opts(FREQ, sign === '+' ? [1, 2, 3, 4] : [4, 3, 2, 1]) });
/** Sāra question: Low / Medium / High. */
const l = (id: string, text: string, sign: '+' | '-', section: string): Question => ({ id, text, section, options: opts(LEVEL, sign === '+' ? [1, 2, 3] : [3, 2, 1]) });
/** Prakṛti trait: scored 1–4 towards its doṣa. */
const p = (id: string, text: string, dosha: DoshaId, section: string): Question => ({ id, text, dosha, section, options: opts(FREQ, [1, 2, 3, 4]) });
/** In-depth questionnaire statement: Never 0 … Always 4. */
const d = (id: string, text: string, domain: string, sub?: string): Question => ({ id, text, domain, section: sub ? `${domain} · ${sub}` : domain, options: opts(DOC1, [0, 1, 2, 3, 4]) });

const W = 1 / 9;

/* ------------------------------------------------------------------ */
/* Ayurveda Health Index — nine domains                                */
/* ------------------------------------------------------------------ */
export const MODULES: AhiModule[] = [
  {
    id: 'agni',
    kind: 'index',
    en: 'Digestion',
    title: 'Agni',
    deva: 'अग्नि',
    icon: 'flame',
    group: 'physiological',
    weight: W,
    blurb: 'How steadily you digest — appetite, heaviness, timing and how food sits with you.',
    why: 'Agni, the digestive fire, is the root of health in Āyurveda. A steady fire digests food fully and keeps the body light.',
    source: 'Caraka Saṃhitā, Cikitsāsthāna 15',
    context: 'Agni reflects how fully and comfortably you digest. A steady fire means regular hunger and lightness after meals.',
    questions: [
      f('ag1', 'Do you eat more food than your body can comfortably digest?', '-'),
      f('ag2', 'After eating a heavy meal, do you have difficulty digesting it?', '-'),
      f('ag3', 'Do you experience more digestive problems during the rainy season?', '-'),
      f('ag4', 'Do you notice any changes in your digestion during cold weather?', '-'),
      f('ag5', 'Do you feel that your food gets digested very quickly?', '-'),
      f('ag6', 'Do you feel that your food takes a long time to digest?', '-'),
      f('ag7', 'When you have digestive problems, do you feel weaker, more uncomfortable and more distressed than usual?', '-'),
      f('ag8', 'Do you feel your hunger comes at irregular times?', '-'),
      f('ag9', 'How often do you feel your previous meal has not been digested?', '-'),
      f('ag10', 'Do you have difficulty digesting even a light meal?', '-'),
      f('ag11', 'Do you eat your meals at irregular times?', '-'),
      f('ag12', 'Do you suffer digestive problems after eating cold, very dry, or contaminated food?', '-'),
      // The document scores this one Never = 1 … Almost always = 4. Irregular digestion is
      // a sign of imbalance, so it is scored like the other twelve (Never = 4).
      f('ag13', 'Do you experience irregular digestion even after eating the regular amount of food every day?', '-'),
    ],
  },
  {
    id: 'nidra',
    kind: 'index',
    en: 'Sleep',
    title: 'Nidrā',
    deva: 'निद्रा',
    icon: 'moon',
    group: 'physiological',
    weight: W,
    blurb: 'Whether sleep restores you — timing, regularity, daytime drowsiness and what disturbs it.',
    why: 'Timely, sufficient sleep brings strength, clarity and a long life; untimely sleep disturbs them.',
    source: 'Caraka Saṃhitā, Sūtrasthāna 21',
    context: 'Nidrā reflects how restoring and regular your sleep is.',
    questions: [
      f('ni1', 'Do you feel physically energetic and rested after your usual sleep?', '+', 'Effects of sleep on health'),
      f('ni2', 'Do you experience physical weakness or tiredness after sleeping in the daytime?', '-', 'Effects of sleep on health'),
      f('ni3', 'Do you usually go to sleep at a time that fits your daily routine?', '+', 'Sleep timing and regularity'),
      f('ni4', 'Do you fall asleep as soon as you go to bed?', '+', 'Sleep timing and regularity'),
      f('ni5', 'Do you usually wake up at approximately the same time according to your daily routine?', '+', 'Sleep timing and regularity'),
      f('ni6', 'Do you sleep longer than you usually need to?', '-', 'Sleep duration and daytime sleep'),
      f('ni7', 'Do you feel drowsy in the daytime?', '-', 'Sleep duration and daytime sleep'),
      f('ni8', 'Does mental stress or emotional distress disturb your sleep?', '-', 'Difficulty sleeping'),
      f('ni9', 'Do you take any medication to induce your sleep?', '-', 'Difficulty sleeping'),
      f('ni10', 'Do you usually sleep according to your daily routine?', '+', 'Timing and patterns of sleep'),
    ],
  },
  {
    id: 'bala',
    kind: 'index',
    en: 'Strength',
    title: 'Bala',
    deva: 'बल',
    icon: 'barbell',
    group: 'physiological',
    weight: W,
    blurb: 'Physical strength and stamina — exercise, food and how the seasons affect you.',
    why: 'Bala is the body’s strength to work, resist illness and recover. It grows with regular exercise and wholesome food.',
    source: 'Caraka Saṃhitā, Sūtrasthāna 11.36',
    context: 'Bala reflects your physical strength and how well you keep it through food, exercise and the seasons.',
    questions: [
      f('ba1', 'Do you begin to feel weak or tired after doing even a small amount of physical work?', '-', 'Strength and ability to work'),
      f('ba2', 'Do you engage in physical activity regularly?', '+', 'Exercise and strength'),
      f('ba3', 'Do you find everyday tasks harder to do than before?', '-', 'Exercise and strength'),
      f('ba4', 'Do you prefer to eat food at a suitable temperature (avoiding food that is excessively hot, cold, or dry)?', '+', 'Food and strength'),
      f('ba5', 'Do you eat processed food?', '-', 'Food and strength'),
      f('ba6', 'Do you experience physical weakness in hot weather?', '-', 'Seasons, digestion and weakness'),
      f('ba7', 'During the rainy season, do you experience reduced appetite or feel that your digestion has become weaker?', '-', 'Seasons, digestion and weakness'),
    ],
  },
  {
    id: 'mala',
    kind: 'index',
    en: 'Elimination',
    title: 'Mala',
    deva: 'मल',
    icon: 'water',
    group: 'physiological',
    weight: W,
    blurb: 'Bowel regularity, ease and comfort — the body’s daily clearing of waste.',
    why: 'Timely, complete elimination of Mala keeps the body light. Retained or irregular wastes are an early sign of imbalance.',
    source: 'Aṣṭāṅga Hṛdaya, Sūtrasthāna 11',
    context: 'Mala reflects how regularly and comfortably your body clears its wastes.',
    questions: [
      f('ma1', 'Are you generally able to pass stool regularly?', '+', 'Formation of Mala'),
      f('ma2', 'Do you experience obstruction during bowel movements or difficulty in passing stool?', '-', 'Formation of Mala'),
      f('ma3', 'Do you need to pass stool more than two times a day?', '-', 'Formation of Mala'),
      f('ma4', 'Does your stool come out in small pieces or fragmented form?', '-', 'Consistency and appearance'),
      f('ma5', 'Is your stool generally dry and hard?', '-', 'Consistency and appearance'),
      f('ma6', 'Does your stool have an excessively foul smell?', '-', 'Odour'),
      f('ma7', 'Does your stool sink to the bottom in water?', '-', 'Behaviour in water'),
      f('ma8', 'Do you feel satisfied after passing stool?', '+', 'After bowel movements'),
      f('ma9', 'Do you take any medicine to pass stool?', '-', 'Purīṣa and bodily function'),
      f('ma10', 'Are you habituated to tea, coffee, tobacco, hot water, cigarettes or anything else before passing stool?', '-', 'Purīṣa and bodily function'),
    ],
  },
  {
    id: 'sara',
    kind: 'index',
    en: 'Tissue quality',
    title: 'Sāra',
    deva: 'सार',
    icon: 'diamond',
    group: 'physiological',
    weight: W,
    blurb: 'The excellence of your tissues — skin, blood, muscle, fat, bone, marrow, reproductive tissue and mind.',
    why: 'Sāra is the excellence of the dhātus. It shows the quality of the body’s tissues, not just their size.',
    source: 'Caraka Saṃhitā, Vimānasthāna 8.102–115',
    context: 'Sāra reflects the quality of your tissues, from skin to mind.',
    questions: [
      l('sa1', 'Is your skin oily, smooth, soft, and lustrous?', '+', 'Tvak Sāra · skin'),
      l('sa2', 'Is the hair on your body short, soft, and thin?', '+', 'Tvak Sāra · skin'),
      l('sa3', 'Do your nails, eyes, tongue, lips, palms, and soles appear oily, lustrous and pinkish in colour?', '+', 'Rakta Sāra · blood'),
      l('sa4', 'Do your body parts appear muscular?', '+', 'Māṃsa Sāra · muscle'),
      l('sa5', 'Do your joints and body parts feel stable, strong and well-covered with muscles?', '+', 'Māṃsa Sāra · muscle'),
      l('sa6', 'Do your skin, hair, nails, teeth, lips, and other body parts appear oily?', '+', 'Meda Sāra · fat tissue'),
      l('sa7', 'Is the sweat produced by your body oily and sticky in nature?', '+', 'Meda Sāra · fat tissue'),
      l('sa8', 'Do you find it difficult to tolerate physical activity?', '-', 'Meda Sāra · fat tissue'),
      l('sa9', 'Are your bones, joints, nails, and teeth thick and strong?', '+', 'Asthi Sāra · bone'),
      l('sa10', 'Are your head and shoulders large and strong?', '+', 'Asthi Sāra · bone'),
      l('sa11', 'Does your body look well nourished and physically strong?', '+', 'Majjā Sāra · marrow'),
      l('sa12', 'Is your voice deep?', '+', 'Majjā Sāra · marrow'),
      l('sa13', 'Do you find it easy to connect with others?', '+', 'Śukra Sāra · reproductive tissue'),
      l('sa14', 'Do your eyes appear clear, lustrous and whitish?', '+', 'Śukra Sāra · reproductive tissue'),
      l('sa15', 'Are your teeth lustrous, well-rounded and even?', '+', 'Śukra Sāra · reproductive tissue'),
      l('sa16', 'Do you think carefully before making decisions?', '+', 'Sattva Sāra · mind'),
      l('sa17', 'Are you grateful and do you appreciate the help others give you?', '+', 'Sattva Sāra · mind'),
      l('sa18', 'Do you have patience and remain calm in difficult situations?', '+', 'Sattva Sāra · mind'),
      l('sa19', 'Are you an enthusiastic person?', '+', 'Sattva Sāra · mind'),
      l('sa20', 'Are you interested in cleanliness?', '+', 'Sattva Sāra · mind'),
    ],
  },
  {
    id: 'samhanana',
    kind: 'index',
    en: 'Body build',
    title: 'Saṃhanana',
    deva: 'संहनन',
    icon: 'body',
    group: 'physiological',
    weight: W,
    blurb: 'How compact and resilient your body is — joints, muscles and tolerance of hunger, heat and cold.',
    why: 'Saṃhanana is the compactness of the body. A well-knit body endures effort, weather and illness.',
    source: 'Caraka Saṃhitā, Vimānasthāna 8.116',
    context: 'Saṃhanana reflects how well-knit and enduring your body is.',
    questions: [
      f('sh1', 'Are the joints of your body strong and working properly?', '+', 'Body structure and muscles'),
      f('sh2', 'Are your muscles strong and well structured?', '+', 'Body structure and muscles'),
      f('sh3', 'Do you feel physically strong?', '+', 'Strength and disease tolerance'),
      f('sh4', 'Do you recover easily when you get sick?', '+', 'Strength and disease tolerance'),
      f('sh5', 'Are you able to tolerate hunger?', '+', 'Tolerance and endurance'),
      f('sh6', 'Are you able to tolerate thirst?', '+', 'Tolerance and endurance'),
      f('sh7', 'Are you able to tolerate sunlight or heat?', '+', 'Tolerance and endurance'),
      f('sh8', 'Are you able to tolerate the cold?', '+', 'Tolerance and endurance'),
      f('sh9', 'Are you able to tolerate physical exercise?', '+', 'Tolerance and endurance'),
    ],
  },
  {
    id: 'satmya',
    kind: 'index',
    en: 'Adaptability',
    title: 'Sātmya',
    deva: 'सात्म्य',
    icon: 'restaurant',
    group: 'lifestyle',
    weight: W,
    blurb: 'What your body is accustomed to — the variety, suitability and manner of your food.',
    why: 'Sātmya is what suits you through habit. Those used to all six tastes and nourishing food are strong and adaptable.',
    source: 'Caraka Saṃhitā, Vimānasthāna 8.118',
    context: 'Sātmya reflects how well your food habits suit and sustain you.',
    questions: [
      f('st1', 'Do you consume foods such as ghee, milk, oil, and meat soup regularly?', '+', 'Sātmya towards food'),
      f('st2', 'Are you habituated to eating different types of food containing all six tastes (sweet, sour, salty, pungent, bitter, and astringent)?', '+', 'Sātmya towards food'),
      f('st3', 'Does your diet contain a greater proportion of foods with only one taste?', '-', 'Sātmya towards food'),
      f('st4', 'Does the food you eat cause any discomfort to your body?', '-', 'Regular consumption and compatibility'),
      f('st5', 'Do you eat food attentively (neither too quickly nor too slowly)?', '+', 'Food habits'),
    ],
  },
  {
    id: 'sattva',
    kind: 'index',
    en: 'Mind',
    title: 'Sattva',
    deva: 'सत्त्व',
    icon: 'flower',
    group: 'psychological',
    weight: W,
    blurb: 'Mental strength — steadiness in difficulty, focus, self-control and inner calm.',
    why: 'Sattva is the strength of the mind. A strong mind stays steady in difficulty and keeps the body steady too.',
    source: 'Caraka Saṃhitā, Vimānasthāna 8.119',
    context: 'Sattva reflects the steadiness and clarity of your mind.',
    questions: [
      f('sv1', 'Are you able to keep your mind stable even in difficult situations (physical, mental, emotional)?', '+', 'Mental strength'),
      f('sv2', 'Do you need support from others during difficult times?', '-', 'Mental strength'),
      f('sv3', 'Do you find it hard to handle small problems?', '-', 'Mental strength'),
      f('sv4', 'Do scary sights or sounds make you feel weak, anxious or faint?', '-', 'Fear, grief and reactions'),
      f('sv5', 'Are you able to control your thoughts and desires?', '+', 'Control of the mind'),
      f('sv6', 'Do you think carefully before taking any decision?', '+', 'Control of the mind'),
      f('sv7', 'Do you make a plan before starting any work?', '+', 'Control of the mind'),
      f('sv8', 'Are you able to focus on one thing at a time?', '+', 'Control of the mind'),
      f('sv9', 'Are you well organised in your daily routine?', '+', 'Mental qualities and behaviour'),
      f('sv10', 'Do you have faith in spirituality?', '+', 'Mental qualities and behaviour'),
      f('sv11', 'Are you able to concentrate on a subject easily?', '+', 'Mental qualities and behaviour'),
      f('sv12', 'Do you get affected by what people think about you?', '-', 'Mental qualities and behaviour'),
      f('sv13', 'Do you feel jealous of other people’s success or achievements?', '-', 'Mental qualities and behaviour'),
      f('sv14', 'Do you practise yoga, meditation, prayer or mantra chanting?', '+', 'Mind and body'),
      f('sv15', 'Do you complete your tasks every day?', '+', 'Mind and body'),
    ],
  },
  {
    id: 'vyadhi',
    kind: 'index',
    en: 'Immunity',
    title: 'Vyādhikṣamatva',
    deva: 'व्याधिक्षमत्व',
    icon: 'shield-checkmark',
    group: 'physiological',
    weight: W,
    blurb: 'Your resistance to illness — routine, stamina, recovery and how often you fall sick.',
    why: 'Vyādhikṣamatva is the body’s power to resist disease and to stop it growing. It rests on Bala and Ojas.',
    source: 'Caraka Saṃhitā, Sūtrasthāna 28.7',
    context: 'Vyādhikṣamatva reflects how well your body resists illness and recovers.',
    questions: [
      f('vy1', 'Do you follow a daily routine to keep yourself healthy (brushing, bathing, cleaning, etc.)?', '+'),
      f('vy2', 'Do you usually feel that your body has enough physical strength and stamina?', '+'),
      f('vy3', 'Do you regularly eat healthy food and maintain self-control in your daily life?', '+'),
      f('vy4', 'Can you tolerate hunger, thirst, heat, cold, and physical exercise without excessive difficulty?', '+'),
      f('vy5', 'Do you generally feel that your body has good natural strength and ability to recover?', '+'),
      f('vy6', 'Do you easily catch a cold, cough, or fever?', '-'),
      f('vy7', 'Do you take a long time to recover after falling ill?', '-'),
      f('vy8', 'Do you frequently experience skin infections?', '-'),
      f('vy9', 'Do you need antibiotics frequently?', '-'),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Prakṛti — constitution (not part of the index)                      */
/* ------------------------------------------------------------------ */
export const PRAKRITI: AhiModule = {
  id: 'prakriti',
  kind: 'prakriti',
  en: 'Constitution',
  title: 'Prakṛti',
  deva: 'प्रकृति',
  icon: 'leaf',
  blurb: 'Your lifelong mix of Vāta, Pitta and Kapha — the nature you were born with.',
  why: 'Prakṛti is your natural constitution. It does not change, and it is not a score — it shows which doṣa leads your nature.',
  source: 'Caraka Saṃhitā, Vimānasthāna 8.95–100',
  context: 'Your constitution is not good or bad. It explains your tendencies and which balance to protect.',
  questions: [
    p('pr1', 'Do you generally have difficulty tolerating cold, and prefer a warm environment during cold weather?', 'vata', 'Vāta traits'),
    p('pr2', 'Are your skin, hands, feet, or other parts of your body generally dry and prone to cracking?', 'vata', 'Vāta traits'),
    p('pr3', 'Is your body thin-built, and do you find it difficult to gain weight or develop a fuller body?', 'vata', 'Vāta traits'),
    p('pr4', 'Do you find it difficult to concentrate on one task or thought for a long time, and does your mind fluctuate quickly?', 'vata', 'Vāta traits'),
    p('pr5', 'Do you generally speak very quickly or tend to talk more than necessary during conversations?', 'vata', 'Vāta traits'),
    p('pr6', 'Do you learn or understand things quickly but find it difficult to remember them after some time?', 'vata', 'Vāta traits'),
    p('pr7', 'Do you become frightened or anxious easily over small things or unexpected situations?', 'vata', 'Vāta traits'),
    p('pr8', 'Do you generally have a strong preference for sweet, sour, salty, or warm foods?', 'vata', 'Vāta traits'),
    p('pr9', 'Do you frequently dream about flying through the sky or travelling above mountains and trees?', 'vata', 'Vāta traits'),
    p('pr10', 'Do you generally have difficulty tolerating heat, and prefer a cool environment?', 'pitta', 'Pitta traits'),
    p('pr11', 'Do you generally sweat excessively, and tend to have a strong body odour or unpleasant-smelling sweat?', 'pitta', 'Pitta traits'),
    p('pr12', 'Do you generally feel hungry frequently and intensely, and experience excessive thirst?', 'pitta', 'Pitta traits'),
    p('pr13', 'Do you feel particularly uncomfortable or restless when you have to delay eating after becoming hungry?', 'pitta', 'Pitta traits'),
    p('pr14', 'Does your hair tend to turn grey at an early age, or are you prone to hair loss or baldness?', 'pitta', 'Pitta traits'),
    p('pr15', 'Do you generally become angry quickly, and does it take some time for your anger to settle?', 'pitta', 'Pitta traits'),
    p('pr16', 'Do you generally understand things quickly and use reasoning and intelligence effectively when making decisions?', 'pitta', 'Pitta traits'),
    p('pr17', 'Do you generally have a strong appetite, enjoy eating and drinking, and tend to eat frequently because you feel hungry?', 'pitta', 'Pitta traits'),
    p('pr18', 'Do you frequently dream about fire, lightning, meteors, or burning objects?', 'pitta', 'Pitta traits'),
    p('pr19', 'Are you generally calm by nature and able to remain patient in difficult situations?', 'kapha', 'Kapha traits'),
    p('pr20', 'Do you generally walk slowly and perform daily activities without rushing?', 'kapha', 'Kapha traits'),
    p('pr21', 'Is your skin generally smooth, soft, and naturally oily or well-moisturised?', 'kapha', 'Kapha traits'),
    p('pr22', 'Do you generally experience less hunger and thirst, with fewer problems related to heat and sweating?', 'kapha', 'Kapha traits'),
    p('pr23', 'Do your joints, bones, and muscles generally feel strong and well-developed?', 'kapha', 'Kapha traits'),
    p('pr24', 'Do you generally tolerate difficulties patiently and remain committed to your decisions or opinions?', 'kapha', 'Kapha traits'),
    p('pr25', 'Do you generally show affection and care towards your friends, family members, or people who depend on you?', 'kapha', 'Kapha traits'),
    p('pr26', 'Does your voice generally sound deep or steady?', 'kapha', 'Kapha traits'),
    p('pr27', 'Do you frequently dream about lotus flowers, swans, lakes, or beautiful natural scenery?', 'kapha', 'Kapha traits'),
  ],
};

/* ------------------------------------------------------------------ */
/* In-depth questionnaires (healthy adults, last one month)            */
/* ------------------------------------------------------------------ */
export const INDEPTH: AhiModule[] = [
  {
    id: 'agni-detail',
    kind: 'indepth',
    en: 'Agni in depth',
    title: 'Samāgni',
    deva: 'समाग्नि',
    icon: 'flame',
    bandLabels: ['Excellent Samāgni', 'Good Agni', 'Mild Agni imbalance', 'Moderate Agni disturbance', 'Severe Agni dysfunction'],
    blurb: '25 statements across hunger, digestion, post-digestive comfort, bowel function and energy.',
    why: 'This questionnaire looks for Samāgni — balanced digestive fire — in healthy adults, using the classical features of Agni.',
    source: 'Caraka Saṃhitā; Aṣṭāṅga Hṛdaya',
    context: 'A detailed look at your digestive fire across five domains, each scored out of 20.',
    questions: [
      d('ad1', 'I experience hunger at regular times every day.', 'Hunger and appetite'),
      d('ad2', 'I feel genuine hunger before meals.', 'Hunger and appetite'),
      d('ad3', 'My appetite is consistent from day to day.', 'Hunger and appetite'),
      d('ad4', 'I can comfortably wait until meal time without irritability.', 'Hunger and appetite'),
      d('ad5', 'My appetite matches the quantity of food I usually consume.', 'Hunger and appetite'),
      d('ad6', 'Food is digested comfortably without discomfort.', 'Digestion'),
      d('ad7', 'I do not feel excessive heaviness after meals.', 'Digestion'),
      d('ad8', 'I do not experience abdominal bloating after eating.', 'Digestion'),
      d('ad9', 'I do not experience excessive gas formation.', 'Digestion'),
      d('ad10', 'I feel energetic after meals rather than sleepy.', 'Digestion'),
      d('ad11', 'I feel light and comfortable after digestion is complete.', 'Post-digestive comfort'),
      d('ad12', 'Previous food appears completely digested before the next meal.', 'Post-digestive comfort'),
      d('ad13', 'I do not experience sour belching or acidity.', 'Post-digestive comfort'),
      d('ad14', 'I do not experience nausea after meals.', 'Post-digestive comfort'),
      d('ad15', 'I rarely experience indigestion.', 'Post-digestive comfort'),
      d('ad16', 'I pass stools regularly every day.', 'Bowel function'),
      d('ad17', 'Stool evacuation is complete and satisfactory.', 'Bowel function'),
      d('ad18', 'Stools are neither excessively hard nor excessively loose.', 'Bowel function'),
      d('ad19', 'I do not strain during bowel evacuation.', 'Bowel function'),
      d('ad20', 'I feel light and refreshed after bowel evacuation.', 'Bowel function'),
      d('ad21', 'My energy remains stable throughout the day.', 'Energy and metabolism'),
      d('ad22', 'I wake up feeling refreshed.', 'Energy and metabolism'),
      d('ad23', 'I can perform daily activities without undue fatigue.', 'Energy and metabolism'),
      d('ad24', 'My body weight remains relatively stable.', 'Energy and metabolism'),
      d('ad25', 'I recover quickly after physical exertion.', 'Energy and metabolism'),
    ],
  },
  {
    id: 'mala-detail',
    kind: 'indepth',
    en: 'Mala in depth',
    title: 'Mala Kriyā',
    deva: 'मलक्रिया',
    icon: 'water',
    bandLabels: ['Excellent Samamala Kriyā', 'Good Mala function', 'Mild functional imbalance', 'Moderate disturbance', 'Severe disturbance'],
    blurb: 'The Mala Assessment Questionnaire (MAQ-H): 40 statements on stool, urine and sweat.',
    why: 'Balanced elimination of the three malas — Purīṣa, Mūtra and Sveda — is one of the essential signs of Svāsthya.',
    source: 'Caraka Saṃhitā; Aṣṭāṅga Hṛdaya',
    context: 'A detailed look at your three malas — stool, urine and sweat — scored as a percentage of 160.',
    questions: [
      d('md1', 'I pass stools regularly every day.', 'Purīṣa (bowel)', 'frequency and regularity'),
      d('md2', 'My bowel movement usually occurs at a predictable time.', 'Purīṣa (bowel)', 'frequency and regularity'),
      d('md3', 'I rarely skip a day without bowel evacuation.', 'Purīṣa (bowel)', 'frequency and regularity'),
      d('md4', 'Stool passes easily without excessive straining.', 'Purīṣa (bowel)', 'ease of evacuation'),
      d('md5', 'I feel complete evacuation after passing stools.', 'Purīṣa (bowel)', 'ease of evacuation'),
      d('md6', 'I do not experience urgency during bowel movements.', 'Purīṣa (bowel)', 'ease of evacuation'),
      d('md7', 'My stools are well-formed.', 'Purīṣa (bowel)', 'stool characteristics'),
      d('md8', 'My stools are neither excessively hard nor loose.', 'Purīṣa (bowel)', 'stool characteristics'),
      d('md9', 'I do not notice mucus in stools.', 'Purīṣa (bowel)', 'stool characteristics'),
      d('md10', 'I do not experience foul-smelling stools frequently.', 'Purīṣa (bowel)', 'stool characteristics'),
      d('md11', 'I feel light and comfortable after bowel evacuation.', 'Purīṣa (bowel)', 'post-evacuation comfort'),
      d('md12', 'I do not experience abdominal discomfort after defecation.', 'Purīṣa (bowel)', 'post-evacuation comfort'),
      d('md13', 'I pass urine at regular intervals.', 'Mūtra (urine)', 'frequency'),
      d('md14', 'I do not feel the need to urinate excessively.', 'Mūtra (urine)', 'frequency'),
      d('md15', 'I rarely wake up at night to urinate.', 'Mūtra (urine)', 'frequency'),
      d('md16', 'Urine passes comfortably without difficulty.', 'Mūtra (urine)', 'ease of urination'),
      d('md17', 'I do not experience burning during urination.', 'Mūtra (urine)', 'ease of urination'),
      d('md18', 'I do not experience pain while passing urine.', 'Mūtra (urine)', 'ease of urination'),
      d('md19', 'Urine is usually clear to light yellow.', 'Mūtra (urine)', 'characteristics'),
      d('md20', 'Urine quantity appears adequate.', 'Mūtra (urine)', 'characteristics'),
      d('md21', 'I do not notice unusual odour in urine.', 'Mūtra (urine)', 'characteristics'),
      d('md22', 'I feel complete emptying of the bladder.', 'Mūtra (urine)', 'post-urination comfort'),
      d('md23', 'I do not feel residual discomfort after urination.', 'Mūtra (urine)', 'post-urination comfort'),
      d('md24', 'I sweat appropriately during physical activity.', 'Sveda (sweat)', 'sweating pattern'),
      d('md25', 'I sweat appropriately in hot weather.', 'Sveda (sweat)', 'sweating pattern'),
      d('md26', 'My body does not remain excessively dry.', 'Sveda (sweat)', 'sweating pattern'),
      d('md27', 'My sweating is neither excessive nor insufficient.', 'Sveda (sweat)', 'quantity'),
      d('md28', 'Sweating helps me feel comfortable in hot conditions.', 'Sveda (sweat)', 'quantity'),
      d('md29', 'I rarely experience sudden unexplained sweating.', 'Sveda (sweat)', 'quantity'),
      d('md30', 'Sweat does not have an unusually offensive odour.', 'Sveda (sweat)', 'characteristics'),
      d('md31', 'Sweat does not excessively stain clothing.', 'Sveda (sweat)', 'characteristics'),
      d('md32', 'My skin feels comfortable after sweating.', 'Sveda (sweat)', 'characteristics'),
      d('md33', 'I tolerate normal environmental temperatures comfortably.', 'Sveda (sweat)', 'thermoregulation'),
      d('md34', 'My body cools naturally after exertion.', 'Sveda (sweat)', 'thermoregulation'),
      d('md35', 'I do not feel excessive heat retention.', 'Sveda (sweat)', 'thermoregulation'),
      d('md36', 'My bowel, urinary, and sweat functions are generally satisfactory.', 'Overall satisfaction'),
      d('md37', 'I feel physically light and comfortable throughout the day.', 'Overall satisfaction'),
      d('md38', 'I rarely experience symptoms suggestive of impaired elimination.', 'Overall satisfaction'),
      d('md39', 'I feel refreshed after elimination of bodily wastes.', 'Overall satisfaction'),
      d('md40', 'My elimination habits support my daily activities and well-being.', 'Overall satisfaction'),
    ],
  },
];

export const ALL_MODULES: AhiModule[] = [...MODULES, PRAKRITI, ...INDEPTH];
export const INDEX_IDS = MODULES.map((m) => m.id as IndexId);
/** Questions in the nine index domains. */
export const TOTAL_QUESTIONS = MODULES.reduce((n, m) => n + m.questions.length, 0);

export const GROUPS: { id: DomainGroup; label: string; text: string }[] = [
  { id: 'physiological', label: 'Physiological health', text: 'Agni, Mala, Bala, Nidrā and the body’s build and resistance.' },
  { id: 'psychological', label: 'Psychological health', text: 'Sattva — mental strength and stability.' },
  { id: 'lifestyle', label: 'Lifestyle and diet', text: 'Sātmya — what your food habits accustom you to.' },
];

export function moduleById(id: string): AhiModule | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function isModuleId(id: string): id is ModuleId {
  return ALL_MODULES.some((m) => m.id === id);
}
