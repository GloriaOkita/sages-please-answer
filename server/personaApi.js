const ALLOWED_TASKS = new Set([
  "persona_main_comment",
  "interaction_director",
  "persona_interaction_reply",
  "persona_user_reply",
]);

export function createPersonaHandler({ invokeModel }) {
  return async function personaHandler(request, response) {
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Method not allowed" });
    }
    const body = request.body ?? {};
    if (!ALLOWED_TASKS.has(body.task)) {
      return response.status(400).json({ error: "Unsupported AI task" });
    }
    const serializedSize = JSON.stringify(body).length;
    if (serializedSize > 70000) {
      return response.status(413).json({ error: "AI request is too large" });
    }
    if (!body.systemPrompt || !body.userMessage) {
      return response.status(400).json({ error: "Missing AI prompt data" });
    }
    try {
      const result = await invokeModel({
        systemPrompt: body.systemPrompt,
        userMessage: body.userMessage,
        history: Array.isArray(body.history) ? body.history.slice(-6) : [],
        task: body.task,
      });
      return response.status(200).json(result);
    } catch (error) {
      console.error("Persona AI request failed:", error.message);
      return response.status(502).json({ error: "人物暂时没有回应，请稍后再试。" });
    }
  };
}
