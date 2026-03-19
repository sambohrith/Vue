namespace IMS.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
    public string? RequestId { get; set; }
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
    public string? RequestId { get; set; }
}

public class ErrorResponse
{
    public bool Success { get; set; } = false;
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, string>? Errors { get; set; }
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");
    public string? RequestId { get; set; }
}

public class PaginationInfo
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public long Total { get; set; }
    public int TotalPages { get; set; }
}
