using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Proveedores.ListarProveedorAuto;

/// <summary>Sugerencias para los buscadores de proveedor con búsqueda parcial.</summary>
public sealed record ListarProveedorAutoQuery(
    string? Ruc,
    string? RazonSocial,
    string? Criterio = null) : IQuery<IReadOnlyList<ProveedorResponse>>;
