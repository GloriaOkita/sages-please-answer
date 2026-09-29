import { createPersonaHandler } from "./personaApi.js";
import { invokeOneAPI } from "./oneapiClient.js";

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 75000) reject(new Error("request too large"));
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function responseAdapter(response) {
  return {
    status(code) {
      response.statusCode = code;
      return this;
    },
    json(payload) {
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(payload));
    },
  };
}

export function personaApiPlugin() {
  const handler = createPersonaHandler({ invokeModel: invokeOneAPI });
  return {
    name: "ancient-moments-persona-api",
    configureServer(server) {
      server.middlewares.use("/api/ai", async (request, response) => {
        try {
          request.body = await readBody(request);
          await handler(request, responseAdapter(response));
        } catch {
          response.statusCode = 400;
          response.setHeader("content-type", "application/json; charset=utf-8");
          response.end(JSON.stringify({ error: "Invalid request" }));
        }
      });
    },
  };
}
