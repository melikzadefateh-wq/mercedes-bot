require("dotenv").config();

const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const { loginUrl, handleCallback } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, "dashboard-state.json");

function defaultState() {
    return {
        guard: {
            spam: true,
            links: true,
            raid: true
        },
        panel: {
            theme: "Mercedes Black"
        },
        logs: []
    };
}

function loadState() {
    try {
        if (!fs.existsSync(STATE_FILE)) {
            const initial = defaultState();
            fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), "utf8");
            return initial;
        }

        const raw = fs.readFileSync(STATE_FILE, "utf8");
        return JSON.parse(raw);
    } catch (err) {
        console.log("STATE READ ERROR:", err.message);
        return defaultState();
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

function pushLog(type, action, by) {
    const state = loadState();
    state.logs.unshift({
        type,
        action,
        by,
        time: new Date().toLocaleString("tr-TR")
    });
    state.logs = state.logs.slice(0, 30);
    saveState(state);
    return state;
}

function requireAuth(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

function requirePass(req, res, next) {
    if (!req.session.passed) return res.redirect("/gate");
    next();
}

app.set("view engine", "ejs");
app.set("views", __dirname);

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "mercedes_secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax"
        }
    })
);

app.get("/", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (!req.session.passed) return res.redirect("/gate");
    return res.redirect("/dashboard");
});

app.get("/login", (req, res) => {
    if (req.session.user && req.session.passed) return res.redirect("/dashboard");
    if (req.session.user && !req.session.passed) return res.redirect("/gate");
    res.render("login", { url: loginUrl });
});

app.get("/gate", requireAuth, (req, res) => {
    if (req.session.passed) return res.redirect("/dashboard");
    res.render("gate", {
        user: req.session.user,
        error: null
    });
});

app.post("/gate", requireAuth, (req, res) => {
    const password = String(req.body.password || "").trim();

    if (password !== "Berkcan") {
        return res.status(401).render("gate", {
            user: req.session.user,
            error: "Parola hatalı."
        });
    }

    req.session.passed = true;
    return res.redirect("/dashboard");
});

app.get("/dashboard", requireAuth, requirePass, (req, res) => {
    const state = loadState();
    res.render("dashboard", {
        user: req.session.user,
        state
    });
});

app.get("/users", requireAuth, requirePass, (req, res) => {
    const state = loadState();
    res.render("users", {
        user: req.session.user,
        state
    });
});

app.get("/logs", requireAuth, requirePass, (req, res) => {
    const state = loadState();
    res.render("logs", {
        user: req.session.user,
        state
    });
});

app.get("/guard", requireAuth, requirePass, (req, res) => {
    const state = loadState();
    res.render("guard", {
        user: req.session.user,
        state
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

app.get("/auth/callback", async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.redirect("/login");

        const result = await handleCallback(code);

        if (!result.allowed) {
            return res.status(403).send(`
                <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>Erişim Reddedildi</title>
                        <link rel="stylesheet" href="/style.css">
                    </head>
                    <body class="page">
                        <div class="login-shell">
                            <div class="card error-card">
                                <h1>Yetki Yok</h1>
                                <p>Bu sunucu için erişim iznin bulunmuyor.</p>
                                <a class="btn btn-primary" href="/login">Geri dön</a>
                            </div>
                        </div>
                    </body>
                </html>
            `);
        }

        req.session.user = result.user;
        req.session.guilds = result.guilds;
        req.session.passed = false;

        res.redirect("/gate");
    } catch (err) {
        console.log("AUTH CALLBACK ERROR:", err.message);
        res.status(500).send("Giriş başarısız.");
    }
});

app.post("/api/guard/toggle", requireAuth, requirePass, (req, res) => {
    const key = String(req.body.key || "");
    if (!["spam", "links", "raid"].includes(key)) {
        return res.status(400).json({ ok: false, message: "Geçersiz anahtar." });
    }

    const state = loadState();
    state.guard[key] = !state.guard[key];
    state.logs.unshift({
        type: "guard",
        action: `${key.toUpperCase()} ${state.guard[key] ? "ON" : "OFF"}`,
        by: req.session.user.username,
        time: new Date().toLocaleString("tr-TR")
    });
    state.logs = state.logs.slice(0, 30);
    saveState(state);

    res.json({ ok: true, guard: state.guard });
});

app.post("/api/panel/theme", requireAuth, requirePass, (req, res) => {
    const theme = String(req.body.theme || "Mercedes Black");
    const state = loadState();
    state.panel.theme = theme;
    state.logs.unshift({
        type: "panel",
        action: `THEME SET: ${theme}`,
        by: req.session.user.username,
        time: new Date().toLocaleString("tr-TR")
    });
    state.logs = state.logs.slice(0, 30);
    saveState(state);

    res.json({ ok: true, theme: state.panel.theme });
});

app.post("/api/logs/clear", requireAuth, requirePass, (req, res) => {
    const state = loadState();
    state.logs = [];
    saveState(state);
    res.json({ ok: true });
});

app.post("/api/users/action", requireAuth, requirePass, (req, res) => {
    const target = String(req.body.target || "").trim();
    const reason = String(req.body.reason || "Belirtilmedi").trim();
    const action = String(req.body.action || "").trim().toLowerCase();

    if (!target) {
        return res.status(400).json({ ok: false, message: "Kullanıcı alanı boş." });
    }

    if (!["ban", "kick", "warn"].includes(action)) {
        return res.status(400).json({ ok: false, message: "Geçersiz işlem." });
    }

    const state = loadState();
    state.logs.unshift({
        type: action,
        action: `${action.toUpperCase()} -> ${target} | ${reason}`,
        by: req.session.user.username,
        time: new Date().toLocaleString("tr-TR")
    });
    state.logs = state.logs.slice(0, 30);
    saveState(state);

    res.json({
        ok: true,
        message: `${action.toUpperCase()} kaydı oluşturuldu.`
    });
});

app.get("/api/state", requireAuth, requirePass, (req, res) => {
    const state = loadState();
    res.json(state);
});

app.listen(PORT, () => {
    console.log(`Dashboard aktif: http://localhost:${PORT}`);
});
