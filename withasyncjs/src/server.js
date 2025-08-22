const http = require("http");
const https = require("https");
const url = require("url");
const async = require("async");

function fetchTitle(address, callback) {

    if (!address.startsWith("http")) {
        address = "https://" + address;
    }

    const client = address.startsWith("https") ? https : http;

    client.get(address, (res) => {

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return fetchTitle(res.headers.location, callback);
        }

        let body = "";

        res.on("data", chunk => {
            body += chunk
        });

        res.on("end", () => {
            const match = body.match(/<title>(.*?)<\/title>/i);
            if (match) {
                callback(null, { address, title: match[1] });
            } else {
                callback(null, { address, title: "NO RESPONSE" });
            }
        });
    }).on("error", () => {
        callback(null, { address, title: "NO RESPONSE" });
    });
}

// create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === "/I/want/title") {
        const addresses = parsedUrl.query.address;

        if (!addresses) {
            res.writeHead(400, { "Content-Type": "text/html" });
            return res.end("<h1>No address provided</h1>");
        }

        const addressList = Array.isArray(addresses) ? addresses : [addresses];

        async.map(addressList, fetchTitle, (err, results) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/html" });
                return res.end("<h1>Server error</h1>");
            }

            res.writeHead(200, { "Content-Type": "text/html" });
            res.write("<html><head></head><body>");
            res.write("<h1>Following are the titles of given websites:</h1>");
            res.write("<ul>");
            results.forEach(r => {
                res.write(`<li>${r.address} - "${r.title}"</li>`);
            });
            res.write("</ul></body></html>");
            res.end();
        });

    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }

});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
