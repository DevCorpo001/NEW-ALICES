using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Proveedores.ListarProveedores;

/// <summary>Listado de proveedores con búsqueda por RUC, razón social o criterio común.</summary>
public sealed record ListarProveedoresQuery(
    string? Ruc,
    string? RazonSocial,
    string? Criterio = null) : IQuery<IReadOnlyList<ProveedorResponse>>;
