/**
 * Two bundled storyboards for demo mode. They need no API key: frames are
 * drawn as placeholders. The stories and scenes are original to Scripto.
 */
import { makeId } from '../lib/ids';
import type { Character, Scene, Storyboard } from '../lib/types';

type SceneData = Omit<Scene, 'id' | 'image'>;

interface DemoData {
  id: string;
  label: string;
  blurb: string;
  title: string;
  logline: string;
  language: string;
  direction: Storyboard['direction'];
  styleId: string;
  story: string;
  characters: Character[];
  scenes: SceneData[];
}

const CLOCKMAKER: DemoData = {
  id: 'clockmaker',
  label: 'The Clockmaker of Lantern Street',
  blurb: 'English · 6 scenes · a night market, a silent music box',
  title: 'The Clockmaker of Lantern Street',
  logline: 'An old clockmaker gives up the one thing he treasures to make a little girl’s music box sing again.',
  language: 'en',
  direction: 'ltr',
  styleId: 'sketch',
  story: `Every night, old Ilyas opens his tiny clock stall at the edge of the lantern market. One rainy evening a girl named Noor brings him a silent music box that belonged to her grandmother. Ilyas tells her it cannot be fixed: the spring is broken, and nobody has made that part in fifty years. Noor leaves the box with him anyway.

After the market closes, Ilyas works through the night by candlelight. He opens the pocket watch his late wife gave him and carefully takes out its spring. At dawn the music box plays again: a lullaby he has not heard since he was a boy.

When Noor comes back, he winds the box for her without a word. She notices the empty watch chain on his waistcoat. The next night she returns with a small present wrapped in newspaper: a cheap new watch that ticks far too loudly. Ilyas laughs for the first time in years.`,
  characters: [
    {
      name: 'Ilyas',
      appearance:
        'an elderly clockmaker in his seventies, thin, with a neat white beard, round brass-rimmed glasses, a flat wool cap and a patched brown waistcoat with a brass watch chain',
    },
    {
      name: 'Noor',
      appearance:
        'a nine-year-old girl with curly black hair tied back, a yellow raincoat that is too big for her and red rubber boots',
    },
  ],
  scenes: [
    {
      title: 'The lantern market',
      slugline: 'EXT. LANTERN MARKET — NIGHT',
      description: 'Rain falls on a crowded night market. At its edge, Ilyas opens the shutters of his tiny clock stall.',
      setting: 'A narrow night market strung with paper lanterns, light rain, evening',
      characters: ['Ilyas'],
      mood: 'calm',
      intensity: 1,
      shot: 'establishing',
      lineType: 'narration',
      speaker: '',
      line: 'Every night, the clocks of Lantern Street started ticking before the lanterns were lit.',
      visualPrompt:
        'A long narrow street market at night lined with glowing paper lanterns and wet cobblestones; at the far end a tiny stall full of clocks with an old man lifting its shutter.',
    },
    {
      title: 'A silent music box',
      slugline: 'INT. CLOCK STALL — NIGHT',
      description: 'Noor, soaked from the rain, sets a small wooden music box on the counter.',
      setting: 'The clock stall, crowded with ticking clocks, lamplight',
      characters: ['Noor', 'Ilyas'],
      mood: 'mysterious',
      intensity: 2,
      shot: 'medium',
      lineType: 'dialogue',
      speaker: 'Noor',
      line: 'It was my grandmother’s. It hasn’t made a sound since she died.',
      visualPrompt:
        'A small girl in a yellow raincoat reaches up to place a carved wooden music box on a cluttered counter; the old clockmaker leans in behind it, walls of clocks behind him.',
    },
    {
      title: 'Beyond repair',
      slugline: 'INT. CLOCK STALL — CONTINUOUS',
      description: 'Ilyas studies the broken mechanism through his loupe and shakes his head.',
      setting: 'The clock stall, under a single hanging bulb',
      characters: ['Ilyas'],
      mood: 'melancholic',
      intensity: 3,
      shot: 'close-up',
      lineType: 'dialogue',
      speaker: 'Ilyas',
      line: 'The spring is broken, little one. Nobody has made this part in fifty years.',
      visualPrompt:
        'Close on the old man’s face, a jeweller’s loupe over one eye, the open music box mechanism reflected in his glasses, his expression gentle but sorry.',
    },
    {
      title: 'The watch he loved',
      slugline: 'INT. SHUTTERED STALL — LATER',
      description: 'Alone after closing, Ilyas opens his late wife’s pocket watch and removes its spring.',
      setting: 'The shuttered stall late at night, lit by one candle',
      characters: ['Ilyas'],
      mood: 'dramatic',
      intensity: 4,
      shot: 'extreme-close-up',
      lineType: 'narration',
      speaker: '',
      line: 'By candlelight, he opened his wife’s pocket watch and gently took out its heart.',
      visualPrompt:
        'Extreme close-up of weathered hands holding tweezers, lifting a coiled spring out of an open engraved pocket watch, candle flame glowing at the edge of frame.',
    },
    {
      title: 'The lullaby',
      slugline: 'INT. CLOCK STALL — DAWN',
      description: 'At dawn the music box plays again, and Ilyas sits very still to listen.',
      setting: 'The stall at sunrise, morning light through the shutters',
      characters: ['Ilyas'],
      mood: 'hopeful',
      intensity: 5,
      shot: 'high-angle',
      lineType: 'narration',
      speaker: '',
      line: 'At dawn, the box played a lullaby he had not heard since he was a boy.',
      visualPrompt:
        'Looking down on the old man at his workbench among scattered tools, the open music box in front of him, golden morning light falling in stripes across the table.',
    },
    {
      title: 'A loud new tick',
      slugline: 'EXT. LANTERN MARKET — NEXT EVENING',
      description:
        'Noor, who noticed his empty watch chain, hands him a cheap new watch wrapped in newspaper. Ilyas laughs for the first time in years.',
      setting: 'The lantern market the next evening',
      characters: ['Noor', 'Ilyas'],
      mood: 'joyful',
      intensity: 4,
      shot: 'over-the-shoulder',
      lineType: 'dialogue',
      speaker: 'Ilyas',
      line: 'Listen to it tick, as impatient as you are!',
      visualPrompt:
        'Over the girl’s shoulder: the old clockmaker laughing as he holds up a small plastic watch, torn newspaper wrapping in his other hand, lanterns glowing behind him.',
    },
  ],
};

const BOTTLE: DemoData = {
  id: 'bottle',
  label: 'رسالة في زجاجة',
  blurb: 'Arabic · 5 scenes · right to left · a letter from the sea',
  title: 'رسالة في زجاجة',
  logline: 'فتاة من الإسكندرية تجد رسالةً في زجاجة، فتقرّر أن تكتب الجواب.',
  language: 'ar',
  direction: 'rtl',
  styleId: 'watercolor',
  story: `في صباحٍ شتويّ على شاطئ الإسكندرية، وجدت سلمى، ابنة الصيّاد، زجاجةً خضراء عالقةً بين الصخور. كان في داخلها ورقةٌ صفراء كتبها طفلٌ اسمه يوسف من جزيرةٍ بعيدة: «إلى من يجد هذه الرسالة: هل البحر عندكم أزرق مثل بحرنا؟».

ركضت سلمى إلى جدّتها التي علّمتها الكتابة بخطٍّ جميل. جلستا معًا في الشرفة المطلّة على الميناء، وكتبت سلمى جوابًا طويلًا عن قوارب أبيها وعن رائحة الخبز في الصباح.

في المساء خرجت مع أبيها في القارب، ورمت الزجاجة بعيدًا خلف الموج. وبعد عامٍ كامل، وصلت إلى البيت بطاقةٌ بريديّة عليها صورة جزيرةٍ صغيرة، وتحتها جملةٌ واحدة: «نعم، أزرق… لكنّ بحركم أجمل».`,
  characters: [
    {
      name: 'سلمى',
      appearance:
        'an eleven-year-old Egyptian girl with long dark hair in a single braid, a navy wool sweater and a red scarf',
    },
    {
      name: 'الجدة',
      appearance:
        'an Egyptian grandmother in her seventies with a kind round face, a white headscarf, a dark green cardigan and reading glasses on a cord',
    },
    {
      name: 'الأب',
      appearance:
        'a broad-shouldered Egyptian fisherman in his forties with a short black beard, a knitted grey cap and a faded blue work jacket',
    },
  ],
  scenes: [
    {
      title: 'زجاجة بين الصخور',
      slugline: 'خارجي. شاطئ الإسكندرية الصخري — صباح',
      description: 'تمشي سلمى على الشاطئ الصخري في الصباح الباكر، فيلمع شيءٌ أخضر بين الصخور.',
      setting: 'شاطئ الإسكندرية الصخري، صباح شتويّ غائم',
      characters: ['سلمى'],
      mood: 'mysterious',
      intensity: 2,
      shot: 'establishing',
      lineType: 'narration',
      speaker: '',
      line: 'في صباحٍ شتويّ، لمع شيءٌ أخضر بين صخور الشاطئ.',
      visualPrompt:
        'A wide grey winter morning on a rocky Mediterranean shore with the Alexandria corniche in the distance; a small girl in a red scarf bends toward a green glass bottle wedged between wet rocks.',
    },
    {
      title: 'رسالة يوسف',
      slugline: 'خارجي. بين الصخور — صباح',
      description: 'تفتح سلمى الزجاجة وتقرأ الورقة الصفراء التي كتبها يوسف.',
      setting: 'على الصخور، والريح تحرّك الورقة',
      characters: ['سلمى'],
      mood: 'mysterious',
      intensity: 3,
      shot: 'extreme-close-up',
      lineType: 'narration',
      speaker: '',
      line: '«إلى من يجد هذه الرسالة: هل البحر عندكم أزرق مثل بحرنا؟»',
      visualPrompt:
        'Extreme close-up of a child’s hands unrolling a small yellowed paper beside the neck of a green glass bottle, sea spray in the air; the handwriting is blurred and unreadable.',
    },
    {
      title: 'في الشرفة مع الجدة',
      slugline: 'خارجي. شرفة البيت القديم — بعد الظهر',
      description: 'تجلس سلمى مع جدّتها في الشرفة المطلّة على الميناء وتكتب جوابًا طويلًا.',
      setting: 'شرفة بيت قديم تطلّ على الميناء، بعد الظهر',
      characters: ['سلمى', 'الجدة'],
      mood: 'calm',
      intensity: 2,
      shot: 'medium',
      lineType: 'dialogue',
      speaker: 'الجدة',
      line: 'اكتبي له عن كلّ ما تحبّينه هنا، يا سلمى.',
      visualPrompt:
        'A girl and her grandmother sit side by side at a small table on an old balcony with wooden shutters, the harbour and fishing boats behind them; the girl writes while the grandmother points at the page.',
    },
    {
      title: 'خلف الموج',
      slugline: 'خارجي. قارب الصيد — غروب',
      description: 'عند الغروب، ترمي سلمى الزجاجة من قارب أبيها بعيدًا في البحر.',
      setting: 'قارب صيد صغير في البحر، عند الغروب',
      characters: ['سلمى', 'الأب'],
      mood: 'hopeful',
      intensity: 4,
      shot: 'over-the-shoulder',
      lineType: 'dialogue',
      speaker: 'الأب',
      line: 'ارميها بعيدًا، خلف الموج.',
      visualPrompt:
        'Over the fisherman’s shoulder in a small wooden boat at sunset: the girl stands at the bow and throws a green bottle high over the waves toward the orange horizon.',
    },
    {
      title: 'بطاقة من جزيرة',
      slugline: 'داخلي. البيت — صباح، بعد عام',
      description: 'بعد عامٍ كامل تصل بطاقة بريديّة عليها صورة جزيرة صغيرة، فتقرؤها سلمى لجدّتها.',
      setting: 'البيت، صباحٌ مشمس بعد عام',
      characters: ['سلمى', 'الجدة'],
      mood: 'joyful',
      intensity: 5,
      shot: 'close-up',
      lineType: 'narration',
      speaker: '',
      line: '«نعم، أزرق… لكنّ بحركم أجمل».',
      visualPrompt:
        'Close-up of the girl’s delighted face as she holds up a postcard showing a tiny green island in a blue sea, her grandmother smiling just behind her shoulder, warm sunlight.',
    },
  ],
};

const LIGHTHOUSE: DemoData = {
  id: 'lighthouse',
  label: 'The Last Lighthouse',
  blurb: 'English · 6 scenes · noir · a letter from the future',
  title: 'The Last Lighthouse',
  logline: 'On the night his lighthouse closes for good, an old keeper finds a letter he has not written yet.',
  language: 'en',
  direction: 'ltr',
  styleId: 'noir',
  story: `On the last night before the lighthouse is shut down for good, its old keeper, Elias, climbs the stairs one more time. Behind the great lens he finds an envelope addressed to him, in his own handwriting, dated forty years in the future.

The letter asks him to keep the light burning until dawn, because a small boat will be lost in the fog. Elias does not believe it, but he stays.

Near four in the morning a horn sounds close to the rocks. When the old motor dies, he turns the lamp by hand until the boat finds the harbour. At dawn a young fisherwoman, Mara, climbs the steps to thank him. "Someone should write down what you did tonight," she says. Elias smiles. "Someone will."`,
  characters: [
    {
      name: 'Elias',
      appearance:
        'a lighthouse keeper in his seventies, tall and stooped, with a weathered face, grey stubble, a dark knit cap and a heavy navy wool coat',
    },
    {
      name: 'Mara',
      appearance:
        'a fisherwoman in her twenties with short dark curly hair, a yellow oilskin jacket and rubber boots, a small notebook in her hand',
    },
  ],
  scenes: [
    {
      title: 'The last night',
      slugline: 'EXT. LIGHTHOUSE ON THE CLIFF — NIGHT',
      description: 'On the eve of its closing, the old lighthouse still sweeps its beam across the dark sea.',
      setting: 'A lighthouse on a cliff above a stormy sea, night, strong wind',
      characters: ['Elias'],
      mood: 'melancholic',
      intensity: 2,
      shot: 'establishing',
      lineType: 'narration',
      speaker: '',
      line: 'Tomorrow the light would go dark for good. Tonight, Elias climbed the stairs one last time.',
      visualPrompt:
        'A lone lighthouse on a black cliff above a rough sea at night, its beam cutting through low clouds, one small lit window halfway up the tower.',
    },
    {
      title: 'A letter behind the lens',
      slugline: 'INT. LAMP ROOM — NIGHT',
      description: 'Behind the great lens, Elias finds an envelope with his own name on it.',
      setting: 'The lamp room at the top of the tower, lit by the turning lens',
      characters: ['Elias'],
      mood: 'mysterious',
      intensity: 3,
      shot: 'extreme-close-up',
      lineType: 'narration',
      speaker: '',
      line: 'The envelope bore his name, in his own handwriting, dated forty years from now.',
      visualPrompt:
        'Extreme close-up of weathered fingers pulling a yellowed envelope from behind the brass frame of a huge glass lighthouse lens, prisms of light across the paper; the handwriting is blurred.',
    },
    {
      title: 'Keep it burning',
      slugline: 'INT. LAMP ROOM — CONTINUOUS',
      description: 'Elias reads the warning: a small boat will be lost in the fog tonight.',
      setting: 'The lamp room, the keeper reading by the light of the lens',
      characters: ['Elias'],
      mood: 'tense',
      intensity: 3,
      shot: 'close-up',
      lineType: 'dialogue',
      speaker: 'Elias',
      line: 'Keep it burning until dawn? Who asks that of a light they are switching off?',
      visualPrompt:
        'Close-up of an old keeper reading a letter, his face lit from below by the glowing lens behind him, his brow furrowed in doubt.',
    },
    {
      title: 'A horn in the fog',
      slugline: 'EXT. ROCKS BELOW THE LIGHTHOUSE — 4 A.M.',
      description: 'Out of the fog, a small fishing boat drifts toward the rocks.',
      setting: 'Thick fog over black rocks at the foot of the cliff, before dawn',
      characters: [],
      mood: 'dramatic',
      intensity: 5,
      shot: 'high-angle',
      lineType: 'narration',
      speaker: '',
      line: 'At four in the morning, a horn sounded close to the rocks.',
      visualPrompt:
        'High-angle view from the top of the lighthouse down onto thick fog over black rocks, a small fishing boat with a single lamp drifting dangerously close as the beam sweeps across it.',
    },
    {
      title: 'By hand',
      slugline: 'INT. LAMP ROOM — CONTINUOUS',
      description: 'The motor fails, and Elias turns the heavy lamp by hand to guide the boat home.',
      setting: 'The lamp room, the lens blazing above the keeper',
      characters: ['Elias'],
      mood: 'hopeful',
      intensity: 4,
      shot: 'low-angle',
      lineType: 'narration',
      speaker: '',
      line: 'When the old motor died, he turned the light by hand.',
      visualPrompt:
        'Low-angle shot of the old keeper straining at a brass crank, the giant lens above him blazing white, his shadow huge on the curved wall.',
    },
    {
      title: 'Someone will',
      slugline: 'EXT. LIGHTHOUSE STEPS — DAWN',
      description: 'At dawn, Mara climbs the steps to thank him, a notebook in her hand.',
      setting: 'The stone steps outside the lighthouse door, first light',
      characters: ['Mara', 'Elias'],
      mood: 'calm',
      intensity: 2,
      shot: 'over-the-shoulder',
      lineType: 'dialogue',
      speaker: 'Elias',
      line: 'Someone will.',
      visualPrompt:
        'Over the young fisherwoman’s shoulder at dawn: the old keeper in the lighthouse doorway smiles at her, pale morning light and calm sea behind him.',
    },
  ],
};

export interface DemoEntry {
  id: string;
  label: string;
  blurb: string;
  language: string;
  direction: Storyboard['direction'];
  styleId: string;
  sceneCount: number;
  /** The first scene, for the gallery cover. */
  cover: Pick<Scene, 'mood' | 'shot' | 'intensity'>;
}

const DEMOS: readonly DemoData[] = [CLOCKMAKER, BOTTLE, LIGHTHOUSE];

export const DEMO_ENTRIES: readonly DemoEntry[] = DEMOS.map(
  ({ id, label, blurb, language, direction, styleId, scenes }) => ({
    id,
    label,
    blurb,
    language,
    direction,
    styleId,
    sceneCount: scenes.length,
    cover: { mood: scenes[0]?.mood ?? 'calm', shot: scenes[0]?.shot ?? 'wide', intensity: scenes[0]?.intensity ?? 3 },
  }),
);

/** Returns a fresh copy of a demo storyboard (new IDs, safe to edit). */
export function loadDemo(id: string): Storyboard | undefined {
  const demo = DEMOS.find((d) => d.id === id);
  if (!demo) return undefined;
  return {
    version: 1,
    id: makeId('demo'),
    title: demo.title,
    logline: demo.logline,
    language: demo.language,
    direction: demo.direction,
    styleId: demo.styleId,
    characters: demo.characters.map((c) => ({ ...c })),
    scenes: demo.scenes.map((scene) => ({ ...scene, characters: [...scene.characters], id: makeId('scene') })),
    source: 'demo',
    createdAt: new Date().toISOString(),
    story: demo.story,
  };
}
