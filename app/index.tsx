// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";

export default function Index() {
  // When app opens, always go to /login
  return <Redirect href="/login" />;
}
