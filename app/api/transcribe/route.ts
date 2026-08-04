async function cleanupTranscript(rawText: string): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error("CLEANUP: ANTHROPIC_API_KEY is missing.");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: CLEANUP_PROMPT + "\n\n" + rawText,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("CLEANUP: Anthropic returned " + response.status + " — " + detail);
      return null;
    }

    const data = await response.json();
    const text = data?.content
      ?.filter((block: any) => block?.type === "text")
      ?.map((block: any) => block?.text ?? "")
      ?.join("\n")
      ?.trim();

    if (!text) {
      console.error("CLEANUP: Anthropic returned no text block.");
      return null;
    }

    console.log("CLEANUP: success, " + text.length + " chars.");
    return text;
  } catch (err: any) {
    console.error("CLEANUP: request failed — " + (err?.name ?? "") + " " + (err?.message ?? ""));
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
