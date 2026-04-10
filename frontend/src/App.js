import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL;

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
    case "home":       return <Feed />;
    case "profile":    return <Profile />;
    case "connections":return <Connections />;
    case "jobs":       return <Jobs />;
    case "reels":      return <Reels />;
    default:           return <Feed />;
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

function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`${API}/posts`)
      .then((res) => res.json())
      .then(setPosts)
      .catch((err) => console.error("Failed to load posts:", err));
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

function Profile() {
  const [profile, setProfile] = useState({});

  const updateProfile = () => {
    fetch(`${API}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch((err) => console.error("Failed to update profile:", err));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">My Profile</h1>
      <input
        className="border p-2 mt-2 w-full rounded"
        placeholder="Scheme"
        onChange={(e) => setProfile({ ...profile, scheme: e.target.value })}
      />
      <input
        className="border p-2 mt-2 w-full rounded"
        placeholder="Level"
        onChange={(e) => setProfile({ ...profile, level: e.target.value })}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        onClick={updateProfile}
      >
        Save
      </button>
    </div>
  );
}

function Connections() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetch(`${API}/connections/placeholder`)
      .then((res) => res.json())
      .then(setConnections)
      .catch((err) => console.error("Failed to load connections:", err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Connections</h1>
      {connections.map((c) => (
        <div key={c._id} className="bg-white p-3 mt-2 rounded">
          {c.name}
        </div>
      ))}
    </div>
  );
}

function Jobs() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch(`${API}/jobs`)
      .then((res) => res.json())
      .then(setJobs)
      .catch((err) => console.error("Failed to load jobs:", err));
  }, []);

  const apply = (id) => {
    fetch(`${API}/apply/${id}`, { method: "POST" })
      .catch((err) => console.error("Failed to apply:", err));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Coaching Positions</h1>
      {jobs.map((job) => (
        <div key={job._id} className="bg-white p-3 mt-2 rounded">
          <h2 className="font-semibold">{job.title}</h2>
          <p className="text-gray-500">{job.type}</p>
          <button
            className="bg-green-500 text-white px-3 py-1 mt-1 rounded"
            onClick={() => apply(job._id)}
          >
            Apply
          </button>
        </div>
      ))}
    </div>
  );
}

function Reels() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Reels</h1>
      <p className="text-gray-500 mt-2">Coming soon.</p>
    </div>
  );
}