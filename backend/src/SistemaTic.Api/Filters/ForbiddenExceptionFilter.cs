using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SistemaTic.Api.Filters;

// Converte UnauthorizedAccessException (usuário autenticado sem permissão sobre o recurso)
// em 403 com { message }, no mesmo formato dos demais erros da API.
public class ForbiddenExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not UnauthorizedAccessException exception)
            return;

        context.Result = new ObjectResult(new { message = exception.Message })
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
        context.ExceptionHandled = true;
    }
}
