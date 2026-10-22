import { JWT } from "google-auth-library";
import { formatTime } from "./engine";
export const SHEET_ID = process.env.GOOGLE_SHEET_ID || "1XqujCdJc4HUxqVVU18Bao7yQEXWBIvXB_npbwr1Px4o";
const tab = process.env.GOOGLE_SHEET_TAB || "시트1";
export type Score = { name: string; seconds: number; time: string };
export function rank(rows: unknown[][]): Score[] {
  return rows.slice(1).flatMap(row => { const name = String(row[1] || "").trim(); const text = String(row[2] || "").trim(); const m = /^(\d+):([0-5]\d)$/.exec(text); if (!name || !m) return []; const seconds = Number(m[1]) * 60 + Number(m[2]); return [{ name, seconds, time: formatTime(seconds) }]; }).sort((a,b) => a.seconds - b.seconds || a.name.localeCompare(b.name, "ko")).slice(0,3);
}
function csv(text: string) {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i]; if (ch === '"') { if (quoted && text[i+1] === '"') { cell += '"'; i++; } else quoted = !quoted; } else if (ch === ',' && !quoted) { row.push(cell); cell = ""; } else if ((ch === '\n' || ch === '\r') && !quoted) { if (ch === '\r' && text[i+1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += ch; }
  if (cell || row.length) { row.push(cell); rows.push(row); } return rows;
}
export async function readScores() {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const token = await accessToken();
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(`'${tab.replace(/'/g,"''")}'!A:C`)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("랭킹 시트의 서버 읽기 권한을 확인해 주세요.");
    const data = await response.json();
    if (data.values?.[0]?.[0] !== "timestamp" || data.values?.[0]?.[1] !== "name" || data.values?.[0]?.[2] !== "finishtime") throw new Error("시트의 A:C 헤더를 확인해 주세요.");
    return rank(data.values || []);
  }
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(SHEET_ID)}/export?format=csv&gid=0`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("공개 시트의 랭킹을 불러오지 못했어요.");
  const rows = csv(await response.text());
  if (rows[0]?.[0]?.replace(/^\uFEFF/, "") !== "timestamp" || rows[0]?.[1] !== "name" || rows[0]?.[2] !== "finishtime") throw new Error("시트의 A:C 헤더를 확인해 주세요.");
  return rank(rows);
}
async function accessToken() {
  const email = process.env.GOOGLE_CLIENT_EMAIL, key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) throw new Error("기록 저장 연결이 필요해요. 서버의 Google 서비스 계정 환경변수를 설정하고 시트를 편집자로 공유해 주세요.");
  const auth = new JWT({ email, key: key.replace(/\\n/g, "\n"), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const { access_token } = await auth.authorize();
  return access_token;
}
export async function appendScore(name: string, seconds: number) {
  const access_token = await accessToken();
  const range = `'${tab.replace(/'/g,"''")}'!A:C`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=OVERWRITE`, { method: "POST", headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ values: [[new Date().toISOString(), name, formatTime(seconds)]] }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("시트에 기록을 저장하지 못했어요. 이 시트에 서비스 계정의 편집 권한이 있는지 확인해 주세요.");
}
