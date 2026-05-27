using Immersio.Application.DTOs.Practice;
using Immersio.Application.DTOs.Common;
using Immersio.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Immersio.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PracticeController : ControllerBase
    {
        private readonly IPronunciationService _pronunciationService;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
        private readonly ILLMService _llmService;

        public PracticeController(
            IPronunciationService pronunciationService,
            Microsoft.Extensions.Configuration.IConfiguration configuration,
            ILLMService llmService)
        {
            _pronunciationService = pronunciationService;
            _configuration = configuration;
            _llmService = llmService;
        }

        [HttpPost("pronunciation-log")]
        public async Task<IActionResult> LogPronunciation(
            [FromBody] CreatePronunciationLogRequest request,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var result = await _pronunciationService.LogPronunciationAsync(userId, request, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResult(result));
        }

        [HttpGet("pronunciation-history")]
        public async Task<IActionResult> GetPronunciationHistory(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var logs = await _pronunciationService.GetUserLogsAsync(userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResult(logs));
        }

        [HttpGet("cefr-analysis")]
        public async Task<IActionResult> GetCefrAnalysis(CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            var analysis = await _pronunciationService.AnalyzeCefrLevelAsync(userId, cancellationToken);
            return Ok(ApiResponse<object>.SuccessResult(analysis));
        }

        [HttpPost("assess-pronunciation")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> AssessPronunciation(
            [FromForm] AssessPronunciationRequest request,
            CancellationToken cancellationToken)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized(ApiResponse.FailureResult("Invalid user identity."));

            if (request.Audio == null || request.Audio.Length == 0)
                return BadRequest(ApiResponse.FailureResult("No audio file was uploaded."));

            if (string.IsNullOrWhiteSpace(request.Phrase))
                return BadRequest(ApiResponse.FailureResult("Target phrase is required."));

            using var memoryStream = new System.IO.MemoryStream();
            await request.Audio.CopyToAsync(memoryStream, cancellationToken);
            var audioBytes = memoryStream.ToArray();

            var result = await _pronunciationService.AssessPronunciationAsync(
                userId,
                audioBytes,
                request.Audio.FileName,
                request.Phrase,
                cancellationToken);

            return Ok(ApiResponse<object>.SuccessResult(result));
        }

        [HttpPost("tts")]
        [AllowAnonymous]
        public async Task<IActionResult> SynthesizeSpeech(
            [FromBody] TtsRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(ApiResponse.FailureResult("Text parameter is required."));

            var apiKey = _configuration["Azure:Speech:ApiKey"];
            var region = _configuration["Azure:Speech:Region"] ?? "centralindia";
            var customEndpoint = _configuration["Azure:Speech:Endpoint"];
            var voice = string.IsNullOrWhiteSpace(request.Voice) ? "en-US-JennyNeural" : request.Voice;

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Contains("YOUR_AZURE"))
            {
                return BadRequest(ApiResponse.FailureResult("Azure Speech ApiKey not set yet. Configure real key in appsettings.json to preview voice."));
            }

            string endpoint;
            if (!string.IsNullOrWhiteSpace(customEndpoint) && !customEndpoint.Contains("api.cognitive.microsoft.com"))
            {
                var baseUri = customEndpoint.Trim();
                if (!baseUri.EndsWith("/"))
                {
                    baseUri += "/";
                }
                endpoint = $"{baseUri}cognitiveservices/v1";
            }
            else
            {
                endpoint = $"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1";
            }

            var lang = "en-US";
            if (voice.Length >= 5)
            {
                lang = voice.Substring(0, 5);
            }

            using var httpClient = new HttpClient();
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint);

            httpRequest.Headers.Add("Ocp-Apim-Subscription-Key", apiKey);
            httpRequest.Headers.Add("User-Agent", "Immersio");
            httpRequest.Headers.Add("X-Microsoft-OutputFormat", "audio-16khz-64kbitrate-mono-mp3");

            var ssml = $@"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{lang}'>
                <voice name='{voice}'>
                    {request.Text}
                </voice>
            </speak>";

            httpRequest.Content = new StringContent(ssml, System.Text.Encoding.UTF8, "application/ssml+xml");

            try
            {
                var response = await httpClient.SendAsync(httpRequest, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var err = await response.Content.ReadAsStringAsync(cancellationToken);
                    return StatusCode((int)response.StatusCode, ApiResponse.FailureResult($"Azure TTS error: {err}"));
                }

                var audioBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
                return File(audioBytes, "audio/mpeg");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.FailureResult($"TTS Synthesis failed: {ex.Message}"));
            }
        }

        [HttpPost("generate-phrase")]
        [AllowAnonymous]
        public async Task<IActionResult> GeneratePhrase(
            [FromBody] GeneratePhraseRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null)
                return BadRequest(ApiResponse.FailureResult("Request body is required."));

            var result = await _pronunciationService.GeneratePhraseAsync(request, cancellationToken);
            return Ok(ApiResponse<GeneratedPhraseDto>.SuccessResult(result));
        }

        [HttpPost("dictionary-lookup")]
        public async Task<IActionResult> DictionaryLookup(
            [FromBody] DictionaryLookupRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Word))
                return BadRequest(ApiResponse.FailureResult("Word parameter is required."));

            var targetLanguage = string.IsNullOrWhiteSpace(request.TargetLanguage) ? "English" : request.TargetLanguage;
            var result = await _llmService.LookupWordAsync(request.Word, targetLanguage, cancellationToken);
            return Ok(ApiResponse<DictionaryEntryDto>.SuccessResult(result));
        }
    }

    public class TtsRequest
    {
        public string Text { get; set; } = null!;
        public string Voice { get; set; } = null!;
    }

    /// <summary>Request DTO for multipart/form-data pronunciation assessment.</summary>
    public class AssessPronunciationRequest
    {
        /// <summary>Audio file to assess (wav/mp3/webm)</summary>
        public Microsoft.AspNetCore.Http.IFormFile Audio { get; set; } = null!;
        /// <summary>Target phrase the user attempted to pronounce</summary>
        public string Phrase { get; set; } = null!;
    }
}
