export type Prediction = {
  class_id: number;
  label: string;
  plant: string;
  condition: string;
  confidence: number;
};

let runtime: Promise<{ mode: string }> | undefined;

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.onerror = () =>
      reject(
        new Error("We could not read this photo. Please choose it again."),
      );
    reader.readAsDataURL(file);
  });
}

export async function predict(
  file: File,
  signal: AbortSignal,
): Promise<Prediction> {
  runtime ??= fetch("/api/runtime")
    .then(async (response) => {
      if (!response.ok)
        throw new Error("The demo is waking up. Please try again shortly.");
      return response.json();
    })
    .catch((error) => {
      runtime = undefined;
      throw error;
    });
  const configuration = await runtime;
  signal.throwIfAborted();
  if (configuration.mode === "gradio") {
    const { Client } = await import("@gradio/client");
    const photo = await toBase64(file);
    const client = await Client.connect(
      window.location.origin,
      { events: ["data", "status"] },
    );
    signal.throwIfAborted();
    const job = client.submit("/check_leaf", [photo]);
    const cancel = () => {
      void job.cancel();
    };
    signal.addEventListener("abort", cancel, { once: true });
    try {
      for await (const event of job) {
        signal.throwIfAborted();
        if (event.type === "data") return event.data[0] as Prediction;
        if (event.type === "status" && event.stage === "error") {
          const message =
            typeof event.message === "string"
              ? event.message
              : "The leaf checker is temporarily unavailable.";
          if (/quota|GPU time|limit/i.test(message))
            throw new Error(
              "The free GPU allowance is temporarily used up. Please try again later.",
            );
          throw new Error(message);
        }
      }
      throw new Error("The check did not finish. Please try again.");
    } finally {
      signal.removeEventListener("abort", cancel);
      client.close();
    }
  }
  const data = new FormData();
  data.append("image", file);
  const response = await fetch("/api/predict", {
    method: "POST",
    body: data,
    signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      typeof payload?.detail === "string"
        ? payload.detail
        : "The leaf checker is waking up or temporarily unavailable. Please try again shortly.",
    );
  return payload;
}
