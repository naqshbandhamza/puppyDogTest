const http = require("http");
const https = require("https");
const url = require("url");

function fetchTitle(address) {
    return new Promise((resolve) => {
        if (!address.startsWith("http")) {
            address = "https://" + address;
        }

        const client = address.startsWith("https") ? https : http;

        client.get(address, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchTitle(res.headers.location));
            }

            let body = "";
            res.on("data", chunk => body += chunk);

            res.on("end", () => {
                const match = body.match(/<title>(.*?)<\/title>/i);
                if (match) {
                    resolve({ address, title: match[1] });
                } else {
                    resolve({ address, title: "NO RESPONSE" });
                }
            });
        }).on("error", () => {
            resolve({ address, title: "NO RESPONSE" });
        });
    });
}


const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === "/I/want/title") {
        const addresses = parsedUrl.query.address;

        if (!addresses) {
            res.writeHead(400, { "Content-Type": "text/html" });
            return res.end("<h1>No address provided</h1>");
        }

        const addressList = Array.isArray(addresses) ? addresses : [addresses];

        try {
            const results = await Promise.all(addressList.map(addr => fetchTitle(addr)));

            res.writeHead(200, { "Content-Type": "text/html" });
            res.write("<html><head></head><body>");
            res.write("<h1>Following are the titles of given websites:</h1>");
            res.write("<ul>");
            results.forEach(r => {
                res.write(`<li>${r.address} - "${r.title}"</li>`);
            });
            res.write("</ul></body></html>");
            res.end();

        } catch (err) {
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end("<h1>Server error</h1>");
        }

    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }

});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
