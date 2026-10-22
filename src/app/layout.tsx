import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "INU 벽돌깨기", description: "횃불이와 함께하는 3 RED BRICK CHALLENGE · 운동건강학부 202202056 이강민" };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="ko"><body>{children}</body></html>; }
