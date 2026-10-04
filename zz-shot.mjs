import { chromium } from "playwright";
const dir = process.argv[2];
const ROUTES = ["/en","/en/stages","/en/blog","/en/blog/how-to-read-an-ai-paper","/en/compare","/fr/news","/en/resources","/en/donate"];
const b = await chromium.launch();
for (const [w,h,mob] of [[1440,900,false],[390,844,true]]) {
  for (const theme of ["light","dark"]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
    await ctx.addInitScript(`try{localStorage.setItem("appearance_theme_preference","${theme}")}catch{}`);
    const p = await ctx.newPage();
    for (const r of ROUTES) {
      await p.goto("http://localhost:3500"+r, { waitUntil:"domcontentloaded" });
      await p.waitForTimeout(1400);
      await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}window.scrollTo(0,0);});
      await p.waitForTimeout(600);
      const name = `${r.replace(/\//g,"_")}_${w}_${theme}.png`;
      await p.screenshot({ path: `${dir}/${name}`, fullPage: true });
    }
    await ctx.close();
  }
}
await b.close();
console.log("  captured", ROUTES.length*4, "screenshots ->", dir);
