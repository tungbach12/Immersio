package com.immersio.practice.service;

import com.immersio.practice.api.dto.DictionaryEntryDto;
import com.immersio.practice.api.dto.GeneratedPhraseDto;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure-logic tests for the configurable AI endpoint client: code-fence
 * cleanup, prompt building and the JSON → DTO mapping with the legacy .NET
 * fallback defaults.
 */
class PracticeLlmClientTest {

    // ------------------------------------------------------------------
    // Code fence cleanup
    // ------------------------------------------------------------------

    @Test
    void stripsMarkdownCodeFences() {
        assertThat(PracticeLlmClient.cleanJson("```json\n{\"translation\":\"x\"}\n```"))
                .isEqualTo("{\"translation\":\"x\"}");
        assertThat(PracticeLlmClient.cleanJson("```\n{\"a\":1}\n```"))
                .isEqualTo("{\"a\":1}");
        assertThat(PracticeLlmClient.cleanJson("{\"a\":1}")).isEqualTo("{\"a\":1}");
        assertThat(PracticeLlmClient.cleanJson("  {\"a\":1}  ")).isEqualTo("{\"a\":1}");
        assertThat(PracticeLlmClient.cleanJson(null)).isNull();
        assertThat(PracticeLlmClient.cleanJson("   ")).isEqualTo("   ");
    }

    // ------------------------------------------------------------------
    // Dictionary content parsing
    // ------------------------------------------------------------------

    @Test
    void mapsCompleteDictionaryJson() {
        String json = """
                {"word":"accomplish","translation":"hoàn thành, đạt được","phonetic":"/əˈkʌm.plɪʃ/",
                 "partOfSpeech":"verb","definition":"To succeed in doing something.",
                 "example":"We can accomplish anything.","exampleTranslation":"Chúng ta có thể."}
                """;

        DictionaryEntryDto entry = PracticeLlmClient.parseDictionaryContent(json, "accomplish");

        assertThat(entry.word()).isEqualTo("accomplish");
        assertThat(entry.translation()).isEqualTo("hoàn thành, đạt được");
        assertThat(entry.phonetic()).isEqualTo("/əˈkʌm.plɪʃ/");
        assertThat(entry.partOfSpeech()).isEqualTo("verb");
        assertThat(entry.definition()).isEqualTo("To succeed in doing something.");
        assertThat(entry.example()).isEqualTo("We can accomplish anything.");
        assertThat(entry.exampleTranslation()).isEqualTo("Chúng ta có thể.");
    }

    @Test
    void parsesFencedDictionaryJson() {
        String fenced = "```json\n{\"translation\":\"hello\"}\n```";

        DictionaryEntryDto entry = PracticeLlmClient.parseDictionaryContent(fenced, "hi");

        assertThat(entry.translation()).isEqualTo("hello");
        assertThat(entry.phonetic()).isEqualTo("/.../");
    }

    @Test
    void fillsNetDefaultsWhenFieldsAreMissing() {
        DictionaryEntryDto entry = PracticeLlmClient.parseDictionaryContent("{\"translation\":\"xin\"}", "test");

        assertThat(entry.word()).isEqualTo("test");
        assertThat(entry.translation()).isEqualTo("xin");
        assertThat(entry.phonetic()).isEqualTo("/.../");
        assertThat(entry.partOfSpeech()).isEqualTo("noun");
        assertThat(entry.definition()).isEqualTo("Definition of the word.");
        assertThat(entry.example()).isEqualTo("An example sentence.");
        assertThat(entry.exampleTranslation()).isEqualTo("Câu ví dụ.");
    }

    @Test
    void returnsNetDefaultsForUnusableContent() {
        DictionaryEntryDto fromNull = PracticeLlmClient.parseDictionaryContent(null, "world");
        DictionaryEntryDto fromGarbage = PracticeLlmClient.parseDictionaryContent("definitely not json", "world");

        for (DictionaryEntryDto entry : new DictionaryEntryDto[]{fromNull, fromGarbage}) {
            assertThat(entry.word()).isEqualTo("world");
            assertThat(entry.translation()).isEqualTo("Nghĩa của từ.");
            assertThat(entry.phonetic()).isEqualTo("/.../");
            assertThat(entry.partOfSpeech()).isEqualTo("noun");
            assertThat(entry.definition()).isEqualTo("Definition of the word.");
            assertThat(entry.example()).isEqualTo("An example sentence.");
            assertThat(entry.exampleTranslation()).isEqualTo("Câu ví dụ.");
        }
    }

    // ------------------------------------------------------------------
    // Phrase content parsing
    // ------------------------------------------------------------------

    @Test
    void mapsCompletePhraseJson() {
        String json = """
                {"phrase":"Bonjour, comment allez-vous?","translation":"Xin chào, bạn khỏe không?",
                 "explanation":"Dùng để chào hỏi lịch sự."}
                """;

        GeneratedPhraseDto phrase = PracticeLlmClient.parsePhraseContent(json, "French");

        assertThat(phrase.phrase()).isEqualTo("Bonjour, comment allez-vous?");
        assertThat(phrase.translation()).isEqualTo("Xin chào, bạn khỏe không?");
        assertThat(phrase.explanation()).isEqualTo("Dùng để chào hỏi lịch sự.");
    }

    @Test
    void returnsLanguageSpecificDefaultsOnFailure() {
        GeneratedPhraseDto english = PracticeLlmClient.parsePhraseContent(null, "English");
        assertThat(english.phrase()).isEqualTo("The quick brown fox jumps over the lazy dog.");
        assertThat(english.translation()).isEqualTo("Chú cáo nâu nhanh nhẹn nhảy qua con chó lười biếng.");
        assertThat(english.explanation()).isEqualTo("Một câu nói thông dụng.");

        GeneratedPhraseDto japanese = PracticeLlmClient.parsePhraseContent(null, "Japanese");
        assertThat(japanese.phrase()).isEqualTo("こんにちは、元気ですか？");
        assertThat(japanese.translation()).isEqualTo("Xin chào, bạn khỏe không?");

        // zh branch matches on language CODES ("zh", "zh-CN") like .NET
        GeneratedPhraseDto chinese = PracticeLlmClient.parsePhraseContent("not json", "zh-CN");
        assertThat(chinese.phrase()).isEqualTo("你好，你怎么样？");
        assertThat(chinese.translation()).isEqualTo("Xin chào, bạn thế nào?");

        // .NET parity (LlmService.cs:894): the plain language NAME "Chinese" does not contain
        // "zh", so the legacy backend also fell back to the English default for it.
        GeneratedPhraseDto chineseName = PracticeLlmClient.parsePhraseContent(null, "Chinese");
        assertThat(chineseName.phrase()).isEqualTo("The quick brown fox jumps over the lazy dog.");
    }

    // ------------------------------------------------------------------
    // Prompts
    // ------------------------------------------------------------------

    @Test
    void buildsDictionaryPromptForTargetLanguage() {
        String prompt = PracticeLlmClient.dictionarySystemPrompt("French");

        assertThat(prompt).contains("in the target language 'French'");
        assertThat(prompt).contains("example sentence in 'French'");
        assertThat(prompt).contains("\"partOfSpeech\"");
        assertThat(prompt).contains("\"exampleTranslation\"");
    }

    @Test
    void buildsPhrasePromptForLanguageLevelTopic() {
        String prompt = PracticeLlmClient.phraseSystemPrompt("English", "Beginner", "travel");

        assertThat(prompt).contains("phrase in English for a learner at the Beginner difficulty level");
        assertThat(prompt).contains("topic/context of 'travel'");
        assertThat(prompt).contains("\"explanation\"");
    }
}
