import express from "express";

const app = express();
app.use(express.json());

// penyimpanan sementara
const storage = {};

// PROTECT API
app.post("/protect", (req, res) => {
    const { lua } = req.body;

    if (!lua) {
        return res.json({ error: "Lua kosong" });
    }

    const encoded = Buffer.from(lua).toString("base64");

    const protectedLua = `
return (function()
    if not game then
        return "ACCESS DENIED"
    end

    local decoded = game:GetService("HttpService"):Base64Decode("${encoded}")
    return loadstring(decoded)()
end)()
`;

    const id = Math.random().toString(36).substring(2, 10);

    storage[id] = {
        code: protectedLua,
        created: Date.now()
    };

    const url = `https://${req.headers.host}/raw/${id}`;

    res.json({
        raw: url,
        loadstring: \`loadstring(game:HttpGet("${url}"))()\`
    });
});

// RAW ENDPOINT
app.get("/raw/:id", (req, res) => {
    const data = storage[req.params.id];

    if (!data) {
        return res.send("ACCESS DENIED");
    }

    res.set("Content-Type", "text/plain");
    res.send(data.code);
});

// auto hapus (optional: 1 jam)
setInterval(() => {
    const now = Date.now();
    for (let key in storage) {
        if (now - storage[key].created > 3600000) {
            delete storage[key];
        }
    }
}, 60000);

app.get("/", (req, res) => {
    res.send("Lua Protect API Aktif");
});

app.listen(3000, () => console.log("Server jalan"));
