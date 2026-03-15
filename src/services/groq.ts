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
                const errorData = await response.json();
                errorDetail = JSON.stringify(errorData);
            } catch (e) {
                errorDetail = await response.text();
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
