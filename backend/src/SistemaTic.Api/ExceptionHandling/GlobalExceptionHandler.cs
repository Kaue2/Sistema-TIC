using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SistemaTic.Application.Exceptions;

namespace SistemaTic.Api.ExceptionHandling;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(
        IProblemDetailsService problemDetailsService,
        ILogger<GlobalExceptionHandler> logger)
    {
        _problemDetailsService = problemDetailsService;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title) = exception switch
        {
            AuthenticationException => (
                StatusCodes.Status401Unauthorized,
                "Falha de autenticação"),

            UnauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                "Não autorizado"),

            NotFoundException => (
                StatusCodes.Status404NotFound,
                "Recurso não encontrado"),

            ConflictException => (
                StatusCodes.Status409Conflict,
                "Conflito"),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Erro interno do servidor")
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(
                exception,
                "Erro não tratado durante {Method} {Path}",
                httpContext.Request.Method,
                httpContext.Request.Path);
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = statusCode < StatusCodes.Status500InternalServerError
                ? exception.Message
                : "Ocorreu um erro inesperado.",
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = statusCode;

        bool written = await _problemDetailsService.TryWriteAsync(
            new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problemDetails
            });

        if (!written)
        {
            await httpContext.Response.WriteAsJsonAsync(
                problemDetails,
                cancellationToken);
        }

        return true;
    }
}
