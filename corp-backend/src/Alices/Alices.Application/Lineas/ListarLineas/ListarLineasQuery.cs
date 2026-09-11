using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Lineas.ListarLineas;

/// <summary>
/// Listado de líneas (`sp_ListarLinea`). Sin filtros devuelve todas, que es lo
/// que necesita el botón Buscar del modal cuando los campos están vacíos.
/// </summary>
public sealed record ListarLineasQuery(
    string? Codigo,
    string? Nombre) : IQuery<IReadOnlyList<LineaResponse>>;
