import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import test from "node:test";

test("production build contains the branded React entry", async () => {
  const [html, socialImage] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    stat(new URL("../dist/og.png", import.meta.url)),
  ]);

  assert.match(html, /<title>秘仪 · 我的塔罗抽牌<\/title>/);
  assert.match(html, /<meta property="og:image" content="\/og\.png"/);
  assert.match(html, /<link rel="canonical" href="\/"/);
  assert.doesNotMatch(html, /__SITE_URL__/);
  assert.match(html, /\/assets\/index-[^"']+\.js/);
  assert.match(html, /\/assets\/index-[^"']+\.css/);
  assert.doesNotMatch(html, /standalone|next\/|_vinext/);
  assert.ok(socialImage.size > 100_000);
});

test("ships all 78 card images and meanings", async () => {
  const [data, publicFiles, builtFiles] = await Promise.all([
    readFile(new URL("../src/tarot-data.ts", import.meta.url), "utf8"),
    readdir(new URL("../public/cards/", import.meta.url)),
    readdir(new URL("../dist/cards/", import.meta.url)),
  ]);

  const meaningRows = data
    .slice(0, data.indexOf("const pad"))
    .match(/^\s*\["/gm) ?? [];
  const expectedCards = [
    ...Array.from({ length: 22 }, (_, index) => `m${String(index).padStart(2, "0")}.webp`),
    ...["w", "c", "s", "p"].flatMap((prefix) =>
      Array.from(
        { length: 14 },
        (_, index) => `${prefix}${String(index + 1).padStart(2, "0")}.webp`,
      ),
    ),
  ].sort();

  assert.equal(meaningRows.length, 78);
  assert.deepEqual(publicFiles.filter((file) => file.endsWith(".webp")).sort(), expectedCards);
  assert.deepEqual(builtFiles.filter((file) => file.endsWith(".webp")).sort(), expectedCards);
});

test("keeps the physical flip layers browser-safe", async () => {
  const [app, css, headers] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  ]);

  assert.match(app, /--flip-angle/);
  assert.match(app, /onPointerMove=\{updateCardPhysics\}/);
  assert.match(css, /backface-visibility:\s*hidden/);
  assert.match(css, /\.tarot-card\.revealed \.tarot-card-inner\s*\{[^}]*rotateY\(var\(--flip-angle\)\)/s);
  assert.match(css, /\.tarot-card-front\s*\{[^}]*rotateY\(180deg\)/s);
  assert.doesNotMatch(css, /rotate3d\(var\(--flip-axis/);
  assert.match(headers, /\/index\.html[\s\S]*Cache-Control: no-cache, no-store, must-revalidate/);
});

test("supports centered mobile cards and opt-in device motion", async () => {
  const [app, css, headers] = await Promise.all([
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  ]);

  assert.match(app, /requestPermission/);
  assert.match(app, /deviceorientation/);
  assert.match(app, /重新校准体感/);
  assert.doesNotMatch(app, /className=\{item\.reversed \? "is-reversed"/);
  assert.doesNotMatch(css, /\.tarot-card-front img\.is-reversed/);
  assert.match(css, /\.tarot-card\.is-motion-tracking/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.drawn-cards\.cards-3\s*\{[^}]*justify-items:\s*center/s);
  assert.match(headers, /accelerometer=\(self\)/);
  assert.match(headers, /gyroscope=\(self\)/);
});
