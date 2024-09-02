// src/app/signin/[[...rest]]/page.tsx
import React from "react";
import { SignIn } from "@clerk/nextjs";

const SignInPage = () => (
	<div style={{ maxWidth: "400px", margin: "100px auto" }}>
		<SignIn path="/signin" routing="path" />
	</div>
);

export default SignInPage;
