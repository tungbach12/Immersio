using Immersio.Domain.Exceptions;
using Immersio.Application.DTOs.Common;
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
            var (statusCode, message, errors) = exception switch
            {
                UnauthorizedException ex => (StatusCodes.Status401Unauthorized, ex.Message, (object?)null),
                NotFoundException ex => (StatusCodes.Status404NotFound, ex.Message, (object?)null),
                ConflictException ex => (StatusCodes.Status409Conflict, ex.Message, (object?)null),
                Domain.Exceptions.ValidationException ex => (StatusCodes.Status422UnprocessableEntity, "Validation Error", (object?)ex.Errors),
                _ => (StatusCodes.Status500InternalServerError, _environment.IsDevelopment() ? exception.Message : "An unexpected error occurred.", (object?)null)
            };

            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            ApiResponse response;
            if (_environment.IsDevelopment() && statusCode == StatusCodes.Status500InternalServerError)
            {
                response = new ApiResponse(false, null, message, new { stackTrace = exception.StackTrace });
            }
            else
            {
                response = ApiResponse.FailureResult(message, errors);
            }

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            await context.Response.WriteAsJsonAsync(response, options);
        }
    }
}
