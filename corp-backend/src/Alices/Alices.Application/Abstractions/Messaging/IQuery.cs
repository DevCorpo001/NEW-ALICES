using Alices.Domain.Abstractions;
using MediatR;

namespace Alices.Application.Abstractions.Messaging;

public interface IQuery<TResponse> : IRequest<Result<TResponse>>
{
}
