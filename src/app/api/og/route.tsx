import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Dynamic 1200×630 social appraisal certificate badge. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get("domain") ?? "yournextdrop.com")
    .slice(0, 42)
    .replace(/[<>"']/g, "");
  const score = (url.searchParams.get("score") ?? "").slice(0, 6);
  const grade = (url.searchParams.get("grade") ?? "").slice(0, 2);
  const valMinor = Number(url.searchParams.get("val") ?? 0);
  const valuation =
    valMinor > 0
      ? `$${Math.round(valMinor / 100).toLocaleString("en-US")}`
      : "";

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#070b09",
            border: "3px solid #1b2b23",
            padding: "56px 64px",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: "#2ee68d",
                  display: "flex",
                }}
              />
              <span style={{ color: "#e7f5ec", fontSize: 30, fontWeight: 700, letterSpacing: 6 }}>
                DOMAINSNIPER.AI
              </span>
            </div>
            <span style={{ color: "#8aa397", fontSize: 22, letterSpacing: 4 }}>
              DROP RADAR CERTIFICATE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#8aa397", fontSize: 24, letterSpacing: 8 }}>
              EXPIRING DOMAIN APPRAISAL
            </span>
            <span
              style={{
                color: "#2ee68d",
                fontSize: domain.length > 22 ? 84 : 108,
                fontWeight: 700,
                marginTop: 10,
              }}
            >
              {domain}
            </span>
            <div style={{ display: "flex", gap: 40, marginTop: 28 }}>
              {score ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "#8aa397", fontSize: 20, letterSpacing: 4 }}>
                    SNIPERSCORE
                  </span>
                  <span style={{ color: "#ffb224", fontSize: 56, fontWeight: 700 }}>
                    {score} / 100 {grade ? `· GRADE ${grade}` : ""}
                  </span>
                </div>
              ) : null}
              {valuation ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ color: "#8aa397", fontSize: 20, letterSpacing: 4 }}>
                    EST. MARKET VALUE
                  </span>
                  <span style={{ color: "#e7f5ec", fontSize: 56, fontWeight: 700 }}>
                    {valuation}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "2px solid #1b2b23",
              paddingTop: 24,
            }}
          >
            <span style={{ color: "#5f7268", fontSize: 20 }}>
              DR · RD · AGE · BRAND · ARBITRAGE → 0–100 MATHEMATICAL SCORE
            </span>
            <span style={{ color: "#2ee68d", fontSize: 20 }}>
              domainsniper.ai
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch {
    // Offline-safe SVG fallback so the route never 500s.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#070b09"/><rect x="3" y="3" width="1194" height="624" fill="none" stroke="#1b2b23" stroke-width="3"/><text x="64" y="84" fill="#e7f5ec" font-family="monospace" font-size="30" font-weight="700" letter-spacing="6">DOMAINSNIPER.AI — DROP RADAR CERTIFICATE</text><text x="64" y="290" fill="#2ee68d" font-family="monospace" font-size="88" font-weight="700">${domain}</text><text x="64" y="380" fill="#ffb224" font-family="monospace" font-size="48" font-weight="700">SNIPERSCORE ${score || "—"} / 100</text><text x="64" y="450" fill="#e7f5ec" font-family="monospace" font-size="44" font-weight="700">EST. VALUE ${valuation || "—"}</text><text x="64" y="580" fill="#5f7268" font-family="monospace" font-size="20">AUTHORITY · BACKLINKS · AGE · BRAND · ARBITRAGE</text></svg>`;
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "no-store",
      },
    });
  }
}
