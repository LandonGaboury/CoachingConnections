const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE =================

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ================= MODELS =================

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  scheme:    { type: String, default: "" },
  level:     { type: String, default: "" },
  bio:       { type: String, default: "" },
  location:  { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  rating:    { type: Number, default: 0 },
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  type:        { type: String, enum: ["apprenticeship", "full-time", "part-time"], required: true },
  scheme:      { type: String, default: "" },
  level:       { type: String, default: "" },
  description: { type: String, default: "" },
  location:    { type: String, default: "" },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  content:   { type: String, required: true },
  authorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mediaUrl:  { type: String, default: "" },
  likes:     { type: Number, default: 0 },
}, { timestamps: true });

const apprenticeshipSchema = new mongoose.Schema({
  coach:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mentor:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate:   { type: Date },
  completed: { type: Boolean, default: false },
  notes:     { type: String, default: "" },
}, { timestamps: true });

const ratingSchema = new mongoose.Schema({
  from:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score:   { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
}, { timestamps: true });

const connectionSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status:    { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobId:     { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  status:    { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  coverNote: { type: String, default: "" },
}, { timestamps: true });

const User           = mongoose.model("User", userSchema);
const Job            = mongoose.model("Job", jobSchema);
const Post           = mongoose.model("Post", postSchema);
const Apprenticeship = mongoose.model("Apprenticeship", apprenticeshipSchema);
const Rating         = mongoose.model("Rating", ratingSchema);
const Connection     = mongoose.model("Connection", connectionSchema);
const Application    = mongoose.model("Application", applicationSchema);

// ================= MIDDLEWARE =================

// Simple error handler — wrap async route handlers with this
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ================= USER / PROFILE ROUTES =================

// Create a user
app.post("/users", asyncHandler(async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).json(user);
}));

// Get a user by ID
app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}));

// Update profile (the missing route from the original code)
app.post("/profile", asyncHandler(async (req, res) => {
  const { userId, ...updates } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  const user = await User.findByIdAndUpdate(userId, updates, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}));

// ================= POST / FEED ROUTES =================

// Get all posts, newest first
app.get("/posts", asyncHandler(async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).populate("authorId", "name avatarUrl");
  res.json(posts);
}));

// Create a post
app.post("/posts", asyncHandler(async (req, res) => {
  const post = new Post(req.body);
  await post.save();
  res.status(201).json(post);
}));

// Like a post
app.post("/posts/:id/like", asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json(post);
}));

// Delete a post
app.delete("/posts/:id", asyncHandler(async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
}));

// ================= JOB ROUTES =================

// Get all jobs, with optional filters: ?type=apprenticeship&scheme=UEFA&level=B
app.get("/jobs", asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type)   filter.type   = req.query.type;
  if (req.query.scheme) filter.scheme = req.query.scheme;
  if (req.query.level)  filter.level  = req.query.level;

  const jobs = await Job.find(filter).sort({ createdAt: -1 }).populate("postedBy", "name");
  res.json(jobs);
}));

// Create a job listing
app.post("/jobs", asyncHandler(async (req, res) => {
  const job = new Job(req.body);
  await job.save();
  res.status(201).json(job);
}));

// Delete a job
app.delete("/jobs/:id", asyncHandler(async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);
  res.json({ message: "Job deleted" });
}));

// ================= APPLICATIONS =================

// Apply to a job
app.post("/apply/:jobId", asyncHandler(async (req, res) => {
  const { userId, coverNote } = req.body;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  // Prevent duplicate applications
  const existing = await Application.findOne({ userId, jobId: req.params.jobId });
  if (existing) return res.status(409).json({ message: "Already applied to this job" });

  const application = new Application({
    userId,
    jobId: req.params.jobId,
    coverNote,
  });
  await application.save();
  res.status(201).json(application);
}));

// Get all applications for a job
app.get("/jobs/:jobId/applications", asyncHandler(async (req, res) => {
  const apps = await Application.find({ jobId: req.params.jobId }).populate("userId", "name scheme level rating");
  res.json(apps);
}));

// Update application status (accept/reject)
app.patch("/applications/:id", asyncHandler(async (req, res) => {
  const app_ = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!app_) return res.status(404).json({ message: "Application not found" });
  res.json(app_);
}));

// ================= AI MATCHING =================

// Returns jobs ranked by how well they match the user's profile
app.get("/match/:userId", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const jobs = await Job.find();

  const ranked = jobs
    .map((job) => ({ job, score: matchScore(job, user) }))
    .sort((a, b) => b.score - a.score)
    .map(({ job, score }) => ({ ...job.toObject(), matchScore: score }));

  res.json(ranked);
}));

function matchScore(job, user) {
  let score = 0;
  if (job.scheme   === user.scheme)   score += 5;
  if (job.level    === user.level)    score += 5;
  if (job.location === user.location) score += 3;
  return score;
}

// ================= APPRENTICESHIP ROUTES =================

// Create an apprenticeship
app.post("/apprenticeship", asyncHandler(async (req, res) => {
  const a = new Apprenticeship(req.body);
  await a.save();
  res.status(201).json(a);
}));

// Get apprenticeships for a user (as coach or mentor)
app.get("/apprenticeship/user/:userId", asyncHandler(async (req, res) => {
  const records = await Apprenticeship.find({
    $or: [{ coach: req.params.userId }, { mentor: req.params.userId }],
  }).populate("coach mentor", "name scheme level");
  res.json(records);
}));

// Mark an apprenticeship as complete
app.patch("/apprenticeship/:id/complete", asyncHandler(async (req, res) => {
  const a = await Apprenticeship.findByIdAndUpdate(
    req.params.id,
    { completed: true, endDate: new Date() },
    { new: true }
  );
  if (!a) return res.status(404).json({ message: "Apprenticeship not found" });
  res.json(a);
}));

// ================= RATINGS =================

// Submit a rating
app.post("/rate", asyncHandler(async (req, res) => {
  const { from, to, score, comment } = req.body;

  // Prevent self-rating
  if (from === to) return res.status(400).json({ message: "Cannot rate yourself" });

  const rating = new Rating({ from, to, score, comment });
  await rating.save();

  // Recalculate and store the average rating on the user
  const ratings = await Rating.find({ to });
  const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  await User.findByIdAndUpdate(to, { rating: Math.round(avg * 10) / 10 });

  res.status(201).json(rating);
}));

// Get all ratings for a user
app.get("/ratings/:userId", asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ to: req.params.userId }).populate("from", "name");
  res.json(ratings);
}));

// ================= CONNECTIONS =================

// Send a connection request
app.post("/connections/request", asyncHandler(async (req, res) => {
  const { requesterId, recipientId } = req.body;

  const existing = await Connection.findOne({ requester: requesterId, recipient: recipientId });
  if (existing) return res.status(409).json({ message: "Connection already exists" });

  const conn = new Connection({ requester: requesterId, recipient: recipientId });
  await conn.save();
  res.status(201).json(conn);
}));

// Accept or decline a connection
app.patch("/connections/:id", asyncHandler(async (req, res) => {
  const conn = await Connection.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!conn) return res.status(404).json({ message: "Connection not found" });
  res.json(conn);
}));

// Get all accepted connections for a user
app.get("/connections/:userId", asyncHandler(async (req, res) => {
  const conns = await Connection.find({
    $or: [{ requester: req.params.userId }, { recipient: req.params.userId }],
    status: "accepted",
  }).populate("requester recipient", "name scheme level rating avatarUrl");
  res.json(conns);
}));

// Get pending incoming requests for a user
app.get("/connections/:userId/pending", asyncHandler(async (req, res) => {
  const pending = await Connection.find({
    recipient: req.params.userId,
    status: "pending",
  }).populate("requester", "name scheme level avatarUrl");
  res.json(pending);
}));

// ================= GLOBAL ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// ================= START =================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // exported for testing with Jest/Supertest