"use client";

import { useState } from "react";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    cpassword: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.cpassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert("Signup successful!");
      console.log(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    >
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px", color: "black"  }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px", color: "black"  }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px", color: "black" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label htmlFor="cpassword">Confirm Password:</label>
          <input
            type="password"
            id="cpassword"
            name="cpassword"
            value={formData.cpassword}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px", color: "black" }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button
          type="submit"
          style={{
            padding: "10px 15px",
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Signup
        </button>
      </form>
    </div>
  );
}
