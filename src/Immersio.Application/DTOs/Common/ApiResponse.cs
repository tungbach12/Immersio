namespace Immersio.Application.DTOs.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public object? Errors { get; set; }
        public string? Detail => Message;

        public ApiResponse() { }

        public ApiResponse(bool success, T? data = default, string? message = null, object? errors = null)
        {
            Success = success;
            Data = data;
            Message = message;
            Errors = errors;
        }

        public static ApiResponse<T> SuccessResult(T data, string? message = null)
        {
            return new ApiResponse<T>(true, data, message);
        }

        public static ApiResponse<T> FailureResult(string message, object? errors = null)
        {
            return new ApiResponse<T>(false, default, message, errors);
        }
    }

    public class ApiResponse : ApiResponse<object>
    {
        public ApiResponse() : base() { }

        public ApiResponse(bool success, object? data = null, string? message = null, object? errors = null)
            : base(success, data, message, errors)
        {
        }

        public static ApiResponse SuccessResult(string? message = null)
        {
            return new ApiResponse(true, null, message);
        }

        public static new ApiResponse FailureResult(string message, object? errors = null)
        {
            return new ApiResponse(false, null, message, errors);
        }
    }
}
