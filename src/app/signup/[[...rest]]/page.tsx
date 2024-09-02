// src/app/signup/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import React from "react";
import { SignUp } from "@clerk/nextjs";

const SignUpPage = () => (
	<div style={{ maxWidth: "400px", margin: "100px auto" }}>
		<SignUp path="/signup" routing="path" />
	</div>
);

export default SignUpPage;
