export async function generateGroqSpeech(text: string): Promise<string | null> {
    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text,
                voice: "austin",
            }),
        });

        if (!response.ok) {
            let errorDetail = "Unknown error";
            try {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetail = JSON.stringify(errorJson);
                } catch (e) {
                    errorDetail = errorText;
                }
            } catch (e) {
                console.error("Failed to read error response", e);
            }
            console.error(`TTS API Error: ${response.status}`, errorDetail);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = btoa(
            new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
            )
        );
        return base64Audio;
    } catch (error) {
        console.error("TTS Service Error:", error);
        return null;
    }
}
