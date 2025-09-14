// seedSentences.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/typinggame";
const client = new MongoClient(uri);

const sentences = [
  // Easy (20)
  { text: "Cats sleep most of the day.", difficulty: "easy" },
  { text: "The sun rises in the east.", difficulty: "easy" },
  { text: "Birds sing loudly in the morning.", difficulty: "easy" },
  { text: "I like to drink fresh water.", difficulty: "easy" },
  { text: "Dogs play happily in the park.", difficulty: "easy" },
  { text: "Rain falls softly on the roof.", difficulty: "easy" },
  { text: "She writes letters every week.", difficulty: "easy" },
  { text: "He runs fast in the race.", difficulty: "easy" },
  { text: "Apples are red and sweet.", difficulty: "easy" },
  { text: "The baby laughs at funny faces.", difficulty: "easy" },
  { text: "We walk to school together.", difficulty: "easy" },
  { text: "Flowers bloom in the spring season.", difficulty: "easy" },
  { text: "The wind blows through the trees.", difficulty: "easy" },
  { text: "He reads a book at night.", difficulty: "easy" },
  { text: "I eat breakfast every morning.", difficulty: "easy" },
  { text: "Stars shine bright in the sky.", difficulty: "easy" },
  { text: "The clock shows the right time.", difficulty: "easy" },
  { text: "We listen to music at home.", difficulty: "easy" },
  { text: "The dog barks at strangers.", difficulty: "easy" },
  { text: "Water flows down the small stream.", difficulty: "easy" },

  // Medium (20)
  { text: "She carefully arranged the books on the library shelf.", difficulty: "medium" },
  { text: "The children played happily in the sunny garden.", difficulty: "medium" },
  { text: "He solved the puzzle after thinking for a long time.", difficulty: "medium" },
  { text: "Clouds gather quickly before a heavy rainstorm begins.", difficulty: "medium" },
  { text: "I enjoy reading stories about adventures and faraway lands.", difficulty: "medium" },
  { text: "They planted vegetables in the backyard every weekend.", difficulty: "medium" },
  { text: "The teacher explained the lesson clearly and slowly.", difficulty: "medium" },
  { text: "Birds flew across the sky, forming a perfect line.", difficulty: "medium" },
  { text: "He wrote a long letter to his best friend.", difficulty: "medium" },
  { text: "She painted a beautiful picture of the ocean waves.", difficulty: "medium" },
  { text: "We walked along the beach as the sun set.", difficulty: "medium" },
  { text: "The dog chased the ball into the tall grass.", difficulty: "medium" },
  { text: "I listened carefully to the instructions before starting the project.", difficulty: "medium" },
  { text: "A gentle breeze cooled us on a warm afternoon.", difficulty: "medium" },
  { text: "The students worked together to complete the group assignment.", difficulty: "medium" },
  { text: "He fixed the broken chair using wood and nails.", difficulty: "medium" },
  { text: "They enjoyed a picnic under the shade of a large tree.", difficulty: "medium" },
  { text: "The small boat drifted slowly down the calm river.", difficulty: "medium" },
  { text: "She carefully folded the clothes and placed them in drawers.", difficulty: "medium" },
  { text: "The cat jumped onto the window sill to watch birds.", difficulty: "medium" },

  // Hard (20)
  { text: "Despite the heavy rain, they continued their journey through the dense forest.", difficulty: "hard" },
  { text: "The intricate machinery required careful adjustments to function properly without any errors.", difficulty: "hard" },
  { text: "He wondered whether the mysterious letter was meant for him or someone else.", difficulty: "hard" },
  { text: "While studying the stars, she discovered an unusual pattern in the night sky.", difficulty: "hard" },
  { text: "The committee debated for hours before reaching a unanimous decision on the proposal.", difficulty: "hard" },
  { text: "Ancient manuscripts revealed secrets about civilizations that existed thousands of years ago.", difficulty: "hard" },
  { text: "The mathematician solved the complex equation that had puzzled experts for decades.", difficulty: "hard" },
  { text: "A sudden gust of wind scattered the papers across the entire room.", difficulty: "hard" },
  { text: "As the sun set, the mountains cast long shadows across the valley below.", difficulty: "hard" },
  { text: "He meticulously painted every detail of the miniature model to perfection.", difficulty: "hard" },
  { text: "The orchestra played a symphony so beautifully that the audience was mesmerized.", difficulty: "hard" },
  { text: "Scientists conducted experiments to determine the effects of the new chemical compound.", difficulty: "hard" },
  { text: "She carefully crafted a speech that balanced humor, emotion, and inspiration.", difficulty: "hard" },
  { text: "The explorer documented every aspect of the uncharted island in his journal.", difficulty: "hard" },
  { text: "Despite numerous setbacks, the team remained determined to complete the ambitious project.", difficulty: "hard" },
  { text: "The professor explained a complex theory using simple examples to ensure understanding.", difficulty: "hard" },
  { text: "He carefully navigated the narrow streets, avoiding obstacles and pedestrians alike.", difficulty: "hard" },
  { text: "A combination of luck, skill, and timing led to their unexpected victory.", difficulty: "hard" },
  { text: "The novel’s intricate plot wove together multiple characters and timelines seamlessly.", difficulty: "hard" },
  { text: "Observing the behavior of the animals provided insights into their survival strategies.", difficulty: "hard" }
];

async function seed() {
  try {
    await client.connect();
    const db = client.db(); // defaults to database in URI
    const collection = db.collection("sentences");

    // Optional: clear existing sentences
    await collection.deleteMany({});

    // Insert new sentences
    const result = await collection.insertMany(sentences);
    console.log(`Inserted ${result.insertedCount} sentences.`);
  } catch (err) {
    console.error("Error seeding sentences:", err);
  } finally {
    await client.close();
  }
}

seed();
