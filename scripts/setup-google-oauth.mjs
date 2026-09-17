import http from "node:http";
import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const PORT = 8790;
const PROD = "https://speakup-gold.vercel.app";
const CALLBACK = `${PROD}/api/auth/callback/google`;
const LOCAL_CALLBACK = "http://localhost:3000/api/auth/callback/google";

const consoleUrl =
  "https://console.cloud.google.com/apis/credentials/oauthclient?previousPage=%2Fapis%2Fcredentials";

function run(cmd) {
  return execAsync(cmd, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 });
}

async function setVercelEnv(name, value) {
  for (const envName of ["production", "preview", "development"]) {
    try {
      await run(
        `npx --yes vercel@latest env rm ${name} ${envName} --yes`,
      );
    } catch {
      // ignore if missing
    }
    await run(
      `npx --yes vercel@latest env add ${name} ${envName} --value ${JSON.stringify(value)} --yes --sensitive --force`,
    );
  }
}

const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>SpeakUp — Google Login Setup</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code, input { font-family: ui-monospace, monospace; }
    input, button { font-size: 1rem; padding: .65rem .8rem; width: 100%; box-sizing: border-box; margin: .35rem 0 1rem; }
    button { background: #1a73e8; color: #fff; border: 0; border-radius: 8px; cursor: pointer; }
    .box { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 10px; padding: 1rem; margin: 1rem 0; }
    ol { padding-left: 1.2rem; }
    a { color: #1a73e8; }
  </style>
</head>
<body>
  <h1>Вход через Google для SpeakUp</h1>
  <p>Нужно один раз создать OAuth-клиент в Google Cloud (это делает только Google).</p>

  <div class="box">
    <ol>
      <li>Откройте <a href="${consoleUrl}" target="_blank" rel="noreferrer">Google Cloud → Create OAuth client</a></li>
      <li>Если попросит — создайте проект, например <b>SpeakUp</b></li>
      <li>Включите OAuth consent screen (External / Testing) и добавьте свой Gmail как Test user</li>
      <li>Application type: <b>Web application</b></li>
      <li>Name: <b>SpeakUp</b></li>
      <li>Authorized JavaScript origins:
        <br><code>${PROD}</code>
        <br><code>http://localhost:3000</code>
      </li>
      <li>Authorized redirect URIs:
        <br><code>${CALLBACK}</code>
        <br><code>${LOCAL_CALLBACK}</code>
      </li>
      <li>Create → скопируйте <b>Client ID</b> и <b>Client Secret</b> сюда ↓</li>
    </ol>
  </div>

  <form method="POST" action="/save">
    <label>Client ID</label>
    <input name="clientId" required placeholder="xxxxx.apps.googleusercontent.com" />
    <label>Client Secret</label>
    <input name="clientSecret" required placeholder="GOCSPX-..." />
    <button type="submit">Сохранить и задеплоить SpeakUp</button>
  </form>
  <p id="status"></p>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url?.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "POST" && req.url === "/save") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const params = new URLSearchParams(body);
    const clientId = (params.get("clientId") || "").trim();
    const clientSecret = (params.get("clientSecret") || "").trim();

    if (!clientId || !clientSecret) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Нужны оба поля</h1><a href='/'>Назад</a>");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write("<h1>Сохраняю в Vercel и деплою…</h1><pre>");

    try {
      console.log("SETTING_ENV");
      await setVercelEnv("AUTH_GOOGLE_ID", clientId);
      res.write("AUTH_GOOGLE_ID ok\n");
      await setVercelEnv("AUTH_GOOGLE_SECRET", clientSecret);
      res.write("AUTH_GOOGLE_SECRET ok\n");
      await setVercelEnv("AUTH_URL", PROD);
      res.write("AUTH_URL ok\n");
      console.log("DEPLOYING");
      const { stdout, stderr } = await run("npx --yes vercel@latest deploy --prod --yes");
      res.write(stdout.slice(-2000));
      if (stderr) res.write(stderr.slice(-1000));
      res.write(`\n\nГотово. Откройте ${PROD}/en/login</pre>`);
      console.log("GOOGLE_SETUP_DONE");
      res.end();
      setTimeout(() => process.exit(0), 1500);
    } catch (error) {
      console.error(error);
      res.write(String(error));
      res.end("</pre><a href='/'>Попробовать снова</a>");
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`OPEN_URL=${url}`);
  exec(`start ${url}`);
  exec(`start ${consoleUrl}`);
});
