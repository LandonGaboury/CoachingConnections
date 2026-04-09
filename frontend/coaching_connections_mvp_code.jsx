// CoachingConnections Full Platform (Frontend + Backend + Core Systems)
// Production-style foundation

// ================= FRONTEND (React) =================

import React, { useState, useEffect } from "react";

export default function App() {
  const [tab, setTab] = useState("home");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <MainContent tab={tab} />
      <Navbar setTab={setTab} />
    </div>
  );
}

function MainContent({ tab }) {
  switch (tab) {
    case "home":
      return <Feed />;
    case "profile":
      return <Profile />;
    case "connections":
      return <Connections />;
    case "jobs":
      return <Jobs />;
    case "reels":
      return <Reels />;
    default:
      return <Feed />;
  }
}

function Navbar({ setTab }) {
  const tabs = ["home", "profile", "connections", "jobs", "reels"];

  return (
    <div className="fixed bottom-0 w-full bg-white flex justify-around p-3 shadow">
      {tabs.map((t) => (
        <button key={t} onClick={() => setTab(t)} className="capitalize">
          {t}
        </button>
      ))}
    </div>
  );
}

// ================= FEED =================

function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/posts`)
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Home / Media</h1>
      {posts.map((p) => (
        <div key={p._id} className="bg-white p-3 mt-2 rounded">
          <p>{p.content}</p>
        </div>
      ))}
    </div>
  );
}

// ================= PROFILE =================

function Profile() {
  const [profile, setProfile] = useState({});

  const updateProfile = () => {
    fetch(`${process.env.REACT_APP_API_URL}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">My Profile</h1>
      <input placeholder="Scheme" onChange={(e) => setProfile({ ...profile, scheme: e.target.value })} />
      <input placeholder="Level" onChange={(e) => setProfile({ ...profile, level: e.target.value })} />
      <button onClick={updateProfile}>Save</button>
    </div>
  );
}

// ================= CONNECTIONS =================

function Connections() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/connections`)
      .then((res) => res.json())
      .then(setConnections);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Connections</h1>
      {connections.map((c) => (
        <div key={c._id}>{c.name}</div>
      ))}
    </div>
  );
}

// ================= JOBS =================

function Jobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/jobs`)
      .then((res) => res.json())
      .then(setJobs);
  }, []);

  const apply = (id) => {
    fetch(`${process.env.REACT_APP_API_URL}/apply/${id}`, { method: "POST" });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Coaching Positions</h1>
      {jobs.map((job) => (
        <div key={job._id} className="bg-white p-3 mt-2 rounded">
          <h2>{job.title}</h2>
          <p>{job.type}</p>
          <button onClick={() => apply(job._id)}>Apply</button>
        </div>
      ))}
    </div>
  );
}

// ================= REELS =================

function Reels() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Reels</h1>
    </div>
  );
}

// ================= BACKEND =================

/* server.js */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/coachingconnections");

// ===== MODELS =====

const User = mongoose.model("User", {
  name: String,
  scheme: String,
  level: String,
  rating: Number,
});

const Job = mongoose.model("Job", {
  title: String,
  type: String, // apprenticeship or full-time
  scheme: String,
  level: String,
});

const Post = mongoose.model("Post", {
  content: String,
});

// ===== ROUTES =====

app.get("/posts", async (req, res) => {
  res.send(await Post.find());
});

app.post("/posts", async (req, res) => {
  const post = new Post(req.body);
  await post.save();
  res.send(post);
});

app.get("/jobs", async (req, res) => {
  res.send(await Job.find());
});

app.post("/jobs", async (req, res) => {
  const job = new Job(req.body);
  await job.save();
  res.send(job);
});

app.post("/apply/:id", (req, res) => {
  res.send({ message: "Applied" });
});

// ===== AI MATCHING =====

app.get("/match/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  const jobs = await Job.find();

  const ranked = jobs.sort((a, b) => score(b, user) - score(a, user));
  res.send(ranked);
});

function score(job, user) {
  let score = 0;
  if (job.scheme === user.scheme) score += 5;
  if (job.level === user.level) score += 5;
  return score;
}

// ===== APPRENTICESHIP SYSTEM =====

const Apprenticeship = mongoose.model("Apprenticeship", {
  coach: String,
  mentor: String,
  startDate: Date,
  endDate: Date,
  completed: Boolean,
});

app.post("/apprenticeship", async (req, res) => {
  const a = new Apprenticeship(req.body);
  await a.save();
  res.send(a);
});

// ===== RATINGS =====

const Rating = mongoose.model("Rating", {
  from: String,
  to: String,
  score: Number,
  comment: String,
});

app.post("/rate", async (req, res) => {
  const r = new Rating(req.body);
  await r.save();
  res.send(r);
});

app.listen(5000, () => console.log("Server running"));

// ================= NEXT STEPS =================
// - Add authentication (Firebase/Auth0)
// - Add messaging system (Socket.io)
// - Add geo filtering
// - Enforce apprenticeship -> job rule
// - Deploy (Vercel + Render)
