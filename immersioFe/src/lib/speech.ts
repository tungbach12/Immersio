const languageCodes: Record<string, string> = {
  English: "en-US",
  Japanese: "ja-JP",
  Chinese: "zh-CN",
  French: "fr-FR",
};

export function speakText(text: string, language = "English") {
  if (!text.trim() || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageCodes[language] || "en-US";
  window.speechSynthesis.speak(utterance);
}
