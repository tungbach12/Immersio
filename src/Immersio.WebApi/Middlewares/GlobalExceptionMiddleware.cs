using Immersio.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Immersio.WebApi.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var problemDetails = exception switch
            {
                UnauthorizedException ex => new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Unauthorized",
                    Detail = ex.Message,
                    Type = "https://tools.ietf.org/html/rfc7807"
                },
                NotFoundException ex => new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Not Found",
                    Detail = ex.Message,
                    Type = "https://tools.ietf.org/html/rfc7807"
                },
                ConflictException ex => new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Conflict",
                    Detail = ex.Message,
                    Type = "https://tools.ietf.org/html/rfc7807"
                },
                Domain.Exceptions.ValidationException ex => CreateValidationProblemDetails(ex),
                _ => new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "Internal Server Error",
                    Detail = _environment.IsDevelopment() ? exception.Message : "An unexpected error occurred.",
                    Type = "https://tools.ietf.org/html/rfc7807"
                }
            };

            if (_environment.IsDevelopment() && problemDetails.Status == StatusCodes.Status500InternalServerError)
            {
                problemDetails.Extensions["stackTrace"] = exception.StackTrace;
            }

            problemDetails.Instance = context.Request.Path;

            context.Response.StatusCode = problemDetails.Status ?? StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsJsonAsync(problemDetails, options);
        }

        private static ProblemDetails CreateValidationProblemDetails(Domain.Exceptions.ValidationException ex)
        {
            var problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status422UnprocessableEntity,
                Title = "Validation Error",
                Detail = ex.Message,
                Type = "https://tools.ietf.org/html/rfc7807"
            };

            problemDetails.Extensions["errors"] = ex.Errors;

            return problemDetails;
        }
    }
}
