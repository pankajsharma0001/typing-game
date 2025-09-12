import mongoose from "mongoose";

const SentenceSchema = new mongoose.Schema({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
});

export default mongoose.models.Sentence || mongoose.model("Sentence", SentenceSchema);
