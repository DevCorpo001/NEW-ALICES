using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Clases.ListarClaseAuto;

/// <summary>Sugerencias para los buscadores de clase (`sp_ListarClase_Auto`).</summary>
public sealed record ListarClaseAutoQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<ClaseResponse>>;
