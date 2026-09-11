using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Lineas.ObtenerSiguienteCodigoLinea;

/// <summary>
/// Código sugerido para una línea nueva. Se deriva de las líneas existentes
/// (`sp_ListarLinea` sin filtros), igual que hacía el sistema anterior al
/// pulsar Agregar.
/// </summary>
public sealed record ObtenerSiguienteCodigoLineaQuery
    : IQuery<SiguienteCodigoLineaResponse>;
